'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Monitor,
  Volume2,
  MapPin,
  Globe,
  Calendar,
  TreePine,
  Mail,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  Upload,
  Image,
  ExternalLink,
  BarChart3,
  Users,
  Map,
  Wifi,
  FileAudio,
  Send,
  Settings,
  Target,
  Link2,
  Unlink,
  Speaker,
  Navigation,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { DatePicker, TimePicker } from '@/components/ui/date-picker';

type TabType = 'digital-displays' | 'audio-players' | 'street-furniture' | 'web-ads' | 'events' | 'outdoor' | 'direct-mail';

interface LinkedDevice {
  id: string;
  deviceId: string;
  name: string;
  status: 'online' | 'offline' | 'error' | 'provisioning';
  locationId?: string;
  ipAddress?: string;
  lastHeartbeat?: string;
}

interface AdLocation {
  id: string;
  // Section A: Location Overview
  name: string;
  locationId: string;
  type: TabType;
  streetAddress: string;
  city: string;
  state: string;
  zip: string;
  gpsCoordinates: string;
  district: string;
  indoorOutdoor: 'indoor' | 'outdoor' | 'both';
  propertyType: string;
  photos: string[];
  videoUrl: string;
  publicDescription: string;
  internalNotes: string;
  
  // Section B: Traffic & Audience
  avgDailyFootTraffic: number;
  weekendTraffic: number;
  vehicleCountPerDay: number;
  avgDwellTime: number;
  peakHours: string[];
  audienceType: string[];
  medianHouseholdIncome: number;
  avgAgeRange: string;
  genderSplit: string;
  touristVsLocalPercent: number;
  
  // Section C: Digital Display Specs
  screenSize?: string;
  resolution?: string;
  orientation?: 'landscape' | 'portrait';
  viewingDistance?: number;
  visibilityDistance?: number;
  loopLength?: number;
  spotsPerLoop?: number;
  spotsPerDay?: number;
  playsPerDay?: number;
  operatingHoursStart?: string;
  operatingHoursEnd?: string;
  shareOfVoiceOptions?: string[];
  
  // Section C: Audio Specs
  audioCoverageRadius?: number;
  speakersInstalled?: number;
  spotsPerHour?: number;
  audioSpotsPerDay?: number;
  totalPlayHoursPerDay?: number;
  adLengthOptions?: number[];
  estimatedListenersPerDay?: number;
  peakListeningTimes?: string[];
  
  // Section D: Pricing
  baseMonthlyRate: number;
  costPerSecond: number;
  costPer15s: number;
  costPer30s: number;
  costPer60s: number;
  costPerMinute: number;
  cpm: number;
  setupFee: number;
  productionFee: number;
  minimumContractTerm: number;
  seasonalRateAdjustment: number;
  
  // Section E: Availability
  campaignStartDate?: string;
  campaignEndDate?: string;
  timeOfDayAvailability: string[];
  dailyTimeWindowStart?: string;
  dailyTimeWindowEnd?: string;
  blackoutDates: string[];
  reservedDates: string[];
  inventorySlotsRemaining: number;
  status: 'available' | 'limited' | 'sold_out' | 'maintenance';
  
  // Section F: Calculated Fields
  monthlyImpressions?: number;
  costPerPlay?: number;
  costPerSpot?: number;
  calculatedCpm?: number;
  monthlyPlays?: number;
  totalInventoryPerDay?: number;
  remainingInventoryPercent?: number;
  
  createdAt: string;
  updatedAt: string;
}

const TABS: { key: TabType; label: string; icon: any }[] = [
  { key: 'digital-displays', label: 'Digital Displays', icon: Monitor },
  { key: 'audio-players', label: 'Audio Players', icon: Volume2 },
  { key: 'street-furniture', label: 'Street Furniture', icon: MapPin },
  { key: 'web-ads', label: 'Web Ads', icon: Globe },
  { key: 'events', label: 'Events', icon: Calendar },
  { key: 'outdoor', label: 'Outdoor', icon: TreePine },
  { key: 'direct-mail', label: 'Direct Mail', icon: Mail },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  available: { label: 'Available', color: 'bg-green-500/20 text-green-500', icon: CheckCircle },
  limited: { label: 'Limited', color: 'bg-yellow-500/20 text-yellow-500', icon: AlertCircle },
  sold_out: { label: 'Sold Out', color: 'bg-red-500/20 text-red-500', icon: X },
  maintenance: { label: 'Maintenance', color: 'bg-gray-500/20 text-gray-500', icon: Clock },
  draft: { label: 'Draft', color: 'bg-gray-500/20 text-gray-500', icon: Clock },
  active: { label: 'Active', color: 'bg-green-500/20 text-green-500', icon: CheckCircle },
  paused: { label: 'Paused', color: 'bg-yellow-500/20 text-yellow-500', icon: Clock },
  completed: { label: 'Completed', color: 'bg-blue-500/20 text-blue-500', icon: CheckCircle },
  scheduled: { label: 'Scheduled', color: 'bg-purple-500/20 text-purple-500', icon: Clock },
};

export default function AdvertisingPage() {
  const [activeTab, setActiveTab] = useState<TabType>('digital-displays');
  const [items, setItems] = useState<AdLocation[]>([]);
  const [devices, setDevices] = useState<LinkedDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<AdLocation | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [showLinkModal, setShowLinkModal] = useState<string | null>(null);
  const [showSiteMap, setShowSiteMap] = useState<string | null>(null);

  useEffect(() => {
    fetchItems();
    if (activeTab === 'audio-players') {
      fetchDevices();
    }
  }, [activeTab]);

  const fetchDevices = async () => {
    try {
      const res = await fetch('/api/advertising/devices');
      const data = await res.json();
      setDevices(data.devices || []);
    } catch (error) {
      console.error('Error fetching devices:', error);
    }
  };

  const getLinkedDevices = (locationId: string) => {
    return devices.filter(d => d.locationId === locationId);
  };

  const getUnlinkedDevices = () => {
    return devices.filter(d => !d.locationId);
  };

  const handleLinkDevice = async (deviceId: string, locationId: string, locationName: string, locationAddress: string) => {
    try {
      const device = devices.find(d => d.id === deviceId);
      if (!device) return;
      
      await fetch('/api/advertising/devices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: deviceId,
          locationId,
          locationName,
          locationAddress,
        }),
      });
      
      fetchDevices();
      setShowLinkModal(null);
    } catch (error) {
      console.error('Error linking device:', error);
    }
  };

  const handleUnlinkDevice = async (deviceId: string) => {
    try {
      await fetch('/api/advertising/devices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: deviceId,
          locationId: null,
          locationName: null,
          locationAddress: null,
        }),
      });
      
      fetchDevices();
    } catch (error) {
      console.error('Error unlinking device:', error);
    }
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/advertising?type=${activeTab}`);
      const data = await res.json();
      setItems(data.items || []);
    } catch (error) {
      console.error('Error fetching advertising items:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (itemData: Partial<AdLocation>) => {
    try {
      const method = editingItem ? 'PUT' : 'POST';
      const body = editingItem 
        ? { ...itemData, id: editingItem.id, type: activeTab }
        : { ...itemData, type: activeTab };

      await fetch('/api/advertising', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      setShowModal(false);
      setEditingItem(null);
      fetchItems();
    } catch (error) {
      console.error('Error saving item:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this location?')) return;
    
    try {
      await fetch('/api/advertising', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, type: activeTab }),
      });
      fetchItems();
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const filteredItems = items.filter(item =>
    item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.locationId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.streetAddress?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: items.length,
    available: items.filter(i => i.status === 'available').length,
    totalMonthlyRevenue: items.reduce((sum, i) => sum + (i.baseMonthlyRate || 0), 0),
    avgImpressions: items.length > 0 ? Math.round(items.reduce((sum, i) => sum + (i.monthlyImpressions || 0), 0) / items.length) : 0,
  };

  const currentTabConfig = TABS.find(t => t.key === activeTab) || TABS[0];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Advertising Inventory</h1>
          <p className="text-muted-foreground">Manage your advertising locations and availability</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/advertising/public"
            className="flex items-center gap-2 px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 transition-colors"
          >
            <Globe className="w-4 h-4" />
            View Public Listing
          </Link>
          <button
            onClick={() => {
              setEditingItem(null);
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-brand text-brand-foreground rounded-lg hover:bg-brand/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Location
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-secondary rounded-lg overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap',
              activeTab === tab.key
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Locations</p>
          <p className="text-2xl font-bold text-foreground">{stats.total}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Available</p>
          <p className="text-2xl font-bold text-green-500">{stats.available}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Monthly Revenue Potential</p>
          <p className="text-2xl font-bold text-foreground">${stats.totalMonthlyRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Avg Monthly Impressions</p>
          <p className="text-2xl font-bold text-foreground">{stats.avgImpressions.toLocaleString()}</p>
        </div>
      </div>

      {/* Audio Players Quick Actions */}
      {activeTab === 'audio-players' && (
        <div className="bg-gradient-to-r from-brand/10 to-purple-500/10 border border-brand/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground">Audio Player Management</h3>
              <p className="text-sm text-muted-foreground">Manage IoT devices, upload audio, and deploy content</p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/advertising/devices"
                className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg hover:bg-secondary transition-colors"
              >
                <Wifi className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium">Devices</span>
              </Link>
              <Link
                href="/advertising/media"
                className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg hover:bg-secondary transition-colors"
              >
                <FileAudio className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium">Media Library</span>
              </Link>
              <Link
                href="/advertising/campaigns"
                className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg hover:bg-secondary transition-colors"
              >
                <Target className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium">Campaigns</span>
              </Link>
              <Link
                href="/advertising/deploy"
                className="flex items-center gap-2 px-4 py-2 bg-brand text-brand-foreground rounded-lg hover:bg-brand/90 transition-colors"
              >
                <Send className="w-4 h-4" />
                <span className="text-sm font-medium">Deploy</span>
              </Link>
              <Link
                href="/advertising/reports"
                className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg hover:bg-secondary transition-colors"
              >
                <BarChart3 className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium">Reports</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder={`Search ${currentTabConfig.label.toLowerCase()}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/50"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <currentTabConfig.icon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No {currentTabConfig.label} Yet</h3>
          <p className="text-muted-foreground mb-4">
            Get started by adding your first advertising location.
          </p>
          <button
            onClick={() => {
              setEditingItem(null);
              setShowModal(true);
            }}
            className="px-4 py-2 bg-brand text-brand-foreground rounded-lg hover:bg-brand/90 transition-colors"
          >
            Add Location
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredItems.map((item) => {
            const statusConfig = STATUS_CONFIG[item.status] || STATUS_CONFIG.draft;
            return (
              <div key={item.id} className="bg-card border border-border rounded-lg p-4 hover:border-brand/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    {item.photos?.[0] ? (
                      <img src={item.photos[0]} alt={item.name} className="w-24 h-24 rounded-lg object-cover" />
                    ) : (
                      <div className="w-24 h-24 rounded-lg bg-secondary flex items-center justify-center">
                        <currentTabConfig.icon className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">{item.name}</h3>
                        <span className="text-xs text-muted-foreground">#{item.locationId}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {item.streetAddress}, {item.city}, {item.state} {item.zip}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', statusConfig.color)}>
                          <statusConfig.icon className="w-3 h-3" />
                          {statusConfig.label}
                        </span>
                        <span className="text-muted-foreground">
                          <DollarSign className="w-3 h-3 inline" /> ${item.baseMonthlyRate?.toLocaleString()}/mo
                        </span>
                        <span className="text-muted-foreground">
                          <Users className="w-3 h-3 inline" /> {item.avgDailyFootTraffic?.toLocaleString()} daily traffic
                        </span>
                        {item.monthlyImpressions && (
                          <span className="text-muted-foreground">
                            <BarChart3 className="w-3 h-3 inline" /> {item.monthlyImpressions?.toLocaleString()} impressions/mo
                          </span>
                        )}
                      </div>
                      
                      {/* Linked Devices Section */}
                      {activeTab === 'audio-players' && (
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/50">
                          {(() => {
                            const linkedDevs = getLinkedDevices(item.id);
                            return linkedDevs.length > 0 ? (
                              <>
                                <div className="flex items-center gap-1">
                                  <Speaker className="w-3 h-3 text-green-500" />
                                  <span className="text-xs text-green-500 font-medium">
                                    {linkedDevs.length} device{linkedDevs.length > 1 ? 's' : ''} linked
                                  </span>
                                </div>
                                {linkedDevs.map(dev => (
                                  <span 
                                    key={dev.id}
                                    className={cn(
                                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs',
                                      dev.status === 'online' ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-400'
                                    )}
                                  >
                                    <Wifi className="w-2.5 h-2.5" />
                                    {dev.name}
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleUnlinkDevice(dev.id); }}
                                      className="ml-1 hover:text-red-400"
                                      title="Unlink device"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </span>
                                ))}
                              </>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                <Unlink className="w-3 h-3 inline mr-1" />
                                No devices linked
                              </span>
                            );
                          })()}
                          <button
                            onClick={() => setShowLinkModal(item.id)}
                            className="ml-auto flex items-center gap-1 px-2 py-1 text-xs bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors"
                          >
                            <Link2 className="w-3 h-3" />
                            Link Device
                          </button>
                          <button
                            onClick={() => setShowSiteMap(item.id)}
                            className="flex items-center gap-1 px-2 py-1 text-xs bg-purple-500/20 text-purple-400 rounded hover:bg-purple-500/30 transition-colors"
                          >
                            <Navigation className="w-3 h-3" />
                            Site Map
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/advertising/${item.id}`}
                      className="p-2 hover:bg-secondary rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    </Link>
                    <button
                      onClick={() => {
                        setEditingItem(item);
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
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <AdLocationModal
          item={editingItem}
          type={activeTab}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false);
            setEditingItem(null);
          }}
          onDeviceCreated={fetchDevices}
        />
      )}

      {/* Link Device Modal */}
      {showLinkModal && (
        <LinkDeviceModal
          locationId={showLinkModal}
          location={items.find(i => i.id === showLinkModal)}
          devices={devices}
          linkedDevices={getLinkedDevices(showLinkModal)}
          unlinkedDevices={getUnlinkedDevices()}
          onLink={handleLinkDevice}
          onUnlink={handleUnlinkDevice}
          onClose={() => setShowLinkModal(null)}
          onAddDevice={() => {
            setShowLinkModal(null);
            // Navigate to devices page with pre-filled location
            window.location.href = `/advertising/devices?linkTo=${showLinkModal}`;
          }}
        />
      )}

      {/* Site Map Modal */}
      {showSiteMap && (
        <SiteMapModal
          locationId={showSiteMap}
          location={items.find(i => i.id === showSiteMap)}
          devices={getLinkedDevices(showSiteMap)}
          onClose={() => setShowSiteMap(null)}
          onSavePositions={async (positions) => {
            // Save device positions to their records
            for (const [deviceId, pos] of Object.entries(positions)) {
              await fetch('/api/advertising/devices', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: deviceId, siteMapX: pos.x, siteMapY: pos.y }),
              });
            }
            fetchDevices();
            setShowSiteMap(null);
          }}
        />
      )}
    </div>
  );
}

// Link Device Modal
function LinkDeviceModal({
  locationId,
  location,
  devices,
  linkedDevices,
  unlinkedDevices,
  onLink,
  onUnlink,
  onClose,
  onAddDevice,
}: {
  locationId: string;
  location?: AdLocation;
  devices: LinkedDevice[];
  linkedDevices: LinkedDevice[];
  unlinkedDevices: LinkedDevice[];
  onLink: (deviceId: string, locationId: string, locationName: string, locationAddress: string) => void;
  onUnlink: (deviceId: string) => void;
  onClose: () => void;
  onAddDevice: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Link Devices</h2>
            <p className="text-sm text-muted-foreground">{location?.name}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-4 max-h-[60vh] overflow-auto">
          {/* Currently Linked */}
          {linkedDevices.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                <Link2 className="w-4 h-4 text-green-500" />
                Linked Devices ({linkedDevices.length})
              </h3>
              <div className="space-y-2">
                {linkedDevices.map(device => (
                  <div key={device.id} className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-2 h-2 rounded-full',
                        device.status === 'online' ? 'bg-green-500' : 'bg-gray-500'
                      )} />
                      <div>
                        <p className="font-medium text-foreground">{device.name}</p>
                        <p className="text-xs text-muted-foreground">{device.ipAddress || device.deviceId}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => onUnlink(device.id)}
                      className="px-3 py-1 text-sm text-red-400 hover:bg-red-500/20 rounded transition-colors"
                    >
                      Unlink
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Available to Link */}
          <div>
            <h3 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
              <Wifi className="w-4 h-4 text-blue-500" />
              Available Devices ({unlinkedDevices.length})
            </h3>
            {unlinkedDevices.length > 0 ? (
              <div className="space-y-2">
                {unlinkedDevices.map(device => (
                  <div key={device.id} className="flex items-center justify-between p-3 bg-secondary border border-border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-2 h-2 rounded-full',
                        device.status === 'online' ? 'bg-green-500' : 'bg-gray-500'
                      )} />
                      <div>
                        <p className="font-medium text-foreground">{device.name}</p>
                        <p className="text-xs text-muted-foreground">{device.ipAddress || device.deviceId}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => onLink(
                        device.id, 
                        locationId, 
                        location?.name || '',
                        `${location?.streetAddress || ''}, ${location?.city || ''}, ${location?.state || ''} ${location?.zip || ''}`
                      )}
                      className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                      Link
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Wifi className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No unlinked devices available</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex gap-2 px-6 py-4 border-t border-border">
          <button
            onClick={onAddDevice}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-brand text-brand-foreground rounded-lg hover:bg-brand/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add New Device
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-border rounded-lg text-foreground hover:bg-secondary transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// Site Map Modal for positioning devices
function SiteMapModal({
  locationId,
  location,
  devices,
  onClose,
  onSavePositions,
}: {
  locationId: string;
  location?: AdLocation;
  devices: LinkedDevice[];
  onClose: () => void;
  onSavePositions: (positions: Record<string, { x: number; y: number }>) => void;
}) {
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>(() => {
    const initial: Record<string, { x: number; y: number }> = {};
    devices.forEach((d, i) => {
      // @ts-ignore - custom fields
      initial[d.id] = { x: d.siteMapX ?? 50 + i * 10, y: d.siteMapY ?? 50 };
    });
    return initial;
  });
  const [dragging, setDragging] = useState<string | null>(null);
  const [bgImage, setBgImage] = useState<string | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setPositions(prev => ({ ...prev, [dragging]: { x, y } }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg w-full max-w-4xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Site Map - Device Positions</h2>
            <p className="text-sm text-muted-foreground">{location?.name} • Drag devices to position them</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          {/* Background Upload */}
          <div className="mb-4 flex items-center gap-4">
            <label className="flex items-center gap-2 px-3 py-2 bg-secondary border border-border rounded-lg cursor-pointer hover:bg-secondary/80 transition-colors">
              <Upload className="w-4 h-4" />
              <span className="text-sm">Upload Floor Plan</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => setBgImage(ev.target?.result as string);
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </label>
            {bgImage && (
              <button
                onClick={() => setBgImage(null)}
                className="text-sm text-red-400 hover:text-red-300"
              >
                Remove Image
              </button>
            )}
            <p className="text-xs text-muted-foreground">
              Upload a floor plan, aerial photo, or site diagram to position devices accurately
            </p>
          </div>
          
          {/* Map Area */}
          <div
            className="relative w-full h-[400px] bg-secondary border border-border rounded-lg overflow-hidden cursor-crosshair"
            onMouseMove={handleMouseMove}
            onMouseUp={() => setDragging(null)}
            onMouseLeave={() => setDragging(null)}
            style={{
              backgroundImage: bgImage ? `url(${bgImage})` : undefined,
              backgroundSize: 'contain',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          >
            {!bgImage && (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Map className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Upload a floor plan or drag devices to position them</p>
                </div>
              </div>
            )}
            
            {/* Grid lines */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
              {[...Array(10)].map((_, i) => (
                <div key={`h-${i}`} className="absolute w-full h-px bg-border" style={{ top: `${(i + 1) * 10}%` }} />
              ))}
              {[...Array(10)].map((_, i) => (
                <div key={`v-${i}`} className="absolute h-full w-px bg-border" style={{ left: `${(i + 1) * 10}%` }} />
              ))}
            </div>
            
            {/* Device Markers */}
            {devices.map((device) => (
              <div
                key={device.id}
                className={cn(
                  'absolute transform -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing z-10',
                  dragging === device.id && 'z-20'
                )}
                style={{
                  left: `${positions[device.id]?.x ?? 50}%`,
                  top: `${positions[device.id]?.y ?? 50}%`,
                }}
                onMouseDown={() => setDragging(device.id)}
              >
                <div className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg border-2 transition-all',
                  device.status === 'online' 
                    ? 'bg-green-500 border-green-400 text-white' 
                    : 'bg-gray-600 border-gray-500 text-white',
                  dragging === device.id && 'scale-110 shadow-xl'
                )}>
                  <Speaker className="w-4 h-4" />
                  <span className="text-xs font-medium whitespace-nowrap">{device.name}</span>
                </div>
                {/* Pulse effect for online devices */}
                {device.status === 'online' && (
                  <div className="absolute inset-0 -z-10 rounded-lg bg-green-500 animate-ping opacity-30" />
                )}
              </div>
            ))}
          </div>
          
          {/* Device Legend */}
          <div className="mt-4 flex flex-wrap gap-4">
            {devices.map(device => (
              <div key={device.id} className="flex items-center gap-2 text-sm">
                <div className={cn(
                  'w-3 h-3 rounded-full',
                  device.status === 'online' ? 'bg-green-500' : 'bg-gray-500'
                )} />
                <span className="text-foreground">{device.name}</span>
                <span className="text-muted-foreground text-xs">
                  ({Math.round(positions[device.id]?.x ?? 0)}%, {Math.round(positions[device.id]?.y ?? 0)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex gap-2 px-6 py-4 border-t border-border">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-secondary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSavePositions(positions)}
            className="flex-1 px-4 py-2 bg-brand text-brand-foreground rounded-lg hover:bg-brand/90 transition-colors"
          >
            Save Positions
          </button>
        </div>
      </div>
    </div>
  );
}

// Comprehensive Ad Location Modal
function AdLocationModal({ 
  item, 
  type,
  onSave, 
  onClose,
  onDeviceCreated,
}: { 
  item: AdLocation | null;
  type: TabType;
  onSave: (data: Partial<AdLocation>) => void;
  onClose: () => void;
  onDeviceCreated?: () => void;
}) {
  const [activeSection, setActiveSection] = useState('A');
  const [createDevice, setCreateDevice] = useState(type === 'audio-players' && !item);
  const [deviceData, setDeviceData] = useState({
    name: '',
    ipAddress: '',
    hardwareModel: '',
    volume: 80,
  });
  const [createdDeviceKey, setCreatedDeviceKey] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<AdLocation>>({
    name: item?.name || '',
    locationId: item?.locationId || `LOC-${Date.now().toString(36).toUpperCase()}`,
    type: type,
    streetAddress: item?.streetAddress || '',
    city: item?.city || 'Scottsdale',
    state: item?.state || 'AZ',
    zip: item?.zip || '',
    gpsCoordinates: item?.gpsCoordinates || '',
    district: item?.district || '',
    indoorOutdoor: item?.indoorOutdoor || 'outdoor',
    propertyType: item?.propertyType || '',
    photos: item?.photos || [],
    videoUrl: item?.videoUrl || '',
    publicDescription: item?.publicDescription || '',
    internalNotes: item?.internalNotes || '',
    
    avgDailyFootTraffic: item?.avgDailyFootTraffic || 0,
    weekendTraffic: item?.weekendTraffic || 0,
    vehicleCountPerDay: item?.vehicleCountPerDay || 0,
    avgDwellTime: item?.avgDwellTime || 0,
    peakHours: item?.peakHours || [],
    audienceType: item?.audienceType || [],
    medianHouseholdIncome: item?.medianHouseholdIncome || 0,
    avgAgeRange: item?.avgAgeRange || '',
    genderSplit: item?.genderSplit || '50/50',
    touristVsLocalPercent: item?.touristVsLocalPercent || 50,
    
    // Digital Display
    screenSize: item?.screenSize || '',
    resolution: item?.resolution || '',
    orientation: item?.orientation || 'landscape',
    viewingDistance: item?.viewingDistance || 0,
    visibilityDistance: item?.visibilityDistance || 0,
    loopLength: item?.loopLength || 60,
    spotsPerLoop: item?.spotsPerLoop || 6,
    spotsPerDay: item?.spotsPerDay || 0,
    playsPerDay: item?.playsPerDay || 0,
    operatingHoursStart: item?.operatingHoursStart || '06:00',
    operatingHoursEnd: item?.operatingHoursEnd || '22:00',
    shareOfVoiceOptions: item?.shareOfVoiceOptions || [],
    
    // Audio
    audioCoverageRadius: item?.audioCoverageRadius || 0,
    speakersInstalled: item?.speakersInstalled || 0,
    spotsPerHour: item?.spotsPerHour || 0,
    audioSpotsPerDay: item?.audioSpotsPerDay || 0,
    totalPlayHoursPerDay: item?.totalPlayHoursPerDay || 0,
    adLengthOptions: item?.adLengthOptions || [15, 30, 60],
    estimatedListenersPerDay: item?.estimatedListenersPerDay || 0,
    peakListeningTimes: item?.peakListeningTimes || [],
    
    // Pricing
    baseMonthlyRate: item?.baseMonthlyRate || 0,
    costPerSecond: item?.costPerSecond || 0,
    costPer15s: item?.costPer15s || 0,
    costPer30s: item?.costPer30s || 0,
    costPer60s: item?.costPer60s || 0,
    costPerMinute: item?.costPerMinute || 0,
    cpm: item?.cpm || 0,
    setupFee: item?.setupFee || 0,
    productionFee: item?.productionFee || 0,
    minimumContractTerm: item?.minimumContractTerm || 1,
    seasonalRateAdjustment: item?.seasonalRateAdjustment || 0,
    
    // Availability
    campaignStartDate: item?.campaignStartDate || '',
    campaignEndDate: item?.campaignEndDate || '',
    timeOfDayAvailability: item?.timeOfDayAvailability || ['morning', 'afternoon', 'evening'],
    dailyTimeWindowStart: item?.dailyTimeWindowStart || '06:00',
    dailyTimeWindowEnd: item?.dailyTimeWindowEnd || '22:00',
    blackoutDates: item?.blackoutDates || [],
    reservedDates: item?.reservedDates || [],
    inventorySlotsRemaining: item?.inventorySlotsRemaining || 100,
    status: item?.status || 'available',
  });

  // Auto-calculate fields
  useEffect(() => {
    const playsPerDay = formData.playsPerDay || (formData.spotsPerLoop && formData.loopLength ? 
      Math.floor(86400 / (formData.loopLength || 60)) * (formData.spotsPerLoop || 1) : 0);
    const monthlyPlays = playsPerDay * 30;
    const monthlyImpressions = monthlyPlays * (formData.avgDailyFootTraffic || 0) / 100;
    const costPerPlay = monthlyPlays > 0 ? (formData.baseMonthlyRate || 0) / monthlyPlays : 0;
    const calculatedCpm = monthlyImpressions > 0 ? ((formData.baseMonthlyRate || 0) / monthlyImpressions) * 1000 : 0;
    
    setFormData(prev => ({
      ...prev,
      monthlyPlays,
      monthlyImpressions: Math.round(monthlyImpressions),
      costPerPlay: Math.round(costPerPlay * 100) / 100,
      calculatedCpm: Math.round(calculatedCpm * 100) / 100,
      totalInventoryPerDay: playsPerDay,
      remainingInventoryPercent: 100 - ((100 - (formData.inventorySlotsRemaining || 100))),
    }));
  }, [formData.playsPerDay, formData.spotsPerLoop, formData.loopLength, formData.avgDailyFootTraffic, formData.baseMonthlyRate, formData.inventorySlotsRemaining]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const baseSections = [
    { key: 'A', label: 'Location Overview' },
    { key: 'B', label: 'Traffic & Audience' },
    { key: 'C', label: 'Ad Specifications' },
    { key: 'D', label: 'Pricing' },
    { key: 'E', label: 'Availability' },
    { key: 'F', label: 'Calculations' },
  ];
  
  const sections = type === 'audio-players' && !item
    ? [...baseSections, { key: 'G', label: 'Add Device' }]
    : baseSections;

  const isDigital = type === 'digital-displays';
  const isAudio = type === 'audio-players';

  // Enhanced save that also creates device if needed
  const handleEnhancedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // First save the location
    onSave(formData);
    
    // If creating a device with this location
    if (createDevice && isAudio && deviceData.name) {
      try {
        const res = await fetch('/api/advertising/devices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: deviceData.name || `${formData.name} Player`,
            ipAddress: deviceData.ipAddress,
            hardwareModel: deviceData.hardwareModel,
            volume: deviceData.volume,
            locationName: formData.name,
            locationAddress: `${formData.streetAddress}, ${formData.city}, ${formData.state} ${formData.zip}`,
            region: formData.district || formData.city,
          }),
        });
        const data = await res.json();
        if (data.apiKey) {
          setCreatedDeviceKey(data.apiKey);
          onDeviceCreated?.();
          return; // Don't close modal yet - show API key
        }
      } catch (error) {
        console.error('Error creating device:', error);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            {item ? 'Edit' : 'Add'} Advertising Location
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Tabs */}
        <div className="flex gap-1 px-6 py-2 border-b border-border overflow-x-auto">
          {sections.map((section) => (
            <button
              key={section.key}
              onClick={() => setActiveSection(section.key)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                activeSection === section.key
                  ? 'bg-brand text-brand-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              )}
            >
              {section.key}. {section.label}
            </button>
          ))}
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-6">
          {/* Section A: Location Overview */}
          {activeSection === 'A' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground border-b border-border pb-2">Location Overview</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Location Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Location ID</label>
                  <input
                    type="text"
                    value={formData.locationId}
                    onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Street Address *</label>
                <input
                  type="text"
                  value={formData.streetAddress}
                  onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">ZIP</label>
                  <input
                    type="text"
                    value={formData.zip}
                    onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">District</label>
                  <input
                    type="text"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    placeholder="e.g., Old Town"
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">GPS Coordinates</label>
                  <input
                    type="text"
                    value={formData.gpsCoordinates}
                    onChange={(e) => setFormData({ ...formData, gpsCoordinates: e.target.value })}
                    placeholder="33.4942, -111.9261"
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Indoor/Outdoor</label>
                  <select
                    value={formData.indoorOutdoor}
                    onChange={(e) => setFormData({ ...formData, indoorOutdoor: e.target.value as any })}
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
                  >
                    <option value="indoor">Indoor</option>
                    <option value="outdoor">Outdoor</option>
                    <option value="both">Both</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Property Type</label>
                  <input
                    type="text"
                    value={formData.propertyType}
                    onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                    placeholder="e.g., Shopping Center, Restaurant"
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Video URL</label>
                <input
                  type="url"
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  placeholder="https://youtube.com/..."
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Public Description</label>
                <textarea
                  value={formData.publicDescription}
                  onChange={(e) => setFormData({ ...formData, publicDescription: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg resize-none"
                  placeholder="Description visible to prospective advertisers..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Internal Notes</label>
                <textarea
                  value={formData.internalNotes}
                  onChange={(e) => setFormData({ ...formData, internalNotes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg resize-none"
                  placeholder="Private notes..."
                />
              </div>
            </div>
          )}

          {/* Section B: Traffic & Audience */}
          {activeSection === 'B' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground border-b border-border pb-2">Traffic & Audience Data</h3>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Avg Daily Foot Traffic</label>
                  <input
                    type="number"
                    value={formData.avgDailyFootTraffic}
                    onChange={(e) => setFormData({ ...formData, avgDailyFootTraffic: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Weekend Traffic</label>
                  <input
                    type="number"
                    value={formData.weekendTraffic}
                    onChange={(e) => setFormData({ ...formData, weekendTraffic: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Vehicle Count/Day</label>
                  <input
                    type="number"
                    value={formData.vehicleCountPerDay}
                    onChange={(e) => setFormData({ ...formData, vehicleCountPerDay: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Avg Dwell Time (min)</label>
                  <input
                    type="number"
                    value={formData.avgDwellTime}
                    onChange={(e) => setFormData({ ...formData, avgDwellTime: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Median Household Income</label>
                  <input
                    type="number"
                    value={formData.medianHouseholdIncome}
                    onChange={(e) => setFormData({ ...formData, medianHouseholdIncome: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Tourist vs Local %</label>
                  <input
                    type="number"
                    value={formData.touristVsLocalPercent}
                    onChange={(e) => setFormData({ ...formData, touristVsLocalPercent: parseInt(e.target.value) || 0 })}
                    placeholder="50 = 50% tourist"
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Average Age Range</label>
                  <input
                    type="text"
                    value={formData.avgAgeRange}
                    onChange={(e) => setFormData({ ...formData, avgAgeRange: e.target.value })}
                    placeholder="e.g., 25-54"
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Gender Split</label>
                  <input
                    type="text"
                    value={formData.genderSplit}
                    onChange={(e) => setFormData({ ...formData, genderSplit: e.target.value })}
                    placeholder="e.g., 55/45 F/M"
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Peak Hours (comma separated)</label>
                <input
                  type="text"
                  value={formData.peakHours?.join(', ')}
                  onChange={(e) => setFormData({ ...formData, peakHours: e.target.value.split(',').map(s => s.trim()) })}
                  placeholder="e.g., 11:00-14:00, 17:00-21:00"
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Audience Type (comma separated)</label>
                <input
                  type="text"
                  value={formData.audienceType?.join(', ')}
                  onChange={(e) => setFormData({ ...formData, audienceType: e.target.value.split(',').map(s => s.trim()) })}
                  placeholder="e.g., Families, Young Professionals, Tourists"
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
                />
              </div>
            </div>
          )}

          {/* Section C: Ad Specifications */}
          {activeSection === 'C' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground border-b border-border pb-2">
                {isDigital ? 'Digital Display' : isAudio ? 'Audio Player' : 'Advertising'} Specifications
              </h3>
              
              {isDigital && (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Screen Size</label>
                      <input
                        type="text"
                        value={formData.screenSize}
                        onChange={(e) => setFormData({ ...formData, screenSize: e.target.value })}
                        placeholder="e.g., 55 inch"
                        className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Resolution</label>
                      <input
                        type="text"
                        value={formData.resolution}
                        onChange={(e) => setFormData({ ...formData, resolution: e.target.value })}
                        placeholder="e.g., 1920x1080"
                        className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Orientation</label>
                      <select
                        value={formData.orientation}
                        onChange={(e) => setFormData({ ...formData, orientation: e.target.value as any })}
                        className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
                      >
                        <option value="landscape">Landscape</option>
                        <option value="portrait">Portrait</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Viewing Distance (ft)</label>
                      <input
                        type="number"
                        value={formData.viewingDistance}
                        onChange={(e) => setFormData({ ...formData, viewingDistance: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Visibility Distance (ft)</label>
                      <input
                        type="number"
                        value={formData.visibilityDistance}
                        onChange={(e) => setFormData({ ...formData, visibilityDistance: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Loop Length (sec)</label>
                      <input
                        type="number"
                        value={formData.loopLength}
                        onChange={(e) => setFormData({ ...formData, loopLength: parseInt(e.target.value) || 60 })}
                        className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Spots Per Loop</label>
                      <input
                        type="number"
                        value={formData.spotsPerLoop}
                        onChange={(e) => setFormData({ ...formData, spotsPerLoop: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Spots Per Day</label>
                      <input
                        type="number"
                        value={formData.spotsPerDay}
                        onChange={(e) => setFormData({ ...formData, spotsPerDay: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Plays Per Day</label>
                      <input
                        type="number"
                        value={formData.playsPerDay}
                        onChange={(e) => setFormData({ ...formData, playsPerDay: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Operating Start</label>
                      <TimePicker
                        value={formData.operatingHoursStart || ''}
                        onChange={(value) => setFormData({ ...formData, operatingHoursStart: value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Operating End</label>
                      <TimePicker
                        value={formData.operatingHoursEnd || ''}
                        onChange={(value) => setFormData({ ...formData, operatingHoursEnd: value })}
                      />
                    </div>
                  </div>
                </>
              )}

              {isAudio && (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Coverage Radius (ft)</label>
                      <input
                        type="number"
                        value={formData.audioCoverageRadius}
                        onChange={(e) => setFormData({ ...formData, audioCoverageRadius: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Speakers Installed</label>
                      <input
                        type="number"
                        value={formData.speakersInstalled}
                        onChange={(e) => setFormData({ ...formData, speakersInstalled: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Spots Per Hour</label>
                      <input
                        type="number"
                        value={formData.spotsPerHour}
                        onChange={(e) => setFormData({ ...formData, spotsPerHour: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Spots Per Day</label>
                      <input
                        type="number"
                        value={formData.audioSpotsPerDay}
                        onChange={(e) => setFormData({ ...formData, audioSpotsPerDay: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Play Hours/Day</label>
                      <input
                        type="number"
                        value={formData.totalPlayHoursPerDay}
                        onChange={(e) => setFormData({ ...formData, totalPlayHoursPerDay: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Est. Listeners/Day</label>
                      <input
                        type="number"
                        value={formData.estimatedListenersPerDay}
                        onChange={(e) => setFormData({ ...formData, estimatedListenersPerDay: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Ad Length Options (seconds, comma separated)</label>
                    <input
                      type="text"
                      value={formData.adLengthOptions?.join(', ')}
                      onChange={(e) => setFormData({ ...formData, adLengthOptions: e.target.value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n)) })}
                      placeholder="15, 30, 60"
                      className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Section D: Pricing */}
          {activeSection === 'D' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground border-b border-border pb-2">Pricing Structure</h3>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Base Monthly Rate ($)</label>
                  <input
                    type="number"
                    value={formData.baseMonthlyRate}
                    onChange={(e) => setFormData({ ...formData, baseMonthlyRate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Setup Fee ($)</label>
                  <input
                    type="number"
                    value={formData.setupFee}
                    onChange={(e) => setFormData({ ...formData, setupFee: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Production Fee ($)</label>
                  <input
                    type="number"
                    value={formData.productionFee}
                    onChange={(e) => setFormData({ ...formData, productionFee: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Cost/Second ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.costPerSecond}
                    onChange={(e) => setFormData({ ...formData, costPerSecond: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Cost/15s ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.costPer15s}
                    onChange={(e) => setFormData({ ...formData, costPer15s: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Cost/30s ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.costPer30s}
                    onChange={(e) => setFormData({ ...formData, costPer30s: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Cost/60s ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.costPer60s}
                    onChange={(e) => setFormData({ ...formData, costPer60s: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">CPM ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cpm}
                    onChange={(e) => setFormData({ ...formData, cpm: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Minimum Contract (months)</label>
                  <input
                    type="number"
                    value={formData.minimumContractTerm}
                    onChange={(e) => setFormData({ ...formData, minimumContractTerm: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Seasonal Adjustment (%)</label>
                  <input
                    type="number"
                    value={formData.seasonalRateAdjustment}
                    onChange={(e) => setFormData({ ...formData, seasonalRateAdjustment: parseFloat(e.target.value) || 0 })}
                    placeholder="e.g., 20 for +20%"
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section E: Availability */}
          {activeSection === 'E' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground border-b border-border pb-2">Availability Management</h3>
              
              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-sm text-blue-400">
                  <strong>Fluent Booking Pro Integration:</strong> Use your Digital Displays and Audio Player booking types in Fluent Booking Pro for detailed calendar scheduling.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Campaign Start Date</label>
                  <DatePicker
                    value={formData.campaignStartDate || ''}
                    onChange={(value) => setFormData({ ...formData, campaignStartDate: value })}
                    placeholder="Select start date"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Campaign End Date</label>
                  <DatePicker
                    value={formData.campaignEndDate || ''}
                    onChange={(value) => setFormData({ ...formData, campaignEndDate: value })}
                    placeholder="Select end date"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Daily Window Start</label>
                  <TimePicker
                    value={formData.dailyTimeWindowStart || ''}
                    onChange={(value) => setFormData({ ...formData, dailyTimeWindowStart: value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Daily Window End</label>
                  <TimePicker
                    value={formData.dailyTimeWindowEnd || ''}
                    onChange={(value) => setFormData({ ...formData, dailyTimeWindowEnd: value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Time of Day Availability</label>
                <div className="flex flex-wrap gap-2">
                  {['morning', 'afternoon', 'evening', 'late_night'].map((time) => (
                    <label key={time} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.timeOfDayAvailability?.includes(time)}
                        onChange={(e) => {
                          const current = formData.timeOfDayAvailability || [];
                          setFormData({
                            ...formData,
                            timeOfDayAvailability: e.target.checked
                              ? [...current, time]
                              : current.filter(t => t !== time)
                          });
                        }}
                        className="rounded"
                      />
                      <span className="text-sm capitalize">{time.replace('_', ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Inventory Slots Remaining (%)</label>
                  <input
                    type="number"
                    value={formData.inventorySlotsRemaining}
                    onChange={(e) => setFormData({ ...formData, inventorySlotsRemaining: parseInt(e.target.value) || 0 })}
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
                  >
                    <option value="available">Available</option>
                    <option value="limited">Limited Availability</option>
                    <option value="sold_out">Sold Out</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Blackout Dates (comma separated)</label>
                <input
                  type="text"
                  value={formData.blackoutDates?.join(', ')}
                  onChange={(e) => setFormData({ ...formData, blackoutDates: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  placeholder="2026-12-25, 2026-12-31"
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
                />
              </div>
            </div>
          )}

          {/* Section F: Calculations */}
          {activeSection === 'F' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground border-b border-border pb-2">Auto-Calculated Performance Metrics</h3>
              
              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-sm text-green-400 mb-2">
                  These values are automatically calculated based on the data entered in previous sections.
                </p>
                <p className="text-xs text-muted-foreground">
                  Formulas: Monthly Plays = Plays Per Day × 30 | CPM = (Monthly Rate ÷ Monthly Impressions) × 1,000 | Cost Per Play = Monthly Rate ÷ Monthly Plays
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card border border-border rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Monthly Plays</p>
                  <p className="text-2xl font-bold text-foreground">{formData.monthlyPlays?.toLocaleString() || 0}</p>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Monthly Impressions</p>
                  <p className="text-2xl font-bold text-foreground">{formData.monthlyImpressions?.toLocaleString() || 0}</p>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Cost Per Play</p>
                  <p className="text-2xl font-bold text-foreground">${formData.costPerPlay || 0}</p>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Calculated CPM</p>
                  <p className="text-2xl font-bold text-foreground">${formData.calculatedCpm || 0}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-card border border-border rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Total Inventory Per Day</p>
                  <p className="text-2xl font-bold text-foreground">{formData.totalInventoryPerDay?.toLocaleString() || 0} spots</p>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Remaining Inventory</p>
                  <p className="text-2xl font-bold text-foreground">{formData.remainingInventoryPercent || 100}%</p>
                </div>
              </div>
            </div>
          )}

          {/* Section G: Add Device (Audio Players only, new locations only) */}
          {activeSection === 'G' && isAudio && !item && (
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground border-b border-border pb-2">Add Audio Player Device</h3>
              
              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-sm text-blue-400">
                  Optionally create a device to link to this location. You can also add devices later from the Devices page.
                </p>
              </div>

              <label className="flex items-center gap-3 p-4 bg-secondary rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={createDevice}
                  onChange={(e) => setCreateDevice(e.target.checked)}
                  className="rounded"
                />
                <div>
                  <p className="font-medium text-foreground">Create a device for this location</p>
                  <p className="text-sm text-muted-foreground">Set up an audio player device that will be automatically linked</p>
                </div>
              </label>

              {createDevice && (
                <div className="space-y-4 p-4 border border-border rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Device Name *</label>
                      <input
                        type="text"
                        value={deviceData.name}
                        onChange={(e) => setDeviceData({ ...deviceData, name: e.target.value })}
                        className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
                        placeholder={`${formData.name || 'Location'} Player`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">IP Address / Hostname</label>
                      <input
                        type="text"
                        value={deviceData.ipAddress}
                        onChange={(e) => setDeviceData({ ...deviceData, ipAddress: e.target.value })}
                        className="w-full px-3 py-2 bg-secondary border border-border rounded-lg font-mono"
                        placeholder="100.x.x.x or hostname"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Hardware Model</label>
                      <input
                        type="text"
                        value={deviceData.hardwareModel}
                        onChange={(e) => setDeviceData({ ...deviceData, hardwareModel: e.target.value })}
                        className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
                        placeholder="e.g., Raspberry Pi, Mini PC"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Default Volume (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={deviceData.volume}
                        onChange={(e) => setDeviceData({ ...deviceData, volume: parseInt(e.target.value) || 80 })}
                        className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
                      />
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    After creation, you'll receive an API key to configure on the device. You can also add more devices later.
                  </p>
                </div>
              )}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex gap-2 p-4 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleEnhancedSubmit}
            className="flex-1 px-4 py-2 bg-brand text-brand-foreground rounded-lg hover:bg-brand/90"
          >
            {item ? 'Update Location' : createDevice ? 'Create Location & Device' : 'Create Location'}
          </button>
        </div>
      </div>

      {/* API Key Modal - shown after device creation */}
      {createdDeviceKey && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60]">
          <div className="bg-card border border-border rounded-lg w-full max-w-lg p-6 m-4">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Device Created!</h2>
              <p className="text-muted-foreground mt-1">Save this API key - it will not be shown again</p>
            </div>
            
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4">
              <p className="text-yellow-500 text-sm font-medium text-center">
                ⚠️ Copy this key before closing!
              </p>
            </div>
            
            <div className="relative mb-4">
              <input
                type="text"
                value={createdDeviceKey}
                readOnly
                className="w-full px-3 py-3 bg-secondary border border-border rounded-lg font-mono text-sm pr-20"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(createdDeviceKey);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
              >
                Copy
              </button>
            </div>
            
            <p className="text-sm text-muted-foreground mb-4 text-center">
              Configure your device with this API key to connect to the dashboard.
            </p>
            
            <button
              onClick={() => {
                setCreatedDeviceKey(null);
                onClose();
              }}
              className="w-full px-4 py-2 bg-brand text-brand-foreground rounded-lg hover:bg-brand/90 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
