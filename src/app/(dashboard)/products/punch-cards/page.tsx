'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  CreditCard,
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Sparkles,
  DollarSign,
  Users,
  Send,
  ArrowLeft,
  TrendingUp,
  Gift,
  QrCode,
  BarChart3,
} from 'lucide-react';

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

interface PunchCardStats {
  totalTemplates: number;
  activeTemplates: number;
  totalCards: number;
  activeCards: number;
  completedCards: number;
  totalPunchesGiven: number;
}

export default function PunchCardsPage() {
  const [templates, setTemplates] = useState<PunchCardTemplate[]>([]);
  const [stats, setStats] = useState<PunchCardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch('/api/products/punch-cards');
      const data = await res.json();
      setTemplates(data.templates || []);
      setStats(data.stats || null);
    } catch (err) {
      console.error('Failed to fetch templates:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this punch card template? This cannot be undone.')) return;
    
    try {
      const res = await fetch(`/api/products/punch-cards?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      
      if (res.ok) {
        fetchTemplates();
      } else {
        alert(data.error || 'Failed to delete template');
      }
    } catch (err) {
      console.error('Failed to delete template:', err);
    }
  };

  const filteredTemplates = templates.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-muted-foreground mb-4">
          <Link href="/products" className="hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <Link href="/products" className="hover:text-foreground transition-colors text-sm">
            Products
          </Link>
          <span>/</span>
          <span className="text-foreground text-sm">Punch Cards</span>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <CreditCard className="w-6 h-6 text-blue-500" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Punch Cards</h1>
            </div>
            <p className="text-muted-foreground">Create and manage digital punch card programs for your customers</p>
          </div>
          
          <Link href="/products/punch-cards/new">
            <Button className="bg-blue-600 hover:bg-blue-700 w-full md:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Create Punch Card
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-card/50 border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <CreditCard className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Active Cards</p>
                <p className="text-xl md:text-2xl font-bold text-foreground">{stats?.activeCards || 0}</p>
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
                <p className="text-xs md:text-sm text-muted-foreground">Completed</p>
                <p className="text-xl md:text-2xl font-bold text-foreground">{stats?.completedCards || 0}</p>
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
                <p className="text-xs md:text-sm text-muted-foreground">Total Punches</p>
                <p className="text-xl md:text-2xl font-bold text-foreground">{stats?.totalPunchesGiven || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <BarChart3 className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Programs</p>
                <p className="text-xl md:text-2xl font-bold text-foreground">{stats?.activeTemplates || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search punch cards..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Templates List */}
      <Card className="bg-card/50 border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Punch Card Templates</CardTitle>
          <CardDescription>Your punch card programs and their performance</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="mb-2">No punch card templates yet</p>
              <p className="text-sm mb-4">Create your first punch card program to start rewarding customers</p>
              <Link href="/products/punch-cards/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Punch Card
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTemplates.map((template) => (
                <div key={template.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-secondary/50 rounded-lg gap-4">
                  <div className="flex items-center gap-4">
                    <div
                      className="p-3 rounded-lg hidden md:flex"
                      style={{ backgroundColor: template.styling.backgroundColor + '33' }}
                    >
                      <CreditCard
                        className="w-6 h-6"
                        style={{ color: template.styling.backgroundColor }}
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{template.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {template.totalPunches} punches
                        {template.type === 'loyalty' && template.reward && ` • Reward: ${template.reward}`}
                        {template.type === 'value' && template.valuePerPunch && ` × ${template.valuePerPunch}`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3 md:gap-4">
                    <div className="text-left md:text-right">
                      <p className="text-sm font-medium text-foreground">
                        {template.stats?.activeCards || 0} active
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {template.stats?.completedCards || 0} completed
                      </p>
                    </div>
                    
                    <Badge
                      className={template.type === 'value' ? 'bg-green-600' : 'bg-blue-600'}
                    >
                      {template.type}
                    </Badge>
                    
                    <div className="flex items-center gap-2">
                      <Link href={`/products/punch-cards/${template.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          Manage
                        </Button>
                      </Link>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/products/punch-cards/${template.id}`}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDeleteTemplate(template.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
