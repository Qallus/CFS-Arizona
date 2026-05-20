import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Handle recording completed callback
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const callSid = formData.get('CallSid') as string;
    const parentCallSid = formData.get('ParentCallSid') as string;
    const recordingSid = formData.get('RecordingSid') as string;
    const recordingUrl = formData.get('RecordingUrl') as string;
    const recordingDuration = formData.get('RecordingDuration') as string;
    const recordingStatus = formData.get('RecordingStatus') as string;
    
    console.log(`Recording ${recordingSid} for call ${callSid} (parent: ${parentCallSid || 'none'}): ${recordingStatus}`);

    if (recordingStatus === 'completed' && recordingUrl) {
      // Try to update by call_sid first
      const { data: updated } = await supabaseAdmin
        .from('call_logs')
        .update({
          recording_url: recordingUrl,
          recording_sid: recordingSid,
        })
        .eq('call_sid', callSid)
        .select('id');

      // If no match and we have a parent call SID, try that
      if ((!updated || updated.length === 0) && parentCallSid) {
        console.log(`No match for ${callSid}, trying parent ${parentCallSid}`);
        await supabaseAdmin
          .from('call_logs')
          .update({
            recording_url: recordingUrl,
            recording_sid: recordingSid,
          })
          .eq('call_sid', parentCallSid);
      }

      // If still no match, find the most recent call without a recording (within last 5 min)
      if (!updated || updated.length === 0) {
        const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        const { data: recentCall } = await supabaseAdmin
          .from('call_logs')
          .select('id, call_sid')
          .is('recording_url', null)
          .gte('started_at', fiveMinAgo)
          .order('started_at', { ascending: false })
          .limit(1)
          .single();

        if (recentCall) {
          console.log(`Attaching recording to recent call ${recentCall.call_sid}`);
          await supabaseAdmin
            .from('call_logs')
            .update({
              recording_url: recordingUrl,
              recording_sid: recordingSid,
            })
            .eq('id', recentCall.id);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error handling recording callback:', error);
    return NextResponse.json({ error: 'Failed to process recording' }, { status: 500 });
  }
}
