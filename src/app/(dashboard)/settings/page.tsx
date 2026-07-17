'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Settings, 
  Save, 
  RefreshCw, 
  Shield, 
  Cpu, 
  Wifi,
  Key,
  ChevronDown,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Loader2,
  Mail,
  Phone,
  Database,
  Globe,
  Workflow,
  Server,
  Lock,
  Plus,
  Trash2,
  X,
  Speaker,
  Play,
  Monitor,
  Edit,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CredentialField {
  key: string;
  label: string;
  type: string;
  sensitive: boolean;
  value: string;
  hasValue: boolean;
  isCustom?: boolean;
}

interface CredentialGroup {
  name: string;
  description: string;
  fields: CredentialField[];
  allowAdd?: boolean;
}

interface SystemInfo {
  gatewayVersion?: string;
  model?: string;
  uptime?: string;
  status?: string;
}

const GROUP_ICONS: Record<string, any> = {
  email: Mail,
  twilio: Phone,
  wordpress: Globe,
  mailpurse: Mail,
  supabase: Database,
  nocodb: Database,
  n8n: Workflow,
  directus: Server,
};

export default function SettingsPage() {
  const [systemInfo, setSystemInfo] = useState<SystemInfo>({});
  const [isLoading, setIsLoading] = useState(true);
  const [groups, setGroups] = useState<Record<string, CredentialGroup>>({});
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const toggleGroup = (k: string) => setOpenGroups((g) => ({ ...g, [k]: !g[k] }));
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState('credentials');
  
  // Add new credential state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyValue, setNewKeyValue] = useState('');
  const [newKeyIsSensitive, setNewKeyIsSensitive] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  

  useEffect(() => {
    loadSettings();
    loadCredentials();
  }, []);


  const loadSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      const data = await response.json();
      setSystemInfo(data.system || {});
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const loadCredentials = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/settings/credentials');
      const data = await response.json();
      setGroups(data.groups || {});
    } catch (error) {
      console.error('Error loading credentials:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleValueChange = (key: string, value: string) => {
    setEditedValues(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const togglePasswordVisibility = (key: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async (groupKey: string, restart: boolean = false) => {
    // Get all edited values for this group
    const group = groups[groupKey];
    if (!group) return;

    const updates: Record<string, string> = {};
    for (const field of group.fields) {
      if (editedValues[field.key]) {
        updates[field.key] = editedValues[field.key];
      }
    }

    if (Object.keys(updates).length === 0) {
      setSaveMessage({ type: 'error', text: 'No changes to save' });
      setTimeout(() => setSaveMessage(null), 3000);
      return;
    }

    setSaving(true);
    setSaveMessage(null);

    try {
      const response = await fetch('/api/settings/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates, restart }),
      });

      const data = await response.json();

      if (data.success) {
        setSaveMessage({ 
          type: 'success', 
          text: restart ? 'Saved! App restarting...' : 'Saved successfully!' 
        });
        // Clear edited values for saved keys
        setEditedValues(prev => {
          const next = { ...prev };
          for (const key of Object.keys(updates)) {
            delete next[key];
          }
          return next;
        });
        // Reload credentials to show updated masked values
        setTimeout(loadCredentials, restart ? 3000 : 500);
      } else {
        setSaveMessage({ type: 'error', text: data.error || 'Failed to save' });
      }
    } catch (error) {
      setSaveMessage({ type: 'error', text: 'Failed to save credentials' });
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMessage(null), 5000);
    }
  };

  const hasChangesInGroup = (groupKey: string) => {
    const group = groups[groupKey];
    if (!group) return false;
    return group.fields.some(field => editedValues[field.key]);
  };

  const handleAddCredential = async () => {
    if (!newKeyName.trim() || !newKeyValue.trim()) {
      setSaveMessage({ type: 'error', text: 'Both key name and value are required' });
      return;
    }

    // Format key name (uppercase, underscores)
    const formattedKey = newKeyName.trim().toUpperCase().replace(/[^A-Z0-9]/g, '_');

    setSaving(true);
    try {
      const response = await fetch('/api/settings/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          updates: { [formattedKey]: newKeyValue },
          restart: false,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSaveMessage({ type: 'success', text: `Added ${formattedKey}` });
        setShowAddModal(false);
        setNewKeyName('');
        setNewKeyValue('');
        setNewKeyIsSensitive(true);
        loadCredentials();
      } else {
        setSaveMessage({ type: 'error', text: data.error || 'Failed to add' });
      }
    } catch {
      setSaveMessage({ type: 'error', text: 'Failed to add credential' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCredential = async (key: string) => {
    if (!confirm(`Are you sure you want to delete "${key}"? This cannot be undone.`)) {
      return;
    }

    setDeleting(key);
    try {
      const response = await fetch(`/api/settings/credentials?key=${encodeURIComponent(key)}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        setSaveMessage({ type: 'success', text: `Deleted ${key}` });
        loadCredentials();
      } else {
        setSaveMessage({ type: 'error', text: data.error || 'Failed to delete' });
      }
    } catch {
      setSaveMessage({ type: 'error', text: 'Failed to delete credential' });
    } finally {
      setDeleting(null);
    }
  };

  const renderCredentialGroup = (groupKey: string, group: CredentialGroup) => {
    const Icon = GROUP_ICONS[groupKey] || Key;
    const hasChanges = hasChangesInGroup(groupKey);
    const isOpen = openGroups[groupKey] ?? false;

    return (
      <Card key={groupKey} className="bg-card/50 border-border">
        <CardHeader className={isOpen ? "pb-3" : "pb-3 [.border-b]:pb-3"}>
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => toggleGroup(groupKey)}
              className="flex min-w-0 flex-1 items-center gap-3 text-left"
              aria-expanded={isOpen}
            >
              <ChevronDown className={cn("w-4 h-4 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
              <div className="w-10 h-10 shrink-0 rounded-lg bg-brand/20 flex items-center justify-center">
                <Icon className="w-5 h-5 text-brand" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-foreground">{group.name}</CardTitle>
                <CardDescription>{group.description}</CardDescription>
              </div>
            </button>
            <div className="flex shrink-0 gap-2">
              {group.allowAdd && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAddModal(true)}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              )}
              {hasChanges && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSave(groupKey, false)}
                    disabled={saving}
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleSave(groupKey, true)}
                    disabled={saving}
                    className="bg-brand hover:bg-brand/90"
                  >
                    Save & Restart
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        {isOpen && (
        <CardContent className="space-y-4">
          {group.fields.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No custom APIs configured. Click "Add" to create one.
            </p>
          )}
          {group.fields.map((field: any) => (
            <div key={field.key} className="space-y-1">
              <label className="text-sm text-muted-foreground flex items-center gap-2">
                {field.label}
                {field.sensitive && <Lock className="w-3 h-3" />}
                {field.hasValue && !editedValues[field.key] && (
                  <Badge variant="outline" className="text-xs border-green-500/50 text-green-500">
                    Set
                  </Badge>
                )}
                {field.isCustom && (
                  <button
                    onClick={() => handleDeleteCredential(field.key)}
                    disabled={deleting === field.key}
                    className="ml-auto text-red-400 hover:text-red-300 disabled:opacity-50"
                    title="Delete this credential"
                  >
                    {deleting === field.key ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                )}
              </label>
              <div className="relative">
                <Input
                  type={field.sensitive && !showPasswords[field.key] ? 'password' : 'text'}
                  value={editedValues[field.key] ?? ''}
                  onChange={(e) => handleValueChange(field.key, e.target.value)}
                  placeholder={field.hasValue ? field.value : `Enter ${field.label.toLowerCase()}`}
                  className={cn(
                    "bg-secondary border-border pr-10",
                    editedValues[field.key] && "border-brand/50"
                  )}
                />
                {field.sensitive && (
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility(field.key)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPasswords[field.key] ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
        )}
      </Card>
    );
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Settings className="w-6 h-6 text-brand" />
            Settings
          </h1>
          <p className="text-muted-foreground">Dashboard configuration and credentials</p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="bg-brand hover:bg-brand/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Credentials
        </Button>
      </div>

      {/* Save Message */}
      {saveMessage && (
        <div className={cn(
          "mb-6 p-4 rounded-lg flex items-center gap-2",
          saveMessage.type === 'success' 
            ? "bg-green-500/10 border border-green-500/30 text-green-400"
            : "bg-red-500/10 border border-red-500/30 text-red-400"
        )}>
          {saveMessage.type === 'success' ? (
            <Check className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          {saveMessage.text}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-secondary">
          <TabsTrigger value="credentials" className="data-[state=active]:bg-muted">
            <Key className="w-4 h-4 mr-2" />
            Credentials
          </TabsTrigger>
          <TabsTrigger value="system" className="data-[state=active]:bg-muted">
            <Cpu className="w-4 h-4 mr-2" />
            System
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-muted">
            <Shield className="w-4 h-4 mr-2" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* Credentials Tab */}
        <TabsContent value="credentials" className="mt-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(groups).map(([key, group]) =>
                renderCredentialGroup(key, group)
              )}
            </div>
          )}

          {/* Help Card */}
          <Card className="bg-card/50 border-border mt-6">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-blue-500" />
                How Credentials Work
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>• Credentials are stored securely in <code className="bg-secondary px-1 rounded">.env.local</code> on the server</p>
              <p>• Sensitive values are masked but shown as "Set" when configured</p>
              <p>• Click <strong>Save</strong> to update without restart, or <strong>Save & Restart</strong> to apply immediately</p>
              <p>• Some changes (like API keys) only take effect after restart</p>
            </CardContent>
          </Card>
        </TabsContent>


        {/* System Tab */}
        <TabsContent value="system" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Info */}
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-muted-foreground" />
                  System Information
                </CardTitle>
                <CardDescription>OpenClaw gateway status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant="outline" className="border-green-500 text-green-500">
                    {systemInfo.status || 'Online'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-muted-foreground">Model</span>
                  <span className="text-foreground">{systemInfo.model || 'claude-opus-4-5'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-muted-foreground">Version</span>
                  <span className="text-foreground">{systemInfo.gatewayVersion || '2026.1.29'}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-muted-foreground">Gateway URL</span>
                  <code className="text-foreground/80 text-sm">localhost:18789</code>
                </div>
              </CardContent>
            </Card>

            {/* Connection */}
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Wifi className="w-5 h-5 text-muted-foreground" />
                  Connection
                </CardTitle>
                <CardDescription>Dashboard connection settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground block mb-2">Gateway URL</label>
                  <Input
                    defaultValue="http://localhost:18789"
                    className="bg-secondary border-border text-foreground"
                    disabled
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground block mb-2">Workspace Path</label>
                  <Input
                    defaultValue="/root/.openclaw/workspace"
                    className="bg-secondary border-border text-foreground"
                    disabled
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={loadSettings}
                  className="w-full border-border text-foreground/80 hover:bg-secondary"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Test Connection
                </Button>
              </CardContent>
            </Card>

            {/* App Control */}
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Server className="w-5 h-5 text-muted-foreground" />
                  App Control
                </CardTitle>
                <CardDescription>Manage the dashboard application</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      await fetch('/api/settings/credentials', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ updates: {}, restart: true }),
                      });
                      setSaveMessage({ type: 'success', text: 'App restarting...' });
                    } catch {
                      setSaveMessage({ type: 'error', text: 'Failed to restart' });
                    }
                  }}
                  className="w-full border-border text-foreground/80 hover:bg-secondary"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Restart Dashboard
                </Button>
              </CardContent>
            </Card>

            {/* About */}
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="text-foreground">About SIG360</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm mb-4">
                  SIG360 provides a web interface for managing your AI assistant,
                  communications, contacts, and system configuration.
                </p>
                <div className="text-xs text-muted-foreground/60 space-y-1">
                  <p>Dashboard v1.0.0</p>
                  <p>Built with Next.js + shadcn/ui</p>
                  <p>© 2026 ChannelCast</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Shield className="w-5 h-5 text-muted-foreground" />
                  Authentication
                </CardTitle>
                <CardDescription>Login and session settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-muted-foreground">Auth Method</span>
                  <Badge variant="outline" className="border-green-500 text-green-500">
                    Credentials
                  </Badge>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-muted-foreground">Session</span>
                  <Badge variant="outline" className="border-blue-500 text-blue-500">
                    Active (JWT)
                  </Badge>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-muted-foreground">Login Email</span>
                  <span className="text-foreground/80">jw@channelcast.io</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Lock className="w-5 h-5 text-muted-foreground" />
                  Password
                </CardTitle>
                <CardDescription>Update login credentials</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground block mb-2">New Password</label>
                  <Input
                    type="password"
                    placeholder="Enter new password"
                    className="bg-secondary border-border"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground block mb-2">Confirm Password</label>
                  <Input
                    type="password"
                    placeholder="Confirm new password"
                    className="bg-secondary border-border"
                  />
                </div>
                <Button
                  variant="outline"
                  className="w-full border-border text-foreground/80 hover:bg-secondary"
                >
                  Update Password
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add New Credential Modal */}
      {showAddModal && (
        <AddCredentialModal 
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddCredential}
          saving={saving}
          newKeyName={newKeyName}
          setNewKeyName={setNewKeyName}
          newKeyValue={newKeyValue}
          setNewKeyValue={setNewKeyValue}
          newKeyIsSensitive={newKeyIsSensitive}
          setNewKeyIsSensitive={setNewKeyIsSensitive}
        />
      )}
    </div>
  );
}

// Preset credential types
const CREDENTIAL_PRESETS = [
  { 
    category: 'Payments', 
    items: [
      { key: 'SQUARE_ACCESS_TOKEN', label: 'Square Access Token', icon: '⬜' },
      { key: 'SQUARE_APPLICATION_ID', label: 'Square Application ID', icon: '⬜' },
      { key: 'SQUARE_LOCATION_ID', label: 'Square Location ID', icon: '⬜' },
      { key: 'SQUARE_WEBHOOK_SIGNATURE', label: 'Square Webhook Signature', icon: '⬜' },
      { key: 'STRIPE_SECRET_KEY', label: 'Stripe Secret Key', icon: '💳' },
      { key: 'STRIPE_PUBLISHABLE_KEY', label: 'Stripe Publishable Key', icon: '💳' },
      { key: 'STRIPE_WEBHOOK_SECRET', label: 'Stripe Webhook Secret', icon: '💳' },
    ]
  },
  { 
    category: 'Email', 
    items: [
      { key: 'RESEND_API_KEY', label: 'Resend API Key', icon: '📧' },
      { key: 'SENDGRID_API_KEY', label: 'SendGrid API Key', icon: '📧' },
    ]
  },
  { 
    category: 'Google', 
    items: [
      { key: 'GOOGLE_CLIENT_ID', label: 'Google Client ID', icon: '🔵' },
      { key: 'GOOGLE_CLIENT_SECRET', label: 'Google Client Secret', icon: '🔵' },
      { key: 'GOOGLE_REFRESH_TOKEN', label: 'Google Refresh Token', icon: '🔵' },
    ]
  },
  { 
    category: 'Automation', 
    items: [
      { key: 'N8N_API_KEY', label: 'n8n API Key', icon: '🔄' },
      { key: 'N8N_WEBHOOK_URL', label: 'n8n Webhook URL', icon: '🔄' },
      { key: 'MAKE_WEBHOOK_URL', label: 'Make.com Webhook', icon: '🔄' },
      { key: 'ZAPIER_WEBHOOK_URL', label: 'Zapier Webhook', icon: '🔄' },
    ]
  },
  { 
    category: 'CRM / Database', 
    items: [
      { key: 'HUBSPOT_API_KEY', label: 'HubSpot API Key', icon: '🟠' },
      { key: 'AIRTABLE_API_KEY', label: 'Airtable API Key', icon: '📊' },
      { key: 'NOTION_API_KEY', label: 'Notion API Key', icon: '📝' },
    ]
  },
  { 
    category: 'Other', 
    items: [
      { key: 'OPENAI_API_KEY', label: 'OpenAI API Key', icon: '🤖' },
      { key: 'CALENDLY_API_KEY', label: 'Calendly API Key', icon: '📅' },
      { key: 'DOCUSIGN_API_KEY', label: 'DocuSign API Key', icon: '✍️' },
    ]
  },
];

function AddCredentialModal({
  onClose,
  onAdd,
  saving,
  newKeyName,
  setNewKeyName,
  newKeyValue,
  setNewKeyValue,
  newKeyIsSensitive,
  setNewKeyIsSensitive,
}: {
  onClose: () => void;
  onAdd: () => void;
  saving: boolean;
  newKeyName: string;
  setNewKeyName: (v: string) => void;
  newKeyValue: string;
  setNewKeyValue: (v: string) => void;
  newKeyIsSensitive: boolean;
  setNewKeyIsSensitive: (v: boolean) => void;
}) {
  const [mode, setMode] = useState<'preset' | 'custom'>('preset');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const handlePresetSelect = (key: string, label: string) => {
    setSelectedPreset(key);
    setNewKeyName(key);
    setNewKeyIsSensitive(true);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Plus className="w-5 h-5 text-brand" />
            Add Credential
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-2 p-4 border-b border-border">
          <Button
            variant={mode === 'preset' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('preset')}
            className={mode === 'preset' ? 'bg-brand hover:bg-brand/90' : ''}
          >
            Common APIs
          </Button>
          <Button
            variant={mode === 'custom' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('custom')}
            className={mode === 'custom' ? 'bg-brand hover:bg-brand/90' : ''}
          >
            Custom Key
          </Button>
        </div>

        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {mode === 'preset' ? (
            <div className="space-y-4">
              {CREDENTIAL_PRESETS.map((category) => (
                <div key={category.category}>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">{category.category}</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {category.items.map((item) => (
                      <button
                        key={item.key}
                        onClick={() => handlePresetSelect(item.key, item.label)}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-lg border transition-colors text-left',
                          selectedPreset === item.key
                            ? 'border-brand bg-brand/10'
                            : 'border-border hover:border-brand/50 hover:bg-secondary'
                        )}
                      >
                        <span className="text-lg">{item.icon}</span>
                        <div>
                          <p className="font-medium text-foreground text-sm">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.key}</p>
                        </div>
                        {selectedPreset === item.key && (
                          <Check className="w-4 h-4 text-brand ml-auto" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              
              {selectedPreset && (
                <div className="pt-4 border-t border-border">
                  <label className="text-sm text-muted-foreground block mb-2">
                    Value for {selectedPreset}
                  </label>
                  <Input
                    type="password"
                    value={newKeyValue}
                    onChange={(e) => setNewKeyValue(e.target.value)}
                    placeholder="Paste your API key or webhook URL"
                    className="bg-secondary border-border"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground block mb-2">
                  Key Name
                </label>
                <Input
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g., MY_API_KEY or MY_WEBHOOK_URL"
                  className="bg-secondary border-border"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Will be converted to UPPERCASE_WITH_UNDERSCORES
                </p>
              </div>

              <div>
                <label className="text-sm text-muted-foreground block mb-2">
                  Value
                </label>
                <Input
                  type={newKeyIsSensitive ? 'password' : 'text'}
                  value={newKeyValue}
                  onChange={(e) => setNewKeyValue(e.target.value)}
                  placeholder="Enter the API key, secret, or webhook URL"
                  className="bg-secondary border-border"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="sensitive"
                  checked={newKeyIsSensitive}
                  onChange={(e) => setNewKeyIsSensitive(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="sensitive" className="text-sm text-muted-foreground">
                  Sensitive value (will be masked)
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 p-4 border-t border-border">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={onAdd}
            disabled={saving || !newKeyName.trim() || !newKeyValue.trim()}
            className="flex-1 bg-brand hover:bg-brand/90"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Add Credential
          </Button>
        </div>
      </div>
    </div>
  );
}
