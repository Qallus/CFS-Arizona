'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  Ticket, 
  Gift, 
  CreditCard,
  ArrowRight,
  Sparkles,
  DollarSign,
  Users,
  TrendingUp,
  Contact,
  QrCode,
  Clock,
  ExternalLink,
} from 'lucide-react';

interface ProductStats {
  punchCards: {
    totalTemplates: number;
    activeCards: number;
    completedCards: number;
    totalPunchesGiven: number;
  };
  scratchCards: {
    totalCampaigns: number;
    totalClaimed: number;
    prizesWon: number;
  };
  giftCards: {
    totalSold: number;
    totalValue: number;
    redeemed: number;
  };
  businessCards: {
    totalCards: number;
    totalScans: number;
    contactsSaved: number;
  };
}

export default function ProductsPage() {
  const [stats, setStats] = useState<ProductStats>({
    punchCards: { totalTemplates: 0, activeCards: 0, completedCards: 0, totalPunchesGiven: 0 },
    scratchCards: { totalCampaigns: 3, totalClaimed: 261, prizesWon: 47 },
    giftCards: { totalSold: 70, totalValue: 3400, redeemed: 23 },
    businessCards: { totalCards: 0, totalScans: 0, contactsSaved: 0 },
  });

  useEffect(() => {
    // Fetch punch card stats
    fetch('/api/products/punch-cards')
      .then(res => res.json())
      .then(data => {
        if (data.stats) {
          setStats(prev => ({
            ...prev,
            punchCards: {
              totalTemplates: data.stats.totalTemplates || 0,
              activeCards: data.stats.activeCards || 0,
              completedCards: data.stats.completedCards || 0,
              totalPunchesGiven: data.stats.totalPunchesGiven || 0,
            }
          }));
        }
      })
      .catch(console.error);
    
    // Fetch business card stats
    fetch('/api/products/business-cards')
      .then(res => res.json())
      .then(data => {
        if (data.stats) {
          setStats(prev => ({
            ...prev,
            businessCards: {
              totalCards: data.stats.total || 0,
              totalScans: data.stats.totalScans || 0,
              contactsSaved: data.stats.totalSaves || 0,
            }
          }));
        }
      })
      .catch(console.error);
    
    // Fetch scratch card stats
    fetch('/api/products/scratch-cards')
      .then(res => res.json())
      .then(data => {
        if (data.stats) {
          setStats(prev => ({
            ...prev,
            scratchCards: {
              totalCampaigns: data.stats.totalCampaigns || 0,
              totalClaimed: data.stats.totalScratches || 0,
              prizesWon: data.stats.totalPrizesWon || 0,
            }
          }));
        }
      })
      .catch(console.error);
  }, []);

  const productSections = [
    {
      title: 'Punch Cards',
      description: 'Digital loyalty and value cards for repeat customers',
      icon: CreditCard,
      color: 'blue',
      href: '/products/punch-cards',
      stats: [
        { label: 'Active Cards', value: stats.punchCards.activeCards },
        { label: 'Completed', value: stats.punchCards.completedCards },
        { label: 'Total Punches', value: stats.punchCards.totalPunchesGiven },
      ],
      badge: `${stats.punchCards.totalTemplates} Programs`,
      ready: true,
    },
    {
      title: 'Digital Scratch Cards',
      description: 'Gamified promotions with scratch-to-reveal prizes',
      icon: Ticket,
      color: 'orange',
      href: '/products/scratch-cards',
      stats: [
        { label: 'Campaigns', value: stats.scratchCards.totalCampaigns },
        { label: 'Scratches', value: stats.scratchCards.totalClaimed },
        { label: 'Prizes Won', value: stats.scratchCards.prizesWon },
      ],
      badge: `${stats.scratchCards.totalCampaigns} Campaigns`,
      ready: true,
    },
    {
      title: 'Gift Cards',
      description: 'Digital gift cards customers can purchase and redeem',
      icon: Gift,
      color: 'green',
      href: '/products/gift-cards',
      stats: [
        { label: 'Sold', value: stats.giftCards.totalSold },
        { label: 'Total Value', value: `$${stats.giftCards.totalValue.toLocaleString()}` },
        { label: 'Redeemed', value: stats.giftCards.redeemed },
      ],
      badge: 'Coming Soon',
      ready: false,
    },
    {
      title: 'Business Cards',
      description: 'Digital vCard business cards with custom QR code shapes',
      icon: Contact,
      color: 'purple',
      href: '/products/business-cards',
      stats: [
        { label: 'Cards', value: stats.businessCards.totalCards },
        { label: 'Scans', value: stats.businessCards.totalScans },
        { label: 'Saved', value: stats.businessCards.contactsSaved },
      ],
      badge: `${stats.businessCards.totalCards} Cards`,
      ready: true,
    },
    {
      title: 'Countdown Timer',
      description: 'Animated countdown timers with embed code and GIF export',
      icon: Clock,
      color: 'pink',
      href: 'https://fund.channelcast.io/products/countdown-timer',
      stats: [
        { label: 'Timers', value: '∞' },
        { label: 'Embed', value: '✓' },
        { label: 'GIF', value: '✓' },
      ],
      badge: 'Live',
      ready: true,
      external: true,
    },
  ];

  const colorClasses = {
    blue: {
      bg: 'bg-blue-500/20',
      text: 'text-blue-500',
      border: 'border-blue-500/30',
      hover: 'hover:border-blue-500/50',
    },
    orange: {
      bg: 'bg-brand/20',
      text: 'text-brand',
      border: 'border-brand/30',
      hover: 'hover:border-brand/50',
    },
    green: {
      bg: 'bg-green-500/20',
      text: 'text-green-500',
      border: 'border-green-500/30',
      hover: 'hover:border-green-500/50',
    },
    purple: {
      bg: 'bg-purple-500/20',
      text: 'text-purple-500',
      border: 'border-purple-500/30',
      hover: 'hover:border-purple-500/50',
    },
    pink: {
      bg: 'bg-pink-500/20',
      text: 'text-pink-500',
      border: 'border-pink-500/30',
      hover: 'hover:border-pink-500/50',
    },
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-brand/20 rounded-lg">
            <Package className="w-6 h-6 text-brand" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Products</h1>
        </div>
        <p className="text-muted-foreground">Manage your digital products, loyalty programs, and promotional campaigns</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-card/50 border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <CreditCard className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Active Cards</p>
                <p className="text-xl font-bold text-foreground">{stats.punchCards.activeCards}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Sparkles className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Completed</p>
                <p className="text-xl font-bold text-foreground">{stats.punchCards.completedCards}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-brand" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Punches</p>
                <p className="text-xl font-bold text-foreground">{stats.punchCards.totalPunchesGiven}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Users className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Programs</p>
                <p className="text-xl font-bold text-foreground">{stats.punchCards.totalTemplates}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Product Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {productSections.map((section) => {
          const colors = colorClasses[section.color as keyof typeof colorClasses];
          const content = (
            <Card 
              className={`bg-card/50 border-border ${section.ready ? `${colors.hover} cursor-pointer` : 'opacity-70'} transition-all h-full`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className={`p-3 ${colors.bg} rounded-lg`}>
                    <section.icon className={`w-6 h-6 ${colors.text}`} />
                  </div>
                  <Badge variant={section.ready ? 'default' : 'secondary'}>
                    {section.badge}
                  </Badge>
                </div>
                <CardTitle className="mt-4">{section.title}</CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  {section.stats.map((stat, i) => (
                    <div key={i} className="text-center">
                      <p className="text-lg font-bold text-foreground">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  ))}
                </div>
                {section.ready && (
                  <Button className="w-full" variant="outline">
                    {(section as any).external ? 'Open' : 'Manage'} {section.title}
                    {(section as any).external ? <ExternalLink className="w-4 h-4 ml-2" /> : <ArrowRight className="w-4 h-4 ml-2" />}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
          
          if (!section.ready) {
            return (
              <div key={section.title}>
                {content}
              </div>
            );
          }
          
          if ((section as any).external) {
            return (
              <a key={section.title} href={section.href} target="_blank" rel="noopener noreferrer">
                {content}
              </a>
            );
          }
          
          return (
            <Link key={section.title} href={section.href}>
              {content}
            </Link>
          );
        })}
      </div>

      {/* Future Products Teaser */}
      <Card className="mt-8 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/20">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-1">More Products Coming Soon</h3>
              <p className="text-muted-foreground text-sm">
                Loyalty programs, digital coupons, membership cards, and more are on the way!
              </p>
            </div>
            <Badge variant="outline" className="border-purple-500/30 text-purple-400">
              In Development
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
