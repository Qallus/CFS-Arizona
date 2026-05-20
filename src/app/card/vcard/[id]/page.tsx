'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { 
  Download, 
  Mail, 
  Phone, 
  Globe, 
  MapPin, 
  Share2,
  Loader2,
  Building,
  User,
  ExternalLink,
  QrCode,
  X,
} from 'lucide-react';
import QRCode from 'qrcode';

// Social platform icons (using emoji for simplicity)
const SOCIAL_ICONS: Record<string, string> = {
  linkedin: '💼',
  twitter: '🐦',
  instagram: '📸',
  facebook: '👤',
  tiktok: '🎵',
  youtube: '▶️',
  github: '🐙',
  dribbble: '🏀',
  behance: '🎨',
  pinterest: '📌',
  snapchat: '👻',
  whatsapp: '💬',
  telegram: '✈️',
  discord: '🎮',
  twitch: '🎬',
  spotify: '🎧',
  soundcloud: '☁️',
  medium: '📝',
  substack: '📰',
  threads: '🧵',
  mastodon: '🐘',
  bluesky: '🦋',
  other: '🔗',
};

const SOCIAL_URL_TEMPLATES: Record<string, string> = {
  linkedin: 'https://linkedin.com/in/',
  twitter: 'https://twitter.com/',
  instagram: 'https://instagram.com/',
  facebook: 'https://facebook.com/',
  tiktok: 'https://tiktok.com/@',
  youtube: 'https://youtube.com/@',
  github: 'https://github.com/',
  dribbble: 'https://dribbble.com/',
  behance: 'https://behance.net/',
  pinterest: 'https://pinterest.com/',
  snapchat: 'https://snapchat.com/add/',
  whatsapp: 'https://wa.me/',
  telegram: 'https://t.me/',
  twitch: 'https://twitch.tv/',
  spotify: 'https://open.spotify.com/user/',
  soundcloud: 'https://soundcloud.com/',
  medium: 'https://medium.com/@',
  threads: 'https://threads.net/@',
  bluesky: 'https://bsky.app/profile/',
};

interface PhoneEntry {
  id: string;
  number: string;
  type: string;
  label?: string;
}

interface EmailEntry {
  id: string;
  email: string;
  type: string;
  label?: string;
}

interface WebsiteEntry {
  id: string;
  url: string;
  type: string;
  label?: string;
}

interface SocialEntry {
  id: string;
  platform: string;
  username: string;
  url?: string;
}

interface BusinessCard {
  id: string;
  name: string;
  title?: string;
  company?: string;
  bio?: string;
  photo?: string;
  logo?: string;
  bgColor: string;
  bgImage?: string;
  accentColor: string;
  
  // Advanced colors
  iconBgColor?: string;
  iconColor?: string;
  sectionBgColor?: string;
  sectionTitleColor?: string;
  contentColor?: string;
  nameColor?: string;
  titleColor?: string;
  companyColor?: string;
  bioColor?: string;
  buttonBgColor?: string;
  buttonTextColor?: string;
  
  // Dynamic fields
  emails?: EmailEntry[];
  phones?: PhoneEntry[];
  websites?: WebsiteEntry[];
  socials?: SocialEntry[];
  
  // Legacy fields
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
  
  nfcEnabled?: boolean;
}

const PHONE_TYPE_LABELS: Record<string, string> = {
  mobile: 'Mobile',
  work: 'Work',
  home: 'Home',
  fax: 'Fax',
  pager: 'Pager',
  other: 'Other',
};

const WEBSITE_TYPE_LABELS: Record<string, string> = {
  website: 'Website',
  portfolio: 'Portfolio',
  blog: 'Blog',
  shop: 'Shop',
  booking: 'Book Now',
  calendar: 'Schedule',
  payment: 'Pay Me',
  other: 'Link',
};

export default function PublicVCardPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [card, setCard] = useState<BusinessCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [showQrModal, setShowQrModal] = useState(false);

  // Check if this is an NFC tap (via query param)
  const isNfcTap = searchParams.get('nfc') === '1';
  // Embed mode - for iframe embedding on external sites
  const isEmbed = searchParams.get('embed') === '1';

  useEffect(() => {
    fetchCard();
    trackVisit();
  }, [params.id]);

  useEffect(() => {
    if (card) {
      generateQrCode();
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

  const generateQrCode = async () => {
    const url = typeof window !== 'undefined' 
      ? `${window.location.origin}/card/vcard/${params.id}`
      : '';
    try {
      const qr = await QRCode.toDataURL(url, {
        width: 280,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
      setQrCodeUrl(qr);
    } catch (err) {
      console.error('QR generation error:', err);
    }
  };

  const trackVisit = async () => {
    try {
      // Track as NFC tap or regular scan
      const body = isNfcTap 
        ? { id: params.id, incrementNfcTap: true }
        : { id: params.id, incrementScan: true };
      
      await fetch('/api/products/business-cards', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch (error) {
      console.error('Error tracking visit:', error);
    }
  };

  const saveContact = async () => {
    // Track save
    try {
      await fetch('/api/products/business-cards', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: params.id, incrementSave: true }),
      });
    } catch (error) {
      console.error('Error tracking save:', error);
    }

    // Download vCard
    window.location.href = `/api/products/business-cards?id=${params.id}&vcard=true`;
    setSaved(true);
  };

  const [shareMessage, setShareMessage] = useState('');

  const shareCard = async () => {
    // Track share
    try {
      await fetch('/api/products/business-cards', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: params.id, incrementShare: true }),
      });
    } catch (error) {
      console.error('Error tracking share:', error);
    }

    // Clean URL for sharing (remove embed/nfc params)
    const shareUrl = window.location.origin + `/card/vcard/${params.id}`;

    // Try native share first (works on mobile, may fail in iframes)
    if (navigator.share && !isEmbed) {
      try {
        await navigator.share({
          title: `${card?.name}'s Contact Card`,
          text: `Contact information for ${card?.name}`,
          url: shareUrl,
        });
        return;
      } catch (err) {
        // User cancelled or not supported, fall through to clipboard
      }
    }
    
    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareMessage('Link copied!');
      setTimeout(() => setShareMessage(''), 2000);
    } catch (err) {
      // Last resort: show the URL
      setShareMessage(shareUrl);
      setTimeout(() => setShareMessage(''), 5000);
    }
  };

  // Get social URL from entry
  const getSocialUrl = (social: SocialEntry): string => {
    if (social.url && social.url.startsWith('http')) return social.url;
    const template = SOCIAL_URL_TEMPLATES[social.platform];
    if (template) {
      return template + social.username.replace('@', '');
    }
    return '#';
  };

  // Merge legacy and dynamic fields for display
  const getEmails = (): EmailEntry[] => {
    if (card?.emails?.length) return card.emails.filter(e => e.email);
    if (card?.email) return [{ id: '1', email: card.email, type: 'work' }];
    return [];
  };

  const getPhones = (): PhoneEntry[] => {
    if (card?.phones?.length) return card.phones.filter(p => p.number);
    const phones: PhoneEntry[] = [];
    if (card?.phone) phones.push({ id: '1', number: card.phone, type: 'work' });
    if (card?.mobile && card.mobile !== card.phone) phones.push({ id: '2', number: card.mobile, type: 'mobile' });
    return phones;
  };

  const getWebsites = (): WebsiteEntry[] => {
    if (card?.websites?.length) return card.websites.filter(w => w.url);
    if (card?.website) return [{ id: '1', url: card.website, type: 'website' }];
    return [];
  };

  const getSocials = (): SocialEntry[] => {
    if (card?.socials?.length) return card.socials.filter(s => s.username);
    const socials: SocialEntry[] = [];
    if (card?.linkedin) socials.push({ id: '1', platform: 'linkedin', username: card.linkedin });
    if (card?.twitter) socials.push({ id: '2', platform: 'twitter', username: card.twitter });
    if (card?.instagram) socials.push({ id: '3', platform: 'instagram', username: card.instagram });
    if (card?.facebook) socials.push({ id: '4', platform: 'facebook', username: card.facebook });
    return socials;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  if (!card) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center text-white">
          <User className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-xl">Business card not found</p>
        </div>
      </div>
    );
  }

  const emails = getEmails();
  const phones = getPhones();
  const websites = getWebsites();
  const socials = getSocials();

  // Color variables with fallbacks
  const iconBgColor = card.iconBgColor || card.accentColor || '#6366f1';
  const iconColor = card.iconColor || '#ffffff';
  const sectionBgColor = card.sectionBgColor || 'rgba(255,255,255,0.1)';
  const sectionTitleColor = card.sectionTitleColor || 'rgba(255,255,255,0.5)';
  const contentColor = card.contentColor || '#ffffff';
  const nameColor = card.nameColor || '#ffffff';
  const titleColor = card.titleColor || 'rgba(255,255,255,0.8)';
  const companyColor = card.companyColor || 'rgba(255,255,255,0.6)';
  const bioColor = card.bioColor || 'rgba(255,255,255,0.7)';
  const buttonBgColor = card.buttonBgColor || card.accentColor || '#6366f1';
  const buttonTextColor = card.buttonTextColor || '#ffffff';

  // In embed mode, use pure black background
  const bgColor = isEmbed ? '#000000' : (card.bgColor || '#1a1a2e');

  return (
    <div 
      className="min-h-screen py-8 px-4"
      style={{ 
        backgroundColor: bgColor,
        backgroundImage: (!isEmbed && card.bgImage) ? `url(${card.bgImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="max-w-md mx-auto">
        {/* NFC Badge */}
        {isNfcTap && (
          <div className="mb-4 text-center">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-300 rounded-full text-sm">
              📲 Shared via NFC Tap
            </span>
          </div>
        )}

        {/* Card */}
        <div className="rounded-3xl overflow-hidden shadow-2xl bg-black/20 backdrop-blur">
          {/* Profile Header */}
          <div className="p-8 text-center">
            {card.photo ? (
              <img 
                src={card.photo} 
                alt={card.name}
                className="w-28 h-28 rounded-full mx-auto mb-4 object-cover border-4 shadow-lg"
                style={{ borderColor: card.accentColor }}
              />
            ) : (
              <div 
                className="w-28 h-28 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl font-bold text-white shadow-lg"
                style={{ backgroundColor: card.accentColor }}
              >
                {card.name?.charAt(0) || '?'}
              </div>
            )}
            
            <h1 className="text-2xl font-bold mb-1" style={{ color: nameColor }}>{card.name}</h1>
            {card.title && (
              <p className="text-lg" style={{ color: titleColor }}>{card.title}</p>
            )}
            {card.company && (
              <p className="flex items-center justify-center gap-2 mt-1" style={{ color: companyColor }}>
                <Building className="w-4 h-4" />
                {card.company}
              </p>
            )}
            
            {card.bio && (
              <p className="text-sm mt-4 leading-relaxed" style={{ color: bioColor }}>
                {card.bio}
              </p>
            )}
          </div>

          {/* Contact Info */}
          <div className="px-6 pb-6 space-y-3">
            {/* Emails */}
            {emails.map((email) => (
              <a 
                key={email.id}
                href={`mailto:${email.email}`}
                className="flex items-center gap-4 p-4 rounded-xl hover:opacity-80 transition-opacity"
                style={{ backgroundColor: sectionBgColor }}
              >
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: iconBgColor }}
                >
                  <Mail className="w-5 h-5" style={{ color: iconColor }} />
                </div>
                <div className="flex-1">
                  <p className="text-xs uppercase" style={{ color: sectionTitleColor }}>
                    {email.label || email.type}
                  </p>
                  <p style={{ color: contentColor }}>{email.email}</p>
                </div>
              </a>
            ))}

            {/* Phones */}
            {phones.map((phone) => (
              <a 
                key={phone.id}
                href={`tel:${phone.number}`}
                className="flex items-center gap-4 p-4 rounded-xl hover:opacity-80 transition-opacity"
                style={{ backgroundColor: sectionBgColor }}
              >
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: iconBgColor }}
                >
                  <Phone className="w-5 h-5" style={{ color: iconColor }} />
                </div>
                <div className="flex-1">
                  <p className="text-xs uppercase" style={{ color: sectionTitleColor }}>
                    {phone.label || PHONE_TYPE_LABELS[phone.type] || phone.type}
                  </p>
                  <p style={{ color: contentColor }}>{phone.number}</p>
                </div>
              </a>
            ))}

            {/* Websites */}
            {websites.map((website) => (
              <a 
                key={website.id}
                href={website.url.startsWith('http') ? website.url : `https://${website.url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 rounded-xl hover:opacity-80 transition-opacity"
                style={{ backgroundColor: sectionBgColor }}
              >
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: iconBgColor }}
                >
                  <Globe className="w-5 h-5" style={{ color: iconColor }} />
                </div>
                <div className="flex-1">
                  <p className="text-xs uppercase" style={{ color: sectionTitleColor }}>
                    {website.label || WEBSITE_TYPE_LABELS[website.type] || website.type}
                  </p>
                  <p className="truncate" style={{ color: contentColor }}>{website.url.replace(/^https?:\/\//, '')}</p>
                </div>
                <ExternalLink className="w-4 h-4" style={{ color: contentColor, opacity: 0.5 }} />
              </a>
            ))}

            {/* Address */}
            {(card.address || card.city) && (
              <div 
                className="flex items-center gap-4 p-4 rounded-xl"
                style={{ backgroundColor: sectionBgColor }}
              >
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: iconBgColor }}
                >
                  <MapPin className="w-5 h-5" style={{ color: iconColor }} />
                </div>
                <div className="flex-1">
                  <p className="text-xs uppercase" style={{ color: sectionTitleColor }}>Address</p>
                  <p style={{ color: contentColor }}>
                    {card.address && <>{card.address}<br /></>}
                    {card.city && <>{card.city}, </>}
                    {card.state && <>{card.state} </>}
                    {card.zip}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Social Links */}
          {socials.length > 0 && (
            <div className="px-6 pb-6">
              <p className="text-xs uppercase mb-3 text-center" style={{ color: sectionTitleColor }}>Connect</p>
              <div className="flex justify-center flex-wrap gap-3">
                {socials.map((social) => (
                  <a
                    key={social.id}
                    href={getSocialUrl(social)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-full flex items-center justify-center transition-opacity hover:opacity-80 text-xl"
                    style={{ backgroundColor: sectionBgColor }}
                    title={`${social.platform}: ${social.username}`}
                  >
                    {SOCIAL_ICONS[social.platform] || '🔗'}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* QR Code Section - Always visible */}
          <div className="px-6 pb-4">
            <button
              onClick={() => setShowQrModal(true)}
              className="w-full p-4 rounded-xl flex items-center justify-center gap-3 transition-opacity hover:opacity-80"
              style={{ backgroundColor: sectionBgColor }}
            >
              {qrCodeUrl ? (
                <img src={qrCodeUrl} alt="QR Code" className="w-16 h-16 rounded-lg" />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-white/10 flex items-center justify-center">
                  <QrCode className="w-8 h-8" style={{ color: contentColor }} />
                </div>
              )}
              <div className="text-left">
                <p className="font-semibold" style={{ color: contentColor }}>Scan QR Code</p>
                <p className="text-sm" style={{ color: sectionTitleColor }}>Tap to enlarge</p>
              </div>
            </button>
          </div>

          {/* Actions */}
          <div className="p-6 space-y-3">
            <button
              onClick={saveContact}
              className="w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] hover:opacity-90"
              style={{ backgroundColor: buttonBgColor, color: buttonTextColor }}
            >
              <Download className="w-5 h-5" />
              {saved ? 'Saved!' : 'Save to Contacts'}
            </button>
            
            <button
              onClick={shareCard}
              className="w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-opacity hover:opacity-80 relative"
              style={{ backgroundColor: sectionBgColor, color: contentColor }}
            >
              <Share2 className="w-5 h-5" />
              {shareMessage || 'Share Card'}
            </button>
          </div>

          {/* Footer */}
          <div 
            className="h-2"
            style={{ backgroundColor: card.accentColor }}
          />
        </div>

        {/* Powered By - hidden in embed mode */}
        {!isEmbed && (
          <p className="text-center text-white/30 text-sm mt-6">
            Powered by ChannelCast
          </p>
        )}
      </div>

      {/* QR Code Modal */}
      {showQrModal && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setShowQrModal(false)}
        >
          <div 
            className="bg-white rounded-2xl p-6 max-w-sm w-full text-center"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-end mb-2">
              <button 
                onClick={() => setShowQrModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            {qrCodeUrl && (
              <img 
                src={qrCodeUrl} 
                alt="QR Code" 
                className="mx-auto mb-4 rounded-lg shadow-lg"
                style={{ width: '280px', height: '280px' }}
              />
            )}
            
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Scan to Connect
            </h3>
            <p className="text-gray-500 text-sm mb-4">
              Point your camera at this QR code to save {card?.name}'s contact info
            </p>
            
            <button
              onClick={shareCard}
              className="w-full py-3 bg-purple-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-purple-600 transition-colors"
            >
              <Share2 className="w-5 h-5" />
              Share Link Instead
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
