'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Image as ImageIcon,
  QrCode,
  Plus,
  Download,
  Copy,
  Check,
  Trash2,
  Edit,
  Search,
  Loader2,
  Link as LinkIcon,
  Type,
  Phone,
  Mail,
  Wifi,
  MapPin,
  Calendar,
  X,
  Settings,
  Palette,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import QRCode from 'qrcode';

type TabType = 'designs' | 'qr-generator';

interface Design {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  category?: string;
  tags?: string[];
  createdAt: string;
}

interface SavedQR {
  id: string;
  name: string;
  type: string;
  data: string;
  dataUrl: string;
  settings: QRSettings;
  createdAt: string;
}

interface QRSettings {
  size: number;
  foreground: string;
  background: string;
  errorCorrection: 'L' | 'M' | 'Q' | 'H';
  margin: number;
}

const TABS = [
  { key: 'designs' as TabType, label: 'Designs', icon: ImageIcon },
  { key: 'qr-generator' as TabType, label: 'QR Code Generator', icon: QrCode },
];

const QR_TYPES = [
  { key: 'url', label: 'URL / Link', icon: LinkIcon, placeholder: 'https://example.com' },
  { key: 'text', label: 'Plain Text', icon: Type, placeholder: 'Enter your text...' },
  { key: 'phone', label: 'Phone Number', icon: Phone, placeholder: '+1 (555) 123-4567' },
  { key: 'email', label: 'Email', icon: Mail, placeholder: 'email@example.com' },
  { key: 'wifi', label: 'WiFi Network', icon: Wifi, placeholder: 'Network Name' },
  { key: 'location', label: 'Location', icon: MapPin, placeholder: 'Address or coordinates' },
  { key: 'event', label: 'Calendar Event', icon: Calendar, placeholder: 'Event details' },
];

const DEFAULT_QR_SETTINGS: QRSettings = {
  size: 256,
  foreground: '#000000',
  background: '#ffffff',
  errorCorrection: 'M',
  margin: 2,
};

export default function PortfolioPage() {
  const [activeTab, setActiveTab] = useState<TabType>('designs');
  const [designs, setDesigns] = useState<Design[]>([]);
  const [savedQRs, setSavedQRs] = useState<SavedQR[]>([]);
  const [loading, setLoading] = useState(false);
  
  // QR Generator state
  const [qrType, setQrType] = useState('url');
  const [qrData, setQrData] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrSettings, setQrSettings] = useState<QRSettings>(DEFAULT_QR_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [wifiPassword, setWifiPassword] = useState('');
  const [wifiEncryption, setWifiEncryption] = useState<'WPA' | 'WEP' | 'nopass'>('WPA');
  const [copied, setCopied] = useState(false);
  const [qrName, setQrName] = useState('');

  // Generate QR code when data or settings change
  useEffect(() => {
    if (qrData) {
      generateQR();
    } else {
      setQrDataUrl(null);
    }
  }, [qrData, qrSettings, qrType, wifiPassword, wifiEncryption]);

  // Load saved QRs from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('savedQRCodes');
    if (saved) {
      setSavedQRs(JSON.parse(saved));
    }
  }, []);

  const generateQR = async () => {
    try {
      let finalData = qrData;
      
      // Format data based on type
      switch (qrType) {
        case 'phone':
          finalData = `tel:${qrData.replace(/\D/g, '')}`;
          break;
        case 'email':
          finalData = `mailto:${qrData}`;
          break;
        case 'wifi':
          finalData = `WIFI:T:${wifiEncryption};S:${qrData};P:${wifiPassword};;`;
          break;
        case 'location':
          if (!qrData.startsWith('geo:')) {
            // If it's an address, just use it as-is for Google Maps
            finalData = `https://maps.google.com/?q=${encodeURIComponent(qrData)}`;
          }
          break;
      }
      
      const url = await QRCode.toDataURL(finalData, {
        width: qrSettings.size,
        margin: qrSettings.margin,
        color: {
          dark: qrSettings.foreground,
          light: qrSettings.background,
        },
        errorCorrectionLevel: qrSettings.errorCorrection,
      });
      
      setQrDataUrl(url);
    } catch (error) {
      console.error('QR generation error:', error);
    }
  };

  const downloadQR = () => {
    if (!qrDataUrl) return;
    
    const link = document.createElement('a');
    link.download = `qr-code-${qrName || Date.now()}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  const copyQR = async () => {
    if (!qrDataUrl) return;
    
    try {
      const blob = await fetch(qrDataUrl).then(r => r.blob());
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Copy error:', error);
    }
  };

  const saveQR = () => {
    if (!qrDataUrl || !qrName) return;
    
    const newQR: SavedQR = {
      id: `qr-${Date.now()}`,
      name: qrName,
      type: qrType,
      data: qrData,
      dataUrl: qrDataUrl,
      settings: qrSettings,
      createdAt: new Date().toISOString(),
    };
    
    const updated = [newQR, ...savedQRs];
    setSavedQRs(updated);
    localStorage.setItem('savedQRCodes', JSON.stringify(updated));
    setQrName('');
  };

  const deleteQR = (id: string) => {
    const updated = savedQRs.filter(qr => qr.id !== id);
    setSavedQRs(updated);
    localStorage.setItem('savedQRCodes', JSON.stringify(updated));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Portfolio</h1>
          <p className="text-muted-foreground">Designs, assets, and tools</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-secondary rounded-lg w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
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

      {/* Designs Tab */}
      {activeTab === 'designs' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search designs..."
                className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded-lg"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-brand text-brand-foreground rounded-lg hover:bg-brand/90">
              <Plus className="w-4 h-4" />
              Upload Design
            </button>
          </div>
          
          {designs.length === 0 ? (
            <div className="text-center py-16">
              <ImageIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Designs Yet</h3>
              <p className="text-muted-foreground mb-4">Upload your first design to get started.</p>
              <button className="px-4 py-2 bg-brand text-brand-foreground rounded-lg hover:bg-brand/90">
                Upload Design
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {designs.map((design) => (
                <div key={design.id} className="bg-card border border-border rounded-lg overflow-hidden hover:border-brand/50 transition-colors">
                  <div className="aspect-square bg-secondary flex items-center justify-center">
                    {design.imageUrl ? (
                      <img src={design.imageUrl} alt={design.name} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-12 h-12 text-muted-foreground" />
                    )}
                  </div>
                  <div className="p-3">
                    <h4 className="font-medium text-foreground truncate">{design.name}</h4>
                    {design.category && (
                      <span className="text-xs text-muted-foreground">{design.category}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* QR Code Generator Tab */}
      {activeTab === 'qr-generator' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Generator Panel */}
          <div className="space-y-6">
            {/* QR Type Selection */}
            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="font-semibold text-foreground mb-3">QR Code Type</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {QR_TYPES.map((type) => (
                  <button
                    key={type.key}
                    onClick={() => {
                      setQrType(type.key);
                      setQrData('');
                    }}
                    className={cn(
                      'flex flex-col items-center gap-2 p-3 rounded-lg transition-colors',
                      qrType === type.key
                        ? 'bg-brand text-brand-foreground'
                        : 'bg-secondary text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <type.icon className="w-5 h-5" />
                    <span className="text-xs font-medium">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Data Input */}
            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="font-semibold text-foreground mb-3">Content</h3>
              
              {qrType === 'wifi' ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">Network Name (SSID)</label>
                    <input
                      type="text"
                      value={qrData}
                      onChange={(e) => setQrData(e.target.value)}
                      placeholder="Network Name"
                      className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">Password</label>
                    <input
                      type="text"
                      value={wifiPassword}
                      onChange={(e) => setWifiPassword(e.target.value)}
                      placeholder="Password"
                      className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">Encryption</label>
                    <select
                      value={wifiEncryption}
                      onChange={(e) => setWifiEncryption(e.target.value as any)}
                      className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
                    >
                      <option value="WPA">WPA/WPA2</option>
                      <option value="WEP">WEP</option>
                      <option value="nopass">None (Open)</option>
                    </select>
                  </div>
                </div>
              ) : (
                <textarea
                  value={qrData}
                  onChange={(e) => setQrData(e.target.value)}
                  placeholder={QR_TYPES.find(t => t.key === qrType)?.placeholder}
                  rows={3}
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg resize-none"
                />
              )}
            </div>

            {/* Settings */}
            <div className="bg-card border border-border rounded-lg p-4">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center justify-between w-full"
              >
                <h3 className="font-semibold text-foreground">Customize</h3>
                <Settings className={cn('w-4 h-4 text-muted-foreground transition-transform', showSettings && 'rotate-90')} />
              </button>
              
              {showSettings && (
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">Size (px)</label>
                      <input
                        type="number"
                        value={qrSettings.size}
                        onChange={(e) => setQrSettings({ ...qrSettings, size: parseInt(e.target.value) || 256 })}
                        min={64}
                        max={1024}
                        className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">Margin</label>
                      <input
                        type="number"
                        value={qrSettings.margin}
                        onChange={(e) => setQrSettings({ ...qrSettings, margin: parseInt(e.target.value) || 2 })}
                        min={0}
                        max={10}
                        className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">Foreground</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={qrSettings.foreground}
                          onChange={(e) => setQrSettings({ ...qrSettings, foreground: e.target.value })}
                          className="w-10 h-10 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={qrSettings.foreground}
                          onChange={(e) => setQrSettings({ ...qrSettings, foreground: e.target.value })}
                          className="flex-1 px-3 py-2 bg-secondary border border-border rounded-lg font-mono text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">Background</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={qrSettings.background}
                          onChange={(e) => setQrSettings({ ...qrSettings, background: e.target.value })}
                          className="w-10 h-10 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={qrSettings.background}
                          onChange={(e) => setQrSettings({ ...qrSettings, background: e.target.value })}
                          className="flex-1 px-3 py-2 bg-secondary border border-border rounded-lg font-mono text-sm"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">Error Correction</label>
                    <select
                      value={qrSettings.errorCorrection}
                      onChange={(e) => setQrSettings({ ...qrSettings, errorCorrection: e.target.value as any })}
                      className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
                    >
                      <option value="L">Low (7%)</option>
                      <option value="M">Medium (15%)</option>
                      <option value="Q">Quartile (25%)</option>
                      <option value="H">High (30%)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Preview & Actions Panel */}
          <div className="space-y-6">
            {/* QR Preview */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-semibold text-foreground mb-4 text-center">Preview</h3>
              
              <div className="flex items-center justify-center p-4 bg-white rounded-lg min-h-[300px]">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="QR Code" className="max-w-full" />
                ) : (
                  <div className="text-center text-gray-400">
                    <QrCode className="w-16 h-16 mx-auto mb-2" />
                    <p>Enter content to generate QR code</p>
                  </div>
                )}
              </div>
              
              {qrDataUrl && (
                <div className="mt-4 space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={qrName}
                      onChange={(e) => setQrName(e.target.value)}
                      placeholder="Name this QR code..."
                      className="flex-1 px-3 py-2 bg-secondary border border-border rounded-lg"
                    />
                    <button
                      onClick={saveQR}
                      disabled={!qrName}
                      className="px-4 py-2 bg-brand text-brand-foreground rounded-lg hover:bg-brand/90 disabled:opacity-50"
                    >
                      Save
                    </button>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={downloadQR}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80"
                    >
                      <Download className="w-4 h-4" />
                      Download PNG
                    </button>
                    <button
                      onClick={copyQR}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Saved QR Codes */}
            {savedQRs.length > 0 && (
              <div className="bg-card border border-border rounded-lg p-4">
                <h3 className="font-semibold text-foreground mb-3">Saved QR Codes</h3>
                <div className="grid grid-cols-3 gap-3">
                  {savedQRs.map((qr) => (
                    <div key={qr.id} className="relative group">
                      <div className="bg-white rounded-lg p-2">
                        <img src={qr.dataUrl} alt={qr.name} className="w-full" />
                      </div>
                      <div className="mt-1 text-xs text-center truncate">{qr.name}</div>
                      <button
                        onClick={() => deleteQR(qr.id)}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
