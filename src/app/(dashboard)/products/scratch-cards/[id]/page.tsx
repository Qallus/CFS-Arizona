'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Ticket,
  ArrowLeft,
  ExternalLink,
  Copy,
  Play,
  Pause,
  Users,
  Gift,
  TrendingUp,
  Clock,
  Loader2,
  QrCode,
  Check,
  X,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface Prize {
  id: string;
  name: string;
  description: string;
  value: string;
  odds: number;
  quantity: number;
  claimed: number;
  color: string;
}

interface Campaign {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'paused' | 'ended';
  startDate: string;
  endDate?: string;
  scratchesPerUser: number;
  requireEmail: boolean;
  prizes: Prize[];
  terms?: string;
  stats: {
    totalScratches: number;
    uniqueUsers: number;
    prizesWon: number;
    prizesClaimed: number;
  };
  createdAt: string;
}

interface Scratch {
  id: string;
  email?: string;
  prizeName?: string;
  won: boolean;
  claimed: boolean;
  scratchedAt: string;
}

export default function ScratchCardDetailPage() {
  const params = useParams();
  const campaignId = params.id as string;
  
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [scratches, setScratches] = useState<Scratch[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchCampaign();
  }, [campaignId]);

  const fetchCampaign = async () => {
    try {
      const res = await fetch(`/api/products/scratch-cards?id=${campaignId}&includeScratches=true`);
      const data = await res.json();
      setCampaign(data.campaign);
      setScratches(data.scratches || []);
    } catch (error) {
      console.error('Error fetching campaign:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (status: string) => {
    try {
      await fetch('/api/products/scratch-cards', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: campaignId, status }),
      });
      fetchCampaign();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const copyLink = () => {
    const url = `${window.location.origin}/scratch/${campaignId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { label: string; className: string }> = {
      draft: { label: 'Draft', className: 'bg-gray-500/20 text-gray-400' },
      active: { label: 'Active', className: 'bg-green-500/20 text-green-400' },
      paused: { label: 'Paused', className: 'bg-yellow-500/20 text-yellow-400' },
      ended: { label: 'Ended', className: 'bg-red-500/20 text-red-400' },
    };
    const config = configs[status] || configs.draft;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Campaign not found</p>
        <Link href="/products/scratch-cards" className="text-brand hover:underline">
          Back to campaigns
        </Link>
      </div>
    );
  }

  const publicUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/scratch/${campaign.id}`;
  const winRate = campaign.stats.totalScratches > 0 
    ? Math.round((campaign.stats.prizesWon / campaign.stats.totalScratches) * 100)
    : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/products/scratch-cards">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">{campaign.name}</h1>
              {getStatusBadge(campaign.status)}
            </div>
            <p className="text-muted-foreground">{campaign.description || 'No description'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {campaign.status === 'active' ? (
            <Button variant="outline" onClick={() => updateStatus('paused')}>
              <Pause className="w-4 h-4 mr-2" />
              Pause
            </Button>
          ) : campaign.status !== 'ended' && (
            <Button className="bg-green-600 hover:bg-green-700" onClick={() => updateStatus('active')}>
              <Play className="w-4 h-4 mr-2" />
              Activate
            </Button>
          )}
          <Link href={publicUrl} target="_blank">
            <Button variant="outline">
              <ExternalLink className="w-4 h-4 mr-2" />
              Open
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-card/50 border-border">
          <CardContent className="p-4 text-center">
            <Users className="w-6 h-6 mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-bold text-foreground">{campaign.stats.totalScratches}</p>
            <p className="text-xs text-muted-foreground">Total Scratches</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-6 h-6 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold text-foreground">{campaign.stats.uniqueUsers}</p>
            <p className="text-xs text-muted-foreground">Unique Users</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border">
          <CardContent className="p-4 text-center">
            <Gift className="w-6 h-6 mx-auto mb-2 text-purple-500" />
            <p className="text-2xl font-bold text-foreground">{campaign.stats.prizesWon}</p>
            <p className="text-xs text-muted-foreground">Prizes Won</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border">
          <CardContent className="p-4 text-center">
            <Check className="w-6 h-6 mx-auto mb-2 text-brand" />
            <p className="text-2xl font-bold text-foreground">{campaign.stats.prizesClaimed}</p>
            <p className="text-xs text-muted-foreground">Claimed</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border">
          <CardContent className="p-4 text-center">
            <Ticket className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
            <p className="text-2xl font-bold text-foreground">{winRate}%</p>
            <p className="text-xs text-muted-foreground">Win Rate</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Prize Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-card/50 border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-purple-500" />
                Prize Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {campaign.prizes.map((prize) => (
                  <div 
                    key={prize.id}
                    className="flex items-center gap-4 p-3 bg-secondary/30 rounded-lg"
                    style={{ borderLeft: `4px solid ${prize.color}` }}
                  >
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{prize.name}</p>
                      {prize.description && (
                        <p className="text-sm text-muted-foreground">{prize.description}</p>
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-foreground">{prize.odds}%</p>
                      <p className="text-xs text-muted-foreground">Chance</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-foreground">
                        {prize.quantity === -1 ? '∞' : `${prize.claimed}/${prize.quantity}`}
                      </p>
                      <p className="text-xs text-muted-foreground">Claimed</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-card/50 border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {scratches.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No scratches yet. Share your campaign to get started!
                </p>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {scratches.slice(0, 20).map((scratch) => (
                    <div 
                      key={scratch.id}
                      className="flex items-center justify-between p-2 bg-secondary/20 rounded"
                    >
                      <div className="flex items-center gap-3">
                        {scratch.won ? (
                          <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                            <Gift className="w-4 h-4 text-green-500" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-500/20 flex items-center justify-center">
                            <X className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm text-foreground">
                            {scratch.won ? `Won: ${scratch.prizeName}` : 'No prize'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {scratch.email || 'Anonymous'} • {new Date(scratch.scratchedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {scratch.won && (
                        <Badge className={scratch.claimed ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}>
                          {scratch.claimed ? 'Claimed' : 'Pending'}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Share & QR */}
        <div className="space-y-6">
          <Card className="bg-card/50 border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-brand" />
                Share Campaign
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white p-4 rounded-lg flex items-center justify-center">
                <QRCodeSVG
                  value={publicUrl}
                  size={180}
                  level="M"
                  includeMargin={false}
                />
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Campaign URL</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={publicUrl}
                    readOnly
                    className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-lg"
                  />
                  <Button variant="outline" size="icon" onClick={copyLink}>
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border">
            <CardHeader>
              <CardTitle>Campaign Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Scratches per user</span>
                <span className="text-foreground">{campaign.scratchesPerUser}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Require email</span>
                <span className="text-foreground">{campaign.requireEmail ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Start date</span>
                <span className="text-foreground">{new Date(campaign.startDate).toLocaleDateString()}</span>
              </div>
              {campaign.endDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">End date</span>
                  <span className="text-foreground">{new Date(campaign.endDate).toLocaleDateString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span className="text-foreground">{new Date(campaign.createdAt).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
