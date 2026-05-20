'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Ticket,
  Plus,
  MoreVertical,
  Play,
  Pause,
  Trash2,
  Eye,
  Copy,
  ExternalLink,
  Gift,
  Users,
  TrendingUp,
  Loader2,
  QrCode,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Campaign {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'paused' | 'ended';
  startDate: string;
  endDate?: string;
  prizes: any[];
  stats: {
    totalScratches: number;
    uniqueUsers: number;
    prizesWon: number;
    prizesClaimed: number;
  };
  createdAt: string;
}

export default function ScratchCardsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalScratches: 0,
    totalPrizesWon: 0,
  });

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const res = await fetch('/api/products/scratch-cards');
      const data = await res.json();
      setCampaigns(data.campaigns || []);
      setStats(data.stats || stats);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await fetch('/api/products/scratch-cards', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      fetchCampaigns();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const deleteCampaign = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;
    
    try {
      await fetch(`/api/products/scratch-cards?id=${id}`, { method: 'DELETE' });
      fetchCampaigns();
    } catch (error) {
      console.error('Error deleting campaign:', error);
    }
  };

  const copyLink = (id: string) => {
    const url = `${window.location.origin}/scratch/${id}`;
    navigator.clipboard.writeText(url);
    alert('Link copied to clipboard!');
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-brand/20 rounded-lg">
              <Ticket className="w-6 h-6 text-brand" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Digital Scratch Cards</h1>
          </div>
          <p className="text-muted-foreground">Create gamified promotions with scratch-to-reveal prizes</p>
        </div>
        <Link href="/products/scratch-cards/new">
          <Button className="bg-brand hover:bg-brand/90">
            <Plus className="w-4 h-4 mr-2" />
            New Campaign
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand/20 rounded-lg">
                <Ticket className="w-5 h-5 text-brand" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Campaigns</p>
                <p className="text-xl font-bold text-foreground">{stats.totalCampaigns}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Play className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Active</p>
                <p className="text-xl font-bold text-foreground">{stats.activeCampaigns}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Scratches</p>
                <p className="text-xl font-bold text-foreground">{stats.totalScratches}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Gift className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Prizes Won</p>
                <p className="text-xl font-bold text-foreground">{stats.totalPrizesWon}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign List */}
      {campaigns.length === 0 ? (
        <Card className="bg-card/50 border-border">
          <CardContent className="p-12 text-center">
            <Ticket className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No campaigns yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first scratch card campaign to engage customers with exciting prizes!
            </p>
            <Link href="/products/scratch-cards/new">
              <Button className="bg-brand hover:bg-brand/90">
                <Plus className="w-4 h-4 mr-2" />
                Create Campaign
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {campaigns.map((campaign) => (
            <Card key={campaign.id} className="bg-card/50 border-border hover:border-brand/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="p-3 bg-brand/20 rounded-lg">
                      <Ticket className="w-6 h-6 text-brand" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">{campaign.name}</h3>
                        {getStatusBadge(campaign.status)}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {campaign.description || 'No description'}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>{campaign.prizes.length} prizes</span>
                        <span>•</span>
                        <span>{campaign.stats.totalScratches} scratches</span>
                        <span>•</span>
                        <span>{campaign.stats.prizesWon} won</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link href={`/scratch/${campaign.id}`} target="_blank">
                      <Button variant="outline" size="sm">
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Preview
                      </Button>
                    </Link>
                    <Link href={`/products/scratch-cards/${campaign.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </Link>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => copyLink(campaign.id)}>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Link
                        </DropdownMenuItem>
                        {campaign.status === 'active' ? (
                          <DropdownMenuItem onClick={() => updateStatus(campaign.id, 'paused')}>
                            <Pause className="w-4 h-4 mr-2" />
                            Pause Campaign
                          </DropdownMenuItem>
                        ) : campaign.status !== 'ended' && (
                          <DropdownMenuItem onClick={() => updateStatus(campaign.id, 'active')}>
                            <Play className="w-4 h-4 mr-2" />
                            Activate Campaign
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          onClick={() => deleteCampaign(campaign.id)}
                          className="text-red-500"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
