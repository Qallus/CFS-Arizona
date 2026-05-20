'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Rocket,
  Globe,
  Link2,
  Server,
  Cloud,
  Plus,
  Settings,
  ExternalLink,
  Check,
  AlertCircle,
  Trash2,
  Edit,
  RefreshCw,
  Shield,
  Bot,
  Copy,
  Eye,
} from 'lucide-react';

interface Domain {
  id: string;
  name: string;
  registrar: string;
  expiresAt: string;
  status: 'active' | 'expiring' | 'expired';
  ssl: boolean;
  dns: 'cloudflare' | 'route53' | 'namecheap' | 'other';
}

interface Subdomain {
  id: string;
  name: string;
  parentDomain: string;
  target: string;
  type: 'CNAME' | 'A' | 'proxy';
  ssl: boolean;
  status: 'active' | 'pending' | 'error';
}

interface HostingAccount {
  id: string;
  name: string;
  provider: string;
  type: 'vps' | 'shared' | 'cloud' | 'dedicated';
  status: 'connected' | 'disconnected' | 'error';
  ip?: string;
  region?: string;
}

interface Deployment {
  id: string;
  name: string;
  framework: string;
  domain: string;
  hosting: string;
  status: 'live' | 'deploying' | 'failed' | 'stopped';
  lastDeployed?: string;
}

export default function DeployPage() {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Sample data - will be replaced with real data from API
  const [domains] = useState<Domain[]>([
    { id: '1', name: 'channelcast.io', registrar: 'Namecheap', expiresAt: '2027-03-15', status: 'active', ssl: true, dns: 'cloudflare' },
    { id: '2', name: 'sig360.io', registrar: 'GoDaddy', expiresAt: '2026-08-22', status: 'active', ssl: true, dns: 'cloudflare' },
  ]);
  
  const [subdomains] = useState<Subdomain[]>([
    { id: '1', name: 'ai', parentDomain: 'channelcast.io', target: '72.62.131.64', type: 'A', ssl: true, status: 'active' },
    { id: '2', name: 'api', parentDomain: 'channelcast.io', target: '72.62.131.64', type: 'A', ssl: true, status: 'active' },
    { id: '3', name: 'voice', parentDomain: 'channelcast.io', target: 'pending', type: 'CNAME', ssl: false, status: 'pending' },
  ]);
  
  const [hostingAccounts] = useState<HostingAccount[]>([
    { id: '1', name: 'SIG360 Primary VPS', provider: 'Contabo', type: 'vps', status: 'connected', ip: '72.62.131.64', region: 'US East' },
  ]);
  
  const [deployments] = useState<Deployment[]>([
    { id: '1', name: 'SIG360', framework: 'Next.js', domain: 'ai.channelcast.io', hosting: 'SIG360 Primary VPS', status: 'live', lastDeployed: '2026-02-26' },
  ]);

  const frameworks = [
    { id: 'nextjs', name: 'Next.js', icon: '▲' },
    { id: 'react', name: 'React', icon: '⚛️' },
    { id: 'vue', name: 'Vue.js', icon: '💚' },
    { id: 'node', name: 'Node.js', icon: '🟢' },
    { id: 'python', name: 'Python', icon: '🐍' },
    { id: 'dograh', name: 'Dograh AI', icon: '🤖' },
    { id: 'wordpress', name: 'WordPress', icon: '📝' },
    { id: 'static', name: 'Static Site', icon: '📄' },
  ];

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Rocket className="w-6 h-6 text-purple-500" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Deploy</h1>
        </div>
        <p className="text-muted-foreground">Manage domains, hosting accounts, and deploy applications</p>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-secondary flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-muted">
            <Rocket className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="domains" className="data-[state=active]:bg-muted">
            <Globe className="w-4 h-4 mr-2" />
            Domains
          </TabsTrigger>
          <TabsTrigger value="subdomains" className="data-[state=active]:bg-muted">
            <Link2 className="w-4 h-4 mr-2" />
            Subdomains
          </TabsTrigger>
          <TabsTrigger value="hosting" className="data-[state=active]:bg-muted">
            <Server className="w-4 h-4 mr-2" />
            Hosting
          </TabsTrigger>
          <TabsTrigger value="vps" className="data-[state=active]:bg-muted">
            <Cloud className="w-4 h-4 mr-2" />
            VPS
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-0 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-card/50 border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Globe className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Domains</p>
                    <p className="text-xl font-bold text-foreground">{domains.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <Link2 className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Subdomains</p>
                    <p className="text-xl font-bold text-foreground">{subdomains.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Server className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Hosting</p>
                    <p className="text-xl font-bold text-foreground">{hostingAccounts.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brand/20 rounded-lg">
                    <Rocket className="w-5 h-5 text-brand" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Deployments</p>
                    <p className="text-xl font-bold text-foreground">{deployments.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Active Deployments */}
          <Card className="bg-card/50 border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Active Deployments</CardTitle>
                  <CardDescription>Your deployed applications and services</CardDescription>
                </div>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="w-4 h-4 mr-2" />
                  New Deployment
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {deployments.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Rocket className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No deployments yet</p>
                  <p className="text-sm">Deploy your first application to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {deployments.map((deployment) => (
                    <div key={deployment.id} className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                          <Rocket className="w-5 h-5 text-purple-500" />
                        </div>
                        <div>
                          <p className="font-medium">{deployment.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {deployment.framework} • {deployment.domain}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={deployment.status === 'live' ? 'default' : 'secondary'} className={deployment.status === 'live' ? 'bg-green-600' : ''}>
                          {deployment.status}
                        </Badge>
                        <Button variant="ghost" size="icon">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Deploy */}
          <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-purple-500" />
                Quick Deploy - Dograh AI Voice
              </CardTitle>
              <CardDescription>Deploy an AI voice agent to handle calls for you or your clients</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Select Hosting Account</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose hosting..." />
                      </SelectTrigger>
                      <SelectContent>
                        {hostingAccounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.name} ({account.ip})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Assign Domain/Subdomain</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose domain..." />
                      </SelectTrigger>
                      <SelectContent>
                        {subdomains.map((sub) => (
                          <SelectItem key={sub.id} value={sub.id}>
                            {sub.name}.{sub.parentDomain}
                          </SelectItem>
                        ))}
                        <SelectItem value="new">+ Add new subdomain</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex flex-col justify-center">
                  <div className="p-4 bg-secondary/50 rounded-lg mb-4">
                    <p className="text-sm text-muted-foreground mb-2">Dograh Requirements:</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• 8GB RAM minimum</li>
                      <li>• 4 vCPUs minimum</li>
                      <li>• Ports: 80, 443, 3478, 5349</li>
                      <li>• Docker installed</li>
                    </ul>
                  </div>
                  <Button disabled className="bg-purple-600 hover:bg-purple-700">
                    <Rocket className="w-4 h-4 mr-2" />
                    Deploy Dograh (Upgrade VPS First)
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Domains Tab */}
        <TabsContent value="domains" className="mt-0">
          <Card className="bg-card/50 border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Domain Names</CardTitle>
                  <CardDescription>Manage your registered domain names</CardDescription>
                </div>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Domain
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {domains.map((domain) => (
                  <div key={domain.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-secondary/50 rounded-lg gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-blue-500/20 rounded-lg">
                        <Globe className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="font-medium">{domain.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {domain.registrar} • Expires: {domain.expiresAt}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {domain.ssl && (
                        <Badge variant="outline" className="border-green-500/30 text-green-500">
                          <Shield className="w-3 h-3 mr-1" />
                          SSL
                        </Badge>
                      )}
                      <Badge variant="secondary">{domain.dns}</Badge>
                      <Badge variant={domain.status === 'active' ? 'default' : 'destructive'} className={domain.status === 'active' ? 'bg-green-600' : ''}>
                        {domain.status}
                      </Badge>
                      <Button variant="ghost" size="icon">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subdomains Tab */}
        <TabsContent value="subdomains" className="mt-0">
          <Card className="bg-card/50 border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Subdomains</CardTitle>
                  <CardDescription>Manage subdomains and DNS records</CardDescription>
                </div>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Subdomain
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {subdomains.map((subdomain) => (
                  <div key={subdomain.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-secondary/50 rounded-lg gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-green-500/20 rounded-lg">
                        <Link2 className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <p className="font-medium">{subdomain.name}.{subdomain.parentDomain}</p>
                        <p className="text-sm text-muted-foreground">
                          {subdomain.type} → {subdomain.target}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {subdomain.ssl && (
                        <Badge variant="outline" className="border-green-500/30 text-green-500">
                          <Shield className="w-3 h-3 mr-1" />
                          SSL
                        </Badge>
                      )}
                      <Badge 
                        variant={subdomain.status === 'active' ? 'default' : subdomain.status === 'pending' ? 'secondary' : 'destructive'}
                        className={subdomain.status === 'active' ? 'bg-green-600' : ''}
                      >
                        {subdomain.status}
                      </Badge>
                      <Button variant="ghost" size="icon">
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hosting Tab */}
        <TabsContent value="hosting" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Hosting Accounts</CardTitle>
                    <CardDescription>Connected hosting providers</CardDescription>
                  </div>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Connect Account
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {hostingAccounts.map((account) => (
                    <div key={account.id} className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                          <Server className="w-5 h-5 text-purple-500" />
                        </div>
                        <div>
                          <p className="font-medium">{account.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {account.provider} • {account.type.toUpperCase()} • {account.region}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={account.status === 'connected' ? 'default' : 'destructive'} className={account.status === 'connected' ? 'bg-green-600' : ''}>
                          {account.status}
                        </Badge>
                        <Button variant="ghost" size="icon">
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle>Supported Providers</CardTitle>
                <CardDescription>Connect these hosting platforms</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {['Contabo', 'DigitalOcean', 'AWS', 'Vercel', 'Netlify', 'Cloudflare', 'Hostinger', 'Linode'].map((provider) => (
                    <div key={provider} className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
                      <Cloud className="w-5 h-5 text-muted-foreground" />
                      <span className="text-sm">{provider}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* VPS Tab */}
        <TabsContent value="vps" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="bg-card/50 border-border">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>VPS Accounts</CardTitle>
                      <CardDescription>Manage your virtual private servers</CardDescription>
                    </div>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add VPS
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {hostingAccounts.filter(a => a.type === 'vps').map((vps) => (
                      <div key={vps.id} className="p-4 bg-secondary/50 rounded-lg">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <div className="p-2 bg-blue-500/20 rounded-lg">
                              <Server className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                              <p className="font-medium">{vps.name}</p>
                              <p className="text-sm text-muted-foreground">{vps.provider}</p>
                            </div>
                          </div>
                          <Badge className="bg-green-600">Online</Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">IP Address</p>
                            <p className="font-mono">{vps.ip}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Region</p>
                            <p>{vps.region}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">RAM</p>
                            <p>4 GB</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">CPU</p>
                            <p>2 vCPUs</p>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button variant="outline" size="sm">
                            <RefreshCw className="w-4 h-4 mr-1" />
                            Refresh Status
                          </Button>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-1" />
                            View Details
                          </Button>
                          <Button variant="outline" size="sm">
                            <Settings className="w-4 h-4 mr-1" />
                            Configure
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="bg-card/50 border-border">
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Check All VPS Status
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Shield className="w-4 h-4 mr-2" />
                    SSL Certificate Status
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Cloud className="w-4 h-4 mr-2" />
                    DNS Propagation Check
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-yellow-500/10 border-yellow-500/20">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                    Upgrade Recommended
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    Your current VPS (4GB RAM) may not support Dograh AI deployment.
                  </p>
                  <p className="text-sm text-muted-foreground mb-3">
                    Recommended: 8GB RAM, 4 vCPUs
                  </p>
                  <Button variant="outline" size="sm" className="w-full">
                    View Upgrade Options
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
