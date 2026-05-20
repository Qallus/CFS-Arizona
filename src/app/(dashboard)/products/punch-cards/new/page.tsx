'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Bell,
  Image,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function NewPunchCardPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<'basics' | 'styling' | 'settings' | 'contact' | 'notifications'>('basics');
  
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
    gradientDirection: 'to bottom' as string,
    logo: '',
    expirationDays: 365,
    terms: '',
    business: '',
    phone: '',
    email: '',
    address: '',
  });

  const handleSave = async () => {
    if (!formData.name) {
      alert('Please enter a card name');
      return;
    }
    
    setSaving(true);
    try {
      const res = await fetch('/api/products/punch-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
        const data = await res.json();
        router.push(`/products/punch-cards/${data.template.id}`);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to create punch card');
      }
    } catch (err) {
      console.error('Failed to create template:', err);
      alert('Failed to create punch card');
    } finally {
      setSaving(false);
    }
  };

  const sections = [
    { id: 'basics', label: 'Basics', icon: CreditCard },
    { id: 'styling', label: 'Styling', icon: Palette },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'contact', label: 'Contact', icon: Building },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ] as const;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/products/punch-cards" className="text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-foreground">Create Punch Card</h1>
                <p className="text-sm text-muted-foreground">Configure your new punch card program</p>
              </div>
            </div>
            
            <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Punch Card
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Section Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    activeSection === section.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-secondary text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <section.icon className="w-4 h-4" />
                  {section.label}
                </button>
              ))}
            </div>

            {/* Basics Section */}
            {activeSection === 'basics' && (
              <Card className="bg-card/50 border-border">
                <CardHeader>
                  <CardTitle>Card Basics</CardTitle>
                  <CardDescription>Choose the type and configure the basic settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Card Type */}
                  <div className="space-y-3">
                    <Label>Card Type</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button
                        type="button"
                        className={`p-4 border rounded-lg text-left transition-all ${
                          formData.type === 'loyalty'
                            ? 'border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/20'
                            : 'border-border hover:border-blue-500/50'
                        }`}
                        onClick={() => setFormData({ ...formData, type: 'loyalty' })}
                      >
                        <Gift className="w-8 h-8 text-blue-500 mb-3" />
                        <p className="font-semibold text-foreground">Loyalty Card</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Customers collect punches and earn a reward when complete
                        </p>
                      </button>
                      <button
                        type="button"
                        className={`p-4 border rounded-lg text-left transition-all ${
                          formData.type === 'value'
                            ? 'border-green-500 bg-green-500/10 ring-2 ring-green-500/20'
                            : 'border-border hover:border-green-500/50'
                        }`}
                        onClick={() => setFormData({ ...formData, type: 'value' })}
                      >
                        <DollarSign className="w-8 h-8 text-green-500 mb-3" />
                        <p className="font-semibold text-foreground">Value Card</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Pre-paid punches with a set value (e.g., water refill cards)
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Card Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Coffee Rewards"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="totalPunches">Total Punches</Label>
                      <Input
                        id="totalPunches"
                        type="number"
                        min={1}
                        max={100}
                        value={formData.totalPunches}
                        onChange={(e) => setFormData({ ...formData, totalPunches: parseInt(e.target.value) || 10 })}
                      />
                    </div>
                  </div>

                  {/* Type-specific fields */}
                  {formData.type === 'value' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="valuePerPunch">Value Per Punch</Label>
                        <Input
                          id="valuePerPunch"
                          value={formData.valuePerPunch}
                          onChange={(e) => setFormData({ ...formData, valuePerPunch: e.target.value })}
                          placeholder="e.g., 5 gallons"
                        />
                        <p className="text-xs text-muted-foreground">What does each punch represent?</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="price">Card Price ($)</Label>
                        <Input
                          id="price"
                          type="number"
                          min={0}
                          step={0.01}
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          placeholder="e.g., 25"
                        />
                        <p className="text-xs text-muted-foreground">How much do customers pay for this card?</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="reward">Reward (when completed)</Label>
                      <Input
                        id="reward"
                        value={formData.reward}
                        onChange={(e) => setFormData({ ...formData, reward: e.target.value })}
                        placeholder="e.g., Free Large Coffee"
                      />
                      <p className="text-xs text-muted-foreground">What do customers get when they complete the card?</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Styling Section */}
            {activeSection === 'styling' && (
              <Card className="bg-card/50 border-border">
                <CardHeader>
                  <CardTitle>Card Appearance</CardTitle>
                  <CardDescription>Customize how your punch card looks to customers</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Display Title</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder={formData.name || 'Title shown on card'}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="logo">Logo URL (optional)</Label>
                      <Input
                        id="logo"
                        value={formData.logo}
                        onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="backgroundColor">Background Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="backgroundColor"
                          type="color"
                          value={formData.backgroundColor}
                          onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                          className="w-16 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          value={formData.backgroundColor}
                          onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                          className="flex-1 font-mono"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="textColor">Text Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="textColor"
                          type="color"
                          value={formData.textColor}
                          onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                          className="w-16 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          value={formData.textColor}
                          onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                          className="flex-1 font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Background Image */}
                  <div className="space-y-2">
                    <Label htmlFor="backgroundImage" className="flex items-center gap-2">
                      <Image className="w-4 h-4" />
                      Background Image (optional)
                    </Label>
                    <Input
                      id="backgroundImage"
                      value={formData.backgroundImage}
                      onChange={(e) => setFormData({ ...formData, backgroundImage: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                    />
                    <p className="text-xs text-muted-foreground">Use a high-quality image. Recommended size: 800x500px</p>
                  </div>

                  {/* Gradient Overlay */}
                  {formData.backgroundImage && (
                    <div className="space-y-4 p-4 bg-secondary/50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <Label className="font-medium">Gradient Overlay</Label>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, gradientOverlay: !formData.gradientOverlay })}
                          className={`relative w-12 h-6 rounded-full transition-colors ${
                            formData.gradientOverlay ? 'bg-blue-600' : 'bg-zinc-600'
                          }`}
                        >
                          <span
                            className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                              formData.gradientOverlay ? 'translate-x-6' : ''
                            }`}
                          />
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground">Add a gradient overlay to improve text readability over images</p>
                      
                      {formData.gradientOverlay && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                          <div className="space-y-2">
                            <Label className="text-sm">Direction</Label>
                            <Select
                              value={formData.gradientDirection}
                              onValueChange={(value) => setFormData({ ...formData, gradientDirection: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="to bottom">Top to Bottom</SelectItem>
                                <SelectItem value="to top">Bottom to Top</SelectItem>
                                <SelectItem value="to right">Left to Right</SelectItem>
                                <SelectItem value="to left">Right to Left</SelectItem>
                                <SelectItem value="to bottom right">Diagonal ↘</SelectItem>
                                <SelectItem value="to bottom left">Diagonal ↙</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm">From (darker)</Label>
                            <Input
                              value={formData.gradientFrom}
                              onChange={(e) => setFormData({ ...formData, gradientFrom: e.target.value })}
                              placeholder="rgba(0,0,0,0.7)"
                              className="font-mono text-sm"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm">To (lighter)</Label>
                            <Input
                              value={formData.gradientTo}
                              onChange={(e) => setFormData({ ...formData, gradientTo: e.target.value })}
                              placeholder="rgba(0,0,0,0.3)"
                              className="font-mono text-sm"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Settings Section */}
            {activeSection === 'settings' && (
              <Card className="bg-card/50 border-border">
                <CardHeader>
                  <CardTitle>Card Settings</CardTitle>
                  <CardDescription>Configure expiration and terms</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expirationDays">Expiration (days)</Label>
                      <Input
                        id="expirationDays"
                        type="number"
                        min={0}
                        value={formData.expirationDays}
                        onChange={(e) => setFormData({ ...formData, expirationDays: parseInt(e.target.value) || 0 })}
                      />
                      <p className="text-xs text-muted-foreground">Set to 0 for cards that never expire</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="terms">Terms & Conditions</Label>
                    <Textarea
                      id="terms"
                      value={formData.terms}
                      onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                      placeholder="e.g., No cash value. Cannot be combined with other offers..."
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Contact Section */}
            {activeSection === 'contact' && (
              <Card className="bg-card/50 border-border">
                <CardHeader>
                  <CardTitle>Business Contact</CardTitle>
                  <CardDescription>Contact information shown on the card</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="business">Business Name</Label>
                      <Input
                        id="business"
                        value={formData.business}
                        onChange={(e) => setFormData({ ...formData, business: e.target.value })}
                        placeholder="Your Business Name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="contact@business.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="123 Main St, City, ST"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notifications Section */}
            {activeSection === 'notifications' && (
              <Card className="bg-card/50 border-border">
                <CardHeader>
                  <CardTitle>Customer Notifications</CardTitle>
                  <CardDescription>Set up automated SMS and email notifications for your customers</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Coming Soon Banner */}
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Bell className="w-5 h-5 text-blue-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-blue-400">Notification Triggers Coming Soon!</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Soon you'll be able to automatically notify customers when:
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Trigger Options Preview */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg opacity-60">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                          <Gift className="w-5 h-5 text-green-500" />
                        </div>
                        <div>
                          <p className="font-medium">Welcome New Customers</p>
                          <p className="text-sm text-muted-foreground">Send a welcome message when a card is issued</p>
                        </div>
                      </div>
                      <button disabled className="px-3 py-1 text-xs bg-secondary rounded-md text-muted-foreground">
                        Coming Soon
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg opacity-60">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand/20 flex items-center justify-center">
                          <CreditCard className="w-5 h-5 text-brand" />
                        </div>
                        <div>
                          <p className="font-medium">Low Punch Reminder</p>
                          <p className="text-sm text-muted-foreground">Remind customers when they're close to a reward</p>
                        </div>
                      </div>
                      <button disabled className="px-3 py-1 text-xs bg-secondary rounded-md text-muted-foreground">
                        Coming Soon
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg opacity-60">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                          <Check className="w-5 h-5 text-purple-500" />
                        </div>
                        <div>
                          <p className="font-medium">Reward Earned</p>
                          <p className="text-sm text-muted-foreground">Celebrate when a customer completes their card</p>
                        </div>
                      </div>
                      <button disabled className="px-3 py-1 text-xs bg-secondary rounded-md text-muted-foreground">
                        Coming Soon
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg opacity-60">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                          <Bell className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                          <p className="font-medium">Holiday & Promotional Campaigns</p>
                          <p className="text-sm text-muted-foreground">Send special offers for holidays and events</p>
                        </div>
                      </div>
                      <button disabled className="px-3 py-1 text-xs bg-secondary rounded-md text-muted-foreground">
                        Coming Soon
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg opacity-60">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                          <Settings className="w-5 h-5 text-yellow-500" />
                        </div>
                        <div>
                          <p className="font-medium">Expiration Warning</p>
                          <p className="text-sm text-muted-foreground">Alert customers before their card expires</p>
                        </div>
                      </div>
                      <button disabled className="px-3 py-1 text-xs bg-secondary rounded-md text-muted-foreground">
                        Coming Soon
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground text-center pt-2">
                    These features will support SMS (via Twilio) and Email notifications.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Live Preview Panel */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card className="bg-card/50 border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Live Preview
                  </CardTitle>
                  <CardDescription>How your card will look to customers</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Card Preview */}
                  <div
                    className="rounded-xl p-6 text-center shadow-lg relative overflow-hidden"
                    style={{
                      backgroundColor: formData.backgroundColor,
                      color: formData.textColor,
                      backgroundImage: formData.backgroundImage ? `url(${formData.backgroundImage})` : undefined,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  >
                    {/* Gradient Overlay */}
                    {formData.backgroundImage && formData.gradientOverlay && (
                      <div
                        className="absolute inset-0"
                        style={{
                          background: `linear-gradient(${formData.gradientDirection}, ${formData.gradientFrom}, ${formData.gradientTo})`,
                        }}
                      />
                    )}
                    
                    {/* Card Content */}
                    <div className="relative z-10">
                      {formData.logo && (
                        <img 
                          src={formData.logo} 
                          alt="Logo" 
                          className="w-16 h-16 mx-auto mb-3 rounded-lg object-contain"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      )}
                      <p className="text-xl font-bold mb-1">
                        {formData.title || formData.name || 'Card Title'}
                      </p>
                      <p className="text-sm opacity-80 mb-4">
                        {formData.totalPunches} punches
                        {formData.type === 'loyalty' && formData.reward && ` • ${formData.reward}`}
                        {formData.type === 'value' && formData.valuePerPunch && ` × ${formData.valuePerPunch}`}
                      </p>
                      
                      {/* Punch circles */}
                      <div className="flex flex-wrap justify-center gap-2 mb-4">
                        {Array.from({ length: Math.min(formData.totalPunches, 10) }).map((_, i) => (
                          <div
                            key={i}
                            className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                              i < 3 ? 'bg-current/20' : ''
                            }`}
                            style={{ borderColor: 'currentColor' }}
                          >
                            {i < 3 && <Check className="w-4 h-4" />}
                          </div>
                        ))}
                        {formData.totalPunches > 10 && (
                          <span className="opacity-60 self-center">+{formData.totalPunches - 10}</span>
                        )}
                      </div>
                      
                      <p className="text-xs opacity-60">
                        3 of {formData.totalPunches} punches used
                      </p>
                    </div>
                  </div>
                  
                  {/* Business info preview */}
                  {(formData.business || formData.phone || formData.email) && (
                    <div className="mt-4 p-3 bg-secondary/50 rounded-lg text-sm">
                      {formData.business && <p className="font-medium">{formData.business}</p>}
                      {formData.phone && <p className="text-muted-foreground">{formData.phone}</p>}
                      {formData.email && <p className="text-muted-foreground">{formData.email}</p>}
                      {formData.address && <p className="text-muted-foreground">{formData.address}</p>}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
