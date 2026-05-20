'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Sparkles,
  Linkedin,
  Facebook,
  MapPin,
  Users,
  Database,
  Link2,
  Search,
  Loader2,
  CheckCircle,
  Clock,
  AlertCircle,
  Play,
  ExternalLink,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnrichPanelProps {
  onContactsEnriched: () => void;
}

interface ScrapeJob {
  id: string;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  contacts_found: number;
  started_at: string;
  url?: string;
}

const SCRAPE_METHODS = [
  { 
    id: 'linkedin', 
    name: 'LinkedIn', 
    icon: Linkedin, 
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    description: 'Import contacts from LinkedIn profiles, company pages, or search results',
    fields: ['search_query', 'location', 'industry'],
  },
  { 
    id: 'facebook', 
    name: 'Facebook Crawl', 
    icon: Facebook, 
    color: 'text-blue-600',
    bgColor: 'bg-blue-600/10',
    description: 'Extract contacts from Facebook business pages or groups',
    fields: ['page_url', 'group_url'],
  },
  { 
    id: 'social', 
    name: 'Social Crawl', 
    icon: Users, 
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    description: 'Multi-platform social media contact discovery (Twitter, Instagram, etc.)',
    fields: ['platforms', 'keywords'],
  },
  { 
    id: 'google_maps', 
    name: 'Google Maps Crawl', 
    icon: MapPin, 
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    description: 'Find businesses and contacts from Google Maps by category and location',
    fields: ['business_type', 'location', 'radius'],
  },
  { 
    id: 'enrichment', 
    name: 'Data Enrichment', 
    icon: Database, 
    color: 'text-brand',
    bgColor: 'bg-brand/10',
    description: 'Enrich existing contacts with additional data (email verification, social profiles, company info)',
    fields: ['source'],
  },
  { 
    id: 'url', 
    name: 'Custom URL Scrape', 
    icon: Link2, 
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
    description: 'Scrape contacts from any website - directories, associations, member lists',
    fields: ['url', 'selectors'],
    examples: [
      { name: 'AIA Directory', url: 'https://www.aia.org/members' },
      { name: 'Chamber of Commerce', url: 'https://example.com/members' },
      { name: 'Trade Association', url: 'https://example.org/directory' },
    ],
  },
];

export function EnrichPanel({ onContactsEnriched }: EnrichPanelProps) {
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<ScrapeJob[]>([]);
  
  // Form states for different methods
  const [linkedinForm, setLinkedinForm] = useState({ search_query: '', location: '', industry: '' });
  const [facebookForm, setFacebookForm] = useState({ page_url: '', group_url: '' });
  const [socialForm, setSocialForm] = useState({ platforms: '', keywords: '' });
  const [googleMapsForm, setGoogleMapsForm] = useState({ business_type: '', location: '', radius: '25' });
  const [urlForm, setUrlForm] = useState({ url: '', selectors: '' });

  const handleStartScrape = async (methodId: string) => {
    setLoading(true);
    try {
      let payload: any = { type: methodId };

      switch (methodId) {
        case 'linkedin':
          payload = { ...payload, ...linkedinForm };
          break;
        case 'facebook':
          payload = { ...payload, ...facebookForm };
          break;
        case 'social':
          payload = { ...payload, ...socialForm };
          break;
        case 'google_maps':
          payload = { ...payload, ...googleMapsForm };
          break;
        case 'url':
          payload = { ...payload, ...urlForm };
          break;
      }

      const response = await fetch('/api/contacts/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        // Add to jobs list
        setJobs(prev => [{
          id: result.jobId,
          type: methodId,
          status: 'pending',
          progress: 0,
          contacts_found: 0,
          started_at: new Date().toISOString(),
          url: urlForm.url || undefined,
        }, ...prev]);
        
        setSelectedMethod(null);
      }
    } catch (error) {
      console.error('Error starting scrape:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'running': return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return null;
    }
  };

  const getMethodInfo = (methodId: string) => {
    return SCRAPE_METHODS.find(m => m.id === methodId);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Methods List */}
      <div className="lg:col-span-2">
        <Card className="bg-card/50 border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand" />
              Contact Enrichment & Scraping
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SCRAPE_METHODS.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(selectedMethod === method.id ? null : method.id)}
                  className={cn(
                    'p-4 rounded-xl border text-left transition-all',
                    selectedMethod === method.id
                      ? 'border-brand bg-brand/10 ring-1 ring-brand/50'
                      : 'border-border bg-secondary/30 hover:bg-secondary/50'
                  )}
                >
                  <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center mb-3', method.bgColor)}>
                    <method.icon className={cn('w-5 h-5', method.color)} />
                  </div>
                  <h3 className="font-semibold text-foreground">{method.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{method.description}</p>
                </button>
              ))}
            </div>

            {/* Method Config Panel */}
            {selectedMethod && (
              <div className="mt-6 p-6 bg-secondary/30 rounded-xl border border-border">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  {(() => {
                    const method = getMethodInfo(selectedMethod);
                    if (method) {
                      const Icon = method.icon;
                      return <Icon className={cn('w-5 h-5', method.color)} />;
                    }
                    return null;
                  })()}
                  Configure {getMethodInfo(selectedMethod)?.name}
                </h3>

                {/* LinkedIn Config */}
                {selectedMethod === 'linkedin' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">Search Query</label>
                      <Input
                        value={linkedinForm.search_query}
                        onChange={(e) => setLinkedinForm({ ...linkedinForm, search_query: e.target.value })}
                        className="bg-secondary border-border"
                        placeholder="CEO, Marketing Director, etc."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-muted-foreground mb-1">Location</label>
                        <Input
                          value={linkedinForm.location}
                          onChange={(e) => setLinkedinForm({ ...linkedinForm, location: e.target.value })}
                          className="bg-secondary border-border"
                          placeholder="Phoenix, AZ"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-muted-foreground mb-1">Industry</label>
                        <Input
                          value={linkedinForm.industry}
                          onChange={(e) => setLinkedinForm({ ...linkedinForm, industry: e.target.value })}
                          className="bg-secondary border-border"
                          placeholder="Technology, Real Estate, etc."
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Facebook Config */}
                {selectedMethod === 'facebook' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">Facebook Page URL</label>
                      <Input
                        value={facebookForm.page_url}
                        onChange={(e) => setFacebookForm({ ...facebookForm, page_url: e.target.value })}
                        className="bg-secondary border-border"
                        placeholder="https://facebook.com/page-name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">Facebook Group URL</label>
                      <Input
                        value={facebookForm.group_url}
                        onChange={(e) => setFacebookForm({ ...facebookForm, group_url: e.target.value })}
                        className="bg-secondary border-border"
                        placeholder="https://facebook.com/groups/group-name"
                      />
                    </div>
                  </div>
                )}

                {/* Social Crawl Config */}
                {selectedMethod === 'social' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">Platforms</label>
                      <Input
                        value={socialForm.platforms}
                        onChange={(e) => setSocialForm({ ...socialForm, platforms: e.target.value })}
                        className="bg-secondary border-border"
                        placeholder="Twitter, Instagram, TikTok"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">Keywords / Hashtags</label>
                      <Input
                        value={socialForm.keywords}
                        onChange={(e) => setSocialForm({ ...socialForm, keywords: e.target.value })}
                        className="bg-secondary border-border"
                        placeholder="#AI, #entrepreneurship"
                      />
                    </div>
                  </div>
                )}

                {/* Google Maps Config */}
                {selectedMethod === 'google_maps' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-muted-foreground mb-1">Business Type</label>
                        <Input
                          value={googleMapsForm.business_type}
                          onChange={(e) => setGoogleMapsForm({ ...googleMapsForm, business_type: e.target.value })}
                          className="bg-secondary border-border"
                          placeholder="Restaurants, Law Firms, etc."
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-muted-foreground mb-1">Location</label>
                        <Input
                          value={googleMapsForm.location}
                          onChange={(e) => setGoogleMapsForm({ ...googleMapsForm, location: e.target.value })}
                          className="bg-secondary border-border"
                          placeholder="Scottsdale, AZ"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">Radius (miles)</label>
                      <Input
                        type="number"
                        value={googleMapsForm.radius}
                        onChange={(e) => setGoogleMapsForm({ ...googleMapsForm, radius: e.target.value })}
                        className="bg-secondary border-border w-32"
                      />
                    </div>
                  </div>
                )}

                {/* Data Enrichment Config */}
                {selectedMethod === 'enrichment' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-brand/10 border border-brand/30 rounded-lg">
                      <p className="text-sm text-brand/90">
                        Data enrichment will enhance your existing contacts with:
                      </p>
                      <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                        <li>• Email verification & validation</li>
                        <li>• Social profile discovery</li>
                        <li>• Company information</li>
                        <li>• Phone number lookup</li>
                        <li>• Job title verification</li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* URL Scrape Config */}
                {selectedMethod === 'url' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">URL to Scrape</label>
                      <Input
                        type="url"
                        value={urlForm.url}
                        onChange={(e) => setUrlForm({ ...urlForm, url: e.target.value })}
                        className="bg-secondary border-border"
                        placeholder="https://www.aia.org/members"
                      />
                    </div>
                    
                    <div className="p-4 bg-secondary/50 rounded-lg">
                      <p className="text-sm font-medium text-foreground mb-2">Example Directories:</p>
                      <div className="space-y-2">
                        {SCRAPE_METHODS.find(m => m.id === 'url')?.examples?.map((ex, i) => (
                          <button
                            key={i}
                            onClick={() => setUrlForm({ ...urlForm, url: ex.url })}
                            className="flex items-center gap-2 text-sm text-blue-400 hover:underline"
                          >
                            <Building2 className="w-3 h-3" />
                            {ex.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">Custom CSS Selectors (optional)</label>
                      <Textarea
                        value={urlForm.selectors}
                        onChange={(e) => setUrlForm({ ...urlForm, selectors: e.target.value })}
                        className="bg-secondary border-border resize-none font-mono text-xs"
                        rows={3}
                        placeholder=".member-name, .member-email, .member-company"
                      />
                    </div>
                  </div>
                )}

                <Button 
                  onClick={() => handleStartScrape(selectedMethod)} 
                  disabled={loading}
                  className="mt-4 bg-brand hover:bg-brand/90"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4 mr-2" />
                  )}
                  Start {getMethodInfo(selectedMethod)?.name}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Jobs Sidebar */}
      <div>
        <Card className="bg-card/50 border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              Recent Jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {jobs.length === 0 ? (
              <div className="text-center py-8">
                <Sparkles className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">No scraping jobs yet</p>
                <p className="text-muted-foreground text-xs mt-1">Start a new job from the left panel</p>
              </div>
            ) : (
              <div className="space-y-3">
                {jobs.map((job) => {
                  const method = getMethodInfo(job.type);
                  return (
                    <div 
                      key={job.id}
                      className="p-3 bg-secondary/30 rounded-lg"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {method && <method.icon className={cn('w-4 h-4', method.color)} />}
                        <span className="text-sm font-medium text-foreground">{method?.name}</span>
                        <div className="ml-auto">{getStatusIcon(job.status)}</div>
                      </div>
                      {job.url && (
                        <p className="text-xs text-muted-foreground truncate mb-2">{job.url}</p>
                      )}
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{job.contacts_found} contacts</span>
                        <span>{job.progress}%</span>
                      </div>
                      {job.status === 'running' && (
                        <div className="mt-2 h-1 bg-secondary rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-brand transition-all" 
                            style={{ width: `${job.progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tips Card */}
        <Card className="bg-card/50 border-border mt-6">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Search className="w-5 h-5 text-purple-500" />
              Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• Start with Google Maps for local businesses</li>
              <li>• Use LinkedIn for B2B leads</li>
              <li>• Custom URL scraping works great for association directories</li>
              <li>• Run enrichment after importing to fill gaps</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
