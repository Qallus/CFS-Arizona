import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Handle transcription callback
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const callSid = formData.get('CallSid') as string;
    const recordingSid = formData.get('RecordingSid') as string;
    const transcriptionText = formData.get('TranscriptionText') as string;
    const transcriptionStatus = formData.get('TranscriptionStatus') as string;
    
    console.log(`Transcription for ${recordingSid}: ${transcriptionStatus}`);

    if (transcriptionStatus === 'completed' && transcriptionText) {
      // Update voicemail with transcription
      await supabaseAdmin
        .from('voicemails')
        .update({ transcription: transcriptionText })
        .eq('recording_sid', recordingSid);

      // Also update call log
      await supabaseAdmin
        .from('call_logs')
        .update({ transcription: transcriptionText })
        .eq('call_sid', callSid);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error handling transcription:', error);
    return NextResponse.json({ error: 'Failed to process transcription' }, { status: 500 });
  }
}
