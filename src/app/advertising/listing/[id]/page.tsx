'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { 
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
  Loader2,
  ExternalLink,
  Building2,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
  loopLength?: number;
  spotsPerDay?: number;
  playsPerDay?: number;
  operatingHoursStart?: string;
  operatingHoursEnd?: string;
  audioCoverageRadius?: number;
  speakersInstalled?: number;
  audioSpotsPerDay?: number;
  estimatedListenersPerDay?: number;
  baseMonthlyRate: number;
  costPer15s: number;
  costPer30s: number;
  costPer60s: number;
  cpm: number;
  setupFee: number;
  minimumContractTerm: number;
  inventorySlotsRemaining: number;
  status: string;
  monthlyImpressions?: number;
  calculatedCpm?: number;
}

const TYPE_ICONS: Record<string, any> = {
  'digital-displays': Monitor,
  'audio-players': Volume2,
  'street-furniture': MapPin,
  'web-ads': Globe,
  'events': Calendar,
  'outdoor': TreePine,
  'direct-mail': Mail,
};

const TYPE_LABELS: Record<string, string> = {
  'digital-displays': 'Digital Display',
  'audio-players': 'Audio Player',
  'street-furniture': 'Street Furniture',
  'web-ads': 'Web Ad',
  'events': 'Event',
  'outdoor': 'Outdoor',
  'direct-mail': 'Direct Mail',
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  available: { label: 'Available Now', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  limited: { label: 'Limited Availability', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  sold_out: { label: 'Sold Out', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  maintenance: { label: 'Coming Soon', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
};

export default function PublicListingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [item, setItem] = useState<AdLocation | null>(null);
  const [loading, setLoading] = useState(true);
  
  const id = params?.id as string;
  const isEmbed = searchParams?.get('embed') === 'true';

  useEffect(() => {
    if (id) fetchItem();
  }, [id]);

  const fetchItem = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/advertising/${id}`);
      const data = await res.json();
      setItem(data.item);
    } catch (error) {
      console.error('Error fetching item:', error);
    } finally {
      setLoading(false);
    }
  };

  const TypeIcon = item ? TYPE_ICONS[item.type] || Monitor : Monitor;
  const statusConfig = item ? STATUS_CONFIG[item.status] || STATUS_CONFIG.available : STATUS_CONFIG.available;

  if (loading) {
    return (
      <div className={cn(
        'min-h-screen flex items-center justify-center',
        isEmbed ? 'bg-card' : 'bg-background'
      )}>
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className={cn(
        'min-h-screen flex items-center justify-center',
        isEmbed ? 'bg-card' : 'bg-background'
      )}>
        <div className="text-center">
          <p className="text-muted-foreground">Listing not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      'min-h-screen',
      isEmbed ? 'bg-card p-4' : 'bg-background p-8'
    )}>
      <div className={cn('max-w-4xl mx-auto', isEmbed && 'max-w-none')}>
        {/* Header */}
        <div className={cn(
          'rounded-xl overflow-hidden mb-6',
          isEmbed ? 'border border-border' : ''
        )}>
          {/* Hero Image */}
          {item.photos && item.photos.length > 0 && (
            <div className="relative h-64 bg-secondary">
              <img
                src={item.photos[0]}
                alt={item.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={cn('px-3 py-1 rounded-full text-sm font-medium border', statusConfig.color)}>
                    {statusConfig.label}
                  </span>
                  <span className="px-3 py-1 rounded-full text-sm bg-secondary/80 text-foreground">
                    {TYPE_LABELS[item.type] || item.type}
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-white">{item.name}</h1>
                <p className="text-white/80 text-sm mt-1">
                  {item.city}, {item.state} • {item.district}
                </p>
              </div>
            </div>
          )}
          
          {/* No Image Header */}
          {(!item.photos || item.photos.length === 0) && (
            <div className="p-6 bg-gradient-to-r from-brand/20 to-brand/20 border-b border-border">
              <div className="flex items-center gap-2 mb-2">
                <span className={cn('px-3 py-1 rounded-full text-sm font-medium border', statusConfig.color)}>
                  {statusConfig.label}
                </span>
                <span className="px-3 py-1 rounded-full text-sm bg-secondary text-foreground">
                  {TYPE_LABELS[item.type] || item.type}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-foreground">{item.name}</h1>
              <p className="text-muted-foreground text-sm mt-1">
                {item.city}, {item.state} • {item.district}
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {item.publicDescription && (
              <div className="p-6 bg-card border border-border rounded-xl">
                <h2 className="text-lg font-semibold text-foreground mb-3">About This Location</h2>
                <p className="text-muted-foreground whitespace-pre-wrap">{item.publicDescription}</p>
              </div>
            )}

            {/* Key Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard
                icon={Users}
                label="Daily Traffic"
                value={item.avgDailyFootTraffic?.toLocaleString() || '—'}
              />
              <StatCard
                icon={Clock}
                label="Avg Dwell Time"
                value={item.avgDwellTime ? `${item.avgDwellTime} min` : '—'}
              />
              <StatCard
                icon={BarChart3}
                label="Monthly Impressions"
                value={item.monthlyImpressions?.toLocaleString() || '—'}
              />
              <StatCard
                icon={Target}
                label="Inventory"
                value={`${item.inventorySlotsRemaining || 100}%`}
              />
            </div>

            {/* Audience Info */}
            <div className="p-6 bg-card border border-border rounded-xl">
              <h2 className="text-lg font-semibold text-foreground mb-4">Audience Profile</h2>
              <div className="grid grid-cols-2 gap-4">
                {item.audienceType?.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground">Audience Type</p>
                    <p className="text-foreground font-medium">{item.audienceType.join(', ')}</p>
                  </div>
                )}
                {item.avgAgeRange && (
                  <div>
                    <p className="text-xs text-muted-foreground">Age Range</p>
                    <p className="text-foreground font-medium">{item.avgAgeRange}</p>
                  </div>
                )}
                {item.touristVsLocalPercent > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground">Visitor Mix</p>
                    <p className="text-foreground font-medium">{item.touristVsLocalPercent}% Tourist / {100 - item.touristVsLocalPercent}% Local</p>
                  </div>
                )}
                {item.weekendTraffic > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground">Weekend Traffic</p>
                    <p className="text-foreground font-medium">{item.weekendTraffic.toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Specs */}
            {(item.type === 'digital-displays' || item.type === 'audio-players') && (
              <div className="p-6 bg-card border border-border rounded-xl">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <TypeIcon className="w-5 h-5 text-brand" />
                  {item.type === 'digital-displays' ? 'Display Specs' : 'Audio Specs'}
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  {item.type === 'digital-displays' && (
                    <>
                      {item.screenSize && <InfoItem label="Screen Size" value={item.screenSize} />}
                      {item.resolution && <InfoItem label="Resolution" value={item.resolution} />}
                      {item.orientation && <InfoItem label="Orientation" value={item.orientation} />}
                      {item.loopLength && <InfoItem label="Loop Length" value={`${item.loopLength} seconds`} />}
                      {item.operatingHoursStart && <InfoItem label="Operating Hours" value={`${item.operatingHoursStart} - ${item.operatingHoursEnd}`} />}
                    </>
                  )}
                  {item.type === 'audio-players' && (
                    <>
                      {item.speakersInstalled && <InfoItem label="Speakers" value={item.speakersInstalled.toString()} />}
                      {item.audioCoverageRadius && <InfoItem label="Coverage" value={`${item.audioCoverageRadius} ft radius`} />}
                      {item.estimatedListenersPerDay && <InfoItem label="Est. Listeners/Day" value={item.estimatedListenersPerDay.toLocaleString()} />}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Photo Gallery */}
            {item.photos && item.photos.length > 1 && (
              <div className="p-6 bg-card border border-border rounded-xl">
                <h2 className="text-lg font-semibold text-foreground mb-4">Photos</h2>
                <div className="grid grid-cols-3 gap-3">
                  {item.photos.slice(1).map((photo, idx) => (
                    <div key={idx} className="aspect-video rounded-lg overflow-hidden bg-secondary">
                      <img src={photo} alt={`Photo ${idx + 2}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Pricing */}
          <div>
            <div className="p-6 bg-card border border-border rounded-xl sticky top-8">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-500" />
                Pricing
              </h2>
              
              <div className="text-center p-4 bg-brand/10 border border-brand/30 rounded-lg mb-4">
                <p className="text-xs text-muted-foreground">Starting at</p>
                <p className="text-3xl font-bold text-brand">
                  ${item.baseMonthlyRate?.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">per month</p>
              </div>

              <div className="space-y-2 text-sm mb-4">
                {item.costPer15s > 0 && (
                  <PriceRow label="15-second spot" value={`$${item.costPer15s}`} />
                )}
                {item.costPer30s > 0 && (
                  <PriceRow label="30-second spot" value={`$${item.costPer30s}`} />
                )}
                {item.costPer60s > 0 && (
                  <PriceRow label="60-second spot" value={`$${item.costPer60s}`} />
                )}
                {item.cpm > 0 && (
                  <PriceRow label="CPM" value={`$${item.cpm}`} />
                )}
                {item.setupFee > 0 && (
                  <PriceRow label="Setup Fee" value={`$${item.setupFee}`} />
                )}
                {item.minimumContractTerm > 0 && (
                  <PriceRow label="Min Contract" value={`${item.minimumContractTerm} months`} />
                )}
              </div>

              <a
                href={`mailto:info@channelcast.io?subject=Inquiry: ${item.name}&body=I'm interested in advertising at ${item.name}. Please send me more information.`}
                className="block w-full py-3 px-4 bg-brand hover:bg-brand/90 text-white font-medium rounded-lg text-center transition-colors"
              >
                Request Quote
              </a>
              
              {!isEmbed && (
                <p className="text-xs text-muted-foreground text-center mt-3">
                  Powered by <span className="text-brand">ChannelCast</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="p-4 bg-card border border-border rounded-xl text-center">
      <Icon className="w-5 h-5 text-brand mx-auto mb-2" />
      <p className="text-lg font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-foreground font-medium">{value}</p>
    </div>
  );
}

function PriceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground font-medium">{value}</span>
    </div>
  );
}
