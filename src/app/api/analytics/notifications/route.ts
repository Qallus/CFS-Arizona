import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

async function readJson(file: string) {
  try {
    const data = await fs.readFile(path.join(DATA_DIR, file), 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    // Fetch voicemails count from Twilio or local
    let voicemails = 0;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/voicemails?unread=true`, {
        cache: 'no-store',
      });
      if (response.ok) {
        const data = await response.json();
        voicemails = data.unreadCount || 0;
      }
    } catch (e) {
      console.error('Error fetching voicemails:', e);
    }

    // Count unread SMS - check Twilio
    let unreadSms = 0;
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    if (accountSid && authToken) {
      try {
        const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const smsResponse = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json?DateSent>=${yesterday.toISOString().split('T')[0]}&To=${process.env.TWILIO_PHONE_NUMBER}&PageSize=100`,
          {
            headers: { 'Authorization': authHeader },
            cache: 'no-store',
          }
        );
        
        if (smsResponse.ok) {
          const smsData = await smsResponse.json();
          // Count incoming messages from last 24 hours
          unreadSms = (smsData.messages || []).filter((msg: any) => 
            msg.direction === 'inbound'
          ).length;
        }
      } catch (e) {
        console.error('Error fetching SMS:', e);
      }
    }

    // Count unread emails (placeholder - would integrate with email provider)
    let unreadEmails = 0;
    // TODO: Integrate with IMAP/email provider to get actual count

    // Count pending reminders from cron jobs
    let pendingReminders = 0;
    const cronData = await readJson('cron.json');
    if (cronData?.jobs) {
      const now = Date.now();
      pendingReminders = cronData.jobs.filter((job: any) => {
        if (!job.enabled) return false;
        // Count jobs scheduled to fire in the next 24 hours
        if (job.schedule?.kind === 'at') {
          const atTime = job.schedule.atMs;
          return atTime > now && atTime < now + 86400000;
        }
        return job.enabled; // Count all enabled recurring jobs
      }).length;
    }

    // Count upcoming appointments (next 7 days)
    let upcomingAppointments = 0;
    try {
      const wpUrl = process.env.WP_SITE_URL;
      const wpUser = process.env.WP_APPLICATION_USERNAME;
      const wpPass = process.env.WP_APPLICATION_PASSWORD;
      
      if (wpUrl && wpUser && wpPass) {
        const authHeader = 'Basic ' + Buffer.from(`${wpUser}:${wpPass}`).toString('base64');
        const response = await fetch(
          `${wpUrl}/wp-json/fluent-booking/v1/bookings?period=upcoming&per_page=100`,
          {
            headers: { 'Authorization': authHeader },
            cache: 'no-store',
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          upcomingAppointments = data.bookings?.total || data.total || 0;
        }
      }
    } catch (e) {
      console.error('Error fetching appointments:', e);
    }

    // Count overdue tasks from todos
    let overdueTasks = 0;
    const todosData = await readJson('todos.json');
    if (todosData?.todos) {
      const now = new Date().toISOString().split('T')[0];
      overdueTasks = todosData.todos.filter((todo: any) => {
        if (todo.completed) return false;
        if (!todo.dueDate) return false;
        return todo.dueDate < now;
      }).length;
    }

    // Count new deals (created in last 7 days)
    let newDeals = 0;
    const dealsData = await readJson('deals.json');
    if (dealsData?.deals) {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoStr = weekAgo.toISOString();
      
      newDeals = dealsData.deals.filter((deal: any) => {
        return deal.createdAt && deal.createdAt > weekAgoStr;
      }).length;
    }

    return NextResponse.json({
      voicemails,
      unreadEmails,
      unreadSms,
      pendingReminders,
      upcomingAppointments,
      overdueTasks,
      newDeals,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({
      voicemails: 0,
      unreadEmails: 0,
      unreadSms: 0,
      pendingReminders: 0,
      upcomingAppointments: 0,
      overdueTasks: 0,
      newDeals: 0,
    });
  }
}
