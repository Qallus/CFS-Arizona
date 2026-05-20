import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import imaps from 'imap-simple';
import { simpleParser, ParsedMail } from 'mailparser';

const EMAIL_CONFIG = {
  address: process.env.EMAIL_ADDRESS || 'hello@channelcast.io',
  password: process.env.EMAIL_PASSWORD || '',
  imap: {
    host: process.env.IMAP_HOST || 'imap.hostinger.com',
    port: parseInt(process.env.IMAP_PORT || '993'),
  },
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.hostinger.com',
    port: parseInt(process.env.SMTP_PORT || '465'),
  },
};

// Create SMTP transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: EMAIL_CONFIG.smtp.host,
    port: EMAIL_CONFIG.smtp.port,
    secure: true, // SSL
    auth: {
      user: EMAIL_CONFIG.address,
      pass: EMAIL_CONFIG.password,
    },
  });
};

// IMAP config
const getImapConfig = () => ({
  imap: {
    user: EMAIL_CONFIG.address,
    password: EMAIL_CONFIG.password,
    host: EMAIL_CONFIG.imap.host,
    port: EMAIL_CONFIG.imap.port,
    tls: true,
    tlsOptions: { rejectUnauthorized: false },
    authTimeout: 10000,
  },
});

interface EmailMessage {
  id: string;
  uid: number;
  from: string;
  fromName: string;
  to: string;
  subject: string;
  date: string;
  snippet: string;
  body: string;
  html?: string;
  read: boolean;
  attachments: Array<{
    filename: string;
    contentType: string;
    size: number;
  }>;
}

// GET - Fetch emails from inbox
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const folder = searchParams.get('folder') || 'INBOX';
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const messageId = searchParams.get('id');

    if (!EMAIL_CONFIG.password || EMAIL_CONFIG.password === 'NEEDS_TO_BE_SET') {
      return NextResponse.json({ 
        error: 'Email password not configured',
        emails: [],
        total: 0,
      }, { status: 200 });
    }

    const connection = await imaps.connect(getImapConfig());
    
    try {
      await connection.openBox(folder);
      
      // Get message count
      const boxInfo = connection.imap as any;
      const totalMessages = boxInfo?.selected?.messages?.total || 0;

      if (messageId) {
        // Fetch single email with full body
        const searchCriteria = [['UID', messageId]];
        const fetchOptions = {
          bodies: ['HEADER', 'TEXT', ''],
          markSeen: false,
          struct: true,
        };

        const messages = await connection.search(searchCriteria, fetchOptions);
        
        if (messages.length === 0) {
          return NextResponse.json({ error: 'Email not found' }, { status: 404 });
        }

        const msg = messages[0];
        const all = msg.parts.find((p: any) => p.which === '');
        const parsed = await simpleParser(all?.body || '');

        const fromText = Array.isArray(parsed.from) ? parsed.from[0]?.text : parsed.from?.text;
        const fromName = Array.isArray(parsed.from) ? parsed.from[0]?.value?.[0]?.name : parsed.from?.value?.[0]?.name;
        const toText = Array.isArray(parsed.to) ? parsed.to[0]?.text : parsed.to?.text;
        
        const email: EmailMessage = {
          id: msg.attributes.uid.toString(),
          uid: msg.attributes.uid,
          from: fromText || '',
          fromName: fromName || fromText || '',
          to: toText || '',
          subject: parsed.subject || '(no subject)',
          date: parsed.date?.toISOString() || '',
          snippet: (parsed.text || '').substring(0, 200),
          body: parsed.text || '',
          html: parsed.html || undefined,
          read: msg.attributes.flags?.includes('\\Seen') || false,
          attachments: (parsed.attachments || []).map((att: any) => ({
            filename: att.filename || 'attachment',
            contentType: att.contentType || 'application/octet-stream',
            size: att.size || 0,
          })),
        };

        connection.end();
        return NextResponse.json({ email });
      }

      // Fetch list of emails (headers only)
      const start = Math.max(1, totalMessages - (page * limit) + 1);
      const end = Math.max(1, totalMessages - ((page - 1) * limit));
      
      const searchCriteria = [['ALL']];
      const fetchOptions = {
        bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)'],
        markSeen: false,
        struct: true,
      };

      // Fetch recent messages
      const fetchResult = await connection.search(searchCriteria, fetchOptions);
      
      // Sort by date (newest first) and paginate
      const sortedMessages = fetchResult
        .sort((a: any, b: any) => b.attributes.uid - a.attributes.uid)
        .slice((page - 1) * limit, page * limit);

      const emails: Partial<EmailMessage>[] = [];
      
      for (const msg of sortedMessages) {
        try {
          const header = msg.parts.find((p: any) => p.which.includes('HEADER'));
          const headerStr = header?.body || {};
          
          emails.push({
            id: msg.attributes.uid.toString(),
            uid: msg.attributes.uid,
            from: headerStr.from?.[0] || '',
            fromName: headerStr.from?.[0]?.replace(/<.*>/, '').trim() || '',
            to: headerStr.to?.[0] || '',
            subject: headerStr.subject?.[0] || '(no subject)',
            date: headerStr.date?.[0] || '',
            read: msg.attributes.flags?.includes('\\Seen') || false,
          });
        } catch (e) {
          console.error('Error parsing message:', e);
        }
      }

      connection.end();

      return NextResponse.json({
        emails,
        total: totalMessages,
        page,
        perPage: limit,
        totalPages: Math.ceil(totalMessages / limit),
        folder,
      });
    } catch (error) {
      connection.end();
      throw error;
    }
  } catch (error) {
    console.error('Error fetching emails:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch emails',
      details: error instanceof Error ? error.message : 'Unknown error',
      emails: [],
    }, { status: 500 });
  }
}

// POST - Send email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, to, subject, text, html, replyTo, cc, bcc, attachments } = body;

    if (action === 'mark_read') {
      // Mark email as read
      const { uid } = body;
      if (!uid) {
        return NextResponse.json({ error: 'UID required' }, { status: 400 });
      }

      const connection = await imaps.connect(getImapConfig());
      await connection.openBox('INBOX');
      await connection.addFlags(uid, '\\Seen');
      connection.end();

      return NextResponse.json({ success: true });
    }

    if (action === 'delete') {
      // Delete email (move to trash)
      const { uid } = body;
      if (!uid) {
        return NextResponse.json({ error: 'UID required' }, { status: 400 });
      }

      const connection = await imaps.connect(getImapConfig());
      await connection.openBox('INBOX');
      await connection.addFlags(uid, '\\Deleted');
      connection.end();

      return NextResponse.json({ success: true });
    }

    // Send email
    if (!to || !subject) {
      return NextResponse.json({ error: 'To and subject are required' }, { status: 400 });
    }

    if (!EMAIL_CONFIG.password || EMAIL_CONFIG.password === 'NEEDS_TO_BE_SET') {
      return NextResponse.json({ error: 'Email password not configured' }, { status: 500 });
    }

    const transporter = createTransporter();

    const mailOptions: any = {
      from: `"ChannelCast" <${EMAIL_CONFIG.address}>`,
      to,
      subject,
      text: text || '',
      html: html || undefined,
      replyTo: replyTo || undefined,
      cc: cc || undefined,
      bcc: bcc || undefined,
    };

    if (attachments && attachments.length > 0) {
      mailOptions.attachments = attachments;
    }

    const info = await transporter.sendMail(mailOptions);

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
    });
  } catch (error) {
    console.error('Error with email action:', error);
    return NextResponse.json({ 
      error: 'Failed to process email action',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
