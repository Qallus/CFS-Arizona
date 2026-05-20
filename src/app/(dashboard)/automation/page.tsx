'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Zap, 
  Plus,
  Play,
  Pause,
  Trash2,
  Edit,
  Phone,
  Mail,
  MessageSquare,
  Bell,
  Calendar,
  Users,
  Share2,
  Megaphone,
  Slack,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
  Search,
  Filter,
  ArrowRight,
  Loader2,
  GitBranch,
  Repeat,
  Target,
  TrendingUp,
  ExternalLink,
  Workflow,
  Link2,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CreateAutomationModal } from '@/components/automation/CreateAutomationModal';
import { EditAutomationModal } from '@/components/automation/EditAutomationModal';

interface Automation {
  id: string;
  name: string;
  description: string;
  category: 'workflow' | 'communication' | 'reminder' | 'marketing' | 'integration';
  trigger: string;
  actions: string[];
  status: 'active' | 'paused' | 'draft';
  lastRun?: string;
  runCount: number;
  successRate: number;
  createdAt: string;
}

// Sample automations for demo
const sampleAutomations: Automation[] = [
  {
    id: '1',
    name: 'New Lead Follow-up',
    description: 'Send welcome email and SMS when a new lead is added',
    category: 'communication',
    trigger: 'New contact with tag "Lead"',
    actions: ['Send welcome email', 'Send SMS introduction', 'Create follow-up task'],
    status: 'active',
    lastRun: '2 hours ago',
    runCount: 156,
    successRate: 98,
    createdAt: '2026-01-15',
  },
  {
    id: '2',
    name: 'Appointment Reminder',
    description: 'Send reminders 24h and 1h before appointments',
    category: 'reminder',
    trigger: 'Appointment scheduled',
    actions: ['Send email 24h before', 'Send SMS 1h before', 'Notify on Slack'],
    status: 'active',
    lastRun: '30 minutes ago',
    runCount: 89,
    successRate: 100,
    createdAt: '2026-01-20',
  },
  {
    id: '3',
    name: 'Weekly Marketing Digest',
    description: 'Compile and send weekly marketing performance report',
    category: 'marketing',
    trigger: 'Every Monday at 9 AM',
    actions: ['Gather analytics', 'Generate report', 'Send to team'],
    status: 'active',
    lastRun: '5 days ago',
    runCount: 12,
    successRate: 100,
    createdAt: '2026-02-01',
  },
  {
    id: '4',
    name: 'Slack Daily Standup',
    description: 'Post daily standup reminder and collect responses',
    category: 'integration',
    trigger: 'Every weekday at 9:30 AM',
    actions: ['Post standup thread', 'Collect responses', 'Summarize at 10 AM'],
    status: 'paused',
    lastRun: '1 week ago',
    runCount: 45,
    successRate: 92,
    createdAt: '2026-01-10',
  },
  {
    id: '5',
    name: 'Lead Nurture Sequence',
    description: 'Multi-step email sequence for new leads over 14 days',
    category: 'workflow',
    trigger: 'New lead added',
    actions: ['Day 1: Welcome', 'Day 3: Value prop', 'Day 7: Case study', 'Day 14: Offer'],
    status: 'active',
    lastRun: '1 hour ago',
    runCount: 234,
    successRate: 87,
    createdAt: '2026-01-05',
  },
];

const categoryConfig = {
  workflow: { icon: GitBranch, color: 'text-purple-500', bg: 'bg-purple-500/20' },
  communication: { icon: MessageSquare, color: 'text-blue-500', bg: 'bg-blue-500/20' },
  reminder: { icon: Bell, color: 'text-yellow-500', bg: 'bg-yellow-500/20' },
  marketing: { icon: Megaphone, color: 'text-green-500', bg: 'bg-green-500/20' },
  integration: { icon: Share2, color: 'text-brand', bg: 'bg-brand/20' },
};

export default function AutomationPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [automations, setAutomations] = useState<Automation[]>(sampleAutomations);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState<Automation | null>(null);
  const [n8nConnected, setN8nConnected] = useState(false);
  const [n8nUrl, setN8nUrl] = useState('');

  const handleAutomationCreated = (automation: Automation) => {
    setAutomations(prev => [automation, ...prev]);
  };

  const handleEditClick = (automation: Automation) => {
    setEditingAutomation(automation);
    setShowEditModal(true);
  };

  const handleAutomationSaved = (updatedAutomation: Automation) => {
    setAutomations(prev => prev.map(a => 
      a.id === updatedAutomation.id ? updatedAutomation : a
    ));
  };

  const filteredAutomations = automations.filter(auto => {
    const matchesSearch = auto.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          auto.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeTab === 'all' || auto.category === activeTab;
    return matchesSearch && matchesCategory;
  });

  const stats = {
    total: automations.length,
    active: automations.filter(a => a.status === 'active').length,
    paused: automations.filter(a => a.status === 'paused').length,
    totalRuns: automations.reduce((sum, a) => sum + a.runCount, 0),
    avgSuccess: Math.round(automations.reduce((sum, a) => sum + a.successRate, 0) / automations.length),
  };

  const toggleStatus = (id: string) => {
    setAutomations(prev => prev.map(a => 
      a.id === id 
        ? { ...a, status: a.status === 'active' ? 'paused' : 'active' }
        : a
    ));
  };

  const deleteAutomation = (id: string) => {
    setAutomations(prev => prev.filter(a => a.id !== id));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'paused': return <Pause className="w-4 h-4 text-yellow-500" />;
      case 'draft': return <AlertCircle className="w-4 h-4 text-gray-500" />;
      default: return null;
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Zap className="w-8 h-8 text-brand" />
            <h1 className="text-3xl font-bold text-foreground">Automation</h1>
          </div>
          <Button className="bg-brand hover:bg-brand/90" onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Automation
          </Button>
        </div>
        <p className="text-muted-foreground">Automate your workflows, communications, and business processes</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <Card className="bg-card/50 border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Zap className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Automations</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <Play className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.active}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/20">
                <Pause className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.paused}</p>
                <p className="text-xs text-muted-foreground">Paused</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Repeat className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.totalRuns.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Runs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-brand/20">
                <TrendingUp className="w-5 h-5 text-brand" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.avgSuccess}%</p>
                <p className="text-xs text-muted-foreground">Success Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="bg-secondary">
            <TabsTrigger value="all" className="data-[state=active]:bg-muted">
              <Zap className="w-4 h-4 mr-2" />
              All
            </TabsTrigger>
            <TabsTrigger value="workflow" className="data-[state=active]:bg-muted">
              <GitBranch className="w-4 h-4 mr-2" />
              Workflows
            </TabsTrigger>
            <TabsTrigger value="communication" className="data-[state=active]:bg-muted">
              <MessageSquare className="w-4 h-4 mr-2" />
              Communication
            </TabsTrigger>
            <TabsTrigger value="reminder" className="data-[state=active]:bg-muted">
              <Bell className="w-4 h-4 mr-2" />
              Reminders
            </TabsTrigger>
            <TabsTrigger value="marketing" className="data-[state=active]:bg-muted">
              <Megaphone className="w-4 h-4 mr-2" />
              Marketing
            </TabsTrigger>
            <TabsTrigger value="integration" className="data-[state=active]:bg-muted">
              <Share2 className="w-4 h-4 mr-2" />
              Integrations
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search automations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-64 bg-secondary border-border"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <TabsContent value={activeTab} className="mt-0">
          <div className="grid gap-4">
            {filteredAutomations.length === 0 ? (
              <Card className="bg-card/50 border-border">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Zap className="w-12 h-12 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">No automations found</p>
                  <Button className="mt-4 bg-brand hover:bg-brand/90">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Automation
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredAutomations.map((automation) => {
                const config = categoryConfig[automation.category];
                const CategoryIcon = config.icon;
                
                return (
                  <Card key={automation.id} className="bg-card/50 border-border hover:border-brand/50 transition-colors">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className={cn('p-3 rounded-lg', config.bg)}>
                            <CategoryIcon className={cn('w-6 h-6', config.color)} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-foreground">{automation.name}</h3>
                              {getStatusIcon(automation.status)}
                              <span className={cn(
                                'px-2 py-0.5 rounded text-xs',
                                automation.status === 'active' ? 'bg-green-500/20 text-green-400' :
                                automation.status === 'paused' ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-gray-500/20 text-gray-400'
                              )}>
                                {automation.status}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">{automation.description}</p>
                            
                            {/* Trigger & Actions */}
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                              <span className="px-2 py-1 bg-secondary rounded text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {automation.trigger}
                              </span>
                              <ArrowRight className="w-4 h-4 text-muted-foreground" />
                              {automation.actions.slice(0, 2).map((action, i) => (
                                <span key={i} className="px-2 py-1 bg-secondary rounded text-xs text-muted-foreground">
                                  {action}
                                </span>
                              ))}
                              {automation.actions.length > 2 && (
                                <span className="px-2 py-1 bg-secondary rounded text-xs text-muted-foreground">
                                  +{automation.actions.length - 2} more
                                </span>
                              )}
                            </div>

                            {/* Stats */}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Repeat className="w-3 h-3" />
                                {automation.runCount} runs
                              </span>
                              <span className="flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                {automation.successRate}% success
                              </span>
                              {automation.lastRun && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  Last run: {automation.lastRun}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleStatus(automation.id)}
                            className={automation.status === 'active' ? 'hover:bg-yellow-500/20' : 'hover:bg-green-500/20'}
                          >
                            {automation.status === 'active' ? (
                              <>
                                <Pause className="w-4 h-4 mr-1" />
                                Pause
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4 mr-1" />
                                Activate
                              </>
                            )}
                          </Button>
                          <Button variant="outline" size="icon" onClick={() => handleEditClick(automation)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon"
                            className="hover:bg-red-500/20 hover:text-red-500 hover:border-red-500/50"
                            onClick={() => deleteAutomation(automation.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Quick Create Section */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-foreground mb-4">Quick Create Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { name: 'Email Drip', icon: Mail, desc: 'Multi-step email sequence', color: 'blue' },
            { name: 'SMS Alert', icon: MessageSquare, desc: 'Instant SMS notification', color: 'green' },
            { name: 'Call Reminder', icon: Phone, desc: 'Automated call scheduling', color: 'purple' },
            { name: 'Slack Notify', icon: Slack, desc: 'Team notifications', color: 'orange' },
            { name: 'Lead Scoring', icon: Target, desc: 'Auto-score leads', color: 'pink' },
          ].map((template) => (
            <Card 
              key={template.name}
              className="bg-card/50 border-border hover:border-brand/50 cursor-pointer transition-all hover:scale-105"
              onClick={() => setShowCreateModal(true)}
            >
              <CardContent className="p-4 text-center">
                <div className={cn(
                  'w-12 h-12 rounded-lg mx-auto mb-3 flex items-center justify-center',
                  template.color === 'blue' ? 'bg-blue-500/20' :
                  template.color === 'green' ? 'bg-green-500/20' :
                  template.color === 'purple' ? 'bg-purple-500/20' :
                  template.color === 'orange' ? 'bg-brand/20' :
                  'bg-pink-500/20'
                )}>
                  <template.icon className={cn(
                    'w-6 h-6',
                    template.color === 'blue' ? 'text-blue-500' :
                    template.color === 'green' ? 'text-green-500' :
                    template.color === 'purple' ? 'text-purple-500' :
                    template.color === 'orange' ? 'text-brand' :
                    'text-pink-500'
                  )} />
                </div>
                <h3 className="font-medium text-foreground text-sm">{template.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{template.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* n8n Integration Section */}
      <div className="mt-8">
        <Card className="bg-card/50 border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Workflow className="w-5 h-5 text-brand" />
              n8n Integration
              <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded ml-2">Advanced</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Connection Status */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-3 h-3 rounded-full',
                      n8nConnected ? 'bg-green-500' : 'bg-gray-500'
                    )} />
                    <div>
                      <p className="font-medium text-foreground">
                        {n8nConnected ? 'Connected to n8n' : 'Not Connected'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {n8nConnected ? n8nUrl : 'Connect your n8n instance for advanced workflows'}
                      </p>
                    </div>
                  </div>
                  {n8nConnected ? (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => window.open(n8nUrl, '_blank')}>
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Open n8n
                      </Button>
                      <Button variant="outline" size="sm">
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Sync
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      size="sm" 
                      className="bg-purple-500 hover:bg-purple-600"
                      onClick={() => {
                        const url = prompt('Enter your n8n instance URL:', 'https://n8n.yourdomain.com');
                        if (url) {
                          setN8nUrl(url);
                          setN8nConnected(true);
                        }
                      }}
                    >
                      <Link2 className="w-4 h-4 mr-1" />
                      Connect n8n
                    </Button>
                  )}
                </div>

                {!n8nConnected && (
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>n8n is a powerful workflow automation tool that enables:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Complex multi-step workflows</li>
                      <li>400+ integrations (Zapier alternative)</li>
                      <li>Custom code execution</li>
                      <li>Webhook triggers & API calls</li>
                      <li>Self-hosted for full control</li>
                    </ul>
                  </div>
                )}
              </div>

              {/* n8n Workflows */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-foreground">n8n Workflows</h4>
                  {n8nConnected && (
                    <Button variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-1" />
                      New Workflow
                    </Button>
                  )}
                </div>

                {n8nConnected ? (
                  <div className="space-y-2">
                    {[
                      { name: 'Lead Enrichment Pipeline', status: 'active', runs: 234 },
                      { name: 'Social Media Auto-Post', status: 'active', runs: 89 },
                      { name: 'Invoice Processing', status: 'paused', runs: 45 },
                    ].map((workflow, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Workflow className="w-4 h-4 text-purple-500" />
                          <div>
                            <p className="text-sm font-medium text-foreground">{workflow.name}</p>
                            <p className="text-xs text-muted-foreground">{workflow.runs} runs</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            'px-2 py-0.5 rounded text-xs',
                            workflow.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                          )}>
                            {workflow.status}
                          </span>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center bg-secondary/20 rounded-lg">
                    <Workflow className="w-12 h-12 text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Connect n8n to see your workflows
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Automation Modal */}
      <CreateAutomationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handleAutomationCreated}
      />

      {/* Edit Automation Modal */}
      <EditAutomationModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingAutomation(null);
        }}
        automation={editingAutomation}
        onSave={handleAutomationSaved}
      />
    </div>
  );
}
