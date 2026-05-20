import { NextRequest, NextResponse } from 'next/server';
import { VoiceResponse } from '@/lib/twilio';

// Handle voicemail
export async function POST(request: NextRequest) {
  try {
    const twiml = new VoiceResponse();
    
    twiml.say({ voice: 'alice' }, 
      'Please leave a message after the beep. Press the pound key when finished.'
    );
    
    twiml.record({
      maxLength: 120,
      transcribe: true,
      transcribeCallback: '/api/twilio/voice/transcription',
      recordingStatusCallback: '/api/twilio/voice/voicemail-saved',
      recordingStatusCallbackEvent: ['completed'],
      finishOnKey: '#',
      playBeep: true,
    });
    
    twiml.say({ voice: 'alice' }, 'Thank you for your message. Goodbye.');
    twiml.hangup();

    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' },
    });
  } catch (error) {
    console.error('Error handling voicemail:', error);
    const twiml = new VoiceResponse();
    twiml.say('Unable to record voicemail. Please try again.');
    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' },
    });
  }
}
