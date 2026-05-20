'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  Share2,
  Copy,
  MessageSquare,
  Code,
  Loader2,
  Edit,
  Eye,
  Map,
  Building2,
  Ruler,
  Target,
  TrendingUp,
  Percent,
  Image,
  Play,
  Info,
  Send,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface AdLocation {
  id: string;
  name: string;
  locationId: string;
  type: string;
  streetAddress: string;
  city: string;
  state: string;
  zip: string;
  gpsCoordinates: string;
  district: string;
  indoorOutdoor: string;
  propertyType: string;
  photos: string[];
  videoUrl: string;
  publicDescription: string;
  internalNotes: string;
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
  screenSize?: string;
  resolution?: string;
  orientation?: string;
  viewingDistance?: number;
  visibilityDistance?: number;
  loopLength?: number;
  spotsPerLoop?: number;
  spotsPerDay?: number;
  playsPerDay?: number;
  operatingHoursStart?: string;
  operatingHoursEnd?: string;
  shareOfVoiceOptions?: string[];
  audioCoverageRadius?: number;
  speakersInstalled?: number;
  spotsPerHour?: number;
  audioSpotsPerDay?: number;
  totalPlayHoursPerDay?: number;
  adLengthOptions?: number[];
  estimatedListenersPerDay?: number;
  peakListeningTimes?: string[];
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
  campaignStartDate?: string;
  campaignEndDate?: string;
  timeOfDayAvailability: string[];
  dailyTimeWindowStart?: string;
  dailyTimeWindowEnd?: string;
  blackoutDates: string[];
  reservedDates: string[];
  inventorySlotsRemaining: number;
  status: string;
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

const TYPE_ICONS: Record<string, any> = {
  'digital-displays': Monitor,
  'audio-players': Volume2,
  'street-furniture': MapPin,
  'web-ads': Globe,
  'events': Calendar,
  'outdoor': TreePine,
  'direct-mail': Mail,
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  available: { label: 'Available', color: 'bg-green-500/20 text-green-500' },
  limited: { label: 'Limited', color: 'bg-yellow-500/20 text-yellow-500' },
  sold_out: { label: 'Sold Out', color: 'bg-red-500/20 text-red-500' },
  maintenance: { label: 'Maintenance', color: 'bg-gray-500/20 text-gray-500' },
};

export default function AdvertisingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [item, setItem] = useState<AdLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [shareEmail, setShareEmail] = useState('');
  const [sharePhone, setSharePhone] = useState('');
  const [sending, setSending] = useState(false);

  const id = params?.id as string;

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

  const getShareUrl = () => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/advertising/listing/${id}`;
  };

  const getEmbedCode = () => {
    const url = getShareUrl();
    return `<iframe src="${url}?embed=true" width="100%" height="600" frameborder="0" style="border-radius: 12px; border: 1px solid #27272a;"></iframe>`;
  };

  const copyToClipboard = async (text: string, type: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleShareEmail = async () => {
    if (!shareEmail) return;
    setSending(true);
    try {
      // Send email via API
      await fetch('/api/advertising/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'email',
          to: shareEmail,
          listingId: id,
          listingName: item?.name,
          listingUrl: getShareUrl(),
        }),
      });
      setShareEmail('');
      alert('Email sent successfully!');
    } catch (error) {
      console.error('Error sending email:', error);
    } finally {
      setSending(false);
    }
  };

  const handleShareSMS = async () => {
    if (!sharePhone) return;
    setSending(true);
    try {
      await fetch('/api/advertising/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'sms',
          to: sharePhone,
          listingId: id,
          listingName: item?.name,
          listingUrl: getShareUrl(),
        }),
      });
      setSharePhone('');
      alert('SMS sent successfully!');
    } catch (error) {
      console.error('Error sending SMS:', error);
    } finally {
      setSending(false);
    }
  };

  const TypeIcon = item ? TYPE_ICONS[item.type] || Monitor : Monitor;
  const statusConfig = item ? STATUS_CONFIG[item.status] || STATUS_CONFIG.available : STATUS_CONFIG.available;

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Listing not found</p>
          <Link href="/advertising" className="text-brand hover:underline mt-2 inline-block">
            Back to Advertising
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/advertising"
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <TypeIcon className="w-6 h-6 text-brand" />
              <h1 className="text-2xl font-bold text-foreground">{item.name}</h1>
              <span className={cn('px-3 py-1 rounded-full text-sm font-medium', statusConfig.color)}>
                {statusConfig.label}
              </span>
            </div>
            <p className="text-muted-foreground mt-1">
              {item.streetAddress}, {item.city}, {item.state} {item.zip}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowShareModal(true)}>
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Link href={`/advertising/listing/${id}`} target="_blank">
            <Button variant="outline">
              <Eye className="w-4 h-4 mr-2" />
              Public View
            </Button>
          </Link>
          <Link href={`/advertising?edit=${id}`}>
            <Button className="bg-brand hover:bg-brand/90">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      {/* Photos */}
      {item.photos && item.photos.length > 0 && (
        <div className="mb-8">
          <div className="grid grid-cols-4 gap-4">
            {item.photos.slice(0, 4).map((photo, idx) => (
              <div
                key={idx}
                className={cn(
                  'rounded-xl overflow-hidden bg-secondary',
                  idx === 0 && 'col-span-2 row-span-2'
                )}
              >
                <img
                  src={photo}
                  alt={`${item.name} photo ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {item.publicDescription && (
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="w-5 h-5 text-brand" />
                  Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground whitespace-pre-wrap">{item.publicDescription}</p>
              </CardContent>
            </Card>
          )}

          {/* Location Details */}
          <Card className="bg-card/50 border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-brand" />
                Location Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <InfoRow label="Address" value={`${item.streetAddress}, ${item.city}, ${item.state} ${item.zip}`} />
                <InfoRow label="District/Area" value={item.district} />
                <InfoRow label="Property Type" value={item.propertyType} />
                <InfoRow label="Indoor/Outdoor" value={item.indoorOutdoor} />
                {item.gpsCoordinates && <InfoRow label="GPS Coordinates" value={item.gpsCoordinates} />}
                <InfoRow label="Location ID" value={item.locationId} />
              </div>
            </CardContent>
          </Card>

          {/* Traffic & Audience */}
          <Card className="bg-card/50 border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-brand" />
                Traffic & Audience
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <InfoRow label="Avg Daily Foot Traffic" value={item.avgDailyFootTraffic?.toLocaleString()} />
                <InfoRow label="Weekend Traffic" value={item.weekendTraffic?.toLocaleString()} />
                {item.vehicleCountPerDay > 0 && <InfoRow label="Vehicle Count/Day" value={item.vehicleCountPerDay?.toLocaleString()} />}
                <InfoRow label="Avg Dwell Time" value={item.avgDwellTime ? `${item.avgDwellTime} min` : undefined} />
                {item.peakHours && item.peakHours.length > 0 && <InfoRow label="Peak Hours" value={item.peakHours.join(', ')} />}
                {item.audienceType && item.audienceType.length > 0 && <InfoRow label="Audience Type" value={item.audienceType.join(', ')} />}
                {item.medianHouseholdIncome > 0 && <InfoRow label="Median HH Income" value={`$${item.medianHouseholdIncome.toLocaleString()}`} />}
                <InfoRow label="Age Range" value={item.avgAgeRange} />
                <InfoRow label="Gender Split" value={item.genderSplit} />
                {item.touristVsLocalPercent > 0 && <InfoRow label="Tourist vs Local" value={`${item.touristVsLocalPercent}% tourist`} />}
              </div>
            </CardContent>
          </Card>

          {/* Display/Audio Specs */}
          {(item.type === 'digital-displays' || item.type === 'audio-players') && (
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {item.type === 'digital-displays' ? <Monitor className="w-5 h-5 text-brand" /> : <Volume2 className="w-5 h-5 text-brand" />}
                  {item.type === 'digital-displays' ? 'Display Specifications' : 'Audio Specifications'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {item.type === 'digital-displays' && (
                    <>
                      <InfoRow label="Screen Size" value={item.screenSize} />
                      <InfoRow label="Resolution" value={item.resolution} />
                      <InfoRow label="Orientation" value={item.orientation} />
                      {item.viewingDistance && <InfoRow label="Viewing Distance" value={`${item.viewingDistance} ft`} />}
                      {item.visibilityDistance && <InfoRow label="Visibility Distance" value={`${item.visibilityDistance} ft`} />}
                      {item.loopLength && <InfoRow label="Loop Length" value={`${item.loopLength} sec`} />}
                      {item.spotsPerLoop && <InfoRow label="Spots Per Loop" value={item.spotsPerLoop.toString()} />}
                      {item.spotsPerDay && <InfoRow label="Spots Per Day" value={item.spotsPerDay.toLocaleString()} />}
                      {item.playsPerDay && <InfoRow label="Plays Per Day" value={item.playsPerDay.toLocaleString()} />}
                      {item.operatingHoursStart && <InfoRow label="Operating Hours" value={`${item.operatingHoursStart} - ${item.operatingHoursEnd}`} />}
                    </>
                  )}
                  {item.type === 'audio-players' && (
                    <>
                      {item.audioCoverageRadius && <InfoRow label="Coverage Radius" value={`${item.audioCoverageRadius} ft`} />}
                      {item.speakersInstalled && <InfoRow label="Speakers Installed" value={item.speakersInstalled.toString()} />}
                      {item.spotsPerHour && <InfoRow label="Spots Per Hour" value={item.spotsPerHour.toString()} />}
                      {item.audioSpotsPerDay && <InfoRow label="Spots Per Day" value={item.audioSpotsPerDay.toLocaleString()} />}
                      {item.totalPlayHoursPerDay && <InfoRow label="Play Hours/Day" value={`${item.totalPlayHoursPerDay} hrs`} />}
                      {item.adLengthOptions && item.adLengthOptions.length > 0 && <InfoRow label="Ad Length Options" value={item.adLengthOptions.map(l => `${l}s`).join(', ')} />}
                      {item.estimatedListenersPerDay && <InfoRow label="Est. Listeners/Day" value={item.estimatedListenersPerDay.toLocaleString()} />}
                      {item.peakListeningTimes && item.peakListeningTimes.length > 0 && <InfoRow label="Peak Listening" value={item.peakListeningTimes.join(', ')} />}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Availability */}
          <Card className="bg-card/50 border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand" />
                Availability
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {item.campaignStartDate && <InfoRow label="Campaign Start" value={new Date(item.campaignStartDate).toLocaleDateString()} />}
                {item.campaignEndDate && <InfoRow label="Campaign End" value={new Date(item.campaignEndDate).toLocaleDateString()} />}
                {item.dailyTimeWindowStart && <InfoRow label="Daily Window" value={`${item.dailyTimeWindowStart} - ${item.dailyTimeWindowEnd}`} />}
                {item.timeOfDayAvailability && item.timeOfDayAvailability.length > 0 && <InfoRow label="Time of Day" value={item.timeOfDayAvailability.join(', ')} />}
                <InfoRow label="Inventory Remaining" value={`${item.inventorySlotsRemaining}%`} />
                {item.blackoutDates && item.blackoutDates.length > 0 && <InfoRow label="Blackout Dates" value={item.blackoutDates.join(', ')} />}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Pricing */}
        <div className="space-y-6">
          {/* Pricing Card */}
          <Card className="bg-card/50 border-border sticky top-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-500" />
                Pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-4 bg-brand/10 border border-brand/30 rounded-lg">
                <p className="text-sm text-muted-foreground">Starting at</p>
                <p className="text-3xl font-bold text-brand">
                  ${item.baseMonthlyRate?.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">per month</p>
              </div>

              <div className="space-y-2 text-sm">
                {item.costPer15s > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">15-second spot</span>
                    <span className="text-foreground font-medium">${item.costPer15s}</span>
                  </div>
                )}
                {item.costPer30s > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">30-second spot</span>
                    <span className="text-foreground font-medium">${item.costPer30s}</span>
                  </div>
                )}
                {item.costPer60s > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">60-second spot</span>
                    <span className="text-foreground font-medium">${item.costPer60s}</span>
                  </div>
                )}
                {item.cpm > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">CPM</span>
                    <span className="text-foreground font-medium">${item.cpm}</span>
                  </div>
                )}
                {item.setupFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Setup Fee</span>
                    <span className="text-foreground font-medium">${item.setupFee}</span>
                  </div>
                )}
                {item.productionFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Production Fee</span>
                    <span className="text-foreground font-medium">${item.productionFee}</span>
                  </div>
                )}
                {item.minimumContractTerm > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Min Contract</span>
                    <span className="text-foreground font-medium">{item.minimumContractTerm} months</span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-border">
                <Button className="w-full bg-brand hover:bg-brand/90">
                  Request Quote
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Metrics Card */}
          {(item.monthlyImpressions || item.monthlyPlays) && (
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-500" />
                  Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {item.monthlyImpressions && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monthly Impressions</span>
                    <span className="text-foreground font-medium">{item.monthlyImpressions.toLocaleString()}</span>
                  </div>
                )}
                {item.monthlyPlays && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monthly Plays</span>
                    <span className="text-foreground font-medium">{item.monthlyPlays.toLocaleString()}</span>
                  </div>
                )}
                {item.calculatedCpm && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Effective CPM</span>
                    <span className="text-foreground font-medium">${item.calculatedCpm.toFixed(2)}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">Share Listing</h2>
              <button onClick={() => setShowShareModal(false)} className="p-2 hover:bg-secondary rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Copy Link */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Direct Link</label>
                <div className="flex gap-2">
                  <Input
                    value={getShareUrl()}
                    readOnly
                    className="bg-secondary border-border"
                  />
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(getShareUrl(), 'link')}
                  >
                    {copied === 'link' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* Email Share */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Share via Email</label>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    value={shareEmail}
                    onChange={(e) => setShareEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="bg-secondary border-border"
                  />
                  <Button
                    variant="outline"
                    onClick={handleShareEmail}
                    disabled={!shareEmail || sending}
                  >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* SMS Share */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Share via SMS</label>
                <div className="flex gap-2">
                  <Input
                    type="tel"
                    value={sharePhone}
                    onChange={(e) => setSharePhone(e.target.value)}
                    placeholder="+1 (480) 555-1234"
                    className="bg-secondary border-border"
                  />
                  <Button
                    variant="outline"
                    onClick={handleShareSMS}
                    disabled={!sharePhone || sending}
                  >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* Embed Code */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Embed Code</label>
                <div className="relative">
                  <textarea
                    value={getEmbedCode()}
                    readOnly
                    rows={3}
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground text-sm font-mono resize-none"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(getEmbedCode(), 'embed')}
                  >
                    {copied === 'embed' ? <CheckCircle className="w-3 h-3 text-green-500" /> : <Code className="w-3 h-3" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Copy and paste this code to embed the listing on your website</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | number }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-foreground font-medium">{value}</p>
    </div>
  );
}
