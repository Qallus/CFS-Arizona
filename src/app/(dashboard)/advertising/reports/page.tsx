'use client';

import { useState, useEffect } from 'react';
import {
  ChevronLeft,
  BarChart3,
  Play,
  Volume2,
  Clock,
  DollarSign,
  TrendingUp,
  Calendar,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface PlaybackLog {
  id: string;
  deviceId: string;
  mediaId: string;
  playedAt: string;
  durationPlayed: number;
  completed: boolean;
}

interface DeviceEvent {
  id: string;
  deviceId: string;
  eventType: string;
  createdAt: string;
}

interface Device {
  id: string;
  name: string;
  locationName?: string;
}

interface Media {
  id: string;
  name: string;
  clientName?: string;
  pricePerUnit?: number;
  pricingModel?: string;
}

export default function ReportsPage() {
  const [logs, setLogs] = useState<PlaybackLog[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('week');

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
      
      // Fetch logs from playback-logs.json via a simple endpoint
      const logsRes = await fetch('/api/advertising/reports');
      
      const devicesData = await devicesRes.json();
      const mediaData = await mediaRes.json();
      const logsData = await logsRes.json();
      
      setDevices(devicesData.devices || []);
      setMedia(mediaData.media || []);
      setLogs(logsData.logs || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredLogs = () => {
    const now = Date.now();
    const day = 86400000;
    
    return logs.filter(log => {
      const logTime = new Date(log.playedAt).getTime();
      switch (dateRange) {
        case 'today':
          return now - logTime < day;
        case 'week':
          return now - logTime < day * 7;
        case 'month':
          return now - logTime < day * 30;
        default:
          return true;
      }
    });
  };

  const filteredLogs = getFilteredLogs();

  // Calculate stats
  const stats = {
    totalPlays: filteredLogs.length,
    completedPlays: filteredLogs.filter(l => l.completed).length,
    uniqueDevices: new Set(filteredLogs.map(l => l.deviceId)).size,
    uniqueMedia: new Set(filteredLogs.map(l => l.mediaId)).size,
    totalDuration: filteredLogs.reduce((sum, l) => sum + (l.durationPlayed || 0), 0),
    estimatedRevenue: filteredLogs.reduce((sum, log) => {
      const mediaItem = media.find(m => m.id === log.mediaId);
      if (mediaItem?.pricePerUnit && mediaItem.pricingModel === 'per_play') {
        return sum + mediaItem.pricePerUnit;
      }
      return sum;
    }, 0),
  };

  // Plays by device
  const playsByDevice = devices.map(device => ({
    ...device,
    plays: filteredLogs.filter(l => l.deviceId === device.id).length,
  })).sort((a, b) => b.plays - a.plays);

  // Plays by media
  const playsByMedia = media.map(m => ({
    ...m,
    plays: filteredLogs.filter(l => l.mediaId === m.id).length,
  })).sort((a, b) => b.plays - a.plays);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
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
            <h1 className="text-2xl font-bold text-foreground">Playback Reports</h1>
            <p className="text-muted-foreground">Analytics and revenue tracking</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 p-1 bg-secondary rounded-lg">
            {(['today', 'week', 'month', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  dateRange === range
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {range === 'today' ? 'Today' : range === 'week' ? '7 Days' : range === 'month' ? '30 Days' : 'All Time'}
              </button>
            ))}
          </div>
          <button
            onClick={fetchData}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Play className="w-4 h-4" />
            <span className="text-sm">Total Plays</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.totalPlays.toLocaleString()}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">Completion Rate</span>
          </div>
          <p className="text-2xl font-bold text-green-500">
            {stats.totalPlays > 0 ? Math.round((stats.completedPlays / stats.totalPlays) * 100) : 0}%
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Volume2 className="w-4 h-4" />
            <span className="text-sm">Active Devices</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.uniqueDevices}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <BarChart3 className="w-4 h-4" />
            <span className="text-sm">Unique Tracks</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.uniqueMedia}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Total Airtime</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{formatDuration(stats.totalDuration)}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <DollarSign className="w-4 h-4" />
            <span className="text-sm">Est. Revenue</span>
          </div>
          <p className="text-2xl font-bold text-green-500">${stats.estimatedRevenue.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Plays by Device */}
        <div className="bg-card border border-border rounded-lg">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="font-semibold text-foreground">Plays by Device</h2>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {playsByDevice.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No playback data yet
              </div>
            ) : (
              playsByDevice.map((device) => (
                <div key={device.id} className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <div>
                    <span className="font-medium text-foreground">{device.name}</span>
                    {device.locationName && (
                      <span className="text-sm text-muted-foreground ml-2">{device.locationName}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand"
                        style={{
                          width: `${playsByDevice[0]?.plays > 0 ? (device.plays / playsByDevice[0].plays) * 100 : 0}%`
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-foreground w-12 text-right">
                      {device.plays}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Plays by Media */}
        <div className="bg-card border border-border rounded-lg">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="font-semibold text-foreground">Plays by Track</h2>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {playsByMedia.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No playback data yet
              </div>
            ) : (
              playsByMedia.filter(m => m.plays > 0).map((item) => (
                <div key={item.id} className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <div>
                    <span className="font-medium text-foreground">{item.name}</span>
                    {item.clientName && (
                      <span className="text-sm text-muted-foreground ml-2">({item.clientName})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500"
                        style={{
                          width: `${playsByMedia[0]?.plays > 0 ? (item.plays / playsByMedia[0].plays) * 100 : 0}%`
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-foreground w-12 text-right">
                      {item.plays}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-card border border-border rounded-lg">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="font-semibold text-foreground">Recent Playback Activity</h2>
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No playback logs yet. Logs will appear here when devices play audio.
            </div>
          ) : (
            filteredLogs.slice(0, 50).map((log) => {
              const device = devices.find(d => d.id === log.deviceId);
              const mediaItem = media.find(m => m.id === log.mediaId);
              return (
                <div key={log.id} className="flex items-center justify-between px-4 py-2 border-b border-border text-sm">
                  <div className="flex items-center gap-4">
                    <span className={cn(
                      'w-2 h-2 rounded-full',
                      log.completed ? 'bg-green-500' : 'bg-yellow-500'
                    )} />
                    <span className="text-foreground">{device?.name || 'Unknown Device'}</span>
                    <span className="text-muted-foreground">played</span>
                    <span className="text-foreground font-medium">{mediaItem?.name || 'Unknown Track'}</span>
                  </div>
                  <span className="text-muted-foreground">
                    {new Date(log.playedAt).toLocaleString()}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
