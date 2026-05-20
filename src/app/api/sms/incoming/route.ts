import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import twilio from 'twilio';

const MessagingResponse = twilio.twiml.MessagingResponse;

// Handle incoming SMS from Twilio
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const messageSid = formData.get('MessageSid') as string;
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;
    const body = formData.get('Body') as string;
    const numMedia = parseInt(formData.get('NumMedia') as string || '0');
    
    console.log(`Incoming SMS from ${from}: ${body}`);

    // Collect media URLs if any
    const mediaUrls: string[] = [];
    for (let i = 0; i < numMedia; i++) {
      const mediaUrl = formData.get(`MediaUrl${i}`) as string;
      if (mediaUrl) mediaUrls.push(mediaUrl);
    }

    // Save to database
    await supabaseAdmin.from('sms_messages').insert({
      message_sid: messageSid,
      direction: 'inbound',
      from_number: from,
      to_number: to,
      body: body,
      status: 'received',
      media_urls: mediaUrls.length > 0 ? mediaUrls : null,
      is_read: false,
    });

    // Return empty TwiML response (no auto-reply)
    const twiml = new MessagingResponse();
    
    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' },
    });
  } catch (error) {
    console.error('Error handling incoming SMS:', error);
    const twiml = new MessagingResponse();
    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' },
    });
  }
}
