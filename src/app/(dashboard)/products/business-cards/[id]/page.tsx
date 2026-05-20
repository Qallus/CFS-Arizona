'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ChevronLeft, 
  Edit, 
  Trash2, 
  Download, 
  Share2, 
  Copy, 
  QrCode,
  Mail,
  Phone,
  Globe,
  MapPin,
  Building,
  BarChart3,
  Eye,
  Loader2,
  ExternalLink,
  Nfc,
  Smartphone,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import QRCode from 'qrcode';

// Social icons
const SOCIAL_ICONS: Record<string, string> = {
  linkedin: '💼', twitter: '🐦', instagram: '📸', facebook: '👤',
  tiktok: '🎵', youtube: '▶️', github: '🐙', dribbble: '🏀',
  behance: '🎨', pinterest: '📌', snapchat: '👻', whatsapp: '💬',
  telegram: '✈️', discord: '🎮', twitch: '🎬', spotify: '🎧',
  soundcloud: '☁️', medium: '📝', substack: '📰', threads: '🧵',
  mastodon: '🐘', bluesky: '🦋', other: '🔗',
};

interface BusinessCard {
  id: string;
  name: string;
  title?: string;
  company?: string;
  bio?: string;
  photo?: string;
  emails?: Array<{ id: string; email: string; type: string; label?: string }>;
  phones?: Array<{ id: string; number: string; type: string; label?: string }>;
  websites?: Array<{ id: string; url: string; type: string; label?: string }>;
  socials?: Array<{ id: string; platform: string; username: string }>;
  email?: string;
  phone?: string;
  mobile?: string;
  website?: string;
  linkedin?: string;
  twitter?: string;
  instagram?: string;
  facebook?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  qrShape: string;
  qrColor: string;
  qrBgColor?: string;
  bgColor: string;
  accentColor: string;
  template: string;
  scanCount: number;
  saveCount: number;
  shareCount: number;
  nfcTapCount: number;
  nfcEnabled?: boolean;
  isActive: boolean;
  createdAt: string;
}

export default function BusinessCardViewPage() {
  const params = useParams();
  const router = useRouter();
  const [card, setCard] = useState<BusinessCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [nfcStatus, setNfcStatus] = useState<'idle' | 'writing' | 'success' | 'error' | 'unsupported'>('idle');
  const [nfcMessage, setNfcMessage] = useState('');

  useEffect(() => {
    fetchCard();
  }, [params.id]);

  useEffect(() => {
    if (card) {
      generateQrCode(card.id);
    }
  }, [card]);

  const fetchCard = async () => {
    try {
      const res = await fetch(`/api/products/business-cards?id=${params.id}`);
      const data = await res.json();
      if (data.card) {
        setCard(data.card);
      }
    } catch (error) {
      console.error('Error fetching card:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateQrCode = async (cardId: string) => {
    const url = `${window.location.origin}/card/vcard/${cardId}`;
    try {
      const qr = await QRCode.toDataURL(url, {
        width: 256,
        margin: 2,
        color: {
          dark: card?.qrColor || '#000000',
          light: card?.qrBgColor || '#ffffff',
        },
      });
      setQrCodeUrl(qr);
    } catch (err) {
      console.error('QR generation error:', err);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this business card?')) return;
    
    try {
      await fetch('/api/products/business-cards', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: card?.id }),
      });
      router.push('/products/business-cards');
    } catch (error) {
      console.error('Error deleting card:', error);
    }
  };

  const copyShareLink = () => {
    const url = `${window.location.origin}/card/vcard/${card?.id}`;
    navigator.clipboard.writeText(url);
    alert('Link copied to clipboard!');
  };

  const downloadVCard = () => {
    window.open(`/api/products/business-cards?id=${card?.id}&vcard=true`, '_blank');
  };

  const downloadQrCode = () => {
    if (qrCodeUrl) {
      const link = document.createElement('a');
      link.download = `${card?.name.replace(/\s+/g, '_')}_qr.png`;
      link.href = qrCodeUrl;
      link.click();
    }
  };

  // NFC Writing
  const writeNfc = async () => {
    if (!('NDEFReader' in window)) {
      setNfcStatus('unsupported');
      setNfcMessage('NFC is not supported on this device/browser. Use Chrome on Android.');
      return;
    }

    try {
      setNfcStatus('writing');
      setNfcMessage('Hold your NFC tag to the back of your phone...');

      // @ts-ignore - NDEFReader is not in TypeScript types yet
      const ndef = new NDEFReader();
      await ndef.write({
        records: [
          {
            recordType: 'url',
            data: `${window.location.origin}/card/vcard/${card?.id}?nfc=1`,
          },
        ],
      });

      setNfcStatus('success');
      setNfcMessage('NFC tag programmed successfully! Tap it with any phone to share your card.');
    } catch (error: any) {
      setNfcStatus('error');
      if (error.name === 'NotAllowedError') {
        setNfcMessage('NFC permission denied. Please allow NFC access.');
      } else if (error.name === 'NotSupportedError') {
        setNfcMessage('NFC is not supported on this device.');
      } else {
        setNfcMessage(`Error: ${error.message}`);
      }
    }
  };

  // Get display data (merge legacy and dynamic)
  const getEmails = () => {
    if (card?.emails?.length) return card.emails.filter(e => e.email);
    if (card?.email) return [{ id: '1', email: card.email, type: 'work' }];
    return [];
  };

  const getPhones = () => {
    if (card?.phones?.length) return card.phones.filter(p => p.number);
    const phones: any[] = [];
    if (card?.phone) phones.push({ id: '1', number: card.phone, type: 'work' });
    if (card?.mobile) phones.push({ id: '2', number: card.mobile, type: 'mobile' });
    return phones;
  };

  const getWebsites = () => {
    if (card?.websites?.length) return card.websites.filter(w => w.url);
    if (card?.website) return [{ id: '1', url: card.website, type: 'website' }];
    return [];
  };

  const getSocials = () => {
    if (card?.socials?.length) return card.socials.filter(s => s.username);
    const socials: any[] = [];
    if (card?.linkedin) socials.push({ id: '1', platform: 'linkedin', username: card.linkedin });
    if (card?.twitter) socials.push({ id: '2', platform: 'twitter', username: card.twitter });
    if (card?.instagram) socials.push({ id: '3', platform: 'instagram', username: card.instagram });
    if (card?.facebook) socials.push({ id: '4', platform: 'facebook', username: card.facebook });
    return socials;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!card) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Business card not found</p>
        <Link href="/products/business-cards" className="text-purple-500 hover:underline">
          Back to cards
        </Link>
      </div>
    );
  }

  const publicUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/card/vcard/${card.id}`;
  const emails = getEmails();
  const phones = getPhones();
  const websites = getWebsites();
  const socials = getSocials();

  return (
    <div className="p-6 space-y-6">
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
            <h1 className="text-2xl font-bold text-foreground">{card.name}</h1>
            <p className="text-muted-foreground">{card.title} {card.company && `at ${card.company}`}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/products/business-cards/${card.id}/edit`}
            className="flex items-center gap-2 px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            <Edit className="w-4 h-4" />
            Edit Card
          </Link>
          <button
            onClick={copyShareLink}
            className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
          >
            <Copy className="w-4 h-4" />
            Copy Link
          </button>
          <button
            onClick={downloadVCard}
            className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download vCard
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-3 py-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/30 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <QrCode className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">QR Scans</p>
              <p className="text-2xl font-bold text-foreground">{card.scanCount || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Nfc className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">NFC Taps</p>
              <p className="text-2xl font-bold text-foreground">{card.nfcTapCount || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Download className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Saves</p>
              <p className="text-2xl font-bold text-foreground">{card.saveCount || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand/20 rounded-lg">
              <Share2 className="w-5 h-5 text-brand" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Shares</p>
              <p className="text-2xl font-bold text-foreground">{card.shareCount || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/20 rounded-lg">
              <Eye className="w-5 h-5 text-cyan-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className={cn(
                'text-lg font-bold',
                card.isActive ? 'text-green-500' : 'text-gray-500'
              )}>
                {card.isActive ? 'Active' : 'Inactive'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Card Preview */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="font-semibold text-foreground mb-4">Card Preview</h3>
          
          <div 
            className="rounded-2xl overflow-hidden shadow-xl"
            style={{ backgroundColor: card.bgColor }}
          >
            {/* Header */}
            <div className="p-5 text-center">
              {card.photo ? (
                <img 
                  src={card.photo} 
                  alt={card.name}
                  className="w-16 h-16 rounded-full mx-auto mb-3 object-cover border-3"
                  style={{ borderColor: card.accentColor }}
                />
              ) : (
                <div 
                  className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-xl font-bold text-white"
                  style={{ backgroundColor: card.accentColor }}
                >
                  {card.name?.charAt(0) || '?'}
                </div>
              )}
              <h2 className="text-base font-bold text-white">{card.name}</h2>
              {card.title && <p className="text-white/70 text-sm">{card.title}</p>}
              {card.company && <p className="text-white/50 text-xs">{card.company}</p>}
            </div>

            {/* Contact Info */}
            <div className="px-4 pb-3 space-y-1">
              {emails.slice(0, 1).map(e => (
                <div key={e.id} className="flex items-center gap-2 text-white/80 text-xs">
                  <Mail className="w-3 h-3" style={{ color: card.accentColor }} />
                  {e.email}
                </div>
              ))}
              {phones.slice(0, 1).map(p => (
                <div key={p.id} className="flex items-center gap-2 text-white/80 text-xs">
                  <Phone className="w-3 h-3" style={{ color: card.accentColor }} />
                  {p.number}
                </div>
              ))}
            </div>

            {/* Social Icons */}
            {socials.length > 0 && (
              <div className="px-4 pb-3 flex justify-center gap-2">
                {socials.slice(0, 4).map(s => (
                  <span key={s.id} className="text-sm">{SOCIAL_ICONS[s.platform] || '🔗'}</span>
                ))}
              </div>
            )}

            {/* Footer */}
            <div className="h-1" style={{ backgroundColor: card.accentColor }} />
          </div>
        </div>

        {/* QR Code */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="font-semibold text-foreground mb-4">QR Code</h3>
          
          <div className="text-center">
            {qrCodeUrl ? (
              <img 
                src={qrCodeUrl} 
                alt="QR Code"
                className="mx-auto mb-4 rounded-lg"
              />
            ) : (
              <div className="w-64 h-64 mx-auto mb-4 bg-secondary rounded-lg flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            )}
            
            <p className="text-sm text-muted-foreground mb-4">
              Scan to view contact info
            </p>
            
            <button
              onClick={downloadQrCode}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors mx-auto"
            >
              <Download className="w-4 h-4" />
              Download QR
            </button>
          </div>
        </div>

        {/* NFC Programming */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Nfc className="w-4 h-4 text-purple-500" />
            NFC Tap-to-Share
          </h3>
          
          <div className="text-center space-y-4">
            <div className="w-24 h-24 mx-auto rounded-full bg-purple-500/20 flex items-center justify-center">
              <Smartphone className="w-12 h-12 text-purple-500" />
            </div>
            
            <p className="text-sm text-muted-foreground">
              Program an NFC tag/card to share your contact info with a tap
            </p>
            
            <button
              onClick={writeNfc}
              disabled={nfcStatus === 'writing'}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors mx-auto',
                nfcStatus === 'success'
                  ? 'bg-green-500 text-white'
                  : nfcStatus === 'error' || nfcStatus === 'unsupported'
                  ? 'bg-red-500/20 text-red-500'
                  : 'bg-purple-500 text-white hover:bg-purple-600'
              )}
            >
              {nfcStatus === 'writing' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Writing...
                </>
              ) : (
                <>
                  <Nfc className="w-4 h-4" />
                  Program NFC Tag
                </>
              )}
            </button>
            
            {nfcMessage && (
              <p className={cn(
                'text-sm',
                nfcStatus === 'success' ? 'text-green-500' : 
                nfcStatus === 'error' || nfcStatus === 'unsupported' ? 'text-red-500' :
                'text-muted-foreground'
              )}>
                {nfcMessage}
              </p>
            )}
            
            <div className="text-xs text-muted-foreground pt-4 border-t border-border">
              <p className="font-medium mb-2">Compatible NFC products:</p>
              <ul className="space-y-1">
                <li>• NFC business cards</li>
                <li>• NFC stickers/tags</li>
                <li>• NFC keychains</li>
                <li>• Phone case NFC spots</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Public URL */}
      <div className="bg-card border border-border rounded-lg p-4">
        <p className="text-sm text-muted-foreground mb-2">Public URL:</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-sm bg-secondary p-3 rounded-lg overflow-x-auto">
            {publicUrl}
          </code>
          <button
            onClick={copyShareLink}
            className="p-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            <Copy className="w-4 h-4" />
          </button>
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
          >
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
          </a>
        </div>
      </div>

      {/* Full Contact Details */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="font-semibold text-foreground mb-4">Contact Details</h3>
        
        <div className="grid grid-cols-4 gap-6">
          {/* Emails */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground uppercase flex items-center gap-2">
              <Mail className="w-4 h-4" /> Emails
            </h4>
            {emails.length > 0 ? emails.map(e => (
              <p key={e.id} className="text-sm">
                <a href={`mailto:${e.email}`} className="text-purple-500 hover:underline">{e.email}</a>
                <span className="text-muted-foreground text-xs ml-1">({e.type})</span>
              </p>
            )) : (
              <p className="text-muted-foreground text-sm">No emails</p>
            )}
          </div>

          {/* Phones */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground uppercase flex items-center gap-2">
              <Phone className="w-4 h-4" /> Phones
            </h4>
            {phones.length > 0 ? phones.map(p => (
              <p key={p.id} className="text-sm">
                <a href={`tel:${p.number}`} className="text-purple-500 hover:underline">{p.number}</a>
                <span className="text-muted-foreground text-xs ml-1">({p.type})</span>
              </p>
            )) : (
              <p className="text-muted-foreground text-sm">No phones</p>
            )}
          </div>

          {/* Websites */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground uppercase flex items-center gap-2">
              <Globe className="w-4 h-4" /> Websites
            </h4>
            {websites.length > 0 ? websites.map(w => (
              <p key={w.id} className="text-sm">
                <a href={w.url} target="_blank" className="text-purple-500 hover:underline truncate block">{w.label || w.url}</a>
                <span className="text-muted-foreground text-xs">({w.type})</span>
              </p>
            )) : (
              <p className="text-muted-foreground text-sm">No websites</p>
            )}
          </div>

          {/* Social */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground uppercase">Social</h4>
            {socials.length > 0 ? socials.map(s => (
              <p key={s.id} className="text-sm flex items-center gap-2">
                <span>{SOCIAL_ICONS[s.platform] || '🔗'}</span>
                <span className="truncate">{s.username}</span>
              </p>
            )) : (
              <p className="text-muted-foreground text-sm">No social links</p>
            )}
          </div>
        </div>

        {/* Address & Bio */}
        {(card.address || card.bio) && (
          <div className="mt-6 pt-6 border-t border-border grid grid-cols-2 gap-6">
            {card.address && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground uppercase mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Address
                </h4>
                <p className="text-foreground">
                  {card.address}
                  {card.city && <>, {card.city}</>}
                  {card.state && <>, {card.state}</>}
                  {card.zip && <> {card.zip}</>}
                  {card.country && <><br />{card.country}</>}
                </p>
              </div>
            )}
            {card.bio && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground uppercase mb-2">Bio</h4>
                <p className="text-foreground">{card.bio}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
