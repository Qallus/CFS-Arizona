'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  ChevronLeft,
  Play,
  Pause,
  Send,
  Edit,
  Trash2,
  Calendar,
  Clock,
  DollarSign,
  Users,
  Volume2,
  FileAudio,
  Target,
  MoreHorizontal,
  CheckCircle,
  AlertCircle,
  X,
  Loader2,
  ChevronRight,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { DatePicker, TimePicker } from '@/components/ui/date-picker';
import { Switch } from '@/components/ui/switch';

interface Campaign {
  id: string;
  name: string;
  description?: string;
  clientName?: string;
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed';
  startDate?: string;
  endDate?: string;
  budget?: number;
  spent?: number;
  pricingModel?: string;
  pricePerUnit?: number;
  mediaIds: string[];
  targetType: 'devices' | 'groups' | 'all';
  deviceIds?: string[];
  groupIds?: string[];
  schedule: {
    enabled: boolean;
    startTime?: string;
    endTime?: string;
    daysOfWeek?: number[];
    spotsPerHour?: number;
    priority?: number;
  };
  totalPlays?: number;
  createdAt: string;
}

interface DeviceGroup {
  id: string;
  name: string;
  description?: string;
  region?: string;
  deviceIds: string[];
}

interface Device {
  id: string;
  name: string;
  locationName?: string;
  status: string;
}

interface Media {
  id: string;
  name: string;
  durationSeconds: number;
  clientName?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  draft: { label: 'Draft', color: 'bg-gray-500/20 text-gray-400', icon: Edit },
  scheduled: { label: 'Scheduled', color: 'bg-purple-500/20 text-purple-500', icon: Calendar },
  active: { label: 'Active', color: 'bg-green-500/20 text-green-500', icon: Play },
  paused: { label: 'Paused', color: 'bg-yellow-500/20 text-yellow-500', icon: Pause },
  completed: { label: 'Completed', color: 'bg-blue-500/20 text-blue-500', icon: CheckCircle },
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [groups, setGroups] = useState<DeviceGroup[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [media, setMedia] = useState<Media[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, scheduled: 0, totalBudget: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [editingGroup, setEditingGroup] = useState<DeviceGroup | null>(null);
  const [activeTab, setActiveTab] = useState<'campaigns' | 'groups'>('campaigns');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [campaignsRes, devicesRes, mediaRes] = await Promise.all([
        fetch('/api/advertising/campaigns'),
        fetch('/api/advertising/devices'),
        fetch('/api/advertising/media'),
      ]);
      
      const campaignsData = await campaignsRes.json();
      const devicesData = await devicesRes.json();
      const mediaData = await mediaRes.json();
      
      setCampaigns(campaignsData.campaigns || []);
      setGroups(campaignsData.groups || []);
      setStats(campaignsData.stats || {});
      setDevices(devicesData.devices || []);
      setMedia(mediaData.media || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCampaign = async (data: Partial<Campaign>) => {
    try {
      const method = editingCampaign ? 'PUT' : 'POST';
      const body = editingCampaign ? { ...data, id: editingCampaign.id } : data;
      
      await fetch('/api/advertising/campaigns', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      setShowModal(false);
      setEditingCampaign(null);
      fetchData();
    } catch (error) {
      console.error('Error saving campaign:', error);
    }
  };

  const handleSaveGroup = async (data: Partial<DeviceGroup>) => {
    try {
      const method = editingGroup ? 'PUT' : 'POST';
      const body = editingGroup 
        ? { ...data, id: editingGroup.id, type: 'group' }
        : { ...data, type: 'group' };
      
      await fetch('/api/advertising/campaigns', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      setShowGroupModal(false);
      setEditingGroup(null);
      fetchData();
    } catch (error) {
      console.error('Error saving group:', error);
    }
  };

  const handleDelete = async (id: string, type: 'campaign' | 'group') => {
    if (!confirm(`Delete this ${type}?`)) return;
    
    try {
      await fetch('/api/advertising/campaigns', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, type }),
      });
      fetchData();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const handleCampaignAction = async (campaignId: string, action: string) => {
    try {
      const res = await fetch('/api/advertising/campaigns', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId, action }),
      });
      const data = await res.json();
      if (data.message) {
        alert(data.message);
      }
      fetchData();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const filteredCampaigns = campaigns.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.clientName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGroups = groups.filter(g =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/advertising" className="p-2 hover:bg-secondary rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Campaigns</h1>
            <p className="text-muted-foreground">Manage advertising campaigns and device groups</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'groups' ? (
            <button
              onClick={() => {
                setEditingGroup(null);
                setShowGroupModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-brand text-brand-foreground rounded-lg hover:bg-brand/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Group
            </button>
          ) : (
            <button
              onClick={() => {
                setEditingCampaign(null);
                setShowModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-brand text-brand-foreground rounded-lg hover:bg-brand/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Campaign
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-secondary rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('campaigns')}
          className={cn(
            'px-4 py-2 rounded-md text-sm font-medium transition-colors',
            activeTab === 'campaigns' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
          )}
        >
          Campaigns ({campaigns.length})
        </button>
        <button
          onClick={() => setActiveTab('groups')}
          className={cn(
            'px-4 py-2 rounded-md text-sm font-medium transition-colors',
            activeTab === 'groups' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
          )}
        >
          Device Groups ({groups.length})
        </button>
      </div>

      {/* Stats (campaigns tab only) */}
      {activeTab === 'campaigns' && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Total Campaigns</p>
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Active</p>
            <p className="text-2xl font-bold text-green-500">{stats.active}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Scheduled</p>
            <p className="text-2xl font-bold text-purple-500">{stats.scheduled}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Total Budget</p>
            <p className="text-2xl font-bold text-foreground">${(stats.totalBudget || 0).toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder={`Search ${activeTab}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded-lg"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : activeTab === 'campaigns' ? (
        /* Campaigns List */
        filteredCampaigns.length === 0 ? (
          <div className="text-center py-12">
            <Target className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Campaigns Yet</h3>
            <p className="text-muted-foreground mb-4">Create your first advertising campaign.</p>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-brand text-brand-foreground rounded-lg hover:bg-brand/90"
            >
              Create Campaign
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredCampaigns.map((campaign) => {
              const statusConfig = STATUS_CONFIG[campaign.status] || STATUS_CONFIG.draft;
              const StatusIcon = statusConfig.icon;
              const mediaCount = campaign.mediaIds?.length || 0;
              const deviceCount = campaign.targetType === 'all' 
                ? devices.length 
                : campaign.targetType === 'groups'
                ? groups.filter(g => campaign.groupIds?.includes(g.id)).reduce((sum, g) => sum + g.deviceIds.length, 0)
                : campaign.deviceIds?.length || 0;
              
              return (
                <div
                  key={campaign.id}
                  className="bg-card border border-border rounded-lg p-4 hover:border-brand/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-foreground text-lg">{campaign.name}</h3>
                        <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', statusConfig.color)}>
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig.label}
                        </span>
                      </div>
                      
                      {campaign.clientName && (
                        <p className="text-sm text-muted-foreground mb-2">
                          Client: {campaign.clientName}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <FileAudio className="w-3 h-3" />
                          {mediaCount} tracks
                        </span>
                        <span className="flex items-center gap-1">
                          <Volume2 className="w-3 h-3" />
                          {deviceCount} devices
                        </span>
                        {campaign.budget && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            ${campaign.budget.toLocaleString()} budget
                          </span>
                        )}
                        {campaign.startDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(campaign.startDate).toLocaleDateString()}
                            {campaign.endDate && ` - ${new Date(campaign.endDate).toLocaleDateString()}`}
                          </span>
                        )}
                        {campaign.schedule?.enabled && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {campaign.schedule.startTime} - {campaign.schedule.endTime}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {campaign.status === 'draft' && (
                        <button
                          onClick={() => handleCampaignAction(campaign.id, 'deploy')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600"
                        >
                          <Send className="w-3 h-3" />
                          Deploy
                        </button>
                      )}
                      {campaign.status === 'active' && (
                        <button
                          onClick={() => handleCampaignAction(campaign.id, 'pause')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-yellow-500 text-white rounded-lg text-sm hover:bg-yellow-600"
                        >
                          <Pause className="w-3 h-3" />
                          Pause
                        </button>
                      )}
                      {campaign.status === 'paused' && (
                        <button
                          onClick={() => handleCampaignAction(campaign.id, 'activate')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600"
                        >
                          <Play className="w-3 h-3" />
                          Resume
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setEditingCampaign(campaign);
                          setShowModal(true);
                        }}
                        className="p-2 hover:bg-secondary rounded-lg"
                      >
                        <Edit className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => handleDelete(campaign.id, 'campaign')}
                        className="p-2 hover:bg-secondary rounded-lg text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Groups List */
        filteredGroups.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Device Groups Yet</h3>
            <p className="text-muted-foreground mb-4">Create groups to organize devices by location or region.</p>
            <button
              onClick={() => setShowGroupModal(true)}
              className="px-4 py-2 bg-brand text-brand-foreground rounded-lg hover:bg-brand/90"
            >
              Create Group
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredGroups.map((group) => (
              <div
                key={group.id}
                className="bg-card border border-border rounded-lg p-4 hover:border-brand/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">{group.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Volume2 className="w-3 h-3" />
                        {group.deviceIds.length} devices
                      </span>
                      {group.region && (
                        <span>Region: {group.region}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingGroup(group);
                        setShowGroupModal(true);
                      }}
                      className="p-2 hover:bg-secondary rounded-lg"
                    >
                      <Edit className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => handleDelete(group.id, 'group')}
                      className="p-2 hover:bg-secondary rounded-lg text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Campaign Modal */}
      {showModal && (
        <CampaignModal
          campaign={editingCampaign}
          devices={devices}
          groups={groups}
          media={media}
          onSave={handleSaveCampaign}
          onClose={() => {
            setShowModal(false);
            setEditingCampaign(null);
          }}
        />
      )}

      {/* Group Modal */}
      {showGroupModal && (
        <GroupModal
          group={editingGroup}
          devices={devices}
          onSave={handleSaveGroup}
          onClose={() => {
            setShowGroupModal(false);
            setEditingGroup(null);
          }}
        />
      )}
    </div>
  );
}

// Campaign Modal Component
function CampaignModal({
  campaign,
  devices,
  groups,
  media,
  onSave,
  onClose,
}: {
  campaign: Campaign | null;
  devices: Device[];
  groups: DeviceGroup[];
  media: Media[];
  onSave: (data: Partial<Campaign>) => void;
  onClose: () => void;
}) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<Campaign>>({
    name: campaign?.name || '',
    description: campaign?.description || '',
    clientName: campaign?.clientName || '',
    status: campaign?.status || 'draft',
    startDate: campaign?.startDate || '',
    endDate: campaign?.endDate || '',
    budget: campaign?.budget || 0,
    pricingModel: campaign?.pricingModel || 'flat',
    pricePerUnit: campaign?.pricePerUnit || 0,
    mediaIds: campaign?.mediaIds || [],
    targetType: campaign?.targetType || 'devices',
    deviceIds: campaign?.deviceIds || [],
    groupIds: campaign?.groupIds || [],
    schedule: campaign?.schedule || {
      enabled: true,
      startTime: '06:00',
      endTime: '22:00',
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      spotsPerHour: 4,
      priority: 1,
    },
  });

  const handleSubmit = () => {
    onSave(formData);
  };

  const toggleMedia = (id: string) => {
    const current = formData.mediaIds || [];
    setFormData({
      ...formData,
      mediaIds: current.includes(id) ? current.filter(m => m !== id) : [...current, id],
    });
  };

  const toggleDevice = (id: string) => {
    const current = formData.deviceIds || [];
    setFormData({
      ...formData,
      deviceIds: current.includes(id) ? current.filter(d => d !== id) : [...current, id],
    });
  };

  const toggleGroup = (id: string) => {
    const current = formData.groupIds || [];
    setFormData({
      ...formData,
      groupIds: current.includes(id) ? current.filter(g => g !== id) : [...current, id],
    });
  };

  const toggleDay = (day: number) => {
    const current = formData.schedule?.daysOfWeek || [];
    setFormData({
      ...formData,
      schedule: {
        ...formData.schedule!,
        daysOfWeek: current.includes(day) ? current.filter(d => d !== day) : [...current, day],
      },
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            {campaign ? 'Edit Campaign' : 'New Campaign'}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-border">
          {[1, 2, 3, 4].map((s) => (
            <button
              key={s}
              onClick={() => setStep(s)}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                step === s ? 'bg-brand text-brand-foreground' : 'text-muted-foreground hover:bg-secondary'
              )}
            >
              {s}. {s === 1 ? 'Details' : s === 2 ? 'Media' : s === 3 ? 'Target' : 'Schedule'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Campaign Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
                  placeholder="Summer Sale Campaign"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg resize-none"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Client/Advertiser</label>
                <input
                  type="text"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Date</label>
                  <DatePicker
                    value={formData.startDate || ''}
                    onChange={(value) => setFormData({ ...formData, startDate: value })}
                    placeholder="Select start date"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Date</label>
                  <DatePicker
                    value={formData.endDate || ''}
                    onChange={(value) => setFormData({ ...formData, endDate: value })}
                    placeholder="Select end date"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Budget ($)</label>
                  <input
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Pricing Model</label>
                  <select
                    value={formData.pricingModel}
                    onChange={(e) => setFormData({ ...formData, pricingModel: e.target.value })}
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
                  >
                    <option value="flat">Flat Rate</option>
                    <option value="per_play">Per Play</option>
                    <option value="cpm">CPM</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                Select audio tracks for this campaign ({formData.mediaIds?.length || 0} selected)
              </p>
              {media.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileAudio className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No audio files available</p>
                  <Link href="/advertising/media" className="text-brand text-sm">
                    Upload some first
                  </Link>
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {media.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => toggleMedia(item.id)}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors',
                        formData.mediaIds?.includes(item.id) ? 'bg-brand/20 border border-brand' : 'bg-secondary hover:bg-secondary/80'
                      )}
                    >
                      <div className={cn(
                        'w-5 h-5 rounded border-2 flex items-center justify-center',
                        formData.mediaIds?.includes(item.id) ? 'bg-brand border-brand' : 'border-muted-foreground'
                      )}>
                        {formData.mediaIds?.includes(item.id) && <CheckCircle className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1">
                        <span className="font-medium">{item.name}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          {Math.floor(item.durationSeconds / 60)}:{(item.durationSeconds % 60).toString().padStart(2, '0')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Target Type</label>
                <div className="flex gap-2">
                  {(['devices', 'groups', 'all'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setFormData({ ...formData, targetType: type })}
                      className={cn(
                        'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                        formData.targetType === type ? 'bg-brand text-brand-foreground' : 'bg-secondary text-muted-foreground'
                      )}
                    >
                      {type === 'devices' ? 'Specific Devices' : type === 'groups' ? 'Device Groups' : 'All Devices'}
                    </button>
                  ))}
                </div>
              </div>

              {formData.targetType === 'devices' && (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {devices.map((device) => (
                    <div
                      key={device.id}
                      onClick={() => toggleDevice(device.id)}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors',
                        formData.deviceIds?.includes(device.id) ? 'bg-brand/20 border border-brand' : 'bg-secondary'
                      )}
                    >
                      <div className={cn(
                        'w-5 h-5 rounded border-2 flex items-center justify-center',
                        formData.deviceIds?.includes(device.id) ? 'bg-brand border-brand' : 'border-muted-foreground'
                      )}>
                        {formData.deviceIds?.includes(device.id) && <CheckCircle className="w-3 h-3 text-white" />}
                      </div>
                      <Volume2 className="w-4 h-4 text-muted-foreground" />
                      <span>{device.name}</span>
                      {device.locationName && <span className="text-sm text-muted-foreground">({device.locationName})</span>}
                    </div>
                  ))}
                </div>
              )}

              {formData.targetType === 'groups' && (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {groups.length === 0 ? (
                    <p className="text-center py-4 text-muted-foreground">No groups created yet</p>
                  ) : (
                    groups.map((group) => (
                      <div
                        key={group.id}
                        onClick={() => toggleGroup(group.id)}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors',
                          formData.groupIds?.includes(group.id) ? 'bg-brand/20 border border-brand' : 'bg-secondary'
                        )}
                      >
                        <div className={cn(
                          'w-5 h-5 rounded border-2 flex items-center justify-center',
                          formData.groupIds?.includes(group.id) ? 'bg-brand border-brand' : 'border-muted-foreground'
                        )}>
                          {formData.groupIds?.includes(group.id) && <CheckCircle className="w-3 h-3 text-white" />}
                        </div>
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span>{group.name}</span>
                        <span className="text-sm text-muted-foreground">({group.deviceIds.length} devices)</span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {formData.targetType === 'all' && (
                <p className="text-muted-foreground">
                  Campaign will deploy to all {devices.length} registered devices.
                </p>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Enable Schedule</label>
                <Switch
                  checked={formData.schedule?.enabled || false}
                  onChange={(checked) => setFormData({
                    ...formData,
                    schedule: { ...formData.schedule!, enabled: checked }
                  })}
                />
              </div>

              {formData.schedule?.enabled && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Start Time</label>
                      <TimePicker
                        value={formData.schedule?.startTime || '06:00'}
                        onChange={(value) => setFormData({
                          ...formData,
                          schedule: { ...formData.schedule!, startTime: value }
                        })}
                        placeholder="Select start time"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">End Time</label>
                      <TimePicker
                        value={formData.schedule?.endTime || '22:00'}
                        onChange={(value) => setFormData({
                          ...formData,
                          schedule: { ...formData.schedule!, endTime: value }
                        })}
                        placeholder="Select end time"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Days of Week</label>
                    <div className="flex gap-2">
                      {DAYS.map((day, i) => (
                        <button
                          key={i}
                          onClick={() => toggleDay(i)}
                          className={cn(
                            'w-10 h-10 rounded-lg text-sm font-medium transition-colors',
                            formData.schedule?.daysOfWeek?.includes(i) ? 'bg-brand text-brand-foreground' : 'bg-secondary text-muted-foreground'
                          )}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Spots per Hour</label>
                      <input
                        type="number"
                        min="1"
                        max="60"
                        value={formData.schedule?.spotsPerHour}
                        onChange={(e) => setFormData({
                          ...formData,
                          schedule: { ...formData.schedule!, spotsPerHour: parseInt(e.target.value) || 4 }
                        })}
                        className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Priority (1-10)</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={formData.schedule?.priority}
                        onChange={(e) => setFormData({
                          ...formData,
                          schedule: { ...formData.schedule!, priority: parseInt(e.target.value) || 1 }
                        })}
                        className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
          <button
            onClick={() => step > 1 ? setStep(step - 1) : onClose()}
            className="px-4 py-2 text-muted-foreground hover:text-foreground"
          >
            {step > 1 ? 'Back' : 'Cancel'}
          </button>
          <button
            onClick={() => step < 4 ? setStep(step + 1) : handleSubmit()}
            className="px-4 py-2 bg-brand text-brand-foreground rounded-lg hover:bg-brand/90"
          >
            {step < 4 ? 'Next' : (campaign ? 'Save Changes' : 'Create Campaign')}
          </button>
        </div>
      </div>
    </div>
  );
}

// Group Modal Component
function GroupModal({
  group,
  devices,
  onSave,
  onClose,
}: {
  group: DeviceGroup | null;
  devices: Device[];
  onSave: (data: Partial<DeviceGroup>) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    name: group?.name || '',
    description: group?.description || '',
    region: group?.region || '',
    deviceIds: group?.deviceIds || [],
  });

  const toggleDevice = (id: string) => {
    setFormData({
      ...formData,
      deviceIds: formData.deviceIds.includes(id)
        ? formData.deviceIds.filter(d => d !== id)
        : [...formData.deviceIds, id],
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold">{group ? 'Edit Group' : 'New Group'}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Group Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Region</label>
            <input
              type="text"
              value={formData.region}
              onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
              placeholder="e.g., Scottsdale, Phoenix"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Select Devices ({formData.deviceIds.length})
            </label>
            <div className="max-h-[200px] overflow-y-auto space-y-2">
              {devices.map((device) => (
                <div
                  key={device.id}
                  onClick={() => toggleDevice(device.id)}
                  className={cn(
                    'flex items-center gap-3 p-2 rounded-lg cursor-pointer',
                    formData.deviceIds.includes(device.id) ? 'bg-brand/20' : 'bg-secondary'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={formData.deviceIds.includes(device.id)}
                    readOnly
                    className="rounded"
                  />
                  <span>{device.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 text-muted-foreground">Cancel</button>
          <button
            onClick={() => onSave(formData)}
            className="px-4 py-2 bg-brand text-brand-foreground rounded-lg hover:bg-brand/90"
          >
            {group ? 'Save' : 'Create Group'}
          </button>
        </div>
      </div>
    </div>
  );
}
