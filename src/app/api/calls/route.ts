import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { twilioClient, formatPhoneNumber } from '@/lib/twilio';

// GET - Fetch call history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const direction = searchParams.get('direction'); // 'inbound' or 'outbound'
    const status = searchParams.get('status');

    let query = supabaseAdmin
      .from('call_logs')
      .select('*', { count: 'exact' })
      .order('started_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (direction) {
      query = query.eq('direction', direction);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data: calls, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({ calls, total: count });
  } catch (error) {
    console.error('Error fetching calls:', error);
    return NextResponse.json({ error: 'Failed to fetch calls' }, { status: 500 });
  }
}

// POST - Initiate outbound call or update call
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, to, callSid, notes } = body;

    if (action === 'call') {
      // Initiate outbound call via Twilio REST API
      const call = await twilioClient.calls.create({
        to: formatPhoneNumber(to),
        from: process.env.TWILIO_PHONE_NUMBER!,
        url: `${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/voice`,
        statusCallback: `${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/voice/status`,
        statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
        statusCallbackMethod: 'POST',
        record: true,
      });

      // Log the call
      await supabaseAdmin.from('call_logs').insert({
        call_sid: call.sid,
        direction: 'outbound',
        from_number: process.env.TWILIO_PHONE_NUMBER!,
        to_number: formatPhoneNumber(to),
        status: 'queued',
        started_at: new Date().toISOString(),
      });

      return NextResponse.json({ success: true, callSid: call.sid });
    }

    if (action === 'update-notes' && callSid) {
      await supabaseAdmin
        .from('call_logs')
        .update({ notes })
        .eq('call_sid', callSid);

      return NextResponse.json({ success: true });
    }

    if (action === 'hangup' && callSid) {
      await twilioClient.calls(callSid).update({ status: 'completed' });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error processing call action:', error);
    return NextResponse.json({ error: 'Failed to process action' }, { status: 500 });
  }
}
