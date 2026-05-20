'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Ticket, 
  Gift, 
  PartyPopper,
  Frown,
  Loader2,
  Mail,
  Share2,
  Copy,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface Prize {
  id: string;
  name: string;
  description: string;
  value: string;
  color: string;
}

interface Campaign {
  id: string;
  name: string;
  description: string;
  status: string;
  requireEmail: boolean;
  terms?: string;
  // Design settings
  cardTitle?: string;
  cardSubtitle?: string;
  cardLogo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  textColor?: string;
  font?: string;
  backgroundImage?: string;
  revealThreshold?: number;
  allowSharing?: boolean;
}

interface ScratchResult {
  scratch: {
    id: string;
    won: boolean;
  };
  prize: Prize | null;
}

export default function ScratchCardPage() {
  const params = useParams();
  const campaignId = params.id as string;
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [scratching, setScratchching] = useState(false);
  const [scratchResult, setScratchResult] = useState<ScratchResult | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [scratchPercent, setScratchPercent] = useState(0);
  const [isScratching, setIsScratching] = useState(false);
  const [alreadyScratched, setAlreadyScratched] = useState(false);
  const [copied, setCopied] = useState(false);
  const [canvasInitialized, setCanvasInitialized] = useState(false);
  
  const visitorId = typeof window !== 'undefined' 
    ? localStorage.getItem('scratch_visitor_id') || `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    : '';

  useEffect(() => {
    if (typeof window !== 'undefined' && visitorId) {
      localStorage.setItem('scratch_visitor_id', visitorId);
    }
  }, [visitorId]);

  useEffect(() => {
    fetchCampaign();
  }, [campaignId]);

  const fetchCampaign = async () => {
    try {
      const res = await fetch(`/api/products/scratch-cards?id=${campaignId}`);
      const data = await res.json();
      
      if (data.error) {
        setError(data.error);
      } else if (data.campaign) {
        setCampaign(data.campaign);
        if (data.campaign.requireEmail) {
          setShowEmailForm(true);
        }
      }
    } catch (err) {
      setError('Failed to load campaign');
    } finally {
      setLoading(false);
    }
  };

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !campaign) return;

    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const primaryColor = campaign.primaryColor || '#667eea';
    const secondaryColor = campaign.secondaryColor || '#764ba2';
    const textColor = campaign.textColor || '#ffffff';
    const font = campaign.font || 'system-ui';

    // Draw scratch layer with gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, primaryColor);
    gradient.addColorStop(1, secondaryColor);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add subtle texture pattern
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    for (let i = 0; i < canvas.width; i += 15) {
      for (let j = 0; j < canvas.height; j += 15) {
        if ((i + j) % 30 === 0) {
          ctx.fillRect(i, j, 8, 8);
        }
      }
    }

    // Draw logo if exists
    if (campaign.cardLogo) {
      const logo = new Image();
      logo.crossOrigin = 'anonymous';
      logo.onload = () => {
        const logoSize = 60;
        ctx.drawImage(
          logo, 
          (canvas.width - logoSize) / 2, 
          canvas.height / 2 - 70, 
          logoSize, 
          logoSize
        );
      };
      logo.src = campaign.cardLogo;
    }

    // Draw title text
    ctx.fillStyle = textColor;
    ctx.font = `bold 28px ${font}`;
    ctx.textAlign = 'center';
    ctx.fillText(
      campaign.cardTitle || 'SCRATCH & WIN!', 
      canvas.width / 2, 
      canvas.height / 2 + (campaign.cardLogo ? 10 : -10)
    );

    // Draw subtitle
    ctx.font = `18px ${font}`;
    ctx.fillStyle = `${textColor}cc`;
    ctx.fillText(
      campaign.cardSubtitle || 'Reveal your prize', 
      canvas.width / 2, 
      canvas.height / 2 + (campaign.cardLogo ? 40 : 20)
    );

    // Draw scratch indicator
    ctx.font = `14px ${font}`;
    ctx.fillStyle = `${textColor}88`;
    ctx.fillText('↓ Scratch here ↓', canvas.width / 2, canvas.height - 30);

    setCanvasInitialized(true);
  }, [campaign]);

  const initScratch = useCallback(async () => {
    if (!campaign) return;

    setScratchching(true);
    
    try {
      const res = await fetch('/api/products/scratch-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'scratch',
          campaignId: campaign.id,
          visitorId,
          email: email || undefined,
        }),
      });
      
      const data = await res.json();
      
      if (data.alreadyScratched) {
        setAlreadyScratched(true);
        setScratchResult({
          scratch: data.previousResult,
          prize: data.previousResult?.prizeName ? { 
            name: data.previousResult.prizeName,
            id: '',
            description: '',
            value: '',
            color: '#22C55E'
          } : null,
        });
        setRevealed(true);
      } else if (data.success) {
        setScratchResult(data);
        // Wait for next render then init canvas
        setTimeout(() => initCanvas(), 100);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to start scratch');
    } finally {
      setScratchching(false);
    }
  }, [campaign, visitorId, email, initCanvas]);

  const scratch = useCallback((x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas || revealed) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Use destination-out to "erase" the scratch layer
    ctx.globalCompositeOperation = 'destination-out';
    
    // Create circular scratch with soft edges
    const radius = 25;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, 'rgba(0,0,0,1)');
    gradient.addColorStop(0.8, 'rgba(0,0,0,0.8)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fill();

    // Calculate scratch percentage
    ctx.globalCompositeOperation = 'source-over';
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let transparent = 0;
    for (let i = 3; i < imageData.data.length; i += 4) {
      if (imageData.data[i] < 128) transparent++;
    }
    const percent = (transparent / (imageData.data.length / 4)) * 100;
    setScratchPercent(percent);

    // Auto-reveal at threshold
    const threshold = campaign?.revealThreshold || 50;
    if (percent > threshold && !revealed) {
      revealResult();
    }
  }, [revealed, campaign]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isScratching || !canvasInitialized) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    scratch(x, y);
  }, [isScratching, canvasInitialized, scratch]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasInitialized) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    scratch(x, y);
  }, [canvasInitialized, scratch]);

  const revealResult = () => {
    setRevealed(true);
    
    // Fade out canvas
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.transition = 'opacity 0.5s';
      canvas.style.opacity = '0';
    }

    // Fire confetti if won
    if (scratchResult?.prize) {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 }
      });
      
      // Second burst
      setTimeout(() => {
        confetti({
          particleCount: 75,
          spread: 60,
          origin: { x: 0.3, y: 0.6 }
        });
        confetti({
          particleCount: 75,
          spread: 60,
          origin: { x: 0.7, y: 0.6 }
        });
      }, 300);
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() && campaign?.requireEmail) {
      alert('Please enter your email');
      return;
    }
    setShowEmailForm(false);
    initScratch();
  };

  const shareResult = async () => {
    const text = scratchResult?.prize 
      ? `🎉 I just won ${scratchResult.prize.name} on ${campaign?.name}!`
      : `I tried my luck on ${campaign?.name}!`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: campaign?.name,
          text,
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled
      }
    } else {
      navigator.clipboard.writeText(`${text}\n${window.location.href}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Get design values with defaults
  const primaryColor = campaign?.primaryColor || '#667eea';
  const secondaryColor = campaign?.secondaryColor || '#764ba2';
  const textColor = campaign?.textColor || '#ffffff';

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-black flex items-center justify-center p-4">
        <div className="text-center">
          <Ticket className="w-16 h-16 mx-auto mb-4 text-purple-400 opacity-50" />
          <h1 className="text-2xl font-bold text-white mb-2">Campaign Not Found</h1>
          <p className="text-gray-400">{error || 'This scratch card campaign is not available.'}</p>
        </div>
      </div>
    );
  }

  if (campaign.status !== 'active') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-black flex items-center justify-center p-4">
        <div className="text-center">
          <Ticket className="w-16 h-16 mx-auto mb-4 text-purple-400 opacity-50" />
          <h1 className="text-2xl font-bold text-white mb-2">Campaign Inactive</h1>
          <p className="text-gray-400">This scratch card campaign is not currently active.</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{
        background: campaign.backgroundImage 
          ? `url(${campaign.backgroundImage}) center/cover fixed`
          : `linear-gradient(135deg, ${primaryColor}22 0%, #111 50%, ${secondaryColor}22 100%)`,
      }}
    >
      {/* Header */}
      <div className="text-center mb-6">
        {campaign.cardLogo && !scratchResult && (
          <img 
            src={campaign.cardLogo} 
            alt="Logo" 
            className="w-16 h-16 mx-auto mb-3 object-contain"
          />
        )}
        <h1 
          className="text-2xl md:text-3xl font-bold"
          style={{ color: textColor, fontFamily: campaign.font }}
        >
          {campaign.name}
        </h1>
        {campaign.description && (
          <p className="text-gray-400 mt-1" style={{ fontFamily: campaign.font }}>
            {campaign.description}
          </p>
        )}
      </div>

      {/* Email Form */}
      {showEmailForm && !scratchResult && (
        <form onSubmit={handleEmailSubmit} className="w-full max-w-sm mb-6">
          <div 
            className="backdrop-blur-sm rounded-xl p-6 border"
            style={{ 
              backgroundColor: `${primaryColor}20`,
              borderColor: `${primaryColor}40`,
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Mail className="w-5 h-5" style={{ color: primaryColor }} />
              <span className="text-white font-medium">Enter your email to play</span>
            </div>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required={campaign.requireEmail}
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 mb-4"
            />
            <Button 
              type="submit" 
              className="w-full"
              style={{ 
                background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
              }}
              disabled={scratching}
            >
              {scratching ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Ticket className="w-4 h-4 mr-2" />
              )}
              Start Scratching!
            </Button>
          </div>
        </form>
      )}

      {/* Start Button (no email required) */}
      {!showEmailForm && !scratchResult && (
        <Button
          onClick={initScratch}
          className="mb-6 text-lg px-8 py-6"
          style={{ 
            background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
          }}
          disabled={scratching}
        >
          {scratching ? (
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
          ) : (
            <Ticket className="w-5 h-5 mr-2" />
          )}
          Start Scratching!
        </Button>
      )}

      {/* Scratch Card */}
      {scratchResult && (
        <div className="w-full max-w-sm">
          <div 
            ref={containerRef}
            className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl"
            style={{ 
              boxShadow: `0 25px 50px -12px ${primaryColor}40`,
            }}
          >
            {/* Prize Layer (underneath) */}
            <div 
              className="absolute inset-0 flex flex-col items-center justify-center p-6"
              style={{
                background: scratchResult.prize 
                  ? `linear-gradient(135deg, #FFD700, #FFA500, #FF6B6B)` 
                  : `linear-gradient(135deg, #4a5568, #2d3748)`,
              }}
            >
              {scratchResult.prize ? (
                <>
                  <PartyPopper className="w-16 h-16 text-white mb-4 animate-bounce" />
                  <h2 className="text-3xl font-bold text-white text-center mb-2">YOU WON!</h2>
                  <div className="bg-white/25 backdrop-blur-sm rounded-lg px-6 py-3">
                    <p className="text-2xl font-bold text-white">{scratchResult.prize.name}</p>
                    {scratchResult.prize.value && (
                      <p className="text-lg text-white/90 text-center">{scratchResult.prize.value}</p>
                    )}
                  </div>
                  {scratchResult.prize.description && (
                    <p className="text-white/80 text-center mt-3 text-sm">{scratchResult.prize.description}</p>
                  )}
                </>
              ) : (
                <>
                  <Frown className="w-16 h-16 text-white/60 mb-4" />
                  <h2 className="text-2xl font-bold text-white text-center">Better luck next time!</h2>
                  <p className="text-white/60 text-center mt-2">Thanks for playing</p>
                </>
              )}
            </div>

            {/* Scratch Layer (on top) */}
            {!revealed && (
              <canvas
                ref={canvasRef}
                className="absolute inset-0 cursor-pointer touch-none"
                style={{ touchAction: 'none' }}
                onMouseDown={() => setIsScratching(true)}
                onMouseUp={() => setIsScratching(false)}
                onMouseLeave={() => setIsScratching(false)}
                onMouseMove={handleMouseMove}
                onTouchStart={(e) => {
                  setIsScratching(true);
                  handleTouchMove(e);
                }}
                onTouchEnd={() => setIsScratching(false)}
                onTouchMove={handleTouchMove}
              />
            )}
          </div>

          {/* Progress */}
          {!revealed && scratchResult && canvasInitialized && (
            <div className="mt-4 text-center">
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full transition-all duration-200"
                  style={{ 
                    width: `${Math.min(scratchPercent * (100 / (campaign.revealThreshold || 50)), 100)}%`,
                    background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})`,
                  }}
                />
              </div>
              <p className="text-gray-400 text-sm mt-2">
                Scratch to reveal your prize!
              </p>
            </div>
          )}

          {/* Already Scratched Message */}
          {alreadyScratched && (
            <div 
              className="mt-4 p-3 rounded-lg text-center"
              style={{ 
                backgroundColor: `${primaryColor}20`,
                border: `1px solid ${primaryColor}40`,
              }}
            >
              <p className="text-sm" style={{ color: primaryColor }}>
                You&apos;ve already played this game!
              </p>
            </div>
          )}

          {/* Actions */}
          {revealed && (
            <div className="mt-6 space-y-3">
              {scratchResult.prize && !alreadyScratched && (
                <Button
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                  onClick={() => {
                    alert('Prize claimed! Check your email for details.');
                  }}
                >
                  <Gift className="w-4 h-4 mr-2" />
                  Claim Prize
                </Button>
              )}
              
              {campaign.allowSharing !== false && (
                <Button
                  variant="outline"
                  className="w-full border-white/20 text-white hover:bg-white/10"
                  onClick={shareResult}
                >
                  {copied ? (
                    <Check className="w-4 h-4 mr-2" />
                  ) : (
                    <Share2 className="w-4 h-4 mr-2" />
                  )}
                  {copied ? 'Copied!' : 'Share Result'}
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Terms */}
      {campaign.terms && (
        <p className="text-gray-500 text-xs text-center mt-8 max-w-sm">
          {campaign.terms}
        </p>
      )}

      {/* Powered by */}
      <p className="text-gray-600 text-xs mt-8">
        Powered by ChannelCast
      </p>
    </div>
  );
}
