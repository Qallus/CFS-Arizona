'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Play,
  Pause,
  Clock,
  Loader2,
  ChevronDown,
  ChevronUp,
  FileText,
  DollarSign,
  RefreshCw,
  Volume2,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CallLog {
  id: string;
  call_sid: string;
  direction: 'inbound' | 'outbound';
  from_number: string;
  to_number: string;
  status: string;
  duration: number | null;
  started_at: string;
  ended_at?: string;
  recording_url?: string;
  recording_sid?: string;
  transcription?: string;
  caller_name?: string;
  notes?: string;
  cost?: number;
}

interface CallHistoryProps {
  onCallBack: (number: string) => void;
}

// Twilio pricing (approximate)
const TWILIO_PRICING = {
  outbound: 0.014, // per minute
  inbound: 0.0085, // per minute
  recording: 0.0025, // per minute
};

function calculateCallCost(call: CallLog): number {
  if (!call.duration) return 0;
  const minutes = Math.ceil(call.duration / 60);
  const baseRate = call.direction === 'outbound' ? TWILIO_PRICING.outbound : TWILIO_PRICING.inbound;
  const recordingCost = call.recording_url ? TWILIO_PRICING.recording * minutes : 0;
  return (baseRate * minutes) + recordingCost;
}

export function CallHistory({ onCallBack }: CallHistoryProps) {
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCall, setExpandedCall] = useState<string | null>(null);
  const [playingCall, setPlayingCall] = useState<string | null>(null);
  const [transcribingCall, setTranscribingCall] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetchCalls();
  }, []);

  const fetchCalls = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/calls?limit=100');
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setCalls(data.calls || []);
      }
    } catch (err) {
      setError('Failed to load call history');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const formatFullDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatPhoneDisplay = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  const getCallIcon = (call: CallLog) => {
    if (call.status === 'no-answer' || call.status === 'busy' || call.status === 'failed') {
      return <PhoneMissed className="w-4 h-4 text-red-400" />;
    }
    if (call.direction === 'inbound') {
      return <PhoneIncoming className="w-4 h-4 text-blue-400" />;
    }
    return <PhoneOutgoing className="w-4 h-4 text-green-400" />;
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { label: string; className: string }> = {
      completed: { label: 'Completed', className: 'bg-green-500/20 text-green-400 border-green-500/30' },
      'no-answer': { label: 'No Answer', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
      busy: { label: 'Busy', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
      failed: { label: 'Failed', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
      canceled: { label: 'Canceled', className: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
      'in-progress': { label: 'In Progress', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    };
    const config = configs[status] || { label: status, className: 'bg-secondary text-muted-foreground' };
    return (
      <Badge variant="outline" className={cn('text-xs', config.className)}>
        {config.label}
      </Badge>
    );
  };

  const handlePlayRecording = (call: CallLog) => {
    if (playingCall === call.id) {
      // Pause
      audioRef.current?.pause();
      setPlayingCall(null);
    } else {
      // Play new recording
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(call.recording_url + '.mp3');
      audio.onended = () => setPlayingCall(null);
      audio.play();
      audioRef.current = audio;
      setPlayingCall(call.id);
    }
  };

  const handleTranscribe = async (call: CallLog) => {
    if (!call.recording_url) return;
    
    setTranscribingCall(call.id);
    try {
      const response = await fetch('/api/calls/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callId: call.id,
          recordingUrl: call.recording_url,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Update local state with transcription
        setCalls(prev => prev.map(c => 
          c.id === call.id 
            ? { ...c, transcription: data.transcription }
            : c
        ));
      } else {
        alert('Failed to transcribe: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Transcription error:', error);
      alert('Failed to transcribe call');
    } finally {
      setTranscribingCall(null);
    }
  };

  const toggleExpand = (callId: string) => {
    setExpandedCall(expandedCall === callId ? null : callId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400">{error}</p>
        <Button onClick={fetchCalls} variant="outline" className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  if (calls.length === 0) {
    return (
      <div className="text-center py-12">
        <Phone className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No call history yet</p>
        <p className="text-muted-foreground text-sm">Your calls will appear here</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-muted-foreground">
          {calls.length} calls
        </div>
        <Button variant="ghost" size="sm" onClick={fetchCalls}>
          <RefreshCw className="w-4 h-4 mr-1" />
          Refresh
        </Button>
      </div>

      <ScrollArea className="h-[500px]">
        <div className="space-y-2">
          {calls.map((call) => {
            const phoneNumber = call.direction === 'inbound' ? call.from_number : call.to_number;
            const isExpanded = expandedCall === call.id;
            const cost = calculateCallCost(call);
            
            return (
              <div
                key={call.id}
                className="rounded-lg bg-secondary/30 border border-border overflow-hidden"
              >
                {/* Main Row */}
                <div
                  className="flex items-center justify-between p-3 hover:bg-secondary/50 transition-colors cursor-pointer"
                  onClick={() => toggleExpand(call.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary">
                      {getCallIcon(call)}
                    </div>
                    <div>
                      <p className="text-foreground font-medium">
                        {call.caller_name || formatPhoneDisplay(phoneNumber)}
                      </p>
                      <div className="flex items-center gap-2 text-sm">
                        {getStatusBadge(call.status)}
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDuration(call.duration)}
                        </span>
                        {call.recording_url && (
                          <Badge variant="outline" className="text-xs bg-purple-500/20 text-purple-400 border-purple-500/30">
                            <Volume2 className="w-3 h-3 mr-1" />
                            Recorded
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground text-sm">
                      {formatTime(call.started_at)}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-border bg-secondary/20">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Direction</p>
                        <p className="text-sm text-foreground capitalize">{call.direction}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Duration</p>
                        <p className="text-sm text-foreground">{formatDuration(call.duration)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Date & Time</p>
                        <p className="text-sm text-foreground">{formatFullDate(call.started_at)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          Est. Cost
                        </p>
                        <p className="text-sm text-foreground">${cost.toFixed(4)}</p>
                      </div>
                    </div>

                    {/* Recording Player */}
                    {call.recording_url && (
                      <div className="mb-4 p-3 bg-secondary/50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant={playingCall === call.id ? "default" : "outline"}
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePlayRecording(call);
                              }}
                              className={playingCall === call.id ? "bg-brand hover:bg-brand/90" : ""}
                            >
                              {playingCall === call.id ? (
                                <Pause className="w-4 h-4 mr-1" />
                              ) : (
                                <Play className="w-4 h-4 mr-1" />
                              )}
                              {playingCall === call.id ? 'Pause' : 'Play Recording'}
                            </Button>
                            <span className="text-xs text-muted-foreground">
                              {formatDuration(call.duration)}
                            </span>
                          </div>
                          <a
                            href={call.recording_url + '.mp3'}
                            download
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs text-brand hover:underline"
                          >
                            Download
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Transcription */}
                    {call.transcription ? (
                      <div className="mb-4">
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                          <FileText className="w-3 h-3" />
                          Transcription
                        </p>
                        <div className="p-3 bg-secondary/50 rounded-lg text-sm text-foreground whitespace-pre-wrap max-h-48 overflow-y-auto">
                          {call.transcription}
                        </div>
                      </div>
                    ) : call.recording_url && (
                      <div className="mb-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTranscribe(call);
                          }}
                          disabled={transcribingCall === call.id}
                          className="text-purple-500 border-purple-500/30 hover:bg-purple-500/10"
                        >
                          {transcribingCall === call.id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                              Transcribing...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-1" />
                              Transcribe Call
                            </>
                          )}
                        </Button>
                        <p className="text-xs text-muted-foreground mt-1">
                          Uses AI to convert recording to text
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCallBack(phoneNumber);
                        }}
                      >
                        <Phone className="w-4 h-4 mr-1" />
                        Call Back
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
