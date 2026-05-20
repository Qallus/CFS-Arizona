import { NextRequest, NextResponse } from 'next/server';
import { VoiceResponse, twilioPhoneNumber, formatPhoneNumber } from '@/lib/twilio';

// Handle outbound calls from browser
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const to = formData.get('To') as string;
    const callerId = formData.get('CallerId') as string || twilioPhoneNumber;
    
    const twiml = new VoiceResponse();
    
    if (to) {
      // Outbound call to PSTN
      const dial = twiml.dial({
        callerId: callerId,
        record: 'record-from-answer-dual',
        recordingStatusCallback: `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/twilio/voice/recording`,
        recordingStatusCallbackEvent: ['completed'],
      });
      
      dial.number({
        statusCallback: `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/twilio/voice/status`,
        statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
        statusCallbackMethod: 'POST',
      }, formatPhoneNumber(to));
    } else {
      twiml.say('No destination specified.');
    }

    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' },
    });
  } catch (error) {
    console.error('Error handling voice request:', error);
    const twiml = new VoiceResponse();
    twiml.say('An error occurred. Please try again.');
    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' },
    });
  }
}
