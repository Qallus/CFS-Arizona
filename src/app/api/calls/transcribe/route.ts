import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import OpenAI from 'openai';

// Lazy initialize OpenAI client
let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

// Transcribe a call recording using OpenAI Whisper
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { callId, callSid, recordingUrl } = body;

    // Get call info if not provided
    let call;
    if (callId) {
      const { data } = await supabaseAdmin
        .from('call_logs')
        .select('*')
        .eq('id', callId)
        .single();
      call = data;
    } else if (callSid) {
      const { data } = await supabaseAdmin
        .from('call_logs')
        .select('*')
        .eq('call_sid', callSid)
        .single();
      call = data;
    }

    if (!call && !recordingUrl) {
      return NextResponse.json({ error: 'Call not found or recording URL required' }, { status: 404 });
    }

    const audioUrl = recordingUrl || call?.recording_url;
    if (!audioUrl) {
      return NextResponse.json({ error: 'No recording available for this call' }, { status: 400 });
    }

    // Download the recording
    // Twilio recordings are in .wav format by default, add .mp3 for mp3
    const finalUrl = audioUrl.endsWith('.mp3') || audioUrl.endsWith('.wav') 
      ? audioUrl 
      : audioUrl + '.mp3';
    
    console.log(`Fetching recording from: ${finalUrl}`);
    
    const audioResponse = await fetch(finalUrl);
    if (!audioResponse.ok) {
      throw new Error(`Failed to fetch recording: ${audioResponse.status}`);
    }

    const audioBuffer = await audioResponse.arrayBuffer();
    const audioBlob = new Blob([audioBuffer], { type: 'audio/mp3' });
    
    // Create a File object for OpenAI
    const audioFile = new File([audioBlob], 'recording.mp3', { type: 'audio/mp3' });

    console.log(`Transcribing audio (${Math.round(audioBuffer.byteLength / 1024)}KB)...`);

    // Transcribe using Whisper
    const transcription = await getOpenAI().audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      response_format: 'verbose_json',
      timestamp_granularities: ['segment'],
    });

    // Format transcription with timestamps
    let formattedTranscription = '';
    if (transcription.segments) {
      formattedTranscription = transcription.segments
        .map(seg => {
          const startTime = formatTime(seg.start);
          return `[${startTime}] ${seg.text.trim()}`;
        })
        .join('\n');
    } else {
      formattedTranscription = transcription.text;
    }

    // Update the call log with transcription
    if (call) {
      await supabaseAdmin
        .from('call_logs')
        .update({ 
          transcription: formattedTranscription,
          transcription_raw: transcription.text,
          transcribed_at: new Date().toISOString(),
        })
        .eq('id', call.id);
    }

    return NextResponse.json({ 
      success: true, 
      transcription: formattedTranscription,
      raw: transcription.text,
      duration: transcription.duration,
      language: transcription.language,
    });
  } catch (error) {
    console.error('Error transcribing call:', error);
    return NextResponse.json({ 
      error: 'Failed to transcribe call',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET - Check transcription status or get existing transcription
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const callId = searchParams.get('callId');
    const callSid = searchParams.get('callSid');

    if (!callId && !callSid) {
      return NextResponse.json({ error: 'Call ID or SID required' }, { status: 400 });
    }

    let query = supabaseAdmin.from('call_logs').select('transcription, transcription_raw, transcribed_at');
    
    if (callId) {
      query = query.eq('id', callId);
    } else if (callSid) {
      query = query.eq('call_sid', callSid);
    }

    const { data, error } = await query.single();

    if (error) throw error;

    return NextResponse.json({
      hasTranscription: !!data?.transcription,
      transcription: data?.transcription,
      transcribedAt: data?.transcribed_at,
    });
  } catch (error) {
    console.error('Error getting transcription:', error);
    return NextResponse.json({ error: 'Failed to get transcription' }, { status: 500 });
  }
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
