'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  CreditCard,
  ArrowLeft,
  Gift,
  DollarSign,
  Save,
  Eye,
  Palette,
  Settings,
  Building,
  Check,
  X,
  Send,
  QrCode,
  ExternalLink,
  Copy,
  Users,
  TrendingUp,
  Sparkles,
  Search,
  Scan,
} from 'lucide-react';
import QRCode from 'qrcode';
import dynamic from 'next/dynamic';

const QRScanner = dynamic(() => import('@/components/QRScanner'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
    </div>
  ),
});

interface PunchCardTemplate {
  id: string;
  name: string;
  type: 'value' | 'loyalty';
  totalPunches: number;
  valuePerPunch: string | null;
  price: number | null;
  reward: string | null;
  styling: {
    title: string;
    backgroundColor: string;
    textColor: string;
    backgroundImage: string | null;
    logo: string | null;
  };
  restrictions: {
    expirationDays: number;
    terms: string;
  };
  contactInfo: {
    business: string;
    phone: string;
    email: string;
    address: string;
  };
  status: 'active' | 'draft' | 'archived';
  createdAt: string;
  stats?: {
    totalCards: number;
    activeCards: number;
    completedCards: number;
    expiredCards: number;
    totalPunchesGiven: number;
  };
}

interface CustomerCard {
  id: string;
  templateId: string;
  uniqueCode: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  punchesRemaining: number;
  punchesUsed: number;
  status: 'active' | 'completed' | 'expired';
  issuedAt: string;
  expiresAt: string | null;
}

export default function PunchCardDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [template, setTemplate] = useState<PunchCardTemplate | null>(null);
  const [cards, setCards] = useState<CustomerCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [redeemModalOpen, setRedeemModalOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [redeemTab, setRedeemTab] = useState<'scan' | 'manual'>('manual');
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    type: 'loyalty' as 'value' | 'loyalty',
    totalPunches: 10,
    valuePerPunch: '',
    price: '',
    reward: '',
    title: '',
    backgroundColor: '#1e40af',
    textColor: '#ffffff',
    backgroundImage: '',
    gradientOverlay: true,
    gradientFrom: 'rgba(0,0,0,0.7)',
    gradientTo: 'rgba(0,0,0,0.3)',
    gradientDirection: 'to bottom',
    logo: '',
    expirationDays: 365,
    terms: '',
    business: '',
    phone: '',
    email: '',
    address: '',
  });
  
  const [issueFormData, setIssueFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
  });
  
  const [redeemFormData, setRedeemFormData] = useState({
    uniqueCode: '',
    punches: 1,
    note: '',
  });
  
  const [issuedCard, setIssuedCard] = useState<{ card: CustomerCard; cardUrl: string; qrCode: string } | null>(null);
  const [redeemResult, setRedeemResult] = useState<{ success: boolean; message: string; card?: CustomerCard } | null>(null);
  const [selectedCardQR, setSelectedCardQR] = useState<{ card: CustomerCard; cardUrl: string; qrCode: string } | null>(null);

  const fetchTemplate = useCallback(async () => {
    try {
      const res = await fetch(`/api/products/punch-cards/${id}`);
      if (!res.ok) {
        router.push('/products/punch-cards');
        return;
      }
      const data = await res.json();
      setTemplate(data.template);
      
      // Populate form
      const t = data.template;
      setFormData({
        name: t.name,
        type: t.type,
        totalPunches: t.totalPunches,
        valuePerPunch: t.valuePerPunch || '',
        price: t.price?.toString() || '',
        reward: t.reward || '',
        title: t.styling.title,
        backgroundColor: t.styling.backgroundColor,
        textColor: t.styling.textColor,
        backgroundImage: t.styling.backgroundImage || '',
        gradientOverlay: t.styling.gradientOverlay ?? true,
        gradientFrom: t.styling.gradientFrom || 'rgba(0,0,0,0.7)',
        gradientTo: t.styling.gradientTo || 'rgba(0,0,0,0.3)',
        gradientDirection: t.styling.gradientDirection || 'to bottom',
        logo: t.styling.logo || '',
        expirationDays: t.restrictions.expirationDays,
        terms: t.restrictions.terms,
        business: t.contactInfo.business,
        phone: t.contactInfo.phone,
        email: t.contactInfo.email,
        address: t.contactInfo.address,
      });
    } catch (err) {
      console.error('Failed to fetch template:', err);
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  const fetchCards = useCallback(async () => {
    try {
      const res = await fetch(`/api/products/punch-cards/${id}/cards`);
      const data = await res.json();
      setCards(data.cards || []);
    } catch (err) {
      console.error('Failed to fetch cards:', err);
    }
  }, [id]);

  useEffect(() => {
    fetchTemplate();
    fetchCards();
  }, [fetchTemplate, fetchCards]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/products/punch-cards', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          name: formData.name,
          type: formData.type,
          totalPunches: formData.totalPunches,
          valuePerPunch: formData.type === 'value' ? formData.valuePerPunch : null,
          price: formData.type === 'value' ? parseFloat(formData.price) || null : null,
          reward: formData.type === 'loyalty' ? formData.reward : null,
          styling: {
            title: formData.title || formData.name,
            backgroundColor: formData.backgroundColor,
            textColor: formData.textColor,
            backgroundImage: formData.backgroundImage || null,
            gradientOverlay: formData.gradientOverlay,
            gradientFrom: formData.gradientFrom,
            gradientTo: formData.gradientTo,
            gradientDirection: formData.gradientDirection,
            logo: formData.logo || null,
          },
          restrictions: {
            expirationDays: formData.expirationDays,
            terms: formData.terms,
          },
          contactInfo: {
            business: formData.business,
            phone: formData.phone,
            email: formData.email,
            address: formData.address,
          },
        }),
      });
      
      if (res.ok) {
        fetchTemplate();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save changes');
      }
    } catch (err) {
      console.error('Failed to save template:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleIssueCard = async () => {
    try {
      const res = await fetch(`/api/products/punch-cards/${id}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(issueFormData),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        const qrCode = await QRCode.toDataURL(data.cardUrl, { width: 200 });
        setIssuedCard({
          card: data.card,
          cardUrl: data.cardUrl,
          qrCode,
        });
        fetchTemplate();
        fetchCards();
      } else {
        alert(data.error || 'Failed to issue card');
      }
    } catch (err) {
      console.error('Failed to issue card:', err);
    }
  };

  const handleRedeem = async () => {
    try {
      const res = await fetch('/api/products/punch-cards/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uniqueCode: redeemFormData.uniqueCode.toUpperCase().trim(),
          punches: redeemFormData.punches,
          note: redeemFormData.note,
        }),
      });
      
      const data = await res.json();
      
      setRedeemResult({
        success: res.ok,
        message: data.message || data.error || 'Unknown error',
        card: data.card,
      });
      
      if (res.ok) {
        fetchTemplate();
        fetchCards();
      }
    } catch (err) {
      console.error('Failed to redeem:', err);
      setRedeemResult({ success: false, message: 'Network error' });
    }
  };

  const showCardQR = async (card: CustomerCard) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const cardUrl = `${baseUrl}/card/${card.uniqueCode}`;
    const qrCode = await QRCode.toDataURL(cardUrl, { width: 200 });
    setSelectedCardQR({ card, cardUrl, qrCode });
    setQrModalOpen(true);
  };

  const filteredCards = cards.filter((c) =>
    c.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.uniqueCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!template) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/products/punch-cards" className="text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-foreground">{template.name}</h1>
                <p className="text-sm text-muted-foreground">
                  {template.type === 'loyalty' ? 'Loyalty Card' : 'Value Card'} • {template.totalPunches} punches
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => {
                setIssueFormData({ customerName: '', customerEmail: '', customerPhone: '' });
                setIssuedCard(null);
                setIssueModalOpen(true);
              }}>
                <Send className="w-4 h-4 mr-2" />
                Issue Card
              </Button>
              <Button variant="outline" onClick={() => {
                setRedeemFormData({ uniqueCode: '', punches: 1, note: '' });
                setRedeemResult(null);
                setRedeemModalOpen(true);
              }}>
                <Scan className="w-4 h-4 mr-2" />
                Redeem
              </Button>
              <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-card/50 border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Active Cards</p>
                  <p className="text-xl font-bold text-foreground">{template.stats?.activeCards || 0}</p>
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
                  <p className="text-xl font-bold text-foreground">{template.stats?.completedCards || 0}</p>
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
                  <p className="text-xl font-bold text-foreground">{template.stats?.totalPunchesGiven || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <CreditCard className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Issued</p>
                  <p className="text-xl font-bold text-foreground">{template.stats?.totalCards || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="customers">Customers ({cards.length})</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Edit Form */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="bg-card/50 border-border">
                  <CardHeader>
                    <CardTitle>Card Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Card Name</Label>
                        <Input
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Total Punches</Label>
                        <Input
                          type="number"
                          value={formData.totalPunches}
                          onChange={(e) => setFormData({ ...formData, totalPunches: parseInt(e.target.value) || 10 })}
                        />
                      </div>
                    </div>
                    
                    {formData.type === 'value' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Value Per Punch</Label>
                          <Input
                            value={formData.valuePerPunch}
                            onChange={(e) => setFormData({ ...formData, valuePerPunch: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Card Price ($)</Label>
                          <Input
                            type="number"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label>Reward</Label>
                        <Input
                          value={formData.reward}
                          onChange={(e) => setFormData({ ...formData, reward: e.target.value })}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-card/50 border-border">
                  <CardHeader>
                    <CardTitle>Appearance</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Display Title</Label>
                        <Input
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Logo URL</Label>
                        <Input
                          value={formData.logo}
                          onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Background Color</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={formData.backgroundColor}
                            onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                            className="w-16 h-10 p-1"
                          />
                          <Input
                            value={formData.backgroundColor}
                            onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                            className="flex-1 font-mono"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Text Color</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={formData.textColor}
                            onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                            className="w-16 h-10 p-1"
                          />
                          <Input
                            value={formData.textColor}
                            onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                            className="flex-1 font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Preview */}
              <div className="lg:col-span-1">
                <div className="sticky top-24">
                  <Card className="bg-card/50 border-border">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        Preview
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div
                        className="rounded-xl p-6 text-center shadow-lg"
                        style={{
                          backgroundColor: formData.backgroundColor,
                          color: formData.textColor,
                        }}
                      >
                        {formData.logo && (
                          <img 
                            src={formData.logo} 
                            alt="Logo" 
                            className="w-16 h-16 mx-auto mb-3 rounded-lg object-contain"
                          />
                        )}
                        <p className="text-xl font-bold mb-1">
                          {formData.title || formData.name}
                        </p>
                        <p className="text-sm opacity-80 mb-4">
                          {formData.totalPunches} punches
                        </p>
                        <div className="flex flex-wrap justify-center gap-2">
                          {Array.from({ length: Math.min(formData.totalPunches, 10) }).map((_, i) => (
                            <div
                              key={i}
                              className="w-8 h-8 rounded-full border-2"
                              style={{ borderColor: 'currentColor' }}
                            />
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Customers Tab */}
          <TabsContent value="customers">
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle>Customer Cards</CardTitle>
                    <CardDescription>All cards issued for this program</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search customers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                    <Button onClick={() => {
                      setIssueFormData({ customerName: '', customerEmail: '', customerPhone: '' });
                      setIssuedCard(null);
                      setIssueModalOpen(true);
                    }}>
                      <Send className="w-4 h-4 mr-2" />
                      Issue Card
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredCards.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No customer cards yet</p>
                    <p className="text-sm">Issue your first card to get started</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredCards.map((card) => (
                      <div
                        key={card.id}
                        className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-secondary/50 rounded-lg gap-4"
                      >
                        <div>
                          <p className="font-medium">{card.customerName}</p>
                          <p className="text-sm text-muted-foreground font-mono">{card.uniqueCode}</p>
                          {card.customerEmail && (
                            <p className="text-xs text-muted-foreground">{card.customerEmail}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {card.punchesUsed}/{template.totalPunches} used
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {card.punchesRemaining} remaining
                            </p>
                          </div>
                          <Badge
                            variant={
                              card.status === 'active' ? 'default' :
                              card.status === 'completed' ? 'secondary' : 'destructive'
                            }
                          >
                            {card.status}
                          </Badge>
                          <Button variant="ghost" size="icon" onClick={() => showCardQR(card)}>
                            <QrCode className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => window.open(`/card/${card.uniqueCode}?preview=true`, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-card/50 border-border">
                <CardHeader>
                  <CardTitle>Expiration & Terms</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Expiration (days)</Label>
                    <Input
                      type="number"
                      value={formData.expirationDays}
                      onChange={(e) => setFormData({ ...formData, expirationDays: parseInt(e.target.value) || 0 })}
                    />
                    <p className="text-xs text-muted-foreground">0 = never expires</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Terms & Conditions</Label>
                    <Textarea
                      value={formData.terms}
                      onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border">
                <CardHeader>
                  <CardTitle>Business Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Business Name</Label>
                      <Input
                        value={formData.business}
                        onChange={(e) => setFormData({ ...formData, business: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Address</Label>
                      <Input
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Issue Card Modal */}
      <Dialog open={issueModalOpen} onOpenChange={setIssueModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Issue New Card</DialogTitle>
            <DialogDescription>
              Issue a {template.name} card to a customer
            </DialogDescription>
          </DialogHeader>

          {issuedCard ? (
            <div className="py-4 text-center space-y-4">
              <div className="bg-green-500/10 text-green-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                <Check className="w-8 h-8" />
              </div>
              <div>
                <p className="font-medium">Card Issued Successfully!</p>
                <p className="text-sm text-muted-foreground">Code: {issuedCard.card.uniqueCode}</p>
              </div>
              <img src={issuedCard.qrCode} alt="QR Code" className="mx-auto" />
              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  onClick={() => navigator.clipboard.writeText(issuedCard.cardUrl)}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Link
                </Button>
                <Button onClick={() => window.open(issuedCard.cardUrl + '?preview=true', '_blank')}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Card
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-4 px-1 py-4">
                <div className="space-y-2">
                  <Label>Customer Name</Label>
                  <Input
                    value={issueFormData.customerName}
                    onChange={(e) => setIssueFormData({ ...issueFormData, customerName: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email (optional)</Label>
                  <Input
                    type="email"
                    value={issueFormData.customerEmail}
                    onChange={(e) => setIssueFormData({ ...issueFormData, customerEmail: e.target.value })}
                    placeholder="john@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone (optional)</Label>
                  <Input
                    value={issueFormData.customerPhone}
                    onChange={(e) => setIssueFormData({ ...issueFormData, customerPhone: e.target.value })}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIssueModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleIssueCard}>
                  <Send className="w-4 h-4 mr-2" />
                  Issue Card
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Redeem Modal */}
      <Dialog open={redeemModalOpen} onOpenChange={setRedeemModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Redeem Punch Card</DialogTitle>
            <DialogDescription>
              Scan or enter card code to apply punches
            </DialogDescription>
          </DialogHeader>

          {redeemResult ? (
            <div className="py-4 text-center space-y-4">
              <div
                className={`rounded-full w-16 h-16 flex items-center justify-center mx-auto ${
                  redeemResult.success ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'
                }`}
              >
                {redeemResult.success ? <Check className="w-8 h-8" /> : <X className="w-8 h-8" />}
              </div>
              <div>
                <p className="font-medium">{redeemResult.message}</p>
                {redeemResult.card && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {redeemResult.card.punchesRemaining} punches remaining
                  </p>
                )}
              </div>
              <Button onClick={() => setRedeemResult(null)}>
                Redeem Another
              </Button>
            </div>
          ) : (
            <>
              <div className="flex gap-1 p-1 bg-secondary rounded-lg mb-4">
                <button
                  onClick={() => setRedeemTab('scan')}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    redeemTab === 'scan' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
                  }`}
                >
                  <Scan className="w-4 h-4" />
                  Scan QR
                </button>
                <button
                  onClick={() => setRedeemTab('manual')}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    redeemTab === 'manual' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  Manual
                </button>
              </div>

              {redeemTab === 'scan' ? (
                <QRScanner
                  onScan={(code) => {
                    setRedeemFormData((prev) => ({ ...prev, uniqueCode: code }));
                    setRedeemTab('manual');
                  }}
                />
              ) : (
                <div className="space-y-4 px-1">
                  <div className="space-y-2">
                    <Label>Card Code</Label>
                    <Input
                      value={redeemFormData.uniqueCode}
                      onChange={(e) => setRedeemFormData({ ...redeemFormData, uniqueCode: e.target.value.toUpperCase() })}
                      placeholder="e.g., WTR-ABC123"
                      className="font-mono text-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Punches to Apply</Label>
                    <Input
                      type="number"
                      min={1}
                      value={redeemFormData.punches}
                      onChange={(e) => setRedeemFormData({ ...redeemFormData, punches: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setRedeemModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleRedeem} disabled={!redeemFormData.uniqueCode.trim()}>
                      <Check className="w-4 h-4 mr-2" />
                      Apply Punch
                    </Button>
                  </DialogFooter>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* QR Code Modal */}
      <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Card QR Code</DialogTitle>
          </DialogHeader>
          {selectedCardQR && (
            <div className="py-4 text-center space-y-4">
              <p className="font-mono text-lg">{selectedCardQR.card.uniqueCode}</p>
              <p className="text-sm text-muted-foreground">{selectedCardQR.card.customerName}</p>
              <img src={selectedCardQR.qrCode} alt="QR Code" className="mx-auto" />
              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  onClick={() => navigator.clipboard.writeText(selectedCardQR.cardUrl)}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Link
                </Button>
                <Button onClick={() => window.open(selectedCardQR.cardUrl + '?preview=true', '_blank')}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
