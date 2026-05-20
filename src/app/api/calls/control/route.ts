import { NextRequest, NextResponse } from 'next/server';
import { twilioClient, twilioPhoneNumber } from '@/lib/twilio';
import { supabaseAdmin } from '@/lib/supabase';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, callSid, transferTo } = body;

    if (!callSid) {
      return NextResponse.json({ error: 'Call SID required' }, { status: 400 });
    }

    switch (action) {
      case 'start-recording': {
        // Start recording on an active call
        const recording = await twilioClient.calls(callSid).recordings.create({
          recordingStatusCallback: `${APP_URL}/api/twilio/voice/recording`,
          recordingStatusCallbackEvent: ['completed'],
          recordingChannels: 'dual', // Record both sides separately
        });

        // Update call log
        await supabaseAdmin
          .from('call_logs')
          .update({ is_recording: true })
          .eq('call_sid', callSid);

        return NextResponse.json({ 
          success: true, 
          recordingSid: recording.sid 
        });
      }

      case 'stop-recording': {
        // Get active recordings for this call and stop them
        const recordings = await twilioClient.calls(callSid).recordings.list({ limit: 1 });
        
        if (recordings.length > 0) {
          const activeRecording = recordings.find(r => r.status === 'in-progress');
          if (activeRecording) {
            await twilioClient.calls(callSid)
              .recordings(activeRecording.sid)
              .update({ status: 'stopped' });
          }
        }

        await supabaseAdmin
          .from('call_logs')
          .update({ is_recording: false })
          .eq('call_sid', callSid);

        return NextResponse.json({ success: true });
      }

      case 'hold': {
        // Put call on hold using TwiML update
        await twilioClient.calls(callSid).update({
          twiml: `<Response>
            <Play loop="0">http://com.twilio.sounds.music.s3.amazonaws.com/MARKOVICHAMP-B8a.mp3</Play>
          </Response>`,
        });

        await supabaseAdmin
          .from('call_logs')
          .update({ is_on_hold: true })
          .eq('call_sid', callSid);

        return NextResponse.json({ success: true });
      }

      case 'unhold': {
        // Resume call by connecting back to the browser client
        await twilioClient.calls(callSid).update({
          twiml: `<Response>
            <Dial>
              <Client>sig360-user</Client>
            </Dial>
          </Response>`,
        });

        await supabaseAdmin
          .from('call_logs')
          .update({ is_on_hold: false })
          .eq('call_sid', callSid);

        return NextResponse.json({ success: true });
      }

      case 'blind-transfer': {
        if (!transferTo) {
          return NextResponse.json({ error: 'Transfer number required' }, { status: 400 });
        }

        // Blind/cold transfer - redirect the call to the new number
        await twilioClient.calls(callSid).update({
          twiml: `<Response>
            <Say>Please hold while we transfer your call.</Say>
            <Dial callerId="${twilioPhoneNumber}">
              <Number>${transferTo}</Number>
            </Dial>
          </Response>`,
        });

        // Log the transfer
        await supabaseAdmin
          .from('call_logs')
          .update({ 
            transferred_to: transferTo,
            transfer_type: 'blind',
          })
          .eq('call_sid', callSid);

        return NextResponse.json({ success: true });
      }

      case 'warm-transfer': {
        if (!transferTo) {
          return NextResponse.json({ error: 'Transfer number required' }, { status: 400 });
        }

        // Warm transfer - create a new outbound call to the transfer target
        // while keeping the original call active
        const conferenceRoom = `transfer-${callSid}-${Date.now()}`;
        
        // Move the current call into a conference
        await twilioClient.calls(callSid).update({
          twiml: `<Response>
            <Dial>
              <Conference 
                startConferenceOnEnter="true"
                endConferenceOnExit="false"
                waitUrl="http://twimlets.com/holdmusic?Bucket=com.twilio.music.classical"
              >${conferenceRoom}</Conference>
            </Dial>
          </Response>`,
        });

        // Create a new call to the transfer target
        const newCall = await twilioClient.calls.create({
          to: transferTo,
          from: twilioPhoneNumber,
          twiml: `<Response>
            <Say>You have an incoming transferred call. Press 1 to accept.</Say>
            <Gather numDigits="1" action="${APP_URL}/api/calls/transfer-accept?conference=${conferenceRoom}">
              <Say>Press 1 to accept the transfer.</Say>
            </Gather>
          </Response>`,
        });

        await supabaseAdmin
          .from('call_logs')
          .update({ 
            transferred_to: transferTo,
            transfer_type: 'warm',
            transfer_conference: conferenceRoom,
          })
          .eq('call_sid', callSid);

        return NextResponse.json({ 
          success: true, 
          transferCallSid: newCall.sid,
          conferenceRoom,
        });
      }

      case 'complete-transfer': {
        // Complete a warm transfer by leaving the conference
        // The original parties remain connected
        if (body.conferenceRoom) {
          // Just disconnect the agent from the conference
          const participants = await twilioClient.conferences(body.conferenceRoom)
            .participants.list();
          
          // Find and remove the agent (browser client)
          for (const participant of participants) {
            if (participant.callSid === callSid) {
              await twilioClient.conferences(body.conferenceRoom)
                .participants(participant.callSid)
                .remove();
              break;
            }
          }
        }

        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error controlling call:', error);
    return NextResponse.json({ 
      error: 'Failed to control call',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
