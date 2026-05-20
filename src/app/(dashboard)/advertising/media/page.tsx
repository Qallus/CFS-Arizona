'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Search,
  Upload,
  Play,
  Pause,
  Trash2,
  Edit,
  MoreHorizontal,
  FileAudio,
  Clock,
  DollarSign,
  Tag,
  User,
  ChevronLeft,
  Loader2,
  X,
  Check,
  Download,
  Volume2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface AudioMedia {
  id: string;
  name: string;
  filename: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  durationSeconds: number;
  storageType: 'local' | 'gcs';
  storageUrl: string;
  description?: string;
  clientId?: string;
  clientName?: string;
  tags?: string[];
  pricingModel?: 'per_play' | 'cpm' | 'flat' | 'duration';
  pricePerUnit?: number;
  status: 'processing' | 'ready' | 'error' | 'archived';
  createdAt: string;
  updatedAt: string;
}

interface Client {
  id: string;
  name: string;
  email?: string;
  company?: string;
}

export default function MediaLibraryPage() {
  const [media, setMedia] = useState<AudioMedia[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [stats, setStats] = useState({ total: 0, ready: 0, totalDuration: 0, totalSize: 0 });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingMedia, setEditingMedia] = useState<AudioMedia | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    try {
      const res = await fetch('/api/advertising/media');
      const data = await res.json();
      setMedia(data.media || []);
      setClients(data.clients || []);
      setStats(data.stats || { total: 0, ready: 0, totalDuration: 0, totalSize: 0 });
    } catch (error) {
      console.error('Error fetching media:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (files: FileList) => {
    setUploading(true);
    
    for (const file of Array.from(files)) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', file.name.replace(/\.[^/.]+$/, ''));
        
        await fetch('/api/advertising/media/upload', {
          method: 'POST',
          body: formData,
        });
      } catch (error) {
        console.error('Upload error:', error);
      }
    }
    
    setUploading(false);
    fetchMedia();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this audio file?')) return;

    try {
      await fetch('/api/advertising/media', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      fetchMedia();
    } catch (error) {
      console.error('Error deleting media:', error);
    }
  };

  const handleSave = async (mediaData: Partial<AudioMedia>) => {
    try {
      await fetch('/api/advertising/media', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...mediaData, id: editingMedia?.id }),
      });
      setShowModal(false);
      setEditingMedia(null);
      fetchMedia();
    } catch (error) {
      console.error('Error saving media:', error);
    }
  };

  const togglePlay = (mediaItem: AudioMedia) => {
    if (playingId === mediaItem.id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = mediaItem.storageUrl;
        audioRef.current.play();
        setPlayingId(mediaItem.id);
      }
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filteredMedia = media.filter(m =>
    m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6">
      {/* Hidden audio element for playback */}
      <audio 
        ref={audioRef} 
        onEnded={() => setPlayingId(null)}
        className="hidden"
      />
      
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        multiple
        onChange={(e) => e.target.files && handleUpload(e.target.files)}
        className="hidden"
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/advertising"
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Media Library</h1>
            <p className="text-muted-foreground">Upload and manage audio files</p>
          </div>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-4 py-2 bg-brand text-brand-foreground rounded-lg hover:bg-brand/90 transition-colors disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          Upload Audio
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Files</p>
          <p className="text-2xl font-bold text-foreground">{stats.total}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Ready to Deploy</p>
          <p className="text-2xl font-bold text-green-500">{stats.ready}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Duration</p>
          <p className="text-2xl font-bold text-foreground">
            {formatDuration(stats.totalDuration)}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Size</p>
          <p className="text-2xl font-bold text-foreground">
            {formatFileSize(stats.totalSize)}
          </p>
        </div>
      </div>

      {/* Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          e.currentTarget.classList.add('border-brand');
        }}
        onDragLeave={(e) => {
          e.currentTarget.classList.remove('border-brand');
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.currentTarget.classList.remove('border-brand');
          if (e.dataTransfer.files.length > 0) {
            handleUpload(e.dataTransfer.files);
          }
        }}
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-brand/50 transition-colors"
      >
        <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-muted-foreground">
          Drag & drop audio files here, or click to browse
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Supports MP3, WAV, AAC, OGG, FLAC, M4A (max 50MB)
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search media..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/50"
        />
      </div>

      {/* Media List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredMedia.length === 0 ? (
        <div className="text-center py-12">
          <FileAudio className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No Audio Files Yet</h3>
          <p className="text-muted-foreground mb-4">
            Upload your first audio file to get started.
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-brand text-brand-foreground rounded-lg hover:bg-brand/90 transition-colors"
          >
            Upload Audio
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredMedia.map((item) => (
            <div
              key={item.id}
              className="bg-card border border-border rounded-lg p-4 hover:border-brand/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Play Button */}
                  <button
                    onClick={() => togglePlay(item)}
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
                      playingId === item.id
                        ? 'bg-brand text-brand-foreground'
                        : 'bg-secondary hover:bg-brand/20 text-muted-foreground hover:text-brand'
                    )}
                  >
                    {playingId === item.id ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4 ml-0.5" />
                    )}
                  </button>

                  {/* Info */}
                  <div>
                    <h3 className="font-medium text-foreground">{item.name}</h3>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(item.durationSeconds || 0)}
                      </span>
                      <span>{formatFileSize(item.fileSize)}</span>
                      {item.clientName && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {item.clientName}
                        </span>
                      )}
                      {item.pricePerUnit && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          ${item.pricePerUnit}/{item.pricingModel === 'per_play' ? 'play' : item.pricingModel}
                        </span>
                      )}
                    </div>
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        {item.tags.map((tag, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-secondary rounded-full text-xs text-muted-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'px-2 py-1 rounded-full text-xs font-medium',
                    item.status === 'ready' ? 'bg-green-500/20 text-green-500' :
                    item.status === 'processing' ? 'bg-yellow-500/20 text-yellow-500' :
                    item.status === 'error' ? 'bg-red-500/20 text-red-500' :
                    'bg-gray-500/20 text-gray-400'
                  )}>
                    {item.status}
                  </span>
                  <a
                    href={item.storageUrl}
                    download={item.originalFilename}
                    className="p-2 hover:bg-secondary rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4 text-muted-foreground" />
                  </a>
                  <button
                    onClick={() => {
                      setEditingMedia(item);
                      setShowModal(true);
                    }}
                    className="p-2 hover:bg-secondary rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 hover:bg-secondary rounded-lg transition-colors text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {showModal && editingMedia && (
        <MediaModal
          media={editingMedia}
          clients={clients}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false);
            setEditingMedia(null);
          }}
        />
      )}
    </div>
  );
}

function MediaModal({
  media,
  clients,
  onSave,
  onClose,
}: {
  media: AudioMedia;
  clients: Client[];
  onSave: (data: Partial<AudioMedia>) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    name: media.name || '',
    description: media.description || '',
    clientId: media.clientId || '',
    clientName: media.clientName || '',
    tags: media.tags?.join(', ') || '',
    pricingModel: media.pricingModel || '',
    pricePerUnit: media.pricePerUnit || 0,
    durationSeconds: media.durationSeconds || 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      pricingModel: formData.pricingModel as any || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Edit Media</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-secondary border border-border rounded-lg resize-none"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Client Name</label>
            <input
              type="text"
              value={formData.clientName}
              onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
              className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
              placeholder="Advertiser name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Tags (comma separated)</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
              placeholder="promo, holiday, urgent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Duration (seconds)
            </label>
            <input
              type="number"
              value={formData.durationSeconds}
              onChange={(e) => setFormData({ ...formData, durationSeconds: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enter duration manually or it will be detected on playback
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Pricing Model</label>
              <select
                value={formData.pricingModel}
                onChange={(e) => setFormData({ ...formData, pricingModel: e.target.value })}
                className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
              >
                <option value="">None</option>
                <option value="per_play">Per Play</option>
                <option value="cpm">CPM</option>
                <option value="flat">Flat Rate</option>
                <option value="duration">Per Second</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Price ($)</label>
              <input
                type="number"
                step="0.01"
                value={formData.pricePerUnit}
                onChange={(e) => setFormData({ ...formData, pricePerUnit: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
              />
            </div>
          </div>
        </form>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-brand text-brand-foreground rounded-lg hover:bg-brand/90 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
