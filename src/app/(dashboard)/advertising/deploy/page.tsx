'use client';

import { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  Volume2,
  FileAudio,
  Check,
  X,
  Loader2,
  Send,
  RefreshCw,
  Clock,
  MapPin,
  Play,
  Calendar,
  Mic,
  Square,
  Pause,
  Radio,
  Zap,
  Timer,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface AudioDevice {
  id: string;
  deviceId: string;
  name: string;
  locationName?: string;
  ipAddress?: string;
  sshUser?: string;
  sshEnabled?: boolean;
  status: 'online' | 'offline' | 'error' | 'provisioning';
  assignedMediaIds?: string[];
}

interface AudioMedia {
  id: string;
  name: string;
  durationSeconds: number;
  clientName?: string;
  status: string;
  storageUrl: string;
  storagePath?: string;
}

type DeployMode = 'schedule' | 'now';

interface ScheduleConfig {
  mode: DeployMode;
  playNow: boolean;
  scheduleDate?: string;
  scheduleTime?: string;
  repeatDaily?: boolean;
  repeatDays?: number[];
}

export default function DeployPage() {
  const [devices, setDevices] = useState<AudioDevice[]>([]);
  const [media, setMedia] = useState<AudioMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [deploying, setDeploying] = useState(false);
  
  const [selectedDevices, setSelectedDevices] = useState<Set<string>>(new Set());
  const [selectedMedia, setSelectedMedia] = useState<Set<string>>(new Set());
  const [deployMessage, setDeployMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  
  // Schedule config
  const [scheduleConfig, setScheduleConfig] = useState<ScheduleConfig>({
    mode: 'now',
    playNow: true,
  });
  
  // Recording state
  const [showRecorder, setShowRecorder] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordingName, setRecordingName] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Audio playback preview
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [devicesRes, mediaRes] = await Promise.all([
        fetch('/api/advertising/devices'),
        fetch('/api/advertising/media'),
      ]);
      
      const devicesData = await devicesRes.json();
      const mediaData = await mediaRes.json();
      
      setDevices(devicesData.devices || []);
      setMedia((mediaData.media || []).filter((m: AudioMedia) => m.status === 'ready'));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDevice = (id: string) => {
    const newSet = new Set(selectedDevices);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedDevices(newSet);
  };

  const toggleMedia = (id: string) => {
    const newSet = new Set(selectedMedia);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedMedia(newSet);
  };

  const selectAllDevices = () => {
    if (selectedDevices.size === devices.length) {
      setSelectedDevices(new Set());
    } else {
      setSelectedDevices(new Set(devices.map(d => d.id)));
    }
  };

  const selectAllMedia = () => {
    if (selectedMedia.size === media.length) {
      setSelectedMedia(new Set());
    } else {
      setSelectedMedia(new Set(media.map(m => m.id)));
    }
  };

  const handleDeploy = async () => {
    if (selectedDevices.size === 0 || selectedMedia.size === 0) {
      setDeployMessage({ text: 'Please select at least one device and one media file.', type: 'error' });
      return;
    }

    setDeploying(true);
    setDeployMessage(null);

    try {
      const mediaIds = Array.from(selectedMedia);
      const selectedMediaItems = media.filter(m => mediaIds.includes(m.id));
      
      if (scheduleConfig.mode === 'now') {
        // Play Now - trigger immediate playback via API
        const results = await Promise.all(
          Array.from(selectedDevices).map(async (deviceId) => {
            const device = devices.find(d => d.id === deviceId);
            if (!device) return { deviceId, success: false, error: 'Device not found' };
            
            // Update device with assigned media
            await fetch('/api/advertising/devices', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: deviceId,
                assignedMediaIds: mediaIds,
              }),
            });
            
            // Trigger immediate playback
            try {
              const playRes = await fetch('/api/advertising/deploy/play-now', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  deviceId,
                  mediaIds,
                  device,
                  mediaItems: selectedMediaItems,
                }),
              });
              const playResult = await playRes.json();
              return { deviceId, success: playResult.success, error: playResult.error };
            } catch (err) {
              return { deviceId, success: false, error: 'Playback trigger failed' };
            }
          })
        );
        
        const successCount = results.filter(r => r.success).length;
        const failedCount = results.filter(r => !r.success).length;
        
        if (successCount > 0) {
          setDeployMessage({ 
            text: `▶️ Playing ${selectedMediaItems.length} track(s) on ${successCount} device(s)${failedCount > 0 ? ` (${failedCount} failed)` : ''}`, 
            type: 'success' 
          });
        } else {
          setDeployMessage({ 
            text: 'Playback failed on all devices. Check device connections.', 
            type: 'error' 
          });
        }
      } else {
        // Schedule for later
        for (const deviceId of selectedDevices) {
          await fetch('/api/advertising/devices', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: deviceId,
              assignedMediaIds: mediaIds,
              scheduledPlayback: {
                date: scheduleConfig.scheduleDate,
                time: scheduleConfig.scheduleTime,
                repeatDaily: scheduleConfig.repeatDaily,
                repeatDays: scheduleConfig.repeatDays,
              },
            }),
          });
        }
        
        setDeployMessage({ 
          text: `📅 Scheduled ${mediaIds.length} track(s) for ${selectedDevices.size} device(s) at ${scheduleConfig.scheduleTime} on ${scheduleConfig.scheduleDate}`, 
          type: 'success' 
        });
      }
      
      setSelectedDevices(new Set());
      setSelectedMedia(new Set());
      fetchData();
    } catch (error) {
      console.error('Deploy error:', error);
      setDeployMessage({ text: 'Deployment failed. Please try again.', type: 'error' });
    } finally {
      setDeploying(false);
    }
  };

  // Recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4',
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });
        setRecordedBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(t => t + 1);
      }, 1000);
    } catch (err) {
      console.error('Error starting recording:', err);
      setDeployMessage({ text: 'Could not access microphone. Please check permissions.', type: 'error' });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const saveRecording = async () => {
    if (!recordedBlob || !recordingName) {
      setDeployMessage({ text: 'Please enter a name for the recording.', type: 'error' });
      return;
    }

    try {
      const formData = new FormData();
      const ext = recordedBlob.type.includes('webm') ? '.webm' : '.mp4';
      formData.append('file', recordedBlob, `${recordingName}${ext}`);
      formData.append('name', recordingName);
      
      const res = await fetch('/api/advertising/media/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (res.ok) {
        setDeployMessage({ text: `Recording "${recordingName}" saved to media library!`, type: 'success' });
        setRecordedBlob(null);
        setRecordingName('');
        setShowRecorder(false);
        fetchData();
      } else {
        throw new Error('Upload failed');
      }
    } catch (err) {
      setDeployMessage({ text: 'Failed to save recording.', type: 'error' });
    }
  };

  const togglePlayPreview = (mediaItem: AudioMedia) => {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Hidden audio element for playback preview */}
      <audio 
        ref={audioRef} 
        onEnded={() => setPlayingId(null)}
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
            <h1 className="text-2xl font-bold text-foreground">Deploy Audio</h1>
            <p className="text-muted-foreground">Assign and play audio on devices</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRecorder(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            <Mic className="w-4 h-4" />
            Record Audio
          </button>
        </div>
      </div>

      {/* Status Message */}
      {deployMessage && (
        <div className={cn(
          'p-4 rounded-lg flex items-center justify-between',
          deployMessage.type === 'success'
            ? 'bg-green-500/10 border border-green-500/30 text-green-500'
            : 'bg-red-500/10 border border-red-500/30 text-red-500'
        )}>
          <span>{deployMessage.text}</span>
          <button onClick={() => setDeployMessage(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Deploy Mode Selection */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="font-semibold text-foreground mb-3">Deployment Options</h3>
        <div className="grid grid-cols-2 gap-4">
          {/* Play Now */}
          <button
            onClick={() => setScheduleConfig({ ...scheduleConfig, mode: 'now' })}
            className={cn(
              'p-4 rounded-lg border-2 transition-all text-left',
              scheduleConfig.mode === 'now'
                ? 'border-brand bg-brand/10'
                : 'border-border hover:border-brand/50'
            )}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center',
                scheduleConfig.mode === 'now' ? 'bg-brand text-brand-foreground' : 'bg-secondary'
              )}>
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Play Now</p>
                <p className="text-xs text-muted-foreground">Trigger immediate playback</p>
              </div>
            </div>
          </button>
          
          {/* Schedule */}
          <button
            onClick={() => setScheduleConfig({ ...scheduleConfig, mode: 'schedule' })}
            className={cn(
              'p-4 rounded-lg border-2 transition-all text-left',
              scheduleConfig.mode === 'schedule'
                ? 'border-purple-500 bg-purple-500/10'
                : 'border-border hover:border-purple-500/50'
            )}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center',
                scheduleConfig.mode === 'schedule' ? 'bg-purple-500 text-white' : 'bg-secondary'
              )}>
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Schedule</p>
                <p className="text-xs text-muted-foreground">Set date and time</p>
              </div>
            </div>
          </button>
        </div>
        
        {/* Schedule Config */}
        {scheduleConfig.mode === 'schedule' && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Date</label>
                <input
                  type="date"
                  value={scheduleConfig.scheduleDate || ''}
                  onChange={(e) => setScheduleConfig({ ...scheduleConfig, scheduleDate: e.target.value })}
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Time</label>
                <input
                  type="time"
                  value={scheduleConfig.scheduleTime || ''}
                  onChange={(e) => setScheduleConfig({ ...scheduleConfig, scheduleTime: e.target.value })}
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground"
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={scheduleConfig.repeatDaily || false}
                    onChange={(e) => setScheduleConfig({ ...scheduleConfig, repeatDaily: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm text-foreground">Repeat daily</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Devices Column */}
        <div className="bg-card border border-border rounded-lg">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-muted-foreground" />
              <h2 className="font-semibold text-foreground">
                Select Devices ({selectedDevices.size}/{devices.length})
              </h2>
            </div>
            <button
              onClick={selectAllDevices}
              className="text-sm text-brand hover:text-brand/90"
            >
              {selectedDevices.size === devices.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          
          <div className="max-h-[400px] overflow-y-auto">
            {devices.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Volume2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No devices available</p>
                <Link href="/advertising/devices" className="text-brand text-sm hover:underline">
                  Add a device
                </Link>
              </div>
            ) : (
              devices.map((device) => (
                <div
                  key={device.id}
                  onClick={() => toggleDevice(device.id)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 border-b border-border cursor-pointer transition-colors',
                    selectedDevices.has(device.id)
                      ? 'bg-brand/10'
                      : 'hover:bg-secondary'
                  )}
                >
                  <div className={cn(
                    'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                    selectedDevices.has(device.id)
                      ? 'bg-brand border-brand'
                      : 'border-muted-foreground'
                  )}>
                    {selectedDevices.has(device.id) && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{device.name}</span>
                      <span className={cn(
                        'w-2 h-2 rounded-full',
                        device.status === 'online' ? 'bg-green-500' :
                        device.status === 'error' ? 'bg-red-500' :
                        'bg-gray-500'
                      )} />
                    </div>
                    {device.locationName && (
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {device.locationName}
                      </span>
                    )}
                    {device.ipAddress && (
                      <span className="text-xs text-muted-foreground font-mono">
                        {device.ipAddress}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Media Column */}
        <div className="bg-card border border-border rounded-lg">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <FileAudio className="w-4 h-4 text-muted-foreground" />
              <h2 className="font-semibold text-foreground">
                Select Media ({selectedMedia.size}/{media.length})
              </h2>
            </div>
            <button
              onClick={selectAllMedia}
              className="text-sm text-brand hover:text-brand/90"
            >
              {selectedMedia.size === media.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          
          <div className="max-h-[400px] overflow-y-auto">
            {media.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <FileAudio className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No media available</p>
                <Link href="/advertising/media" className="text-brand text-sm hover:underline">
                  Upload audio
                </Link>
              </div>
            ) : (
              media.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 border-b border-border transition-colors',
                    selectedMedia.has(item.id)
                      ? 'bg-brand/10'
                      : 'hover:bg-secondary'
                  )}
                >
                  {/* Play/Pause button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePlayPreview(item);
                    }}
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center transition-colors',
                      playingId === item.id
                        ? 'bg-brand text-brand-foreground'
                        : 'bg-secondary hover:bg-secondary/80'
                    )}
                  >
                    {playingId === item.id ? (
                      <Pause className="w-3 h-3" />
                    ) : (
                      <Play className="w-3 h-3 ml-0.5" />
                    )}
                  </button>
                  
                  {/* Selection checkbox */}
                  <div
                    onClick={() => toggleMedia(item.id)}
                    className={cn(
                      'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors cursor-pointer',
                      selectedMedia.has(item.id)
                        ? 'bg-brand border-brand'
                        : 'border-muted-foreground'
                    )}
                  >
                    {selectedMedia.has(item.id) && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                  
                  <div className="flex-1 cursor-pointer" onClick={() => toggleMedia(item.id)}>
                    <span className="font-medium text-foreground">{item.name}</span>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(item.durationSeconds || 0)}
                      </span>
                      {item.clientName && (
                        <span>{item.clientName}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Summary & Deploy Button */}
      {(selectedDevices.size > 0 || selectedMedia.size > 0) && (
        <div className="bg-secondary/50 border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground mb-2">Deployment Summary</h3>
              <div className="flex items-center gap-6 text-sm">
                <div>
                  <span className="text-muted-foreground">Devices:</span>
                  <span className="ml-2 text-foreground font-medium">{selectedDevices.size}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Tracks:</span>
                  <span className="ml-2 text-foreground font-medium">{selectedMedia.size}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Duration:</span>
                  <span className="ml-2 text-foreground font-medium">
                    {formatDuration(
                      media
                        .filter(m => selectedMedia.has(m.id))
                        .reduce((sum, m) => sum + (m.durationSeconds || 0), 0)
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Mode:</span>
                  <span className={cn(
                    'ml-2 font-medium',
                    scheduleConfig.mode === 'now' ? 'text-brand' : 'text-purple-500'
                  )}>
                    {scheduleConfig.mode === 'now' ? '⚡ Play Now' : `📅 ${scheduleConfig.scheduleDate} ${scheduleConfig.scheduleTime}`}
                  </span>
                </div>
              </div>
            </div>
            
            <button
              onClick={handleDeploy}
              disabled={deploying || selectedDevices.size === 0 || selectedMedia.size === 0}
              className={cn(
                'flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
                scheduleConfig.mode === 'now'
                  ? 'bg-brand text-brand-foreground hover:bg-brand/90'
                  : 'bg-purple-500 text-white hover:bg-purple-600'
              )}
            >
              {deploying ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : scheduleConfig.mode === 'now' ? (
                <Play className="w-4 h-4" />
              ) : (
                <Calendar className="w-4 h-4" />
              )}
              {scheduleConfig.mode === 'now' ? 'Play Now' : 'Schedule'}
            </button>
          </div>
        </div>
      )}

      {/* Recording Modal */}
      {showRecorder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Record Audio</h2>
                <p className="text-sm text-muted-foreground">Create a quick audio spot</p>
              </div>
              <button 
                onClick={() => {
                  if (isRecording) stopRecording();
                  setShowRecorder(false);
                  setRecordedBlob(null);
                  setRecordingName('');
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Recording visualization */}
              <div className={cn(
                'flex flex-col items-center justify-center py-8 rounded-lg border-2 border-dashed transition-colors',
                isRecording ? 'border-red-500 bg-red-500/10' : 'border-border'
              )}>
                <div className={cn(
                  'w-20 h-20 rounded-full flex items-center justify-center mb-4 transition-all',
                  isRecording ? 'bg-red-500 animate-pulse' : recordedBlob ? 'bg-green-500' : 'bg-secondary'
                )}>
                  {isRecording ? (
                    <Radio className="w-8 h-8 text-white animate-pulse" />
                  ) : recordedBlob ? (
                    <Check className="w-8 h-8 text-white" />
                  ) : (
                    <Mic className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                
                <p className="text-2xl font-mono text-foreground mb-2">
                  {formatDuration(recordingTime)}
                </p>
                
                {isRecording ? (
                  <p className="text-sm text-red-500 font-medium">Recording...</p>
                ) : recordedBlob ? (
                  <p className="text-sm text-green-500 font-medium">Recording complete!</p>
                ) : (
                  <p className="text-sm text-muted-foreground">Click to start recording</p>
                )}
              </div>
              
              {/* Controls */}
              <div className="flex justify-center gap-4">
                {!isRecording && !recordedBlob && (
                  <button
                    onClick={startRecording}
                    className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <Mic className="w-5 h-5" />
                    Start Recording
                  </button>
                )}
                
                {isRecording && (
                  <button
                    onClick={stopRecording}
                    className="flex items-center gap-2 px-6 py-3 bg-gray-500 text-white rounded-full hover:bg-gray-600 transition-colors"
                  >
                    <Square className="w-5 h-5" />
                    Stop
                  </button>
                )}
                
                {recordedBlob && (
                  <>
                    <button
                      onClick={() => {
                        setRecordedBlob(null);
                        setRecordingTime(0);
                      }}
                      className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-secondary transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Re-record
                    </button>
                    <button
                      onClick={() => {
                        const url = URL.createObjectURL(recordedBlob);
                        const audio = new Audio(url);
                        audio.play();
                      }}
                      className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-secondary transition-colors"
                    >
                      <Play className="w-4 h-4" />
                      Preview
                    </button>
                  </>
                )}
              </div>
              
              {/* Save form */}
              {recordedBlob && (
                <div className="pt-4 border-t border-border space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Recording Name *
                    </label>
                    <input
                      type="text"
                      value={recordingName}
                      onChange={(e) => setRecordingName(e.target.value)}
                      placeholder="e.g., Store Announcement March 2026"
                      className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
                    />
                  </div>
                  
                  <button
                    onClick={saveRecording}
                    disabled={!recordingName}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Check className="w-4 h-4" />
                    Save to Media Library
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
