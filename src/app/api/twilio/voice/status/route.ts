import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Handle call status updates
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const callSid = formData.get('CallSid') as string;
    const callStatus = formData.get('CallStatus') as string;
    const duration = formData.get('CallDuration') as string;
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;
    const direction = formData.get('Direction') as string;
    
    console.log(`Call ${callSid} status: ${callStatus}`);

    // Map Twilio status to our status
    const statusMap: Record<string, string> = {
      'queued': 'queued',
      'initiated': 'queued',
      'ringing': 'ringing',
      'in-progress': 'in-progress',
      'completed': 'completed',
      'busy': 'busy',
      'failed': 'failed',
      'no-answer': 'no-answer',
      'canceled': 'canceled',
    };

    const status = statusMap[callStatus] || callStatus;

    // Check if call log exists
    const { data: existing } = await supabaseAdmin
      .from('call_logs')
      .select('id')
      .eq('call_sid', callSid)
      .single();

    if (existing) {
      // Update existing call log
      await supabaseAdmin
        .from('call_logs')
        .update({
          status,
          duration: duration ? parseInt(duration) : null,
          ended_at: ['completed', 'busy', 'failed', 'no-answer', 'canceled'].includes(status) 
            ? new Date().toISOString() 
            : null,
        })
        .eq('call_sid', callSid);
    } else {
      // Create new call log
      await supabaseAdmin.from('call_logs').insert({
        call_sid: callSid,
        direction: direction === 'outbound-api' || direction === 'outbound-dial' ? 'outbound' : 'inbound',
        from_number: from,
        to_number: to,
        status,
        duration: duration ? parseInt(duration) : null,
        started_at: new Date().toISOString(),
        ended_at: ['completed', 'busy', 'failed', 'no-answer', 'canceled'].includes(status) 
          ? new Date().toISOString() 
          : null,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error handling status callback:', error);
    return NextResponse.json({ error: 'Failed to process status' }, { status: 500 });
  }
}
