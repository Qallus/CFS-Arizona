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

async function getContactsCount(leadsCount: number): Promise<number> {
  // Try FluentCRM first, fall back to leads count
  const wpUrl = process.env.WP_SITE_URL;
  const wpUser = process.env.WP_APPLICATION_USERNAME;
  const wpPass = process.env.WP_APPLICATION_PASSWORD;
  
  if (!wpUrl || !wpUser || !wpPass) {
    return leadsCount; // Fall back to leads
  }
  
  try {
    const authHeader = 'Basic ' + Buffer.from(`${wpUser}:${wpPass}`).toString('base64');
    const response = await fetch(
      `${wpUrl}/wp-json/fluent-crm/v2/subscribers?per_page=1`,
      {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      }
    );
    
    if (!response.ok) return leadsCount;
    
    const data = await response.json();
    return data.total || leadsCount;
  } catch {
    return leadsCount;
  }
}

async function getCommunicationVolume() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  
  const today = new Date();
  const twoWeeksAgo = new Date(today);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  
  // Initialize empty data
  const commsByDay: Record<string, { date: string; calls: number; sms: number; emails: number }> = {};
  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - (13 - i));
    const dateStr = date.toISOString().split('T')[0];
    commsByDay[dateStr] = { date: dateStr, calls: 0, sms: 0, emails: 0 };
  }
  
  if (!accountSid || !authToken) {
    return {
      calls: 0,
      sms: 0,
      emails: 0,
      byDay: Object.values(commsByDay),
    };
  }
  
  const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');
  
  try {
    // Fetch calls from last 14 days
    const callsResponse = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json?StartTime>=${twoWeeksAgo.toISOString().split('T')[0]}&PageSize=1000`,
      {
        headers: { 'Authorization': authHeader },
        cache: 'no-store',
      }
    );
    
    if (callsResponse.ok) {
      const callsData = await callsResponse.json();
      (callsData.calls || []).forEach((call: any) => {
        // Twilio returns RFC 2822 dates like "Tue, 17 Feb 2026 22:09:05 +0000"
        const dateRaw = call.start_time || call.date_created;
        if (dateRaw) {
          const dateStr = new Date(dateRaw).toISOString().split('T')[0];
          if (commsByDay[dateStr]) {
            commsByDay[dateStr].calls++;
          }
        }
      });
    }
    
    // Fetch SMS from last 14 days
    const smsResponse = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json?DateSent>=${twoWeeksAgo.toISOString().split('T')[0]}&PageSize=1000`,
      {
        headers: { 'Authorization': authHeader },
        cache: 'no-store',
      }
    );
    
    if (smsResponse.ok) {
      const smsData = await smsResponse.json();
      (smsData.messages || []).forEach((msg: any) => {
        const dateRaw = msg.date_sent || msg.date_created;
        if (dateRaw) {
          const dateStr = new Date(dateRaw).toISOString().split('T')[0];
          if (commsByDay[dateStr]) {
            commsByDay[dateStr].sms++;
          }
        }
      });
    }
  } catch (error) {
    console.error('Error fetching Twilio data:', error);
  }
  
  const byDay = Object.values(commsByDay);
  
  return {
    calls: byDay.reduce((sum, d) => sum + d.calls, 0),
    sms: byDay.reduce((sum, d) => sum + d.sms, 0),
    emails: 0, // Email tracking would need separate integration
    byDay,
  };
}

export async function GET(req: NextRequest) {
  // Load local JSON data first
  const [leadsData, dealsData, projectsData, invoicesData] = await Promise.all([
    readJson('leads.json'),
    readJson('deals.json'),
    readJson('projects.json'),
    readJson('invoices.json'),
  ]);
  
  const leads = Array.isArray(leadsData) ? leadsData : (leadsData?.leads || []);
  const deals = Array.isArray(dealsData) ? dealsData : (dealsData?.deals || []);
  const projects = Array.isArray(projectsData) ? projectsData : (projectsData?.projects || []);
  const invoices = Array.isArray(invoicesData) ? invoicesData : (invoicesData?.invoices || []);
  
  // Fetch external data (contacts from FluentCRM, with fallback to leads count)
  const contactsCount = await getContactsCount(leads.length);
  
  // Lead Conversion Analytics
  const leadStages = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];
  const convertedLeads = leads.filter((l: any) => l.status === 'won').length;
  const leadsByStage = leadStages.map(stage => ({
    stage,
    count: leads.filter((l: any) => l.status === stage).length,
  }));
  
  // Generate trend data (last 30 days)
  const leadTrend = generateTrendData(leads, 30);
  
  const leadConversion = {
    total: leads.length,
    converted: convertedLeads,
    conversionRate: leads.length > 0 ? Math.round((convertedLeads / leads.length) * 100) : 0,
    byStage: leadsByStage,
    trend: leadTrend,
  };
  
  // Communication Volume - fetch from Twilio
  const communicationVolume = await getCommunicationVolume();
  
  // Project Velocity
  const activeProjects = projects.filter((p: any) => p.status === 'active').length;
  const completedProjects = projects.filter((p: any) => p.status === 'completed');
  const projectStatuses = ['planning', 'active', 'on_hold', 'completed', 'cancelled'];
  
  // Calculate average days to complete
  let avgDaysToComplete = 0;
  if (completedProjects.length > 0) {
    const totalDays = completedProjects.reduce((sum: number, p: any) => {
      if (p.startDate && p.endDate) {
        const start = new Date(p.startDate);
        const end = new Date(p.endDate);
        return sum + Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      }
      return sum;
    }, 0);
    avgDaysToComplete = Math.round(totalDays / completedProjects.length);
  }
  
  const projectVelocity = {
    active: activeProjects,
    completed: completedProjects.length,
    avgDaysToComplete,
    byStatus: projectStatuses.map(status => ({
      status,
      count: projects.filter((p: any) => p.status === status).length,
    })),
    completedByMonth: getCompletedByMonth(completedProjects),
  };
  
  // Revenue Analytics
  const openDeals = deals.filter((d: any) => !d.stage.startsWith('closed_'));
  const wonDeals = deals.filter((d: any) => d.stage === 'closed_won');
  const lostDeals = deals.filter((d: any) => d.stage === 'closed_lost');
  
  const totalPipeline = openDeals.reduce((sum: number, d: any) => sum + d.value, 0);
  const weightedPipeline = openDeals.reduce((sum: number, d: any) => sum + (d.value * d.probability / 100), 0);
  const closedWon = wonDeals.reduce((sum: number, d: any) => sum + d.value, 0);
  const closedLost = lostDeals.reduce((sum: number, d: any) => sum + d.value, 0);
  
  const dealStages = ['lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];
  
  const revenue = {
    totalPipeline,
    weightedPipeline: Math.round(weightedPipeline),
    closedWon,
    closedLost,
    byMonth: getRevenueByMonth(deals),
    byStage: dealStages.map(stage => ({
      stage,
      value: deals.filter((d: any) => d.stage === stage).reduce((sum: number, d: any) => sum + d.value, 0),
      count: deals.filter((d: any) => d.stage === stage).length,
    })),
  };
  
  // Invoice stats
  const paidInvoices = invoices.filter((i: any) => i.status === 'paid');
  const invoiceStats = {
    totalInvoiced: invoices.reduce((sum: number, i: any) => sum + i.total, 0),
    totalCollected: paidInvoices.reduce((sum: number, i: any) => sum + i.total, 0),
    outstanding: invoices.filter((i: any) => ['sent', 'overdue'].includes(i.status)).reduce((sum: number, i: any) => sum + i.amountDue, 0),
    avgInvoiceValue: invoices.length > 0 ? Math.round(invoices.reduce((sum: number, i: any) => sum + i.total, 0) / invoices.length) : 0,
  };
  
  // Summary stats
  const summary = {
    totalContacts: contactsCount,
    totalLeads: leads.length,
    totalDeals: deals.length,
    totalProjects: projects.length,
    activeProjects,
    openDeals: openDeals.length,
    pipelineValue: totalPipeline,
    weightedPipeline: Math.round(weightedPipeline),
    revenueThisMonth: closedWon, // Simplified - would filter by date
  };
  
  return NextResponse.json({
    leadConversion,
    communicationVolume,
    projectVelocity,
    revenue,
    invoiceStats,
    summary,
  });
}

function generateTrendData(items: any[], days: number) {
  const today = new Date();
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (days - 1 - i));
    const dateStr = date.toISOString().split('T')[0];
    
    const itemsOnDate = items.filter((item: any) => {
      const created = item.createdAt?.split('T')[0];
      return created === dateStr;
    });
    
    return {
      date: dateStr,
      total: itemsOnDate.length,
      converted: itemsOnDate.filter((l: any) => l.status === 'won').length,
    };
  });
}

function getCompletedByMonth(projects: any[]) {
  const months: Record<string, number> = {};
  
  projects.forEach((p: any) => {
    if (p.endDate) {
      const month = p.endDate.substring(0, 7); // YYYY-MM
      months[month] = (months[month] || 0) + 1;
    }
  });
  
  // Return last 6 months
  const result = [];
  const today = new Date();
  for (let i = 5; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthKey = date.toISOString().substring(0, 7);
    result.push({
      month: monthKey,
      count: months[monthKey] || 0,
    });
  }
  
  return result;
}

function getRevenueByMonth(deals: any[]) {
  const months: Record<string, { won: number; lost: number }> = {};
  
  deals.forEach((d: any) => {
    if (d.actualCloseDate) {
      const month = d.actualCloseDate.substring(0, 7);
      if (!months[month]) months[month] = { won: 0, lost: 0 };
      
      if (d.stage === 'closed_won') {
        months[month].won += d.value;
      } else if (d.stage === 'closed_lost') {
        months[month].lost += d.value;
      }
    }
  });
  
  // Return last 6 months
  const result = [];
  const today = new Date();
  for (let i = 5; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthKey = date.toISOString().substring(0, 7);
    result.push({
      month: monthKey,
      won: months[monthKey]?.won || 0,
      lost: months[monthKey]?.lost || 0,
    });
  }
  
  return result;
}
