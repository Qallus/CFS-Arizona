'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Pause,
  Play,
  PhoneForwarded,
  Circle,
  User,
  X,
  ArrowRight,
  Users,
} from 'lucide-react';
import { formatCallerIdDisplay } from '@/lib/twilio-client';
import { cn } from '@/lib/utils';

interface ActiveCallProps {
  call: {
    type: 'incoming' | 'outgoing';
    call: any;
    from?: string;
    to?: string;
    status: string;
    callSid?: string;
  };
  onEnd: () => void;
}

export function ActiveCall({ call, onEnd }: ActiveCallProps) {
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [notes, setNotes] = useState('');
  const [callStatus, setCallStatus] = useState(call.status);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferNumber, setTransferNumber] = useState('');
  const [transferType, setTransferType] = useState<'blind' | 'warm'>('blind');
  const [isTransferring, setIsTransferring] = useState(false);
  const [currentCallSid, setCurrentCallSid] = useState<string | null>(call.callSid || null);

  // Call duration timer
  useEffect(() => {
    if (callStatus === 'in-progress') {
      const timer = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [callStatus]);

  // Recording duration timer
  useEffect(() => {
    if (isRecording && recordingStartTime) {
      const timer = setInterval(() => {
        setRecordingDuration(Math.floor((Date.now() - recordingStartTime) / 1000));
      }, 1000);
      return () => clearInterval(timer);
    } else {
      setRecordingDuration(0);
    }
  }, [isRecording, recordingStartTime]);

  // Call event listeners
  useEffect(() => {
    const twilioCall = call.call;
    
    if (twilioCall) {
      twilioCall.on('accept', () => {
        setCallStatus('in-progress');
        // Get CallSid when call is accepted
        const sid = twilioCall.parameters?.CallSid;
        if (sid) {
          console.log('[ActiveCall] Call accepted, CallSid:', sid);
          setCurrentCallSid(sid);
        }
      });
      twilioCall.on('disconnect', () => {
        setCallStatus('completed');
        onEnd();
      });
      twilioCall.on('cancel', () => {
        setCallStatus('canceled');
        onEnd();
      });
    }
    
    // Update callSid from prop if it changes
    if (call.callSid && call.callSid !== currentCallSid) {
      setCurrentCallSid(call.callSid);
    }
  }, [call.call, call.callSid, onEnd]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMute = useCallback(() => {
    if (call.call) {
      call.call.mute(!isMuted);
      setIsMuted(!isMuted);
    }
  }, [call.call, isMuted]);

  const handleHold = useCallback(async () => {
    if (!currentCallSid) {
      console.warn('[ActiveCall] Cannot hold - no CallSid available');
      return;
    }
    
    try {
      await fetch('/api/calls/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isOnHold ? 'unhold' : 'hold',
          callSid: currentCallSid,
        }),
      });
      setIsOnHold(!isOnHold);
    } catch (error) {
      console.error('Error toggling hold:', error);
    }
  }, [currentCallSid, isOnHold]);

  const handleRecord = useCallback(async () => {
    if (!currentCallSid) {
      console.warn('[ActiveCall] Cannot record - no CallSid available yet');
      alert('Call is still connecting. Please wait a moment and try again.');
      return;
    }
    
    console.log('[ActiveCall] Toggling recording, CallSid:', currentCallSid, 'isRecording:', isRecording);
    
    try {
      const action = isRecording ? 'stop-recording' : 'start-recording';
      const response = await fetch('/api/calls/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          callSid: currentCallSid,
        }),
      });
      
      const data = await response.json();
      console.log('[ActiveCall] Recording response:', data);
      
      if (response.ok) {
        if (!isRecording) {
          setRecordingStartTime(Date.now());
        } else {
          setRecordingStartTime(null);
        }
        setIsRecording(!isRecording);
      } else {
        console.error('[ActiveCall] Recording failed:', data);
        alert(`Recording failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error toggling recording:', error);
      alert('Failed to toggle recording. Check console for details.');
    }
  }, [currentCallSid, isRecording]);

  const handleTransfer = useCallback(async () => {
    if (!currentCallSid || !transferNumber.trim()) return;
    
    setIsTransferring(true);
    try {
      const response = await fetch('/api/calls/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: transferType === 'blind' ? 'blind-transfer' : 'warm-transfer',
          callSid: currentCallSid,
          transferTo: transferNumber,
        }),
      });
      
      if (response.ok) {
        if (transferType === 'blind') {
          // Blind transfer ends our connection
          setShowTransferModal(false);
          onEnd();
        } else {
          // Warm transfer - we stay on until we complete it
          setShowTransferModal(false);
          // Show merge/complete UI
        }
      }
    } catch (error) {
      console.error('Error transferring call:', error);
    } finally {
      setIsTransferring(false);
    }
  }, [currentCallSid, transferNumber, transferType, onEnd]);

  const handleHangup = useCallback(() => {
    if (call.call) {
      call.call.disconnect();
    }
    onEnd();
  }, [call.call, onEnd]);

  const handleAccept = useCallback(() => {
    if (call.call && call.type === 'incoming') {
      call.call.accept();
      setCallStatus('in-progress');
    }
  }, [call]);

  const handleReject = useCallback(() => {
    if (call.call && call.type === 'incoming') {
      call.call.reject();
    }
    onEnd();
  }, [call, onEnd]);

  const phoneNumber = call.type === 'incoming' ? call.from : call.to;

  return (
    <>
      <Card className="mb-6 bg-gradient-to-r from-green-900/30 to-card border-green-500/30">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            {/* Caller Info */}
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-secondary">
                <User className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {call.type === 'incoming' ? 'Incoming Call' : 'Outgoing Call'}
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {phoneNumber ? formatCallerIdDisplay(phoneNumber) : 'Unknown'}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`w-2 h-2 rounded-full ${
                    callStatus === 'in-progress' ? 'bg-green-500 animate-pulse' :
                    callStatus === 'ringing' ? 'bg-yellow-500 animate-pulse' :
                    'bg-muted-foreground'
                  }`} />
                  <span className="text-sm text-muted-foreground">
                    {callStatus === 'in-progress' ? formatDuration(duration) :
                     callStatus === 'ringing' ? 'Ringing...' :
                     callStatus === 'connecting' ? 'Connecting...' :
                     callStatus}
                  </span>
                  {isOnHold && (
                    <span className="text-sm text-yellow-500 font-medium">
                      On Hold
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Call Controls */}
            <div className="flex items-center gap-2">
              {/* Incoming call: Accept/Reject */}
              {call.type === 'incoming' && callStatus === 'ringing' ? (
                <>
                  <Button
                    onClick={handleAccept}
                    className="bg-green-600 hover:bg-green-700"
                    size="lg"
                  >
                    <Phone className="w-5 h-5 mr-2" />
                    Accept
                  </Button>
                  <Button
                    onClick={handleReject}
                    variant="destructive"
                    size="lg"
                  >
                    <PhoneOff className="w-5 h-5 mr-2" />
                    Reject
                  </Button>
                </>
              ) : callStatus === 'in-progress' && (
                <>
                  {/* Record Button */}
                  <div className="flex flex-col items-center gap-1">
                    <div className={cn(
                      'rounded-lg p-0.5 transition-all',
                      isRecording && 'ring-2 ring-red-500 ring-offset-2 ring-offset-background'
                    )}>
                      <Button
                        onClick={handleRecord}
                        variant="secondary"
                        size="icon"
                        disabled={!currentCallSid}
                        className={cn(
                          'w-12 h-12 relative transition-colors',
                          isRecording && 'bg-red-500/20 hover:bg-red-500/30 border border-red-500',
                          !currentCallSid && 'opacity-50 cursor-not-allowed'
                        )}
                        title={!currentCallSid ? 'Waiting for call to connect...' : isRecording ? 'Stop Recording' : 'Start Recording'}
                      >
                        <Circle className={cn(
                          'w-5 h-5 transition-colors',
                          isRecording ? 'text-red-500 fill-red-500' : 'text-muted-foreground'
                        )} />
                      </Button>
                    </div>
                    {isRecording && (
                      <span className="text-xs font-medium text-red-500 flex items-center gap-1 mt-1">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                        {formatDuration(recordingDuration)}
                      </span>
                    )}
                  </div>

                  {/* Mute */}
                  <Button
                    onClick={handleMute}
                    variant={isMuted ? 'destructive' : 'secondary'}
                    size="icon"
                    className="w-12 h-12"
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </Button>

                  {/* Hold */}
                  <Button
                    onClick={handleHold}
                    variant={isOnHold ? 'default' : 'secondary'}
                    size="icon"
                    className={cn('w-12 h-12', isOnHold && 'bg-yellow-600 hover:bg-yellow-700')}
                    title={isOnHold ? 'Resume Call' : 'Hold'}
                  >
                    {isOnHold ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                  </Button>

                  {/* Transfer */}
                  <Button
                    onClick={() => setShowTransferModal(true)}
                    variant="secondary"
                    size="icon"
                    className="w-12 h-12"
                    title="Transfer Call"
                  >
                    <PhoneForwarded className="w-5 h-5" />
                  </Button>

                  {/* Hangup */}
                  <Button
                    onClick={handleHangup}
                    variant="destructive"
                    size="icon"
                    className="w-12 h-12"
                    title="End Call"
                  >
                    <PhoneOff className="w-5 h-5" />
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Call Notes */}
          {callStatus === 'in-progress' && (
            <div className="mt-4">
              <Textarea
                placeholder="Add notes during the call..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-secondary/50 border-border text-foreground resize-none"
                rows={2}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl border border-border w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">Transfer Call</h3>
              <button
                onClick={() => setShowTransferModal(false)}
                className="p-1 hover:bg-secondary rounded"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Transfer Type Selection */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setTransferType('blind')}
                  className={cn(
                    'p-3 rounded-lg border text-left transition-colors',
                    transferType === 'blind'
                      ? 'border-brand bg-brand/10'
                      : 'border-border hover:bg-secondary'
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <ArrowRight className="w-4 h-4 text-brand" />
                    <span className="font-medium text-foreground">Blind Transfer</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Transfer immediately without speaking to the recipient
                  </p>
                </button>
                <button
                  onClick={() => setTransferType('warm')}
                  className={cn(
                    'p-3 rounded-lg border text-left transition-colors',
                    transferType === 'warm'
                      ? 'border-brand bg-brand/10'
                      : 'border-border hover:bg-secondary'
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-4 h-4 text-brand" />
                    <span className="font-medium text-foreground">Warm Transfer</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Speak to recipient first, then complete transfer
                  </p>
                </button>
              </div>

              {/* Phone Number Input */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Transfer to
                </label>
                <Input
                  type="tel"
                  placeholder="Enter phone number..."
                  value={transferNumber}
                  onChange={(e) => setTransferNumber(e.target.value)}
                  className="bg-background"
                />
              </div>

              {/* Quick Transfer Options */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Quick transfer:</p>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTransferNumber('+1234567890')}
                  >
                    Sales
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTransferNumber('+1234567891')}
                  >
                    Support
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 p-4 border-t border-border">
              <Button
                variant="ghost"
                onClick={() => setShowTransferModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleTransfer}
                disabled={!transferNumber.trim() || isTransferring}
                className="bg-brand hover:bg-brand/90"
              >
                {isTransferring ? 'Transferring...' : `${transferType === 'blind' ? 'Transfer' : 'Call & Transfer'}`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
