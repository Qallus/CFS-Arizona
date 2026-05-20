'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  Contact, 
  QrCode, 
  Eye, 
  Edit, 
  Trash2, 
  Copy, 
  Download,
  ChevronLeft,
  Loader2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Building,
  User,
  Share2,
  BarChart3,
  Square,
  RectangleHorizontal,
  Circle,
  Cloud,
  Heart,
  Star,
  Home,
  Shirt,
  ShoppingCart,
  Smartphone,
  Car,
  TreePine,
  Gift,
  Coffee,
  UtensilsCrossed,
  Dumbbell,
  PawPrint,
  Music,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BusinessCard {
  id: string;
  name: string;
  title?: string;
  company?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  linkedin?: string;
  twitter?: string;
  instagram?: string;
  facebook?: string;
  bio?: string;
  photo?: string;
  logo?: string;
  qrShape: string;
  qrColor: string;
  bgColor: string;
  accentColor: string;
  template: string;
  scanCount: number;
  saveCount: number;
  shareCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Icon component map
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Square, RectangleHorizontal, Circle, Cloud, Heart, Star,
  Home, Shirt, ShoppingCart, Smartphone, Car, TreePine,
  Gift, Coffee, UtensilsCrossed, Dumbbell, PawPrint, Music
};

const QR_SHAPES = [
  { id: 'square', name: 'Square', icon: 'Square' },
  { id: 'rounded', name: 'Rounded', icon: 'RectangleHorizontal' },
  { id: 'circle', name: 'Circle', icon: 'Circle' },
  { id: 'cloud', name: 'Cloud', icon: 'Cloud' },
  { id: 'heart', name: 'Heart', icon: 'Heart' },
  { id: 'star', name: 'Star', icon: 'Star' },
  { id: 'house', name: 'House', icon: 'Home' },
  { id: 'shirt', name: 'T-Shirt', icon: 'Shirt' },
  { id: 'cart', name: 'Shopping Cart', icon: 'ShoppingCart' },
  { id: 'phone', name: 'Phone', icon: 'Smartphone' },
  { id: 'car', name: 'Car', icon: 'Car' },
  { id: 'tree', name: 'Tree', icon: 'TreePine' },
  { id: 'gift', name: 'Gift', icon: 'Gift' },
  { id: 'coffee', name: 'Coffee', icon: 'Coffee' },
  { id: 'utensils', name: 'Utensils', icon: 'UtensilsCrossed' },
  { id: 'dumbbell', name: 'Fitness', icon: 'Dumbbell' },
  { id: 'paw', name: 'Paw Print', icon: 'PawPrint' },
  { id: 'music', name: 'Music', icon: 'Music' },
];

export default function BusinessCardsPage() {
  const [cards, setCards] = useState<BusinessCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({ total: 0, totalScans: 0, totalSaves: 0 });

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      const res = await fetch('/api/products/business-cards');
      const data = await res.json();
      setCards(data.cards || []);
      setStats(data.stats || { total: 0, totalScans: 0, totalSaves: 0 });
    } catch (error) {
      console.error('Error fetching business cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this business card?')) return;
    
    try {
      await fetch('/api/products/business-cards', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      fetchCards();
    } catch (error) {
      console.error('Error deleting card:', error);
    }
  };

  const copyShareLink = (id: string) => {
    const url = `${window.location.origin}/card/vcard/${id}`;
    navigator.clipboard.writeText(url);
    alert('Link copied to clipboard!');
  };

  const filteredCards = cards.filter(card =>
    card.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    card.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    card.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/products"
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Digital Business Cards</h1>
            <p className="text-muted-foreground">Create vCard QR codes with custom shapes</p>
          </div>
        </div>
        <Link
          href="/products/business-cards/new"
          className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Card
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Contact className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Cards</p>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <QrCode className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Scans</p>
              <p className="text-2xl font-bold text-foreground">{stats.totalScans}</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Download className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Contacts Saved</p>
              <p className="text-2xl font-bold text-foreground">{stats.totalSaves}</p>
            </div>
          </div>
        </div>
      </div>

      {/* QR Shapes Preview */}
      <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-lg p-4">
        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <QrCode className="w-4 h-4 text-purple-500" />
          Custom QR Code Shapes Available
        </h3>
        <div className="flex flex-wrap gap-2">
          {QR_SHAPES.map(shape => {
            const IconComponent = ICON_MAP[shape.icon] || Square;
            return (
              <span 
                key={shape.id}
                className="px-3 py-1.5 bg-card border border-border rounded-full text-sm flex items-center gap-1.5"
              >
                <IconComponent className="w-4 h-4 text-purple-400" />
                {shape.name}
              </span>
            );
          })}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search business cards..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50"
        />
      </div>

      {/* Cards List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredCards.length === 0 ? (
        <div className="text-center py-12">
          <Contact className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No Business Cards Yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first digital business card with a custom QR code shape.
          </p>
          <Link
            href="/products/business-cards/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Business Card
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCards.map((card) => (
            <div
              key={card.id}
              className="bg-card border border-border rounded-lg overflow-hidden hover:border-purple-500/50 transition-colors"
            >
              {/* Card Preview */}
              <div 
                className="h-32 flex items-center justify-center"
                style={{ backgroundColor: card.bgColor || '#1a1a2e' }}
              >
                <div className="text-center">
                  {card.photo ? (
                    <img 
                      src={card.photo} 
                      alt={card.name}
                      className="w-16 h-16 rounded-full mx-auto mb-2 object-cover border-2 border-white"
                    />
                  ) : (
                    <div 
                      className="w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center text-2xl font-bold text-white"
                      style={{ backgroundColor: card.accentColor || '#6366f1' }}
                    >
                      {card.name?.charAt(0) || '?'}
                    </div>
                  )}
                  <h3 className="font-semibold text-white">{card.name}</h3>
                  {card.title && (
                    <p className="text-xs text-white/70">{card.title}</p>
                  )}
                </div>
              </div>

              {/* Card Details */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    {card.company && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Building className="w-3 h-3" />
                        {card.company}
                      </p>
                    )}
                    {card.email && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {card.email}
                      </p>
                    )}
                  </div>
                  <span className={cn(
                    'px-2 py-0.5 rounded-full text-xs',
                    card.isActive 
                      ? 'bg-green-500/20 text-green-500' 
                      : 'bg-gray-500/20 text-gray-400'
                  )}>
                    {card.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                  <span className="flex items-center gap-1">
                    <QrCode className="w-3 h-3" />
                    {card.scanCount} scans
                  </span>
                  <span className="flex items-center gap-1">
                    <Download className="w-3 h-3" />
                    {card.saveCount} saves
                  </span>
                  <span className="flex items-center gap-1">
                    <Share2 className="w-3 h-3" />
                    {card.shareCount} shares
                  </span>
                </div>

                {/* QR Shape Badge */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs text-muted-foreground">QR Shape:</span>
                  <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs">
                    {QR_SHAPES.find(s => s.id === card.qrShape)?.name || 'Square'}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Link
                    href={`/products/business-cards/${card.id}`}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-purple-500 text-white rounded-lg text-sm hover:bg-purple-600 transition-colors"
                  >
                    <Eye className="w-3 h-3" />
                    View
                  </Link>
                  <button
                    onClick={() => copyShareLink(card.id)}
                    className="p-2 hover:bg-secondary rounded-lg transition-colors"
                    title="Copy share link"
                  >
                    <Copy className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => handleDelete(card.id)}
                    className="p-2 hover:bg-secondary rounded-lg transition-colors text-red-500"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
