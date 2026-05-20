'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Ticket,
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Gift,
  Percent,
  Loader2,
  Palette,
  Type,
  Image as ImageIcon,
  Share2,
  Settings,
  Upload,
  Eye,
  Grid3X3,
  Sparkles,
} from 'lucide-react';

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

interface Symbol {
  id: string;
  name: string;
  image?: string;
  emoji?: string;
  isWinner: boolean;
}

const PRIZE_COLORS = [
  { name: 'Gold', value: '#FFD700' },
  { name: 'Silver', value: '#C0C0C0' },
  { name: 'Bronze', value: '#CD7F32' },
  { name: 'Green', value: '#22C55E' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Purple', value: '#A855F7' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Orange', value: '#F97316' },
];

const CARD_COLORS = [
  { name: 'Purple Gradient', primary: '#667eea', secondary: '#764ba2' },
  { name: 'Blue Gradient', primary: '#2193b0', secondary: '#6dd5ed' },
  { name: 'Orange Gradient', primary: '#f7971e', secondary: '#ffd200' },
  { name: 'Green Gradient', primary: '#11998e', secondary: '#38ef7d' },
  { name: 'Red Gradient', primary: '#eb3349', secondary: '#f45c43' },
  { name: 'Pink Gradient', primary: '#ee0979', secondary: '#ff6a00' },
  { name: 'Dark', primary: '#232526', secondary: '#414345' },
  { name: 'Gold', primary: '#BF953F', secondary: '#FCF6BA' },
];

const FONTS = [
  { name: 'System', value: 'system-ui' },
  { name: 'Serif', value: 'Georgia, serif' },
  { name: 'Mono', value: 'monospace' },
  { name: 'Rounded', value: 'Nunito, system-ui' },
  { name: 'Bold', value: 'Impact, system-ui' },
];

const DEFAULT_SYMBOLS: Symbol[] = [
  { id: 'gold', name: 'Gold Bars', emoji: '🥇', isWinner: true },
  { id: 'diamond', name: 'Diamond', emoji: '💎', isWinner: true },
  { id: 'star', name: 'Star', emoji: '⭐', isWinner: true },
  { id: 'clover', name: 'Clover', emoji: '🍀', isWinner: true },
  { id: 'cherry', name: 'Cherry', emoji: '🍒', isWinner: false },
  { id: 'lemon', name: 'Lemon', emoji: '🍋', isWinner: false },
  { id: 'grape', name: 'Grape', emoji: '🍇', isWinner: false },
  { id: 'orange', name: 'Orange', emoji: '🍊', isWinner: false },
  { id: 'bell', name: 'Bell', emoji: '🔔', isWinner: false },
  { id: 'seven', name: 'Lucky 7', emoji: '7️⃣', isWinner: true },
];

export default function NewScratchCardPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    // Basic Details
    name: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    scratchesPerUser: 1,
    maxTotalScratches: -1,
    requireEmail: false,
    terms: '',
    
    // Game Type
    gameType: 'single' as 'single' | 'multizone',
    
    // Card Design
    cardTitle: 'SCRATCH & WIN!',
    cardSubtitle: 'Reveal your prize',
    cardLogo: '',
    primaryColor: '#667eea',
    secondaryColor: '#764ba2',
    textColor: '#ffffff',
    titleColor: '#ffffff',
    descriptionColor: '#cccccc',
    descriptionBgColor: '',
    font: 'system-ui',
    backgroundImage: '',
    scratchLayerColor: '#667eea',
    
    // Mechanics
    revealThreshold: 50,
    
    // Multi-zone settings
    gridRows: 3,
    gridCols: 5,
    matchToWin: 3, // Number of matching symbols needed to win
    showNumbers: true, // Show random numbers above each zone
    zoneShape: 'rounded' as 'square' | 'rounded' | 'circle',
    zoneBgColor: '#ffffff',
    
    // Winner Settings
    generateWinnerCodes: false,
    sendWinnerSms: false,
    sendWinnerEmail: false,
    
    // Sharing
    allowSharing: true,
    allowGifting: false,
    
    // Fundraiser
    isFundraiser: false,
    cardPrice: 0,
  });

  const [prizes, setPrizes] = useState<Prize[]>([
    {
      id: `prize_${Date.now()}`,
      name: 'Grand Prize',
      description: '',
      value: '$100',
      odds: 5,
      quantity: 1,
      claimed: 0,
      color: '#FFD700',
    },
    {
      id: `prize_${Date.now() + 1}`,
      name: '10% Off',
      description: 'Discount on next purchase',
      value: '10% OFF',
      odds: 25,
      quantity: -1,
      claimed: 0,
      color: '#22C55E',
    },
    {
      id: `prize_${Date.now() + 2}`,
      name: 'Better Luck Next Time',
      description: 'No prize this time',
      value: '',
      odds: 70,
      quantity: -1,
      claimed: 0,
      color: '#6B7280',
    },
  ]);

  const [symbols, setSymbols] = useState<Symbol[]>(DEFAULT_SYMBOLS);
  const [selectedWinnerSymbols, setSelectedWinnerSymbols] = useState<string[]>(['gold', 'diamond']);
  const [selectedLoserSymbols, setSelectedLoserSymbols] = useState<string[]>(['cherry', 'lemon', 'grape', 'orange']);

  const totalOdds = prizes.reduce((sum, p) => sum + p.odds, 0);

  const addPrize = () => {
    setPrizes([
      ...prizes,
      {
        id: `prize_${Date.now()}`,
        name: '',
        description: '',
        value: '',
        odds: 0,
        quantity: -1,
        claimed: 0,
        color: PRIZE_COLORS[prizes.length % PRIZE_COLORS.length].value,
      },
    ]);
  };

  const updatePrize = (index: number, field: string, value: any) => {
    const updated = [...prizes];
    updated[index] = { ...updated[index], [field]: value };
    setPrizes(updated);
  };

  const removePrize = (index: number) => {
    setPrizes(prizes.filter((_, i) => i !== index));
  };

  const handleImageUpload = async (file: File, type: 'logo' | 'background') => {
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);
    formDataUpload.append('folder', 'scratch-cards');

    try {
      const res = await fetch('/api/uploads', {
        method: 'POST',
        body: formDataUpload,
      });
      const data = await res.json();
      if (data.url) {
        if (type === 'logo') {
          setFormData({ ...formData, cardLogo: data.url });
        } else {
          setFormData({ ...formData, backgroundImage: data.url });
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  const toggleSymbol = (symbolId: string, isWinner: boolean) => {
    if (isWinner) {
      if (selectedWinnerSymbols.includes(symbolId)) {
        setSelectedWinnerSymbols(selectedWinnerSymbols.filter(s => s !== symbolId));
      } else {
        setSelectedWinnerSymbols([...selectedWinnerSymbols, symbolId]);
      }
    } else {
      if (selectedLoserSymbols.includes(symbolId)) {
        setSelectedLoserSymbols(selectedLoserSymbols.filter(s => s !== symbolId));
      } else {
        setSelectedLoserSymbols([...selectedLoserSymbols, symbolId]);
      }
    }
  };

  const handleSubmit = async (status: 'draft' | 'active') => {
    if (!formData.name.trim()) {
      alert('Please enter a campaign name');
      return;
    }

    if (formData.gameType === 'single') {
      if (prizes.length === 0) {
        alert('Please add at least one prize');
        return;
      }
      if (Math.abs(totalOdds - 100) > 0.01) {
        alert(`Prize odds must total 100%. Current total: ${totalOdds}%`);
        return;
      }
    } else {
      if (selectedWinnerSymbols.length === 0) {
        alert('Please select at least one winner symbol');
        return;
      }
      if (selectedLoserSymbols.length === 0) {
        alert('Please select at least one non-winner symbol');
        return;
      }
    }

    setSaving(true);

    try {
      const response = await fetch('/api/products/scratch-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-campaign',
          ...formData,
          prizes: formData.gameType === 'single' ? prizes : [],
          symbols: {
            winners: selectedWinnerSymbols.map(id => symbols.find(s => s.id === id)),
            losers: selectedLoserSymbols.map(id => symbols.find(s => s.id === id)),
          },
          status,
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push(`/products/scratch-cards/${data.campaign.id}`);
      } else {
        alert('Error creating campaign: ' + data.error);
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert('Failed to create campaign');
    } finally {
      setSaving(false);
    }
  };

  const totalZones = formData.gridRows * formData.gridCols;

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
            <h1 className="text-2xl font-bold text-foreground">New Scratch Card Campaign</h1>
            <p className="text-muted-foreground">Create a gamified promotion with exciting prizes</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleSubmit('draft')} disabled={saving}>
            Save Draft
          </Button>
          <Button className="bg-brand hover:bg-brand/90" onClick={() => handleSubmit('active')} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Create & Activate
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="details">
                <Settings className="w-4 h-4 mr-1" />
                Details
              </TabsTrigger>
              <TabsTrigger value="gametype">
                <Grid3X3 className="w-4 h-4 mr-1" />
                Game
              </TabsTrigger>
              <TabsTrigger value="design">
                <Palette className="w-4 h-4 mr-1" />
                Design
              </TabsTrigger>
              <TabsTrigger value="prizes">
                <Gift className="w-4 h-4 mr-1" />
                Prizes
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Share2 className="w-4 h-4 mr-1" />
                Settings
              </TabsTrigger>
            </TabsList>

            {/* Details Tab */}
            <TabsContent value="details" className="mt-4">
              <Card className="bg-card/50 border-border">
                <CardHeader>
                  <CardTitle>Campaign Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Campaign Name *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Luck of the Irish Fundraiser"
                      className="bg-background"
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe what customers can win..."
                      className="bg-background"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="bg-background"
                      />
                    </div>
                    <div>
                      <Label>End Date (Optional)</Label>
                      <Input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        className="bg-background"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Plays Per User</Label>
                      <Input
                        type="number"
                        min="1"
                        value={formData.scratchesPerUser}
                        onChange={(e) => setFormData({ ...formData, scratchesPerUser: parseInt(e.target.value) || 1 })}
                        className="bg-background"
                      />
                    </div>
                    <div>
                      <Label>Max Total Plays (-1 = unlimited)</Label>
                      <Input
                        type="number"
                        min="-1"
                        value={formData.maxTotalScratches}
                        onChange={(e) => setFormData({ ...formData, maxTotalScratches: parseInt(e.target.value) || -1 })}
                        className="bg-background"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Terms & Conditions</Label>
                    <Textarea
                      value={formData.terms}
                      onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                      placeholder="Enter any terms and conditions..."
                      className="bg-background"
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Game Type Tab */}
            <TabsContent value="gametype" className="mt-4 space-y-4">
              <Card className="bg-card/50 border-border">
                <CardHeader>
                  <CardTitle>Game Type</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, gameType: 'single' })}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        formData.gameType === 'single'
                          ? 'border-brand bg-brand/10'
                          : 'border-border hover:border-muted-foreground'
                      }`}
                    >
                      <Sparkles className="w-8 h-8 text-brand mb-2" />
                      <p className="font-semibold text-foreground">Single Scratch</p>
                      <p className="text-sm text-muted-foreground">One scratch area reveals the prize</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, gameType: 'multizone' })}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        formData.gameType === 'multizone'
                          ? 'border-brand bg-brand/10'
                          : 'border-border hover:border-muted-foreground'
                      }`}
                    >
                      <Grid3X3 className="w-8 h-8 text-purple-500 mb-2" />
                      <p className="font-semibold text-foreground">Multi-Zone Grid</p>
                      <p className="text-sm text-muted-foreground">Match symbols to win (lottery style)</p>
                    </button>
                  </div>
                </CardContent>
              </Card>

              {formData.gameType === 'multizone' && (
                <>
                  <Card className="bg-card/50 border-border">
                    <CardHeader>
                      <CardTitle>Grid Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label>Rows</Label>
                          <Input
                            type="number"
                            min="1"
                            max="6"
                            value={formData.gridRows}
                            onChange={(e) => setFormData({ ...formData, gridRows: Math.min(6, Math.max(1, parseInt(e.target.value) || 1)) })}
                            className="bg-background"
                          />
                        </div>
                        <div>
                          <Label>Columns</Label>
                          <Input
                            type="number"
                            min="1"
                            max="8"
                            value={formData.gridCols}
                            onChange={(e) => setFormData({ ...formData, gridCols: Math.min(8, Math.max(1, parseInt(e.target.value) || 1)) })}
                            className="bg-background"
                          />
                        </div>
                        <div>
                          <Label>Match to Win</Label>
                          <Input
                            type="number"
                            min="2"
                            max={totalZones}
                            value={formData.matchToWin}
                            onChange={(e) => setFormData({ ...formData, matchToWin: Math.min(totalZones, Math.max(2, parseInt(e.target.value) || 3)) })}
                            className="bg-background"
                          />
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {totalZones} zones total. Players need to find {formData.matchToWin} matching winner symbols to win.
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Zone Shape</Label>
                          <select
                            value={formData.zoneShape}
                            onChange={(e) => setFormData({ ...formData, zoneShape: e.target.value as any })}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                          >
                            <option value="square">Square</option>
                            <option value="rounded">Rounded</option>
                            <option value="circle">Circle</option>
                          </select>
                        </div>
                        <div>
                          <Label>Show Numbers</Label>
                          <div className="flex items-center gap-2 mt-2">
                            <Switch
                              checked={formData.showNumbers}
                              onChange={(checked) => setFormData({ ...formData, showNumbers: checked })}
                            />
                            <span className="text-sm text-muted-foreground">
                              {formData.showNumbers ? 'Random numbers above zones' : 'No numbers'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <Label>Zone Background Color</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={formData.zoneBgColor}
                            onChange={(e) => setFormData({ ...formData, zoneBgColor: e.target.value })}
                            className="w-12 h-10 p-1 bg-background"
                          />
                          <Input
                            value={formData.zoneBgColor}
                            onChange={(e) => setFormData({ ...formData, zoneBgColor: e.target.value })}
                            className="bg-background flex-1"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card/50 border-border">
                    <CardHeader>
                      <CardTitle>Symbols</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-green-500">Winner Symbols (select at least 1)</Label>
                        <p className="text-xs text-muted-foreground mb-2">
                          Players need to match {formData.matchToWin} of these to win
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {symbols.filter(s => s.isWinner || selectedWinnerSymbols.includes(s.id)).map((symbol) => (
                            <button
                              key={symbol.id}
                              type="button"
                              onClick={() => toggleSymbol(symbol.id, true)}
                              className={`px-3 py-2 rounded-lg border-2 flex items-center gap-2 transition-all ${
                                selectedWinnerSymbols.includes(symbol.id)
                                  ? 'border-green-500 bg-green-500/20'
                                  : 'border-border hover:border-green-500/50'
                              }`}
                            >
                              <span className="text-2xl">{symbol.emoji}</span>
                              <span className="text-sm">{symbol.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label className="text-red-400">Non-Winner Symbols (select at least 1)</Label>
                        <p className="text-xs text-muted-foreground mb-2">
                          These fill the remaining zones
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {symbols.filter(s => !s.isWinner || selectedLoserSymbols.includes(s.id)).map((symbol) => (
                            <button
                              key={symbol.id}
                              type="button"
                              onClick={() => toggleSymbol(symbol.id, false)}
                              className={`px-3 py-2 rounded-lg border-2 flex items-center gap-2 transition-all ${
                                selectedLoserSymbols.includes(symbol.id)
                                  ? 'border-red-500 bg-red-500/20'
                                  : 'border-border hover:border-red-500/50'
                              }`}
                            >
                              <span className="text-2xl">{symbol.emoji}</span>
                              <span className="text-sm">{symbol.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            {/* Design Tab */}
            <TabsContent value="design" className="mt-4 space-y-4">
              <Card className="bg-card/50 border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Type className="w-5 h-5 text-blue-500" />
                    Card Text & Colors
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Card Title</Label>
                      <Input
                        value={formData.cardTitle}
                        onChange={(e) => setFormData({ ...formData, cardTitle: e.target.value })}
                        placeholder="SCRATCH & WIN!"
                        className="bg-background"
                      />
                    </div>
                    <div>
                      <Label>Title Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={formData.titleColor}
                          onChange={(e) => setFormData({ ...formData, titleColor: e.target.value })}
                          className="w-12 h-10 p-1 bg-background"
                        />
                        <Input
                          value={formData.titleColor}
                          onChange={(e) => setFormData({ ...formData, titleColor: e.target.value })}
                          className="bg-background flex-1"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Subtitle/Description</Label>
                      <Input
                        value={formData.cardSubtitle}
                        onChange={(e) => setFormData({ ...formData, cardSubtitle: e.target.value })}
                        placeholder="Reveal your prize"
                        className="bg-background"
                      />
                    </div>
                    <div>
                      <Label>Description Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={formData.descriptionColor}
                          onChange={(e) => setFormData({ ...formData, descriptionColor: e.target.value })}
                          className="w-12 h-10 p-1 bg-background"
                        />
                        <Input
                          value={formData.descriptionColor}
                          onChange={(e) => setFormData({ ...formData, descriptionColor: e.target.value })}
                          className="bg-background flex-1"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label>Description Background Color (optional)</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={formData.descriptionBgColor || '#00000000'}
                        onChange={(e) => setFormData({ ...formData, descriptionBgColor: e.target.value })}
                        className="w-12 h-10 p-1 bg-background"
                      />
                      <Input
                        value={formData.descriptionBgColor}
                        onChange={(e) => setFormData({ ...formData, descriptionBgColor: e.target.value })}
                        placeholder="Leave empty for transparent"
                        className="bg-background flex-1"
                      />
                      {formData.descriptionBgColor && (
                        <Button variant="ghost" size="sm" onClick={() => setFormData({ ...formData, descriptionBgColor: '' })}>
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label>Font</Label>
                    <select
                      value={formData.font}
                      onChange={(e) => setFormData({ ...formData, font: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                    >
                      {FONTS.map((font) => (
                        <option key={font.value} value={font.value}>{font.name}</option>
                      ))}
                    </select>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="w-5 h-5 text-purple-500" />
                    Background Colors
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Color Theme</Label>
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {CARD_COLORS.map((color) => (
                        <button
                          key={color.name}
                          type="button"
                          onClick={() => setFormData({ 
                            ...formData, 
                            primaryColor: color.primary, 
                            secondaryColor: color.secondary,
                            scratchLayerColor: color.primary,
                          })}
                          className={`h-12 rounded-lg border-2 transition-all ${
                            formData.primaryColor === color.primary 
                              ? 'border-white scale-105' 
                              : 'border-transparent'
                          }`}
                          style={{ 
                            background: `linear-gradient(135deg, ${color.primary}, ${color.secondary})` 
                          }}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Primary Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={formData.primaryColor}
                          onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                          className="w-12 h-10 p-1 bg-background"
                        />
                        <Input
                          value={formData.primaryColor}
                          onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                          className="bg-background flex-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Secondary Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={formData.secondaryColor}
                          onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                          className="w-12 h-10 p-1 bg-background"
                        />
                        <Input
                          value={formData.secondaryColor}
                          onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                          className="bg-background flex-1"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-green-500" />
                    Images
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Logo</Label>
                    <div className="flex items-center gap-4 mt-2">
                      {formData.cardLogo ? (
                        <div className="relative">
                          <img 
                            src={formData.cardLogo} 
                            alt="Logo" 
                            className="w-20 h-20 object-contain bg-secondary rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, cardLogo: '' })}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full text-white text-xs"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <div 
                          onClick={() => logoInputRef.current?.click()}
                          className="w-20 h-20 border-2 border-dashed border-border rounded-lg flex items-center justify-center cursor-pointer hover:border-brand transition-colors"
                        >
                          <Upload className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'logo')}
                      />
                      <div className="text-sm text-muted-foreground">
                        <p>Upload your logo</p>
                        <p className="text-xs">PNG, JPG up to 2MB</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label>Full Page Background Image</Label>
                    <div className="flex items-center gap-4 mt-2">
                      {formData.backgroundImage ? (
                        <div className="relative">
                          <img 
                            src={formData.backgroundImage} 
                            alt="Background" 
                            className="w-32 h-20 object-cover bg-secondary rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, backgroundImage: '' })}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full text-white text-xs"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <div 
                          onClick={() => bgInputRef.current?.click()}
                          className="w-32 h-20 border-2 border-dashed border-border rounded-lg flex items-center justify-center cursor-pointer hover:border-brand transition-colors"
                        >
                          <Upload className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                      <input
                        ref={bgInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'background')}
                      />
                      <div className="text-sm text-muted-foreground">
                        <p>Full page background</p>
                        <p className="text-xs">Replaces gradient</p>
                      </div>
                    </div>
                  </div>
                  {formData.gameType === 'single' && (
                    <div>
                      <Label>Reveal Threshold: {formData.revealThreshold}%</Label>
                      <input
                        type="range"
                        min="30"
                        max="90"
                        value={formData.revealThreshold}
                        onChange={(e) => setFormData({ ...formData, revealThreshold: parseInt(e.target.value) })}
                        className="w-full mt-2"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Prize auto-reveals when this much is scratched
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Prizes Tab (only for single game type) */}
            <TabsContent value="prizes" className="mt-4">
              {formData.gameType === 'single' ? (
                <Card className="bg-card/50 border-border">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Gift className="w-5 h-5 text-purple-500" />
                        Prizes
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm ${Math.abs(totalOdds - 100) < 0.01 ? 'text-green-500' : 'text-red-500'}`}>
                          Total: {totalOdds}%
                        </span>
                        <Button variant="outline" size="sm" onClick={addPrize}>
                          <Plus className="w-4 h-4 mr-1" />
                          Add Prize
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {prizes.map((prize, index) => (
                      <div 
                        key={prize.id}
                        className="p-4 bg-secondary/30 rounded-lg border border-border"
                        style={{ borderLeftColor: prize.color, borderLeftWidth: 4 }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <span className="text-sm font-medium text-muted-foreground">Prize #{index + 1}</span>
                          {prizes.length > 1 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-red-500"
                              onClick={() => removePrize(index)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Prize Name *</Label>
                            <Input
                              value={prize.name}
                              onChange={(e) => updatePrize(index, 'name', e.target.value)}
                              placeholder="e.g., 20% Off"
                              className="bg-background h-9"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Display Value</Label>
                            <Input
                              value={prize.value}
                              onChange={(e) => updatePrize(index, 'value', e.target.value)}
                              placeholder="e.g., $50, 20% OFF"
                              className="bg-background h-9"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Win Chance (%)</Label>
                            <div className="relative">
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={prize.odds}
                                onChange={(e) => updatePrize(index, 'odds', parseFloat(e.target.value) || 0)}
                                className="bg-background h-9 pr-8"
                              />
                              <Percent className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs">Quantity (-1 = unlimited)</Label>
                            <Input
                              type="number"
                              min="-1"
                              value={prize.quantity}
                              onChange={(e) => updatePrize(index, 'quantity', parseInt(e.target.value) || -1)}
                              className="bg-background h-9"
                            />
                          </div>
                          <div className="col-span-2">
                            <Label className="text-xs">Color</Label>
                            <div className="flex gap-2 mt-1">
                              {PRIZE_COLORS.map((color) => (
                                <button
                                  key={color.value}
                                  type="button"
                                  onClick={() => updatePrize(index, 'color', color.value)}
                                  className={`w-6 h-6 rounded-full border-2 transition-transform ${
                                    prize.color === color.value ? 'border-white scale-125' : 'border-transparent'
                                  }`}
                                  style={{ backgroundColor: color.value }}
                                  title={color.name}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {Math.abs(totalOdds - 100) > 0.01 && (
                      <p className="text-sm text-red-500">
                        ⚠️ Prize odds must total 100%. Currently at {totalOdds}%.
                      </p>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-card/50 border-border">
                  <CardContent className="p-8 text-center">
                    <Grid3X3 className="w-12 h-12 mx-auto mb-4 text-purple-500" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">Multi-Zone Game Selected</h3>
                    <p className="text-muted-foreground">
                      Prizes are determined by matching symbols. Configure symbols in the Game tab.
                    </p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setActiveTab('gametype')}
                    >
                      Go to Game Settings
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="mt-4 space-y-4">
              <Card className="bg-card/50 border-border">
                <CardHeader>
                  <CardTitle>User Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">Require Email</p>
                      <p className="text-sm text-muted-foreground">Collect email before playing</p>
                    </div>
                    <Switch
                      checked={formData.requireEmail}
                      onChange={(checked) => setFormData({ ...formData, requireEmail: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">Allow Sharing</p>
                      <p className="text-sm text-muted-foreground">Let users share their results</p>
                    </div>
                    <Switch
                      checked={formData.allowSharing}
                      onChange={(checked) => setFormData({ ...formData, allowSharing: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">Allow Gifting</p>
                      <p className="text-sm text-muted-foreground">Let users gift scratch cards</p>
                    </div>
                    <Switch
                      checked={formData.allowGifting}
                      onChange={(checked) => setFormData({ ...formData, allowGifting: checked })}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border">
                <CardHeader>
                  <CardTitle>Winner Notifications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">Generate Winner Codes</p>
                      <p className="text-sm text-muted-foreground">Create unique redemption codes</p>
                    </div>
                    <Switch
                      checked={formData.generateWinnerCodes}
                      onChange={(checked) => setFormData({ ...formData, generateWinnerCodes: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">Send Winner SMS</p>
                      <p className="text-sm text-muted-foreground">Text winners their prize code</p>
                    </div>
                    <Switch
                      checked={formData.sendWinnerSms}
                      onChange={(checked) => setFormData({ ...formData, sendWinnerSms: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">Send Winner Email</p>
                      <p className="text-sm text-muted-foreground">Email winners their prize code</p>
                    </div>
                    <Switch
                      checked={formData.sendWinnerEmail}
                      onChange={(checked) => setFormData({ ...formData, sendWinnerEmail: checked })}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Preview */}
        <div className="space-y-6">
          <Card className="bg-card/50 border-border sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Live Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Preview Container */}
              <div 
                className="rounded-xl overflow-hidden relative"
                style={{
                  background: formData.backgroundImage 
                    ? `url(${formData.backgroundImage}) center/cover`
                    : `linear-gradient(135deg, ${formData.primaryColor}, ${formData.secondaryColor})`,
                  fontFamily: formData.font,
                  padding: '1rem',
                }}
              >
                {/* Title */}
                <h3 
                  className="text-xl font-bold text-center mb-2"
                  style={{ color: formData.titleColor }}
                >
                  {formData.cardTitle || 'SCRATCH & WIN!'}
                </h3>
                
                {/* Description */}
                {formData.cardSubtitle && (
                  <p 
                    className="text-sm text-center mb-4 px-2 py-1 rounded"
                    style={{ 
                      color: formData.descriptionColor,
                      backgroundColor: formData.descriptionBgColor || 'transparent',
                    }}
                  >
                    {formData.cardSubtitle}
                  </p>
                )}

                {/* Single Game Preview */}
                {formData.gameType === 'single' && (
                  <div 
                    className="aspect-[4/3] rounded-lg flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${formData.scratchLayerColor}dd, ${formData.secondaryColor}dd)`,
                    }}
                  >
                    <div className="text-center">
                      {formData.cardLogo && (
                        <img 
                          src={formData.cardLogo} 
                          alt="Logo" 
                          className="w-10 h-10 object-contain mx-auto mb-2"
                        />
                      )}
                      <Ticket className="w-8 h-8 mx-auto mb-1" style={{ color: formData.textColor }} />
                      <p className="text-xs" style={{ color: `${formData.textColor}99` }}>
                        ↓ Scratch to reveal ↓
                      </p>
                    </div>
                  </div>
                )}

                {/* Multi-zone Preview */}
                {formData.gameType === 'multizone' && (
                  <div 
                    className="grid gap-2 p-2 rounded-lg"
                    style={{
                      gridTemplateColumns: `repeat(${formData.gridCols}, 1fr)`,
                      background: 'rgba(255,255,255,0.1)',
                    }}
                  >
                    {Array.from({ length: totalZones }).map((_, i) => (
                      <div 
                        key={i}
                        className={`aspect-square flex flex-col items-center justify-center text-xs ${
                          formData.zoneShape === 'circle' ? 'rounded-full' :
                          formData.zoneShape === 'rounded' ? 'rounded-lg' : ''
                        }`}
                        style={{ 
                          backgroundColor: formData.zoneBgColor,
                          border: '2px solid rgba(0,0,0,0.1)',
                        }}
                      >
                        {formData.showNumbers && (
                          <span className="font-bold text-gray-800 text-[10px]">
                            {String(Math.floor(Math.random() * 50)).padStart(2, '0')}
                          </span>
                        )}
                        <span className="text-lg">
                          {i < formData.matchToWin 
                            ? symbols.find(s => s.id === selectedWinnerSymbols[0])?.emoji || '🥇'
                            : symbols.find(s => s.id === selectedLoserSymbols[i % selectedLoserSymbols.length])?.emoji || '🍋'
                          }
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Prize preview for single */}
                {formData.gameType === 'single' && (
                  <div className="mt-3 space-y-1">
                    <p className="text-xs text-white/60">Prizes:</p>
                    {prizes.filter(p => p.name).slice(0, 3).map((prize, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: prize.color }}
                        />
                        <span className="text-xs text-white/80">{prize.name}</span>
                        <span className="text-xs text-white/50 ml-auto">{prize.odds}%</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Match info for multizone */}
                {formData.gameType === 'multizone' && (
                  <p className="text-xs text-center mt-2" style={{ color: formData.textColor }}>
                    Match {formData.matchToWin} {symbols.find(s => s.id === selectedWinnerSymbols[0])?.emoji || '🥇'} to win!
                  </p>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-border text-xs text-muted-foreground">
                <p>Game: {formData.gameType === 'single' ? 'Single Scratch' : `${formData.gridRows}×${formData.gridCols} Grid`}</p>
                {formData.gameType === 'single' && (
                  <p>Reveal at {formData.revealThreshold}% scratched</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
