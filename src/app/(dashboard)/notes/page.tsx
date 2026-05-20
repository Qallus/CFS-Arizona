'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Mic, 
  Square, 
  Play, 
  Pause,
  Trash2,
  Download,
  Sparkles,
  Clock,
  Calendar,
  ChevronRight,
  Loader2,
  Volume2,
  Edit,
  MoreHorizontal,
  Check,
  Copy,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type TabType = 'all-notes' | 'meeting-recordings';

interface Note {
  id: string;
  title: string;
  content: string;
  type: 'note' | 'meeting';
  createdAt: string;
  updatedAt: string;
  // Meeting specific
  audioUrl?: string;
  duration?: number;
  transcription?: string;
  aiSummary?: string;
  attendees?: string[];
}

export default function NotesPage() {
  const [activeTab, setActiveTab] = useState<TabType>('all-notes');
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [showRecordingModal, setShowRecordingModal] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const res = await fetch('/api/notes');
      if (res.ok) {
        const data = await res.json();
        setNotes(data);
      }
    } catch (error) {
      console.error('Failed to fetch notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNote = async (noteData: Partial<Note>) => {
    try {
      const method = editingNote ? 'PUT' : 'POST';
      const res = await fetch('/api/notes', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingNote ? { ...noteData, id: editingNote.id } : noteData),
      });
      if (res.ok) {
        fetchNotes();
        setShowNoteModal(false);
        setEditingNote(null);
      }
    } catch (error) {
      console.error('Failed to save note:', error);
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!confirm('Delete this note?')) return;
    try {
      const res = await fetch(`/api/notes?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchNotes();
      }
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  const handleSaveMeeting = async (meetingData: any) => {
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...meetingData, type: 'meeting' }),
      });
      if (res.ok) {
        fetchNotes();
        setShowRecordingModal(false);
      }
    } catch (error) {
      console.error('Failed to save meeting:', error);
    }
  };

  const filteredNotes = notes.filter(note => {
    const matchesSearch = !searchQuery || 
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === 'meeting-recordings') {
      return matchesSearch && note.type === 'meeting';
    }
    return matchesSearch;
  });

  const tabs = [
    { id: 'all-notes' as TabType, label: 'All Notes', icon: FileText },
    { id: 'meeting-recordings' as TabType, label: 'Record Meeting', icon: Mic },
  ];

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-border">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Notes</h1>
            <p className="text-sm text-muted-foreground">
              Capture ideas, meeting notes, and recordings
            </p>
          </div>
          <div className="flex gap-2">
            {activeTab === 'meeting-recordings' ? (
              <button
                onClick={() => setShowRecordingModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                <Mic className="w-4 h-4" />
                Record Meeting
              </button>
            ) : (
              <button
                onClick={() => { setEditingNote(null); setShowNoteModal(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-brand text-brand-foreground rounded-lg hover:bg-brand/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Note
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  activeTab === tab.id
                    ? "bg-brand text-brand-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {activeTab === 'meeting-recordings' ? 'No meeting recordings yet' : 'No notes yet'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {activeTab === 'meeting-recordings' 
                ? 'Record your first meeting to get started'
                : 'Create your first note to get started'}
            </p>
            <button
              onClick={() => activeTab === 'meeting-recordings' ? setShowRecordingModal(true) : setShowNoteModal(true)}
              className="px-4 py-2 bg-brand text-brand-foreground rounded-lg hover:bg-brand/90"
            >
              {activeTab === 'meeting-recordings' ? 'Record Meeting' : 'Create Note'}
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={() => { setEditingNote(note); setShowNoteModal(true); }}
                onDelete={() => handleDeleteNote(note.id)}
                onRefresh={fetchNotes}
              />
            ))}
          </div>
        )}
      </div>

      {/* Note Modal */}
      {showNoteModal && (
        <NoteModal
          note={editingNote}
          onSave={handleSaveNote}
          onClose={() => { setShowNoteModal(false); setEditingNote(null); }}
        />
      )}

      {/* Recording Modal */}
      {showRecordingModal && (
        <MeetingRecordingModal
          onSave={handleSaveMeeting}
          onClose={() => setShowRecordingModal(false)}
        />
      )}
    </div>
  );
}

// Note Card Component
function NoteCard({ 
  note, 
  onEdit, 
  onDelete,
  onRefresh 
}: { 
  note: Note; 
  onEdit: () => void; 
  onDelete: () => void;
  onRefresh: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleGenerateSummary = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/notes/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId: note.id }),
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (error) {
      console.error('Failed to generate summary:', error);
    } finally {
      setGenerating(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {note.type === 'meeting' ? (
            <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center">
              <Mic className="w-4 h-4 text-red-500" />
            </div>
          ) : (
            <div className="w-8 h-8 bg-brand/10 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-brand" />
            </div>
          )}
          <div>
            <h3 className="font-medium text-foreground line-clamp-1">{note.title}</h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              {new Date(note.createdAt).toLocaleDateString()}
              {note.duration && (
                <>
                  <span>•</span>
                  <Clock className="w-3 h-3" />
                  {formatDuration(note.duration)}
                </>
              )}
            </div>
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 hover:bg-secondary rounded"
          >
            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-36 bg-card border border-border rounded-lg shadow-lg z-10">
              <button
                onClick={() => { onEdit(); setShowMenu(false); }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-secondary"
              >
                <Edit className="w-4 h-4" /> Edit
              </button>
              <button
                onClick={() => { onDelete(); setShowMenu(false); }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-secondary text-red-500"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content Preview */}
      {note.content && (
        <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
          {note.content}
        </p>
      )}

      {/* Meeting Audio Player */}
      {note.type === 'meeting' && note.audioUrl && (
        <div className="mb-3">
          <audio controls className="w-full h-10" src={note.audioUrl}>
            Your browser does not support audio playback.
          </audio>
        </div>
      )}

      {/* Transcription */}
      {note.transcription && (
        <div className="mb-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-sm text-blue-500 hover:text-blue-600"
          >
            <FileText className="w-3 h-3" />
            {expanded ? 'Hide' : 'Show'} Transcription
          </button>
          {expanded && (
            <div className="mt-2 p-3 bg-secondary/50 rounded-lg text-sm text-foreground max-h-40 overflow-y-auto">
              {note.transcription}
            </div>
          )}
        </div>
      )}

      {/* AI Summary */}
      {note.aiSummary && (
        <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg mb-3">
          <div className="flex items-center gap-2 text-purple-500 text-sm font-medium mb-2">
            <Sparkles className="w-4 h-4" />
            AI Summary
          </div>
          <div className="text-sm text-foreground whitespace-pre-wrap">
            {note.aiSummary}
          </div>
        </div>
      )}

      {/* Generate Summary Button (for meetings without summary) */}
      {note.type === 'meeting' && note.transcription && !note.aiSummary && (
        <button
          onClick={handleGenerateSummary}
          disabled={generating}
          className="flex items-center gap-2 w-full px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 text-sm justify-center"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate AI Meeting Summary
            </>
          )}
        </button>
      )}
    </div>
  );
}

// Note Modal
function NoteModal({
  note,
  onSave,
  onClose,
}: {
  note: Note | null;
  onSave: (data: Partial<Note>) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ title, content, type: 'note' });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl border border-border w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold">{note ? 'Edit Note' : 'New Note'}</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
              placeholder="Note title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand min-h-[200px]"
              placeholder="Write your note..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-muted-foreground hover:text-foreground">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-brand text-brand-foreground rounded-lg hover:bg-brand/90">
              {note ? 'Save Changes' : 'Create Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Meeting Recording Modal
function MeetingRecordingModal({
  onSave,
  onClose,
}: {
  onSave: (data: any) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState('');
  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [contactSearch, setContactSearch] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  const [contactsError, setContactsError] = useState('');
  const [manualAttendee, setManualAttendee] = useState('');
  const [manualAttendees, setManualAttendees] = useState<string[]>([]);

  // Load contacts on mount
  useEffect(() => {
    const loadContacts = async () => {
      try {
        // Try FluentCRM first
        const res = await fetch('/api/contacts');
        if (res.ok) {
          const data = await res.json();
          if (data.contacts && data.contacts.length > 0) {
            setContacts(data.contacts);
            return;
          }
        }
        // Try local contacts
        const localRes = await fetch('/api/contacts/local');
        if (localRes.ok) {
          const localData = await localRes.json();
          if (localData.contacts && localData.contacts.length > 0) {
            setContacts(localData.contacts);
            return;
          }
        }
        setContactsError('No contacts found. Add contacts in Contacts page or type names manually.');
      } catch (e) {
        setContactsError('Could not load contacts. You can add names manually.');
      }
    };
    loadContacts();
  }, []);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcribing, setTranscribing] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [step, setStep] = useState<'setup' | 'recording' | 'review'>('setup');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      setStep('recording');

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      timerRef.current = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      if (timerRef.current) clearInterval(timerRef.current);
      setStep('review');
    }
  };

  const transcribeAudio = async () => {
    if (!audioBlob) return;
    
    setTranscribing(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      
      const res = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });
      
      if (res.ok) {
        const data = await res.json();
        setTranscription(data.text || '');
      } else {
        throw new Error('Transcription failed');
      }
    } catch (error) {
      console.error('Transcription error:', error);
      alert('Failed to transcribe. You can still save without transcription.');
    } finally {
      setTranscribing(false);
    }
  };

  const handleSave = async () => {
    if (!audioBlob) return;

    // Upload audio
    const formData = new FormData();
    formData.append('file', audioBlob, 'meeting-recording.webm');
    formData.append('folder', 'recordings');
    
    try {
      const uploadRes = await fetch('/api/uploads', {
        method: 'POST',
        body: formData,
      });
      const uploadData = await uploadRes.json();
      
      // Combine contact names and manual attendees
      const attendeeNames = [
        ...selectedContacts.map(id => {
          const c = contacts.find(c => c.id === id);
          return c ? `${c.first_name || ''} ${c.last_name || ''}`.trim() : '';
        }).filter(Boolean),
        ...manualAttendees,
      ];
      
      const meetingData = {
        title: title || `Meeting - ${new Date().toLocaleDateString()}`,
        audioUrl: uploadData.url,
        duration,
        transcription,
        contactIds: selectedContacts,
        attendees: attendeeNames,
      };
      
      // Also add a note to each contact's notes
      if (selectedContacts.length > 0 && (transcription || uploadData.url)) {
        for (const contactId of selectedContacts) {
          try {
            await fetch('/api/contacts/notes', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contactId,
                type: 'meeting',
                content: transcription || `Meeting recorded on ${new Date().toLocaleDateString()}`,
                title: meetingData.title,
                audioUrl: uploadData.url,
              }),
            });
          } catch (e) {
            console.error('Failed to add note to contact:', contactId);
          }
        }
      }
      
      onSave(meetingData);
    } catch (error) {
      console.error('Failed to save meeting:', error);
      alert('Failed to save meeting recording.');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl border border-border w-full max-w-lg">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {step === 'setup' && 'Record Meeting'}
            {step === 'recording' && 'Recording...'}
            {step === 'review' && 'Review Recording'}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </div>
        
        <div className="p-6">
          {step === 'setup' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Meeting Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                  placeholder="e.g., Weekly Team Sync"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  <Users className="inline w-4 h-4 mr-1" />
                  Participants
                </label>
                
                {/* Selected contacts */}
                {(selectedContacts.length > 0 || manualAttendees.length > 0) && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedContacts.map(id => {
                      const contact = contacts.find(c => c.id === id);
                      if (!contact) return null;
                      return (
                        <span key={id} className="inline-flex items-center gap-1 px-2 py-1 bg-brand/20 text-brand rounded-full text-sm">
                          {contact.first_name} {contact.last_name}
                          <button
                            type="button"
                            onClick={() => setSelectedContacts(prev => prev.filter(cid => cid !== id))}
                            className="hover:text-brand/70"
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                    {manualAttendees.map((name, idx) => (
                      <span key={`manual-${idx}`} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-500 rounded-full text-sm">
                        {name}
                        <button
                          type="button"
                          onClick={() => setManualAttendees(prev => prev.filter((_, i) => i !== idx))}
                          className="hover:text-blue-300"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                
                {/* Contact search or manual entry */}
                {contacts.length > 0 ? (
                  <>
                    <input
                      type="text"
                      value={contactSearch}
                      onChange={(e) => setContactSearch(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                      placeholder="Search contacts..."
                    />
                    
                    {/* Contact dropdown */}
                    {contactSearch && (
                      <div className="mt-1 max-h-32 overflow-y-auto bg-card border border-border rounded-lg shadow-lg">
                        {contacts
                          .filter(c => 
                            !selectedContacts.includes(c.id) &&
                            (`${c.first_name || ''} ${c.last_name || ''}`).toLowerCase().includes(contactSearch.toLowerCase())
                          )
                          .slice(0, 5)
                          .map(c => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                setSelectedContacts(prev => [...prev, c.id]);
                                setContactSearch('');
                              }}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-secondary text-left"
                            >
                              <Users className="w-4 h-4 text-muted-foreground" />
                              {c.first_name} {c.last_name}
                              {c.company_name && <span className="text-muted-foreground text-xs">({c.company_name})</span>}
                            </button>
                          ))}
                        {contacts.filter(c => 
                          !selectedContacts.includes(c.id) &&
                          (`${c.first_name || ''} ${c.last_name || ''}`).toLowerCase().includes(contactSearch.toLowerCase())
                        ).length === 0 && (
                          <p className="px-3 py-2 text-sm text-muted-foreground">No matching contacts</p>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Meeting notes will be added to selected contacts
                    </p>
                  </>
                ) : (
                  <>
                    {/* Manual attendee entry when no contacts */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={manualAttendee}
                        onChange={(e) => setManualAttendee(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && manualAttendee.trim()) {
                            e.preventDefault();
                            setManualAttendees(prev => [...prev, manualAttendee.trim()]);
                            setManualAttendee('');
                          }
                        }}
                        className="flex-1 px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                        placeholder="Type name and press Enter"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (manualAttendee.trim()) {
                            setManualAttendees(prev => [...prev, manualAttendee.trim()]);
                            setManualAttendee('');
                          }
                        }}
                        className="px-3 py-2 bg-secondary rounded-lg hover:bg-secondary/80"
                      >
                        Add
                      </button>
                    </div>
                    {contactsError && (
                      <p className="text-xs text-yellow-500 mt-1">{contactsError}</p>
                    )}
                  </>
                )}
              </div>

              <div className="pt-4">
                <button
                  onClick={startRecording}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 text-lg"
                >
                  <Mic className="w-5 h-5" />
                  Start Recording
                </button>
              </div>
            </div>
          )}

          {step === 'recording' && (
            <div className="text-center space-y-6">
              {/* Recording Indicator */}
              <div className="relative inline-flex">
                <div className={cn(
                  "w-24 h-24 rounded-full flex items-center justify-center",
                  isPaused ? "bg-yellow-500" : "bg-red-500 animate-pulse"
                )}>
                  <Mic className="w-10 h-10 text-white" />
                </div>
                {!isPaused && (
                  <div className="absolute inset-0 w-24 h-24 rounded-full bg-red-500 animate-ping opacity-25" />
                )}
              </div>

              {/* Timer */}
              <div className="text-4xl font-mono font-bold text-foreground">
                {formatTime(duration)}
              </div>

              <p className="text-muted-foreground">
                {isPaused ? 'Recording paused' : 'Recording in progress...'}
              </p>

              {/* Controls */}
              <div className="flex justify-center gap-4">
                {isPaused ? (
                  <button
                    onClick={resumeRecording}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                  >
                    <Play className="w-4 h-4" />
                    Resume
                  </button>
                ) : (
                  <button
                    onClick={pauseRecording}
                    className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
                  >
                    <Pause className="w-4 h-4" />
                    Pause
                  </button>
                )}
                <button
                  onClick={stopRecording}
                  className="flex items-center gap-2 px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80"
                >
                  <Square className="w-4 h-4" />
                  Stop
                </button>
              </div>
            </div>
          )}

          {step === 'review' && (
            <div className="space-y-4">
              {/* Audio Player */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Recording ({formatTime(duration)})</label>
                <audio controls className="w-full" src={audioUrl || undefined}>
                  Your browser does not support audio playback.
                </audio>
              </div>

              {/* Transcription */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-foreground">Transcription</label>
                  {!transcription && (
                    <button
                      onClick={transcribeAudio}
                      disabled={transcribing}
                      className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm disabled:opacity-50"
                    >
                      {transcribing ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Transcribing...
                        </>
                      ) : (
                        <>
                          <FileText className="w-3 h-3" />
                          Transcribe
                        </>
                      )}
                    </button>
                  )}
                </div>
                {transcription ? (
                  <textarea
                    value={transcription}
                    onChange={(e) => setTranscription(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand min-h-[150px] text-sm"
                  />
                ) : (
                  <div className="p-4 bg-secondary/50 rounded-lg text-sm text-muted-foreground text-center">
                    Click "Transcribe" to convert audio to text
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <button 
                  onClick={() => { setStep('setup'); setDuration(0); setAudioBlob(null); setAudioUrl(null); setTranscription(''); }}
                  className="px-4 py-2 text-muted-foreground hover:text-foreground"
                >
                  Record Again
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-brand text-brand-foreground rounded-lg hover:bg-brand/90"
                >
                  Save Recording
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
