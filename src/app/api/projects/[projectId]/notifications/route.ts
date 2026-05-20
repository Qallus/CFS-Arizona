import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'projects.json');

// Twilio config
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

interface Notification {
  id: string;
  type: 'sms' | 'email' | 'call';
  recipient: string;
  recipientName: string;
  subject: string;
  message: string;
  status: 'pending' | 'sent' | 'failed';
  sentAt: string | null;
  createdAt: string;
  relatedTaskId?: string;
  errorMessage?: string;
}

interface Project {
  id: string;
  notifications: Notification[];
  activityLog: any[];
  [key: string]: any;
}

function readProjects(): Project[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    return [];
  }
}

function writeProjects(projects: Project[]): void {
  fs.writeFileSync(DATA_FILE, JSON.stringify(projects, null, 2));
}

// Send SMS via Twilio
async function sendSMS(to: string, body: string): Promise<{ success: boolean; error?: string; sid?: string }> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    return { success: false, error: 'Twilio not configured' };
  }

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: to,
          From: TWILIO_PHONE_NUMBER,
          Body: body,
        }),
      }
    );

    const data = await response.json();
    
    if (response.ok) {
      return { success: true, sid: data.sid };
    } else {
      return { success: false, error: data.message || 'Failed to send SMS' };
    }
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// Initiate call via Twilio
async function initiateCall(to: string, message: string): Promise<{ success: boolean; error?: string; sid?: string }> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    return { success: false, error: 'Twilio not configured' };
  }

  try {
    // Create TwiML for the call
    const twiml = `<Response><Say>${message}</Say></Response>`;
    
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Calls.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: to,
          From: TWILIO_PHONE_NUMBER,
          Twiml: twiml,
        }),
      }
    );

    const data = await response.json();
    
    if (response.ok) {
      return { success: true, sid: data.sid };
    } else {
      return { success: false, error: data.message || 'Failed to initiate call' };
    }
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// GET - List notifications for a project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    const projects = readProjects();
    const project = projects.find(p => p.id === projectId);

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    let notifications = project.notifications || [];

    if (type) {
      notifications = notifications.filter(n => n.type === type);
    }
    if (status) {
      notifications = notifications.filter(n => n.status === status);
    }

    // Sort by createdAt descending
    notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      notifications,
      total: notifications.length,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

// POST - Send notification
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const body = await request.json();

    const projects = readProjects();
    const projectIndex = projects.findIndex(p => p.id === projectId);

    if (projectIndex === -1) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const project = projects[projectIndex];

    const notification: Notification = {
      id: `notif-${Date.now()}`,
      type: body.type || 'sms',
      recipient: body.recipient,
      recipientName: body.recipientName || body.recipient,
      subject: body.subject || '',
      message: body.message,
      status: 'pending',
      sentAt: null,
      createdAt: new Date().toISOString(),
      relatedTaskId: body.relatedTaskId,
    };

    // Send notification based on type
    let result: { success: boolean; error?: string };

    switch (body.type) {
      case 'sms':
        result = await sendSMS(body.recipient, body.message);
        break;
      case 'call':
        result = await initiateCall(body.recipient, body.message);
        break;
      case 'email':
        // Email sending would go through your email API
        result = { success: true }; // Placeholder - integrate with your email service
        break;
      default:
        result = { success: false, error: 'Invalid notification type' };
    }

    notification.status = result.success ? 'sent' : 'failed';
    notification.sentAt = result.success ? new Date().toISOString() : null;
    if (!result.success) {
      notification.errorMessage = result.error;
    }

    if (!project.notifications) {
      project.notifications = [];
    }
    project.notifications.push(notification);

    // Log activity
    project.activityLog.push({
      id: `act-${Date.now()}`,
      type: 'notification_sent',
      message: `${body.type.toUpperCase()} notification ${result.success ? 'sent to' : 'failed for'} ${notification.recipientName}`,
      userId: body.sentBy || 'user-1',
      userName: body.sentByName || 'System',
      metadata: { notificationId: notification.id, type: body.type },
      createdAt: new Date().toISOString(),
    });

    project.updatedAt = new Date().toISOString();
    projects[projectIndex] = project;
    writeProjects(projects);

    return NextResponse.json({ 
      success: result.success, 
      notification,
      error: result.error,
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
  }
}
