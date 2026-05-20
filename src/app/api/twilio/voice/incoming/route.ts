import { NextRequest, NextResponse } from 'next/server';
import { VoiceResponse } from '@/lib/twilio';
import { supabaseAdmin } from '@/lib/supabase';

// Handle incoming calls
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;
    const callSid = formData.get('CallSid') as string;
    const digits = formData.get('Digits') as string;
    
    const twiml = new VoiceResponse();

    // Log the incoming call
    if (!digits) {
      await supabaseAdmin.from('call_logs').insert({
        call_sid: callSid,
        direction: 'inbound',
        from_number: from,
        to_number: to,
        status: 'ringing',
        started_at: new Date().toISOString(),
      });
    }

    // IVR Menu
    if (!digits) {
      const gather = twiml.gather({
        numDigits: 1,
        action: '/api/twilio/voice/incoming',
        method: 'POST',
        timeout: 5,
      });
      
      gather.say({ voice: 'alice' }, 
        'Welcome. Press 1 for Sales, Press 2 for Support, or stay on the line to leave a message.'
      );
      
      // If no input, go to voicemail
      twiml.redirect('/api/twilio/voice/voicemail');
    } else {
      // Handle IVR selection
      switch (digits) {
        case '1':
          twiml.say({ voice: 'alice' }, 'Connecting you to Sales.');
          // Connect to browser client
          const dialSales = twiml.dial({
            record: 'record-from-answer-dual',
            recordingStatusCallback: '/api/twilio/voice/recording',
          });
          dialSales.client('sig360-user');
          break;
          
        case '2':
          twiml.say({ voice: 'alice' }, 'Connecting you to Support.');
          const dialSupport = twiml.dial({
            record: 'record-from-answer-dual',
            recordingStatusCallback: '/api/twilio/voice/recording',
          });
          dialSupport.client('sig360-user');
          break;
          
        default:
          twiml.say({ voice: 'alice' }, 'Invalid selection.');
          twiml.redirect('/api/twilio/voice/incoming');
      }
    }

    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' },
    });
  } catch (error) {
    console.error('Error handling incoming call:', error);
    const twiml = new VoiceResponse();
    twiml.say('We are experiencing technical difficulties. Please try again later.');
    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' },
    });
  }
}
