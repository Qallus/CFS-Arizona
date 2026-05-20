'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Wifi,
  WifiOff,
  AlertTriangle,
  Settings,
  MoreHorizontal,
  Trash2,
  Edit,
  RefreshCw,
  Volume2,
  MapPin,
  Clock,
  Activity,
  Key,
  Copy,
  Check,
  ChevronLeft,
  Play,
  Loader2,
  Signal,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface AudioDevice {
  id: string;
  deviceId: string;
  name: string;
  description?: string;
  locationId?: string;
  locationName?: string;
  locationAddress?: string;
  region?: string;
  status: 'online' | 'offline' | 'error' | 'provisioning';
  lastHeartbeat?: string;
  lastPlayback?: string;
  currentMedia?: string;
  firmwareVersion?: string;
  hardwareModel?: string;
  ipAddress?: string;
  wifiStrength?: number;
  volume?: number;
  assignedMediaIds?: string[];
  schedule?: {
    enabled: boolean;
    startTime?: string;
    endTime?: string;
    daysOfWeek?: number[];
    spotsPerHour?: number;
  };
  createdAt: string;
  updatedAt: string;
}

const STATUS_CONFIG = {
  online: { label: 'Online', color: 'bg-green-500', icon: Wifi },
  offline: { label: 'Offline', color: 'bg-gray-500', icon: WifiOff },
  error: { label: 'Error', color: 'bg-red-500', icon: AlertTriangle },
  provisioning: { label: 'Setup', color: 'bg-yellow-500', icon: Settings },
};

export default function DevicesPage() {
  const [devices, setDevices] = useState<AudioDevice[]>([]);
  const [stats, setStats] = useState({ total: 0, online: 0, offline: 0, error: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState<AudioDevice | null>(null);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  useEffect(() => {
    fetchDevices();
    // Refresh every 30 seconds
    const interval = setInterval(fetchDevices, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDevices = async () => {
    try {
      const res = await fetch('/api/advertising/devices');
      const data = await res.json();
      setDevices(data.devices || []);
      setStats(data.stats || { total: 0, online: 0, offline: 0, error: 0 });
    } catch (error) {
      console.error('Error fetching devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (deviceData: Partial<AudioDevice>) => {
    try {
      const method = editingDevice ? 'PUT' : 'POST';
      const body = editingDevice
        ? { ...deviceData, id: editingDevice.id }
        : deviceData;

      const res = await fetch('/api/advertising/devices', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      
      if (data.apiKey) {
        setNewApiKey(data.apiKey);
      } else {
        setShowModal(false);
        setEditingDevice(null);
        fetchDevices();
      }
    } catch (error) {
      console.error('Error saving device:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this device?')) return;

    try {
      await fetch('/api/advertising/devices', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      fetchDevices();
    } catch (error) {
      console.error('Error deleting device:', error);
    }
  };

  const handleRegenerateKey = async (id: string) => {
    if (!confirm('Regenerate API key? The device will need to be reconfigured.')) return;

    try {
      const res = await fetch(`/api/advertising/devices/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'regenerate-key' }),
      });
      const data = await res.json();
      if (data.apiKey) {
        setNewApiKey(data.apiKey);
      }
    } catch (error) {
      console.error('Error regenerating key:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const filteredDevices = devices.filter(d =>
    d.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.deviceId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.locationName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTimeSince = (dateStr?: string) => {
    if (!dateStr) return 'Never';
    const diff = Date.now() - new Date(dateStr).getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

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
            <h1 className="text-2xl font-bold text-foreground">Audio Players</h1>
            <p className="text-muted-foreground">Manage your IoT audio devices</p>
          </div>
        </div>
        <button
          onClick={() => {
            setEditingDevice(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-brand text-brand-foreground rounded-lg hover:bg-brand/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Device
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Devices</p>
          <p className="text-2xl font-bold text-foreground">{stats.total}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <p className="text-sm text-muted-foreground">Online</p>
          </div>
          <p className="text-2xl font-bold text-green-500">{stats.online}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gray-500"></div>
            <p className="text-sm text-muted-foreground">Offline</p>
          </div>
          <p className="text-2xl font-bold text-muted-foreground">{stats.offline}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <p className="text-sm text-muted-foreground">Errors</p>
          </div>
          <p className="text-2xl font-bold text-red-500">{stats.error}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search devices..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/50"
        />
      </div>

      {/* Devices List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredDevices.length === 0 ? (
        <div className="text-center py-12">
          <Volume2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No Devices Yet</h3>
          <p className="text-muted-foreground mb-4">
            Add your first audio player to get started.
          </p>
          <button
            onClick={() => {
              setEditingDevice(null);
              setShowModal(true);
            }}
            className="px-4 py-2 bg-brand text-brand-foreground rounded-lg hover:bg-brand/90 transition-colors"
          >
            Add Device
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredDevices.map((device) => {
            const statusConfig = STATUS_CONFIG[device.status] || STATUS_CONFIG.offline;
            const StatusIcon = statusConfig.icon;
            
            return (
              <div
                key={device.id}
                className="bg-card border border-border rounded-lg p-4 hover:border-brand/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <div className={cn(
                      'w-12 h-12 rounded-lg flex items-center justify-center',
                      device.status === 'online' ? 'bg-green-500/20' : 'bg-secondary'
                    )}>
                      <Volume2 className={cn(
                        'w-6 h-6',
                        device.status === 'online' ? 'text-green-500' : 'text-muted-foreground'
                      )} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">{device.name}</h3>
                        <span className="text-xs text-muted-foreground font-mono">
                          {device.deviceId}
                        </span>
                        <span className={cn(
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                          device.status === 'online' ? 'bg-green-500/20 text-green-500' :
                          device.status === 'error' ? 'bg-red-500/20 text-red-500' :
                          device.status === 'provisioning' ? 'bg-yellow-500/20 text-yellow-500' :
                          'bg-gray-500/20 text-gray-400'
                        )}>
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig.label}
                        </span>
                      </div>
                      
                      {device.locationName && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                          <MapPin className="w-3 h-3" />
                          {device.locationName}
                          {device.locationAddress && ` - ${device.locationAddress}`}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Last seen: {getTimeSince(device.lastHeartbeat)}
                        </span>
                        {device.wifiStrength !== undefined && (
                          <span className="flex items-center gap-1">
                            <Signal className="w-3 h-3" />
                            {device.wifiStrength}%
                          </span>
                        )}
                        {device.volume !== undefined && (
                          <span className="flex items-center gap-1">
                            <Volume2 className="w-3 h-3" />
                            {device.volume}%
                          </span>
                        )}
                        {device.assignedMediaIds && device.assignedMediaIds.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Play className="w-3 h-3" />
                            {device.assignedMediaIds.length} tracks
                          </span>
                        )}
                        {device.ipAddress && (
                          <span className="font-mono text-xs">
                            {device.ipAddress}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRegenerateKey(device.id)}
                      className="p-2 hover:bg-secondary rounded-lg transition-colors"
                      title="Regenerate API Key"
                    >
                      <Key className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingDevice(device);
                        setShowModal(true);
                      }}
                      className="p-2 hover:bg-secondary rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => handleDelete(device.id)}
                      className="p-2 hover:bg-secondary rounded-lg transition-colors text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Device Modal */}
      {showModal && !newApiKey && (
        <DeviceModal
          device={editingDevice}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false);
            setEditingDevice(null);
          }}
        />
      )}

      {/* API Key Modal */}
      {newApiKey && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Device API Key</h2>
              <button
                onClick={() => {
                  setNewApiKey(null);
                  setShowModal(false);
                  setEditingDevice(null);
                  fetchDevices();
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4">
              <p className="text-yellow-500 text-sm font-medium">
                ⚠️ Save this key now! It will not be shown again.
              </p>
            </div>
            
            <div className="relative">
              <input
                type="text"
                value={newApiKey}
                readOnly
                className="w-full px-3 py-2 pr-10 bg-secondary border border-border rounded-lg font-mono text-sm"
              />
              <button
                onClick={() => copyToClipboard(newApiKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-background rounded"
              >
                {copiedKey ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
            </div>
            
            <p className="text-sm text-muted-foreground mt-4">
              Configure your device with this API key to connect to the dashboard.
            </p>
            
            <button
              onClick={() => {
                setNewApiKey(null);
                setShowModal(false);
                setEditingDevice(null);
                fetchDevices();
              }}
              className="w-full mt-4 px-4 py-2 bg-brand text-brand-foreground rounded-lg hover:bg-brand/90 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function DeviceModal({
  device,
  onSave,
  onClose,
}: {
  device: AudioDevice | null;
  onSave: (data: Partial<AudioDevice>) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    name: device?.name || '',
    deviceId: device?.deviceId || '',
    description: device?.description || '',
    locationName: device?.locationName || '',
    locationAddress: device?.locationAddress || '',
    region: device?.region || '',
    hardwareModel: device?.hardwareModel || '',
    volume: device?.volume ?? 80,
    schedule: device?.schedule || {
      enabled: false,
      startTime: '06:00',
      endTime: '22:00',
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      spotsPerHour: 4,
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            {device ? 'Edit Device' : 'Add Device'}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Device Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
              placeholder="e.g., Lobby Audio Player"
              required
            />
          </div>

          {!device && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Device ID (Hardware)
              </label>
              <input
                type="text"
                value={formData.deviceId}
                onChange={(e) => setFormData({ ...formData, deviceId: e.target.value })}
                className="w-full px-3 py-2 bg-secondary border border-border rounded-lg font-mono"
                placeholder="Leave blank to auto-generate"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Unique hardware identifier. Can be MAC address or serial number.
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-secondary border border-border rounded-lg resize-none"
              rows={2}
              placeholder="Optional notes about this device..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Location Name
              </label>
              <input
                type="text"
                value={formData.locationName}
                onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
                className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
                placeholder="e.g., Main Lobby"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Region
              </label>
              <input
                type="text"
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
                placeholder="e.g., Scottsdale"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Location Address
            </label>
            <input
              type="text"
              value={formData.locationAddress}
              onChange={(e) => setFormData({ ...formData, locationAddress: e.target.value })}
              className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
              placeholder="Full address..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Hardware Model
              </label>
              <input
                type="text"
                value={formData.hardwareModel}
                onChange={(e) => setFormData({ ...formData, hardwareModel: e.target.value })}
                className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
                placeholder="e.g., Raspberry Pi Zero 2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Default Volume
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.volume}
                onChange={(e) => setFormData({ ...formData, volume: parseInt(e.target.value) || 80 })}
                className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
              />
            </div>
          </div>

          {/* Schedule Section */}
          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-medium text-foreground">
                Playback Schedule
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.schedule.enabled}
                  onChange={(e) => setFormData({
                    ...formData,
                    schedule: { ...formData.schedule, enabled: e.target.checked }
                  })}
                  className="rounded"
                />
                <span className="text-sm text-muted-foreground">Enable</span>
              </label>
            </div>

            {formData.schedule.enabled && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Start Time</label>
                    <input
                      type="time"
                      value={formData.schedule.startTime}
                      onChange={(e) => setFormData({
                        ...formData,
                        schedule: { ...formData.schedule, startTime: e.target.value }
                      })}
                      className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">End Time</label>
                    <input
                      type="time"
                      value={formData.schedule.endTime}
                      onChange={(e) => setFormData({
                        ...formData,
                        schedule: { ...formData.schedule, endTime: e.target.value }
                      })}
                      className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Spots/Hour</label>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={formData.schedule.spotsPerHour}
                      onChange={(e) => setFormData({
                        ...formData,
                        schedule: { ...formData.schedule, spotsPerHour: parseInt(e.target.value) || 4 }
                      })}
                      className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>
            )}
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
            {device ? 'Save Changes' : 'Add Device'}
          </button>
        </div>
      </div>
    </div>
  );
}
