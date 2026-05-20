'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ChevronLeft, 
  Save, 
  User, 
  Mail, 
  Phone, 
  Globe, 
  Building, 
  MapPin,
  QrCode,
  Palette,
  Image,
  Loader2,
  Eye,
  Plus,
  Trash2,
  Camera,
  Upload,
  Nfc,
  Link as LinkIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
interface PhoneEntry {
  id: string;
  number: string;
  type: 'mobile' | 'work' | 'home' | 'fax' | 'pager' | 'other';
  label?: string;
}

interface EmailEntry {
  id: string;
  email: string;
  type: 'work' | 'personal' | 'other';
  label?: string;
}

interface WebsiteEntry {
  id: string;
  url: string;
  type: 'website' | 'portfolio' | 'blog' | 'shop' | 'booking' | 'calendar' | 'payment' | 'other';
  label?: string;
}

interface SocialEntry {
  id: string;
  platform: string;
  username: string;
  url?: string;
}

const PHONE_TYPES = [
  { value: 'mobile', label: 'Mobile' },
  { value: 'work', label: 'Work' },
  { value: 'home', label: 'Home' },
  { value: 'fax', label: 'Fax' },
  { value: 'pager', label: 'Pager' },
  { value: 'other', label: 'Other' },
];

const EMAIL_TYPES = [
  { value: 'work', label: 'Work' },
  { value: 'personal', label: 'Personal' },
  { value: 'other', label: 'Other' },
];

const WEBSITE_TYPES = [
  { value: 'website', label: 'Website' },
  { value: 'portfolio', label: 'Portfolio' },
  { value: 'blog', label: 'Blog' },
  { value: 'shop', label: 'Shop/Store' },
  { value: 'booking', label: 'Booking' },
  { value: 'calendar', label: 'Calendar' },
  { value: 'payment', label: 'Payment (Venmo, CashApp)' },
  { value: 'other', label: 'Other' },
];

const SOCIAL_PLATFORMS = [
  { value: 'linkedin', label: 'LinkedIn', icon: '💼' },
  { value: 'twitter', label: 'Twitter/X', icon: '🐦' },
  { value: 'instagram', label: 'Instagram', icon: '📸' },
  { value: 'facebook', label: 'Facebook', icon: '👤' },
  { value: 'tiktok', label: 'TikTok', icon: '🎵' },
  { value: 'youtube', label: 'YouTube', icon: '▶️' },
  { value: 'github', label: 'GitHub', icon: '🐙' },
  { value: 'dribbble', label: 'Dribbble', icon: '🏀' },
  { value: 'behance', label: 'Behance', icon: '🎨' },
  { value: 'pinterest', label: 'Pinterest', icon: '📌' },
  { value: 'snapchat', label: 'Snapchat', icon: '👻' },
  { value: 'whatsapp', label: 'WhatsApp', icon: '💬' },
  { value: 'telegram', label: 'Telegram', icon: '✈️' },
  { value: 'discord', label: 'Discord', icon: '🎮' },
  { value: 'twitch', label: 'Twitch', icon: '🎬' },
  { value: 'spotify', label: 'Spotify', icon: '🎧' },
  { value: 'soundcloud', label: 'SoundCloud', icon: '☁️' },
  { value: 'medium', label: 'Medium', icon: '📝' },
  { value: 'substack', label: 'Substack', icon: '📰' },
  { value: 'threads', label: 'Threads', icon: '🧵' },
  { value: 'mastodon', label: 'Mastodon', icon: '🐘' },
  { value: 'bluesky', label: 'Bluesky', icon: '🦋' },
  { value: 'other', label: 'Other', icon: '🔗' },
];

const QR_SHAPES = [
  { id: 'square', name: 'Square', preview: '⬜' },
  { id: 'rounded', name: 'Rounded', preview: '⬜' },
  { id: 'circle', name: 'Circle', preview: '⭕' },
  { id: 'cloud', name: 'Cloud', preview: '☁️' },
  { id: 'heart', name: 'Heart', preview: '❤️' },
  { id: 'star', name: 'Star', preview: '⭐' },
  { id: 'house', name: 'House', preview: '🏠' },
  { id: 'shirt', name: 'T-Shirt', preview: '👕' },
  { id: 'cart', name: 'Shopping Cart', preview: '🛒' },
  { id: 'phone', name: 'Phone', preview: '📱' },
  { id: 'car', name: 'Car', preview: '🚗' },
  { id: 'tree', name: 'Tree', preview: '🌲' },
  { id: 'gift', name: 'Gift', preview: '🎁' },
  { id: 'coffee', name: 'Coffee', preview: '☕' },
  { id: 'utensils', name: 'Utensils', preview: '🍴' },
  { id: 'dumbbell', name: 'Fitness', preview: '🏋️' },
  { id: 'paw', name: 'Paw Print', preview: '🐾' },
  { id: 'music', name: 'Music', preview: '🎵' },
];

const TEMPLATES = [
  { id: 'modern', name: 'Modern', colors: { bg: '#1a1a2e', accent: '#6366f1' } },
  { id: 'classic', name: 'Classic', colors: { bg: '#1e3a5f', accent: '#3b82f6' } },
  { id: 'minimal', name: 'Minimal', colors: { bg: '#ffffff', accent: '#000000' } },
  { id: 'dark', name: 'Dark', colors: { bg: '#0f0f0f', accent: '#00fc83' } },
  { id: 'gradient', name: 'Gradient', colors: { bg: '#1f1f3d', accent: '#8b5cf6' } },
];

const QR_COLORS = [
  { id: 'black', name: 'Black', color: '#000000' },
  { id: 'purple', name: 'Purple', color: '#6366f1' },
  { id: 'blue', name: 'Blue', color: '#3b82f6' },
  { id: 'green', name: 'Green', color: '#10b981' },
  { id: 'orange', name: 'Brand', color: '#00fc83' },
  { id: 'red', name: 'Red', color: '#ef4444' },
  { id: 'pink', name: 'Pink', color: '#ec4899' },
];

interface FormData {
  // Personal
  name: string;
  title: string;
  company: string;
  bio: string;
  photo: string;
  logo: string;
  
  // Dynamic contact
  emails: EmailEntry[];
  phones: PhoneEntry[];
  websites: WebsiteEntry[];
  socials: SocialEntry[];
  
  // Address
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  
  // Design
  template: string;
  qrShape: string;
  qrColor: string;
  bgColor: string;
  accentColor: string;
  
  // NFC
  nfcEnabled: boolean;
}

export default function NewBusinessCardPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'contact' | 'design' | 'preview'>('info');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    title: '',
    company: '',
    bio: '',
    photo: '',
    logo: '',
    emails: [{ id: '1', email: '', type: 'work' }],
    phones: [{ id: '1', number: '', type: 'mobile' }],
    websites: [],
    socials: [],
    address: '',
    city: '',
    state: '',
    zip: '',
    country: 'USA',
    template: 'modern',
    qrShape: 'square',
    qrColor: '#000000',
    bgColor: '#1a1a2e',
    accentColor: '#6366f1',
    nfcEnabled: false,
  });

  // Photo upload handlers
  const handlePhotoUpload = async (file: File) => {
    setUploadingPhoto(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('type', 'business-card-photo');
      
      const res = await fetch('/api/uploads', {
        method: 'POST',
        body: formDataUpload,
      });
      
      const data = await res.json();
      if (data.url) {
        setFormData({ ...formData, photo: data.url });
      } else {
        alert('Error uploading photo');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Error uploading photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handlePhotoUpload(file);
    }
  };

  // Dynamic field handlers
  const addEmail = () => {
    setFormData({
      ...formData,
      emails: [...formData.emails, { id: Date.now().toString(), email: '', type: 'work' }],
    });
  };

  const removeEmail = (id: string) => {
    setFormData({
      ...formData,
      emails: formData.emails.filter(e => e.id !== id),
    });
  };

  const updateEmail = (id: string, field: keyof EmailEntry, value: string) => {
    setFormData({
      ...formData,
      emails: formData.emails.map(e => e.id === id ? { ...e, [field]: value } : e),
    });
  };

  const addPhone = () => {
    setFormData({
      ...formData,
      phones: [...formData.phones, { id: Date.now().toString(), number: '', type: 'mobile' }],
    });
  };

  const removePhone = (id: string) => {
    setFormData({
      ...formData,
      phones: formData.phones.filter(p => p.id !== id),
    });
  };

  const updatePhone = (id: string, field: keyof PhoneEntry, value: string) => {
    setFormData({
      ...formData,
      phones: formData.phones.map(p => p.id === id ? { ...p, [field]: value } : p),
    });
  };

  const addWebsite = () => {
    setFormData({
      ...formData,
      websites: [...formData.websites, { id: Date.now().toString(), url: '', type: 'website' }],
    });
  };

  const removeWebsite = (id: string) => {
    setFormData({
      ...formData,
      websites: formData.websites.filter(w => w.id !== id),
    });
  };

  const updateWebsite = (id: string, field: keyof WebsiteEntry, value: string) => {
    setFormData({
      ...formData,
      websites: formData.websites.map(w => w.id === id ? { ...w, [field]: value } : w),
    });
  };

  const addSocial = () => {
    setFormData({
      ...formData,
      socials: [...formData.socials, { id: Date.now().toString(), platform: 'linkedin', username: '' }],
    });
  };

  const removeSocial = (id: string) => {
    setFormData({
      ...formData,
      socials: formData.socials.filter(s => s.id !== id),
    });
  };

  const updateSocial = (id: string, field: keyof SocialEntry, value: string) => {
    setFormData({
      ...formData,
      socials: formData.socials.map(s => s.id === id ? { ...s, [field]: value } : s),
    });
  };

  const handleTemplateSelect = (template: typeof TEMPLATES[0]) => {
    setFormData({
      ...formData,
      template: template.id,
      bgColor: template.colors.bg,
      accentColor: template.colors.accent,
    });
  };

  const handleSave = async () => {
    if (!formData.name) {
      alert('Please enter a name');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/products/business-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const data = await res.json();
      if (data.success) {
        router.push(`/products/business-cards/${data.card.id}`);
      } else {
        alert('Error creating card: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving card:', error);
      alert('Error saving card');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        capture="user"
        className="hidden"
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/products/business-cards"
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Create Business Card</h1>
            <p className="text-muted-foreground">Design your digital vCard with custom QR code</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save Card
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-secondary rounded-lg w-fit">
        {[
          { key: 'info', label: 'Personal Info', icon: User },
          { key: 'contact', label: 'Contact & Social', icon: Phone },
          { key: 'design', label: 'Design & QR', icon: QrCode },
          { key: 'preview', label: 'Preview', icon: Eye },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
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

      {/* Personal Info Tab */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-2 gap-6">
          {/* Photo Upload */}
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Camera className="w-4 h-4 text-purple-500" />
              Profile Photo
            </h3>
            
            <div className="flex items-center gap-6">
              {/* Photo Preview */}
              <div className="relative">
                {formData.photo ? (
                  <img 
                    src={formData.photo}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover border-4 border-purple-500"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center text-3xl font-bold text-muted-foreground border-4 border-border">
                    {formData.name?.charAt(0) || '?'}
                  </div>
                )}
                {uploadingPhoto && (
                  <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-white" />
                  </div>
                )}
              </div>
              
              {/* Upload Buttons */}
              <div className="space-y-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors w-full"
                >
                  <Upload className="w-4 h-4" />
                  Upload Photo
                </button>
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors w-full"
                >
                  <Camera className="w-4 h-4" />
                  Take Photo
                </button>
                {formData.photo && (
                  <button
                    onClick={() => setFormData({ ...formData, photo: '' })}
                    className="flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors w-full"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove
                  </button>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Or enter photo URL
              </label>
              <input
                type="url"
                value={formData.photo}
                onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
                className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
                placeholder="https://example.com/photo.jpg"
              />
            </div>
          </div>

          {/* Personal Info */}
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <User className="w-4 h-4 text-purple-500" />
              Personal Information
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
                placeholder="John Doe"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Job Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
                placeholder="CEO & Founder"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Company / Organization
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
                placeholder="Acme Inc."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Bio / About
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full px-3 py-2 bg-secondary border border-border rounded-lg resize-none"
                rows={3}
                placeholder="Brief description about yourself..."
              />
            </div>
          </div>

          {/* Address */}
          <div className="bg-card border border-border rounded-lg p-6 space-y-4 col-span-2">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <MapPin className="w-4 h-4 text-green-500" />
              Address (Optional)
            </h3>
            
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1">
                  Street Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
                  placeholder="123 Main St"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    ZIP
                  </label>
                  <input
                    type="text"
                    value={formData.zip}
                    onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contact & Social Tab */}
      {activeTab === 'contact' && (
        <div className="grid grid-cols-2 gap-6">
          {/* Emails */}
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-500" />
                Email Addresses
              </h3>
              <button
                onClick={addEmail}
                className="flex items-center gap-1 px-2 py-1 text-sm bg-blue-500/20 text-blue-500 rounded hover:bg-blue-500/30 transition-colors"
              >
                <Plus className="w-3 h-3" />
                Add
              </button>
            </div>
            
            <div className="space-y-3">
              {formData.emails.map((email) => (
                <div key={email.id} className="flex items-center gap-2">
                  <select
                    value={email.type}
                    onChange={(e) => updateEmail(email.id, 'type', e.target.value)}
                    className="px-2 py-2 bg-secondary border border-border rounded-lg text-sm"
                  >
                    {EMAIL_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  <input
                    type="email"
                    value={email.email}
                    onChange={(e) => updateEmail(email.id, 'email', e.target.value)}
                    className="flex-1 px-3 py-2 bg-secondary border border-border rounded-lg"
                    placeholder="email@example.com"
                  />
                  {formData.emails.length > 1 && (
                    <button
                      onClick={() => removeEmail(email.id)}
                      className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Phones */}
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Phone className="w-4 h-4 text-green-500" />
                Phone Numbers
              </h3>
              <button
                onClick={addPhone}
                className="flex items-center gap-1 px-2 py-1 text-sm bg-green-500/20 text-green-500 rounded hover:bg-green-500/30 transition-colors"
              >
                <Plus className="w-3 h-3" />
                Add
              </button>
            </div>
            
            <div className="space-y-3">
              {formData.phones.map((phone) => (
                <div key={phone.id} className="flex items-center gap-2">
                  <select
                    value={phone.type}
                    onChange={(e) => updatePhone(phone.id, 'type', e.target.value)}
                    className="px-2 py-2 bg-secondary border border-border rounded-lg text-sm"
                  >
                    {PHONE_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    value={phone.number}
                    onChange={(e) => updatePhone(phone.id, 'number', e.target.value)}
                    className="flex-1 px-3 py-2 bg-secondary border border-border rounded-lg"
                    placeholder="+1 (555) 123-4567"
                  />
                  {formData.phones.length > 1 && (
                    <button
                      onClick={() => removePhone(phone.id)}
                      className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Websites */}
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Globe className="w-4 h-4 text-brand" />
                Websites & Links
              </h3>
              <button
                onClick={addWebsite}
                className="flex items-center gap-1 px-2 py-1 text-sm bg-brand/20 text-brand rounded hover:bg-brand/30 transition-colors"
              >
                <Plus className="w-3 h-3" />
                Add
              </button>
            </div>
            
            <div className="space-y-3">
              {formData.websites.length === 0 && (
                <p className="text-sm text-muted-foreground">No websites added yet</p>
              )}
              {formData.websites.map((website) => (
                <div key={website.id} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <select
                      value={website.type}
                      onChange={(e) => updateWebsite(website.id, 'type', e.target.value)}
                      className="px-2 py-2 bg-secondary border border-border rounded-lg text-sm"
                    >
                      {WEBSITE_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                    <input
                      type="url"
                      value={website.url}
                      onChange={(e) => updateWebsite(website.id, 'url', e.target.value)}
                      className="flex-1 px-3 py-2 bg-secondary border border-border rounded-lg"
                      placeholder="https://example.com"
                    />
                    <button
                      onClick={() => removeWebsite(website.id)}
                      className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={website.label || ''}
                    onChange={(e) => updateWebsite(website.id, 'label', e.target.value)}
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm"
                    placeholder="Custom label (optional)"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Social Links */}
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-purple-500" />
                Social Profiles
              </h3>
              <button
                onClick={addSocial}
                className="flex items-center gap-1 px-2 py-1 text-sm bg-purple-500/20 text-purple-500 rounded hover:bg-purple-500/30 transition-colors"
              >
                <Plus className="w-3 h-3" />
                Add
              </button>
            </div>
            
            <div className="space-y-3">
              {formData.socials.length === 0 && (
                <p className="text-sm text-muted-foreground">No social profiles added yet</p>
              )}
              {formData.socials.map((social) => (
                <div key={social.id} className="flex items-center gap-2">
                  <select
                    value={social.platform}
                    onChange={(e) => updateSocial(social.id, 'platform', e.target.value)}
                    className="px-2 py-2 bg-secondary border border-border rounded-lg text-sm min-w-[140px]"
                  >
                    {SOCIAL_PLATFORMS.map(p => (
                      <option key={p.value} value={p.value}>{p.icon} {p.label}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={social.username}
                    onChange={(e) => updateSocial(social.id, 'username', e.target.value)}
                    className="flex-1 px-3 py-2 bg-secondary border border-border rounded-lg"
                    placeholder="@username or profile URL"
                  />
                  <button
                    onClick={() => removeSocial(social.id)}
                    className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* NFC Settings */}
          <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-lg p-6 space-y-4 col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Nfc className="w-4 h-4 text-purple-500" />
                  NFC Tap-to-Share
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Program NFC tags/cards to instantly share your contact info with a tap
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.nfcEnabled}
                  onChange={(e) => setFormData({ ...formData, nfcEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-secondary rounded-full peer peer-checked:bg-purple-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
            </div>
            
            {formData.nfcEnabled && (
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-sm text-foreground mb-2">
                  📱 <strong>How it works:</strong>
                </p>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Create and save your card first</li>
                  <li>Go to the card view page and click "Program NFC"</li>
                  <li>Hold an NFC tag/card to your phone</li>
                  <li>The tag will be programmed with your card URL</li>
                  <li>Anyone who taps the tag will see your contact card!</li>
                </ol>
                <p className="text-xs text-muted-foreground mt-3">
                  ⚠️ NFC writing requires Android Chrome. iOS can read but not write NFC tags.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Design Tab */}
      {activeTab === 'design' && (
        <div className="grid grid-cols-2 gap-6">
          {/* QR Code Shape */}
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <QrCode className="w-4 h-4 text-purple-500" />
              QR Code Shape
            </h3>
            <p className="text-sm text-muted-foreground">
              Choose a custom shape for your QR code
            </p>
            
            <div className="grid grid-cols-6 gap-2">
              {QR_SHAPES.map((shape) => (
                <button
                  key={shape.id}
                  onClick={() => setFormData({ ...formData, qrShape: shape.id })}
                  className={cn(
                    'p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1',
                    formData.qrShape === shape.id
                      ? 'border-purple-500 bg-purple-500/20'
                      : 'border-border hover:border-purple-500/50'
                  )}
                >
                  <span className="text-2xl">{shape.preview}</span>
                  <span className="text-xs text-muted-foreground">{shape.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* QR Color */}
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Palette className="w-4 h-4 text-blue-500" />
              QR Code Color
            </h3>
            
            <div className="flex flex-wrap gap-2">
              {QR_COLORS.map((color) => (
                <button
                  key={color.id}
                  onClick={() => setFormData({ ...formData, qrColor: color.color })}
                  className={cn(
                    'w-10 h-10 rounded-lg border-2 transition-all',
                    formData.qrColor === color.color
                      ? 'border-purple-500 ring-2 ring-purple-500/50'
                      : 'border-border hover:border-purple-500/50'
                  )}
                  style={{ backgroundColor: color.color }}
                  title={color.name}
                />
              ))}
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.qrColor}
                  onChange={(e) => setFormData({ ...formData, qrColor: e.target.value })}
                  className="w-10 h-10 rounded-lg cursor-pointer"
                />
                <span className="text-xs text-muted-foreground">Custom</span>
              </div>
            </div>
          </div>

          {/* Card Template */}
          <div className="bg-card border border-border rounded-lg p-6 space-y-4 col-span-2">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Image className="w-4 h-4 text-green-500" />
              Card Template
            </h3>
            
            <div className="grid grid-cols-5 gap-4">
              {TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  className={cn(
                    'relative rounded-lg border-2 overflow-hidden transition-all h-24',
                    formData.template === template.id
                      ? 'border-purple-500 ring-2 ring-purple-500/50'
                      : 'border-border hover:border-purple-500/50'
                  )}
                >
                  <div 
                    className="absolute inset-0"
                    style={{ backgroundColor: template.colors.bg }}
                  >
                    <div 
                      className="absolute bottom-0 left-0 right-0 h-1"
                      style={{ backgroundColor: template.colors.accent }}
                    />
                  </div>
                  <span 
                    className="absolute bottom-2 left-2 text-xs font-medium"
                    style={{ color: template.colors.accent }}
                  >
                    {template.name}
                  </span>
                </button>
              ))}
            </div>

            {/* Custom Colors */}
            <div className="flex items-center gap-6 pt-4 border-t border-border">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Background:</span>
                <input
                  type="color"
                  value={formData.bgColor}
                  onChange={(e) => setFormData({ ...formData, bgColor: e.target.value })}
                  className="w-8 h-8 rounded cursor-pointer"
                />
                <span className="text-xs font-mono text-muted-foreground">{formData.bgColor}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Accent:</span>
                <input
                  type="color"
                  value={formData.accentColor}
                  onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                  className="w-8 h-8 rounded cursor-pointer"
                />
                <span className="text-xs font-mono text-muted-foreground">{formData.accentColor}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Tab */}
      {activeTab === 'preview' && (
        <div className="flex justify-center">
          <div className="w-full max-w-md">
            {/* Card Preview */}
            <div 
              className="rounded-2xl overflow-hidden shadow-2xl"
              style={{ backgroundColor: formData.bgColor }}
            >
              {/* Header */}
              <div className="p-6 text-center">
                {formData.photo ? (
                  <img 
                    src={formData.photo} 
                    alt={formData.name}
                    className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-4"
                    style={{ borderColor: formData.accentColor }}
                  />
                ) : (
                  <div 
                    className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-bold text-white"
                    style={{ backgroundColor: formData.accentColor }}
                  >
                    {formData.name?.charAt(0) || '?'}
                  </div>
                )}
                <h2 className="text-xl font-bold text-white">{formData.name || 'Your Name'}</h2>
                {formData.title && (
                  <p className="text-white/70">{formData.title}</p>
                )}
                {formData.company && (
                  <p className="text-white/50 text-sm">{formData.company}</p>
                )}
              </div>

              {/* Contact Info */}
              <div className="px-6 pb-6 space-y-2">
                {formData.emails.filter(e => e.email).map((email) => (
                  <div key={email.id} className="flex items-center gap-3 text-white/80">
                    <Mail className="w-4 h-4" style={{ color: formData.accentColor }} />
                    <span className="text-sm">{email.email}</span>
                    <span className="text-xs text-white/40">({email.type})</span>
                  </div>
                ))}
                {formData.phones.filter(p => p.number).map((phone) => (
                  <div key={phone.id} className="flex items-center gap-3 text-white/80">
                    <Phone className="w-4 h-4" style={{ color: formData.accentColor }} />
                    <span className="text-sm">{phone.number}</span>
                    <span className="text-xs text-white/40">({phone.type})</span>
                  </div>
                ))}
                {formData.websites.filter(w => w.url).map((website) => (
                  <div key={website.id} className="flex items-center gap-3 text-white/80">
                    <Globe className="w-4 h-4" style={{ color: formData.accentColor }} />
                    <span className="text-sm">{website.label || website.url}</span>
                  </div>
                ))}
                {formData.address && (
                  <div className="flex items-center gap-3 text-white/80">
                    <MapPin className="w-4 h-4" style={{ color: formData.accentColor }} />
                    <span className="text-sm">
                      {formData.address}
                      {formData.city && `, ${formData.city}`}
                      {formData.state && `, ${formData.state}`}
                    </span>
                  </div>
                )}
              </div>

              {/* Social Icons */}
              {formData.socials.length > 0 && (
                <div className="px-6 pb-4 flex justify-center gap-3">
                  {formData.socials.map((social) => {
                    const platform = SOCIAL_PLATFORMS.find(p => p.value === social.platform);
                    return (
                      <div 
                        key={social.id}
                        className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
                        title={social.username}
                      >
                        <span>{platform?.icon || '🔗'}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* QR Code Placeholder */}
              <div className="p-6 flex justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                <div className="text-center">
                  <div 
                    className="w-32 h-32 rounded-lg flex items-center justify-center mx-auto mb-2"
                    style={{ backgroundColor: 'white' }}
                  >
                    <QrCode className="w-20 h-20" style={{ color: formData.qrColor }} />
                  </div>
                  <p className="text-white/50 text-xs">
                    {QR_SHAPES.find(s => s.id === formData.qrShape)?.preview} {QR_SHAPES.find(s => s.id === formData.qrShape)?.name} QR Code
                  </p>
                  {formData.nfcEnabled && (
                    <p className="text-purple-400 text-xs mt-1 flex items-center justify-center gap-1">
                      <Nfc className="w-3 h-3" />
                      NFC Enabled
                    </p>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div 
                className="h-2"
                style={{ backgroundColor: formData.accentColor }}
              />
            </div>

            <p className="text-center text-muted-foreground text-sm mt-4">
              This is a preview. The actual card will include a scannable QR code that saves your contact info.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
