'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import {
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Gift,
  Droplets,
  ArrowLeft,
  X,
} from 'lucide-react';

interface CardData {
  uniqueCode: string;
  customerName: string;
  punchesRemaining: number;
  punchesUsed: number;
  totalPunches: number;
  status: 'active' | 'completed' | 'expired';
  issuedAt: string;
  expiresAt: string | null;
}

interface TemplateData {
  name: string;
  type: 'value' | 'loyalty';
  totalPunches: number;
  valuePerPunch: string | null;
  reward: string | null;
  styling: {
    title: string;
    backgroundColor: string;
    backgroundImage: string | null;
    textColor: string;
    logo: string | null;
  };
  restrictions: {
    terms: string;
  };
  contactInfo: {
    business: string;
    phone: string;
    email: string;
    address: string;
  };
}

interface HistoryItem {
  punchesDeducted: number;
  note: string;
  redeemedAt: string;
}

export default function CustomerCardPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const code = params.code as string;
  const isPreview = searchParams.get('preview') === 'true';
  const isEmbed = searchParams.get('embed') === '1';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [card, setCard] = useState<CardData | null>(null);
  const [template, setTemplate] = useState<TemplateData | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    fetchCardData();
    generateQRCode();
  }, [code]);

  async function fetchCardData() {
    try {
      const res = await fetch(`/api/products/punch-cards/customer/${code}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Card not found');
      }
      const data = await res.json();
      setCard(data.card);
      setTemplate(data.template);
      setHistory(data.history || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function generateQRCode() {
    try {
      const url = typeof window !== 'undefined' ? window.location.href : '';
      const qr = await QRCode.toDataURL(url, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
      setQrCodeUrl(qr);
    } catch (err) {
      console.error('QR generation failed:', err);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !card || !template) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Card Not Found</h1>
          <p className="text-gray-600">
            {error || 'The punch card you are looking for does not exist or has been removed.'}
          </p>
        </div>
      </div>
    );
  }

  const statusConfig = {
    active: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-100', label: 'Active' },
    completed: { icon: Gift, color: 'text-purple-500', bg: 'bg-purple-100', label: 'Completed!' },
    expired: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-100', label: 'Expired' },
  };

  const status = statusConfig[card.status];
  const StatusIcon = status.icon;

  // Create punch circles
  const punches = [];
  for (let i = 0; i < template.totalPunches; i++) {
    const isUsed = i < card.punchesUsed;
    punches.push(
      <div
        key={i}
        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border-2 transition-all ${
          isUsed
            ? 'bg-white/30 border-white/50'
            : 'bg-white/10 border-white/30'
        }`}
      >
        {isUsed ? (
          <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        ) : (
          <span className="text-white/50 text-sm font-bold">{i + 1}</span>
        )}
      </div>
    );
  }

  // Calculate remaining value for value cards
  const remainingValue = template.type === 'value' && template.valuePerPunch
    ? `${card.punchesRemaining} × ${template.valuePerPunch}`
    : null;

  // Use black background in embed mode
  const bgClass = isEmbed ? 'bg-black' : 'bg-gray-100';

  return (
    <div className={`min-h-screen ${bgClass} py-4 px-4 sm:py-8`}>
      {/* Back Button for Preview Mode (hidden in embed mode) */}
      {isPreview && !isEmbed && (
        <div className="max-w-md mx-auto mb-4">
          <button
            onClick={() => router.push('/products')}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow hover:bg-gray-50 transition-colors text-gray-700 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Products
          </button>
        </div>
      )}
      
      <div className="max-w-md mx-auto space-y-4">
        {/* Main Card */}
        <div
          className="rounded-2xl shadow-xl overflow-hidden"
          style={{
            backgroundColor: template.styling.backgroundColor,
            backgroundImage: template.styling.backgroundImage
              ? `url(${template.styling.backgroundImage})`
              : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Card Header */}
          <div className="p-6 pb-4" style={{ color: template.styling.textColor }}>
            <div className="flex items-start justify-between mb-4">
              <div>
                {template.styling.logo && (
                  <img
                    src={template.styling.logo}
                    alt="Logo"
                    className="h-12 mb-3 object-contain"
                  />
                )}
                <h1 className="text-2xl font-bold">{template.styling.title}</h1>
                <p className="text-sm opacity-80">{template.contactInfo.business}</p>
              </div>
              <div className={`${status.bg} px-3 py-1 rounded-full flex items-center gap-1`}>
                <StatusIcon className={`w-4 h-4 ${status.color}`} />
                <span className={`text-sm font-medium ${status.color}`}>{status.label}</span>
              </div>
            </div>

            {/* Customer Name */}
            <div className="mb-4">
              <p className="text-sm opacity-70">Card Holder</p>
              <p className="text-lg font-semibold">{card.customerName}</p>
            </div>

            {/* Value/Reward Display */}
            {card.status === 'completed' ? (
              <div className="bg-white/20 backdrop-blur rounded-xl p-4 mb-4 text-center">
                <Gift className="w-10 h-10 mx-auto mb-2" />
                <p className="text-sm opacity-80">Congratulations!</p>
                <p className="text-xl font-bold">
                  {template.type === 'loyalty' ? template.reward : 'Card Completed!'}
                </p>
              </div>
            ) : remainingValue ? (
              <div className="bg-white/20 backdrop-blur rounded-xl p-4 mb-4 text-center">
                <Droplets className="w-8 h-8 mx-auto mb-1 opacity-80" />
                <p className="text-sm opacity-80">Remaining Value</p>
                <p className="text-2xl font-bold">{remainingValue}</p>
              </div>
            ) : template.type === 'loyalty' && template.reward ? (
              <div className="bg-white/20 backdrop-blur rounded-xl p-4 mb-4 text-center">
                <Gift className="w-8 h-8 mx-auto mb-1 opacity-80" />
                <p className="text-sm opacity-80">Collect all punches for</p>
                <p className="text-xl font-bold">{template.reward}</p>
              </div>
            ) : null}

            {/* Punch Grid */}
            <div className="mb-2">
              <p className="text-sm opacity-70 mb-2">
                {card.punchesUsed} / {template.totalPunches} Punches Used
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {punches}
              </div>
            </div>
          </div>

          {/* Card Footer */}
          <div
            className="bg-black/20 backdrop-blur px-6 py-4"
            style={{ color: template.styling.textColor }}
          >
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1 opacity-70">
                <Calendar className="w-4 h-4" />
                <span>Issued: {new Date(card.issuedAt).toLocaleDateString()}</span>
              </div>
              {card.expiresAt && (
                <div className="flex items-center gap-1 opacity-70">
                  <Clock className="w-4 h-4" />
                  <span>Exp: {new Date(card.expiresAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
            <div className="mt-2 text-center">
              <p className="text-xs opacity-60 font-mono">{card.uniqueCode}</p>
            </div>
          </div>
        </div>

        {/* QR Code Section */}
        <div className={`rounded-xl shadow-lg p-6 text-center ${isEmbed ? 'bg-gray-900' : 'bg-white'}`}>
          <h2 className={`text-lg font-semibold mb-3 ${isEmbed ? 'text-white' : 'text-gray-800'}`}>Show This to Redeem</h2>
          {qrCodeUrl && (
            <img src={qrCodeUrl} alt="QR Code" className="mx-auto mb-3" />
          )}
          <p className={`text-sm ${isEmbed ? 'text-gray-400' : 'text-gray-500'}`}>
            Present this QR code or card code at checkout
          </p>
          <p className={`text-lg font-mono font-bold mt-2 ${isEmbed ? 'text-white' : 'text-gray-700'}`}>{card.uniqueCode}</p>
        </div>

        {/* Contact Info */}
        <div className={`rounded-xl shadow-lg p-6 ${isEmbed ? 'bg-gray-900' : 'bg-white'}`}>
          <h2 className={`text-lg font-semibold mb-4 ${isEmbed ? 'text-white' : 'text-gray-800'}`}>Contact</h2>
          <div className="space-y-3">
            {template.contactInfo.phone && (
              <a
                href={`tel:${template.contactInfo.phone}`}
                className={`flex items-center gap-3 ${isEmbed ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-blue-600'}`}
              >
                <Phone className="w-5 h-5" />
                <span>{template.contactInfo.phone}</span>
              </a>
            )}
            {template.contactInfo.email && (
              <a
                href={`mailto:${template.contactInfo.email}`}
                className={`flex items-center gap-3 ${isEmbed ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-blue-600'}`}
              >
                <Mail className="w-5 h-5" />
                <span>{template.contactInfo.email}</span>
              </a>
            )}
            {template.contactInfo.address && (
              <div className={`flex items-start gap-3 ${isEmbed ? 'text-gray-300' : 'text-gray-600'}`}>
                <MapPin className="w-5 h-5 mt-0.5" />
                <span>{template.contactInfo.address}</span>
              </div>
            )}
          </div>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className={`rounded-xl shadow-lg p-6 ${isEmbed ? 'bg-gray-900' : 'bg-white'}`}>
            <h2 className={`text-lg font-semibold mb-4 ${isEmbed ? 'text-white' : 'text-gray-800'}`}>Recent Activity</h2>
            <div className="space-y-3">
              {history.slice(0, 5).map((item, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between py-2 border-b last:border-0 ${isEmbed ? 'border-gray-700' : 'border-gray-100'}`}
                >
                  <div>
                    <p className={`text-sm font-medium ${isEmbed ? 'text-gray-200' : 'text-gray-700'}`}>
                      {item.punchesDeducted} punch{item.punchesDeducted > 1 ? 'es' : ''} used
                    </p>
                    {item.note && (
                      <p className={`text-xs ${isEmbed ? 'text-gray-400' : 'text-gray-500'}`}>{item.note}</p>
                    )}
                  </div>
                  <p className={`text-xs ${isEmbed ? 'text-gray-500' : 'text-gray-400'}`}>
                    {new Date(item.redeemedAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Terms */}
        {template.restrictions.terms && (
          <div className={`rounded-xl p-4 ${isEmbed ? 'bg-gray-900' : 'bg-gray-50'}`}>
            <p className={`text-xs text-center ${isEmbed ? 'text-gray-400' : 'text-gray-500'}`}>{template.restrictions.terms}</p>
          </div>
        )}
      </div>
    </div>
  );
}
