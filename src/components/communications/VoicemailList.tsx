'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Voicemail,
  Play,
  Pause,
  Trash2,
  Mail,
  MailOpen,
  Loader2,
  Clock,
} from 'lucide-react';
import type { Voicemail as VoicemailType } from '@/lib/supabase';

interface VoicemailListProps {
  onCountChange: (count: number) => void;
}

export function VoicemailList({ onCountChange }: VoicemailListProps) {
  const [voicemails, setVoicemails] = useState<VoicemailType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetchVoicemails();
  }, []);

  const fetchVoicemails = async () => {
    try {
      const response = await fetch('/api/voicemails');
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setVoicemails(data.voicemails || []);
        onCountChange(data.unreadCount || 0);
      }
    } catch (err) {
      setError('Failed to load voicemails');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
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
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
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

  const handlePlay = (voicemail: VoicemailType) => {
    if (playingId === voicemail.id) {
      // Pause
      audioRef?.pause();
      setPlayingId(null);
    } else {
      // Play
      audioRef?.pause();
      const audio = new Audio(voicemail.recording_url);
      audio.onended = () => setPlayingId(null);
      audio.play();
      setAudioRef(audio);
      setPlayingId(voicemail.id);

      // Mark as read
      if (!voicemail.is_read) {
        markAsRead(voicemail.id);
      }
    }
  };

  const markAsRead = async (id: string) => {
    await fetch('/api/voicemails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mark-read', voicemailId: id }),
    });
    
    setVoicemails(prev => 
      prev.map(v => v.id === id ? { ...v, is_read: true } : v)
    );
    onCountChange(voicemails.filter(v => !v.is_read && v.id !== id).length);
  };

  const handleDelete = async (id: string) => {
    await fetch('/api/voicemails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', voicemailId: id }),
    });
    
    const deleted = voicemails.find(v => v.id === id);
    setVoicemails(prev => prev.filter(v => v.id !== id));
    
    if (deleted && !deleted.is_read) {
      onCountChange(voicemails.filter(v => !v.is_read && v.id !== id).length);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400">{error}</p>
        <Button onClick={fetchVoicemails} variant="outline" className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  if (voicemails.length === 0) {
    return (
      <div className="text-center py-12">
        <Voicemail className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
        <p className="text-zinc-400">No voicemails</p>
        <p className="text-zinc-500 text-sm">Missed calls will leave messages here</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-1">
        {voicemails.map((voicemail) => (
          <div
            key={voicemail.id}
            className={`flex items-start gap-3 p-3 rounded-lg hover:bg-zinc-800/50 transition-colors group ${
              !voicemail.is_read ? 'bg-zinc-800/30' : ''
            }`}
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-zinc-800 flex-shrink-0">
              {voicemail.is_read ? (
                <MailOpen className="w-4 h-4 text-zinc-400" />
              ) : (
                <Mail className="w-4 h-4 text-brand/90" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className={`font-medium ${!voicemail.is_read ? 'text-white' : 'text-zinc-300'}`}>
                  {formatPhoneDisplay(voicemail.from_number)}
                </p>
                <span className="text-zinc-500 text-sm">
                  {formatTime(voicemail.created_at)}
                </span>
              </div>

              {voicemail.transcription && (
                <p className="text-zinc-400 text-sm mt-1 line-clamp-2">
                  {voicemail.transcription}
                </p>
              )}

              <div className="flex items-center gap-2 mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3"
                  onClick={() => handlePlay(voicemail)}
                >
                  {playingId === voicemail.id ? (
                    <Pause className="w-4 h-4 mr-1" />
                  ) : (
                    <Play className="w-4 h-4 mr-1" />
                  )}
                  {formatDuration(voicemail.duration)}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300"
                  onClick={() => handleDelete(voicemail.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
