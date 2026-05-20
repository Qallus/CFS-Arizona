import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Handle voicemail recording saved
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const callSid = formData.get('CallSid') as string;
    const recordingSid = formData.get('RecordingSid') as string;
    const recordingUrl = formData.get('RecordingUrl') as string;
    const recordingDuration = formData.get('RecordingDuration') as string;
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;
    
    console.log(`Voicemail saved: ${recordingSid} from ${from}`);

    // Save voicemail to database
    await supabaseAdmin.from('voicemails').insert({
      call_sid: callSid,
      from_number: from,
      to_number: to,
      recording_url: recordingUrl,
      recording_sid: recordingSid,
      duration: recordingDuration ? parseInt(recordingDuration) : 0,
      is_read: false,
    });

    // Update call log
    await supabaseAdmin
      .from('call_logs')
      .update({
        status: 'completed',
        recording_url: recordingUrl,
        recording_sid: recordingSid,
        ended_at: new Date().toISOString(),
      })
      .eq('call_sid', callSid);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving voicemail:', error);
    return NextResponse.json({ error: 'Failed to save voicemail' }, { status: 500 });
  }
}
