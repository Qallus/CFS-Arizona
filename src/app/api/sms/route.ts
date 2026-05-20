import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { twilioClient } from '@/lib/twilio';

const TWILIO_PHONE = process.env.TWILIO_SMS_PHONE_NUMBER || process.env.TWILIO_PHONE_NUMBER!;

// GET - Fetch SMS conversations or messages
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationWith = searchParams.get('with');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (conversationWith) {
      // Get messages in a conversation
      const { data: messages, error } = await supabaseAdmin
        .from('sms_messages')
        .select('*')
        .or(`from_number.eq.${conversationWith},to_number.eq.${conversationWith}`)
        .order('created_at', { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      // Mark as read
      await supabaseAdmin
        .from('sms_messages')
        .update({ is_read: true })
        .eq('from_number', conversationWith)
        .eq('direction', 'inbound');

      return NextResponse.json({ messages });
    } else {
      // Get conversation list (grouped by contact)
      const { data: conversations, error } = await supabaseAdmin
        .rpc('get_sms_conversations')
        .limit(limit)
        .range(offset, offset + limit - 1);

      if (error) {
        // Fallback if RPC doesn't exist - get recent messages grouped
        const { data: messages } = await supabaseAdmin
          .from('sms_messages')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        // Group by contact
        const convMap = new Map();
        messages?.forEach(msg => {
          const contact = msg.direction === 'inbound' ? msg.from_number : msg.to_number;
          if (!convMap.has(contact)) {
            convMap.set(contact, {
              contact_number: contact,
              last_message: msg.body,
              last_message_at: msg.created_at,
              direction: msg.direction,
              is_read: msg.is_read,
            });
          }
        });

        return NextResponse.json({ conversations: Array.from(convMap.values()) });
      }

      return NextResponse.json({ conversations });
    }
  } catch (error) {
    console.error('Error fetching SMS:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

// POST - Send SMS
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, to, body: messageBody, contacts, template } = body;

    if (action === 'send') {
      // Send single SMS
      const message = await twilioClient.messages.create({
        to: formatPhoneNumber(to),
        from: TWILIO_PHONE,
        body: messageBody,
        statusCallback: `${process.env.NEXT_PUBLIC_APP_URL}/api/sms/status`,
      });

      // Save to database
      await supabaseAdmin.from('sms_messages').insert({
        message_sid: message.sid,
        direction: 'outbound',
        from_number: TWILIO_PHONE,
        to_number: formatPhoneNumber(to),
        body: messageBody,
        status: message.status,
        is_read: true,
      });

      return NextResponse.json({ success: true, messageSid: message.sid });
    }

    if (action === 'bulk') {
      // Send bulk SMS
      const results = [];
      const errors = [];

      for (const contact of contacts) {
        try {
          // Replace template variables
          let personalizedBody = template;
          if (contact.name) {
            personalizedBody = personalizedBody.replace(/\{\{name\}\}/gi, contact.name);
          }
          personalizedBody = personalizedBody.replace(/\{\{phone\}\}/gi, contact.phone);

          const message = await twilioClient.messages.create({
            to: formatPhoneNumber(contact.phone),
            from: TWILIO_PHONE,
            body: personalizedBody,
            statusCallback: `${process.env.NEXT_PUBLIC_APP_URL}/api/sms/status`,
          });

          // Save to database
          await supabaseAdmin.from('sms_messages').insert({
            message_sid: message.sid,
            direction: 'outbound',
            from_number: TWILIO_PHONE,
            to_number: formatPhoneNumber(contact.phone),
            body: personalizedBody,
            status: message.status,
            is_read: true,
            bulk_id: body.bulkId || null,
          });

          results.push({ phone: contact.phone, status: 'sent', sid: message.sid });
          
          // Rate limiting - small delay between messages
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (err: any) {
          errors.push({ phone: contact.phone, error: err.message });
        }
      }

      return NextResponse.json({ 
        success: true, 
        sent: results.length, 
        failed: errors.length,
        results,
        errors 
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error sending SMS:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}

function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`;
  }
  if (!phone.startsWith('+')) {
    return `+${cleaned}`;
  }
  return phone;
}
