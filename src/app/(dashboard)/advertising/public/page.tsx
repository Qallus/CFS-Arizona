'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft,
  Monitor,
  Volume2,
  MapPin,
  Globe,
  Calendar,
  TreePine,
  Mail,
  DollarSign,
  Users,
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle,
  X,
  ExternalLink,
  Filter,
  Search,
  Map,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type TabType = 'all' | 'digital-displays' | 'audio-players' | 'street-furniture' | 'outdoor';

interface AdLocation {
  id: string;
  name: string;
  locationId: string;
  type: string;
  streetAddress: string;
  city: string;
  state: string;
  zip: string;
  district: string;
  indoorOutdoor: string;
  propertyType: string;
  photos: string[];
  publicDescription: string;
  avgDailyFootTraffic: number;
  weekendTraffic: number;
  avgDwellTime: number;
  audienceType: string[];
  avgAgeRange: string;
  touristVsLocalPercent: number;
  screenSize?: string;
  resolution?: string;
  orientation?: string;
  operatingHoursStart?: string;
  operatingHoursEnd?: string;
  baseMonthlyRate: number;
  costPer15s: number;
  costPer30s: number;
  setupFee: number;
  minimumContractTerm: number;
  monthlyImpressions: number;
  calculatedCpm: number;
  status: 'available' | 'limited' | 'sold_out' | 'maintenance';
  inventorySlotsRemaining: number;
}

const TABS: { key: TabType; label: string; icon: any }[] = [
  { key: 'all', label: 'All Locations', icon: MapPin },
  { key: 'digital-displays', label: 'Digital Displays', icon: Monitor },
  { key: 'audio-players', label: 'Audio', icon: Volume2 },
  { key: 'street-furniture', label: 'Street Furniture', icon: MapPin },
  { key: 'outdoor', label: 'Outdoor', icon: TreePine },
];

const STATUS_CONFIG = {
  available: { label: 'Available', color: 'bg-green-500/20 text-green-500 border-green-500/30' },
  limited: { label: 'Limited', color: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30' },
  sold_out: { label: 'Sold Out', color: 'bg-red-500/20 text-red-500 border-red-500/30' },
  maintenance: { label: 'Unavailable', color: 'bg-gray-500/20 text-gray-500 border-gray-500/30' },
};

const TYPE_ICONS: Record<string, any> = {
  'digital-displays': Monitor,
  'audio-players': Volume2,
  'street-furniture': MapPin,
  'outdoor': TreePine,
  'web-ads': Globe,
  'events': Calendar,
  'direct-mail': Mail,
};

export default function PublicAdvertisingPage() {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [items, setItems] = useState<AdLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<AdLocation | null>(null);
  const [priceFilter, setPriceFilter] = useState<'all' | 'under1000' | 'under5000' | 'premium'>('all');

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/advertising?public=true');
      const data = await res.json();
      setItems(data.items || []);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item => {
    // Type filter
    if (activeTab !== 'all' && item.type !== activeTab) return false;
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!item.name.toLowerCase().includes(query) && 
          !item.district?.toLowerCase().includes(query) &&
          !item.city?.toLowerCase().includes(query)) {
        return false;
      }
    }
    
    // Price filter
    if (priceFilter === 'under1000' && item.baseMonthlyRate > 1000) return false;
    if (priceFilter === 'under5000' && (item.baseMonthlyRate > 5000 || item.baseMonthlyRate <= 1000)) return false;
    if (priceFilter === 'premium' && item.baseMonthlyRate <= 5000) return false;
    
    return true;
  });

  const availableCount = filteredItems.filter(i => i.status === 'available').length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand to-brand/90 text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <Link 
            href="/advertising"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Admin
          </Link>
          <h1 className="text-4xl font-bold mb-2">Advertising Opportunities</h1>
          <p className="text-xl text-white/90 mb-6">
            Premium advertising locations in Scottsdale's most vibrant districts
          </p>
          <div className="flex items-center gap-6 text-white/80">
            <span className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              {items.length} Locations
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              {availableCount} Available Now
            </span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Type Tabs */}
            <div className="flex gap-1 p-1 bg-secondary rounded-lg">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                    activeTab === tab.key
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded-lg text-sm"
              />
            </div>

            {/* Price Filter */}
            <select
              value={priceFilter}
              onChange={(e) => setPriceFilter(e.target.value as any)}
              className="px-3 py-2 bg-secondary border border-border rounded-lg text-sm"
            >
              <option value="all">All Prices</option>
              <option value="under1000">Under $1,000/mo</option>
              <option value="under5000">$1,000 - $5,000/mo</option>
              <option value="premium">Premium ($5,000+)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20">
            <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Locations Found</h3>
            <p className="text-muted-foreground">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => {
              const statusConfig = STATUS_CONFIG[item.status];
              const TypeIcon = TYPE_ICONS[item.type] || MapPin;
              
              return (
                <div 
                  key={item.id} 
                  className="bg-card border border-border rounded-xl overflow-hidden hover:border-brand/50 transition-all cursor-pointer group"
                  onClick={() => setSelectedItem(item)}
                >
                  {/* Image */}
                  <div className="relative aspect-video bg-secondary">
                    {item.photos?.[0] ? (
                      <img 
                        src={item.photos[0]} 
                        alt={item.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <TypeIcon className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                    {/* Status Badge */}
                    <div className={cn(
                      'absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium border',
                      statusConfig.color
                    )}>
                      {statusConfig.label}
                    </div>
                    {/* Type Badge */}
                    <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 text-white rounded-full text-xs font-medium flex items-center gap-1">
                      <TypeIcon className="w-3 h-3" />
                      {item.type.replace('-', ' ')}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-semibold text-foreground mb-1 group-hover:text-brand transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {item.district ? `${item.district}, ` : ''}{item.city}, {item.state}
                    </p>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Users className="w-3 h-3" />
                        {item.avgDailyFootTraffic?.toLocaleString() || 0}/day
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <BarChart3 className="w-3 h-3" />
                        {item.monthlyImpressions?.toLocaleString() || 0} imp/mo
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {item.avgDwellTime || 0} min dwell
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <DollarSign className="w-3 h-3" />
                        ${item.calculatedCpm || 0} CPM
                      </div>
                    </div>

                    {/* Price */}
                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <div>
                        <p className="text-2xl font-bold text-foreground">
                          ${item.baseMonthlyRate?.toLocaleString() || 0}
                        </p>
                        <p className="text-xs text-muted-foreground">per month</p>
                      </div>
                      <button className="px-4 py-2 bg-brand text-brand-foreground rounded-lg text-sm font-medium hover:bg-brand/90 transition-colors">
                        Learn More
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedItem && (
        <LocationDetailModal 
          item={selectedItem} 
          onClose={() => setSelectedItem(null)} 
        />
      )}
    </div>
  );
}

function LocationDetailModal({ item, onClose }: { item: AdLocation; onClose: () => void }) {
  const statusConfig = STATUS_CONFIG[item.status];
  const TypeIcon = TYPE_ICONS[item.type] || MapPin;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-3xl max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TypeIcon className="w-6 h-6 text-brand" />
            <div>
              <h2 className="text-xl font-bold text-foreground">{item.name}</h2>
              <p className="text-sm text-muted-foreground">
                {item.district ? `${item.district}, ` : ''}{item.city}, {item.state} • ID: {item.locationId}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Image Gallery */}
          {item.photos?.length > 0 && (
            <div className="aspect-video rounded-lg overflow-hidden bg-secondary">
              <img src={item.photos[0]} alt={item.name} className="w-full h-full object-cover" />
            </div>
          )}

          {/* Status & Availability */}
          <div className="flex items-center gap-4">
            <span className={cn('px-3 py-1 rounded-full text-sm font-medium border', statusConfig.color)}>
              {statusConfig.label}
            </span>
            <span className="text-sm text-muted-foreground">
              {item.inventorySlotsRemaining}% inventory available
            </span>
          </div>

          {/* Description */}
          {item.publicDescription && (
            <div>
              <h3 className="font-semibold text-foreground mb-2">About This Location</h3>
              <p className="text-muted-foreground">{item.publicDescription}</p>
            </div>
          )}

          {/* Specs Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Location Details */}
            <div className="bg-secondary/50 rounded-lg p-4">
              <h4 className="font-semibold text-foreground mb-3">Location Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Address</span>
                  <span className="text-foreground">{item.streetAddress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Environment</span>
                  <span className="text-foreground capitalize">{item.indoorOutdoor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Property Type</span>
                  <span className="text-foreground">{item.propertyType || 'N/A'}</span>
                </div>
                {item.screenSize && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Screen Size</span>
                    <span className="text-foreground">{item.screenSize}</span>
                  </div>
                )}
                {item.resolution && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Resolution</span>
                    <span className="text-foreground">{item.resolution}</span>
                  </div>
                )}
                {item.operatingHoursStart && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Operating Hours</span>
                    <span className="text-foreground">{item.operatingHoursStart} - {item.operatingHoursEnd}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Audience */}
            <div className="bg-secondary/50 rounded-lg p-4">
              <h4 className="font-semibold text-foreground mb-3">Audience</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Daily Traffic</span>
                  <span className="text-foreground">{item.avgDailyFootTraffic?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Weekend Traffic</span>
                  <span className="text-foreground">{item.weekendTraffic?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg Dwell Time</span>
                  <span className="text-foreground">{item.avgDwellTime} minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Age Range</span>
                  <span className="text-foreground">{item.avgAgeRange || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tourist/Local</span>
                  <span className="text-foreground">{item.touristVsLocalPercent}% / {100 - item.touristVsLocalPercent}%</span>
                </div>
                {item.audienceType?.length > 0 && (
                  <div className="pt-2">
                    <span className="text-muted-foreground block mb-1">Audience Types</span>
                    <div className="flex flex-wrap gap-1">
                      {item.audienceType.map((type, i) => (
                        <span key={i} className="px-2 py-0.5 bg-secondary rounded text-xs">{type}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-brand/10 border border-brand/30 rounded-lg p-4">
            <h4 className="font-semibold text-foreground mb-3">Pricing</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-2xl font-bold text-brand">${item.baseMonthlyRate?.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Monthly Rate</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">${item.costPer15s}</p>
                <p className="text-xs text-muted-foreground">Per 15 Seconds</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">${item.costPer30s}</p>
                <p className="text-xs text-muted-foreground">Per 30 Seconds</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">${item.calculatedCpm}</p>
                <p className="text-xs text-muted-foreground">CPM</p>
              </div>
            </div>
            <div className="flex gap-4 mt-4 pt-4 border-t border-brand/30 text-sm">
              <span className="text-muted-foreground">Setup Fee: <strong className="text-foreground">${item.setupFee || 0}</strong></span>
              <span className="text-muted-foreground">Min Term: <strong className="text-foreground">{item.minimumContractTerm || 1} month(s)</strong></span>
            </div>
          </div>

          {/* Performance */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-secondary rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{item.monthlyImpressions?.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Monthly Impressions</p>
            </div>
            <div className="bg-secondary rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{(item.avgDailyFootTraffic * 30)?.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Monthly Reach</p>
            </div>
            <div className="bg-secondary rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{item.inventorySlotsRemaining}%</p>
              <p className="text-xs text-muted-foreground">Available</p>
            </div>
          </div>

          {/* CTA */}
          <div className="flex gap-3">
            <button className="flex-1 px-6 py-3 bg-brand text-brand-foreground rounded-lg font-medium hover:bg-brand/90 transition-colors">
              Request Quote
            </button>
            <button className="px-6 py-3 bg-secondary text-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors">
              Download Media Kit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
