'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Phone, 
  PhoneOff, 
  Delete, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  Loader2,
  User,
  X,
  Pause,
  Play,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Device, Call } from '@twilio/voice-sdk';

interface DialpadModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPhone?: string;
  contactName?: string;
  /** Workflow context — when supplied, a completed call is logged to this contact's timeline. */
  contactId?: string | null;
  opportunityId?: string | null;
  /** Called after a call was written to the timeline, so the caller can refresh it. */
  onLogged?: () => void;
}

const DIALPAD_KEYS = [
  { digit: '1', letters: '' },
  { digit: '2', letters: 'ABC' },
  { digit: '3', letters: 'DEF' },
  { digit: '4', letters: 'GHI' },
  { digit: '5', letters: 'JKL' },
  { digit: '6', letters: 'MNO' },
  { digit: '7', letters: 'PQRS' },
  { digit: '8', letters: 'TUV' },
  { digit: '9', letters: 'WXYZ' },
  { digit: '*', letters: '' },
  { digit: '0', letters: '+' },
  { digit: '#', letters: '' },
];

export function DialpadModal({
  isOpen,
  onClose,
  initialPhone,
  contactName,
  contactId,
  opportunityId,
  onLogged,
}: DialpadModalProps) {
  const [phoneNumber, setPhoneNumber] = useState(initialPhone || '');
  const [device, setDevice] = useState<Device | null>(null);
  const [activeCall, setActiveCall] = useState<Call | null>(null);
  const [callStatus, setCallStatus] = useState<'idle' | 'connecting' | 'ringing' | 'connected' | 'ended'>('idle');
  const [isReady, setIsReady] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Call length is measured from the wall clock rather than read off the
  // display timer: the Twilio event handlers below are registered once and
  // would otherwise close over the duration value as it was at dial time.
  const connectedAtRef = useRef<number | null>(null);
  // 'disconnect' can arrive alongside a local hangup, and both paths end the
  // call — this keeps a single call from producing two timeline entries.
  const loggedRef = useRef(false);

  /**
   * Write a finished call to the contact's timeline, with billable minutes
   * derived from how long it was actually connected. Rounds up, so a
   * two-minute-ten call bills as three — matching how the practice already
   * reports time. Calls that never connected are not logged: an unanswered
   * ring is not billable, and would bury real contact in noise.
   */
  const logCall = useCallback(async () => {
    if (!contactId || loggedRef.current || connectedAtRef.current === null) return;
    loggedRef.current = true;

    const seconds = Math.round((Date.now() - connectedAtRef.current) / 1000);
    connectedAtRef.current = null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    try {
      const res = await fetch('/api/crm/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId,
          opportunityId: opportunityId || null,
          type: 'call',
          direction: 'out',
          subject: `Call — ${mins}m ${secs}s`,
          body: `Outbound call to ${phoneNumber}.`,
          billableMinutes: Math.max(1, Math.ceil(seconds / 60)),
        }),
      });
      if (res.ok) onLogged?.();
    } catch (err) {
      // The call happened whether or not we managed to record it. Surfacing
      // this would be alarming and unactionable mid-hangup.
      console.error('Could not log the call to the timeline:', err);
    }
  }, [contactId, opportunityId, phoneNumber, onLogged]);

  useEffect(() => {
    if (initialPhone) {
      setPhoneNumber(initialPhone);
    }
  }, [initialPhone]);

  // Initialize Twilio Device when modal opens
  useEffect(() => {
    if (!isOpen) return;

    async function initDevice() {
      try {
        const response = await fetch('/api/twilio/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identity: 'sig360-contacts-user' }),
        });
        
        const { token, error: tokenError } = await response.json();
        
        if (tokenError) {
          setError(tokenError);
          return;
        }

        const newDevice = new Device(token, {
          codecPreferences: [Call.Codec.PCMU, Call.Codec.Opus],
          allowIncomingWhileBusy: false,
        });

        newDevice.on('registered', () => {
          console.log('Twilio Device registered for DialpadModal');
          setIsReady(true);
        });

        newDevice.on('error', (err) => {
          console.error('Twilio Device error:', err);
          setError(err.message);
        });

        await newDevice.register();
        setDevice(newDevice);
      } catch (err: any) {
        console.error('Failed to initialize device:', err);
        setError('Failed to initialize phone. Check Twilio configuration.');
      }
    }

    initDevice();

    return () => {
      if (device) {
        device.destroy();
        setDevice(null);
      }
    };
  }, [isOpen]);

  // Duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (callStatus === 'connected') {
      interval = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callStatus]);

  const handleKeyPress = (digit: string) => {
    if (callStatus === 'idle') {
      setPhoneNumber(prev => prev + digit);
    } else if (activeCall) {
      // Send DTMF during call
      activeCall.sendDigits(digit);
    }
  };

  const handleBackspace = () => {
    setPhoneNumber(prev => prev.slice(0, -1));
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCall = useCallback(async () => {
    if (!device || !phoneNumber.trim()) return;

    setError(null);
    setCallStatus('connecting');
    setDuration(0);
    connectedAtRef.current = null;
    loggedRef.current = false;

    try {
      const call = await device.connect({
        params: {
          To: phoneNumber,
        },
      });

      setActiveCall(call);

      call.on('ringing', () => {
        console.log('Call ringing');
        setCallStatus('ringing');
      });

      call.on('accept', () => {
        console.log('Call accepted/connected');
        connectedAtRef.current = Date.now();
        setCallStatus('connected');
      });

      call.on('disconnect', () => {
        console.log('Call disconnected');
        void logCall();
        setCallStatus('ended');
        setActiveCall(null);
        setTimeout(() => {
          setCallStatus('idle');
          setDuration(0);
        }, 2000);
      });

      call.on('cancel', () => {
        console.log('Call cancelled');
        setCallStatus('idle');
        setActiveCall(null);
      });

      call.on('error', (err) => {
        console.error('Call error:', err);
        setError(err.message);
        setCallStatus('idle');
        setActiveCall(null);
      });

    } catch (err: any) {
      console.error('Failed to make call:', err);
      setError(err.message);
      setCallStatus('idle');
    }
  }, [device, phoneNumber, logCall]);

  const handleHangup = useCallback(() => {
    if (activeCall) {
      // Emits 'disconnect', which is where the call gets logged.
      activeCall.disconnect();
    } else {
      void logCall();
    }
    setCallStatus('ended');
    setActiveCall(null);
    setTimeout(() => {
      setCallStatus('idle');
      setDuration(0);
    }, 2000);
  }, [activeCall, logCall]);

  const handleMuteToggle = useCallback(() => {
    if (activeCall) {
      if (isMuted) {
        activeCall.mute(false);
      } else {
        activeCall.mute(true);
      }
      setIsMuted(!isMuted);
    }
  }, [activeCall, isMuted]);

  const handleClose = () => {
    if (activeCall) {
      activeCall.disconnect();
    }
    if (device) {
      device.destroy();
      setDevice(null);
    }
    setPhoneNumber(initialPhone || '');
    setError(null);
    setCallStatus('idle');
    setActiveCall(null);
    setIsReady(false);
    setDuration(0);
    onClose();
  };

  const isInCall = callStatus === 'connecting' || callStatus === 'ringing' || callStatus === 'connected';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[360px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-green-500" />
            {callStatus === 'idle' ? 'Make a Call' : 
             callStatus === 'connecting' ? 'Connecting...' :
             callStatus === 'ringing' ? 'Ringing...' :
             callStatus === 'connected' ? 'In Call' : 'Call Ended'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Contact Info */}
          {contactName && (
            <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-brand/20 flex items-center justify-center">
                <User className="w-5 h-5 text-brand" />
              </div>
              <div>
                <p className="font-medium text-foreground">{contactName}</p>
                <p className="text-sm text-muted-foreground">{phoneNumber}</p>
              </div>
            </div>
          )}

          {/* Phone Number Display */}
          <div className="text-center">
            <Input
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Enter phone number"
              className="text-center text-2xl font-mono bg-secondary border-border h-14"
              disabled={isInCall}
            />
            {callStatus === 'connected' && (
              <p className="text-green-500 mt-2 text-lg font-mono">{formatDuration(duration)}</p>
            )}
            {callStatus === 'connecting' && (
              <p className="text-yellow-500 mt-2 animate-pulse">Connecting...</p>
            )}
            {callStatus === 'ringing' && (
              <p className="text-blue-500 mt-2 animate-pulse">Ringing...</p>
            )}
            {callStatus === 'ended' && (
              <p className="text-muted-foreground mt-2">Call ended</p>
            )}
          </div>

          {/* Status indicator */}
          {callStatus === 'idle' && (
            <div className="text-center">
              {error ? (
                <p className="text-red-400 text-sm">{error}</p>
              ) : (
                <p className="text-muted-foreground text-sm">
                  {isReady ? '● Ready to call' : 'Initializing...'}
                </p>
              )}
            </div>
          )}

          {error && callStatus !== 'idle' && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          {/* Dialpad */}
          {callStatus === 'idle' && (
            <div className="grid grid-cols-3 gap-2">
              {DIALPAD_KEYS.map(({ digit, letters }) => (
                <Button
                  key={digit}
                  variant="outline"
                  className="h-16 flex flex-col items-center justify-center hover:bg-secondary"
                  onClick={() => handleKeyPress(digit)}
                >
                  <span className="text-2xl font-medium">{digit}</span>
                  {letters && (
                    <span className="text-[10px] text-muted-foreground tracking-wider">{letters}</span>
                  )}
                </Button>
              ))}
            </div>
          )}

          {/* In-Call Controls */}
          {isInCall && (
            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                size="icon"
                className={cn("w-14 h-14 rounded-full", isMuted && "bg-red-500/20 border-red-500/50")}
                onClick={handleMuteToggle}
                disabled={callStatus !== 'connected'}
              >
                {isMuted ? <MicOff className="w-6 h-6 text-red-500" /> : <Mic className="w-6 h-6" />}
              </Button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-center gap-4">
            {callStatus === 'idle' && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className="w-14 h-14 rounded-full"
                  onClick={handleBackspace}
                  disabled={!phoneNumber}
                >
                  <Delete className="w-6 h-6" />
                </Button>
                <Button
                  size="icon"
                  className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-600"
                  onClick={handleCall}
                  disabled={!phoneNumber.trim() || !isReady}
                >
                  {!isReady ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <Phone className="w-6 h-6" />
                  )}
                </Button>
              </>
            )}
            {isInCall && (
              <Button
                size="icon"
                className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600"
                onClick={handleHangup}
              >
                <PhoneOff className="w-6 h-6" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
