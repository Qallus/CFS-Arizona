'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  UserCog,
  Save,
  Bell,
  Mail,
  Phone,
  Globe,
  Clock,
  Calendar,
  Palette,
  Monitor,
  Loader2,
  Check,
  AlertCircle,
  Volume2,
  MessageSquare,
  Smartphone,
  Languages,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UserSettings {
  // Notifications
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  notifyNewLead: boolean;
  notifyNewMessage: boolean;
  notifyAppointment: boolean;
  notifyPayment: boolean;
  notifyWeeklyReport: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  // Preferences
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  language: string;
  currency: string;
  // Display
  theme: 'dark' | 'light' | 'system';
  compactMode: boolean;
  showAvatars: boolean;
  animationsEnabled: boolean;
  soundEnabled: boolean;
  // Communication
  defaultSmsSignature: string;
  defaultEmailSignature: string;
  autoReplyEnabled: boolean;
  autoReplyMessage: string;
}

const TIMEZONES = [
  { value: 'America/Phoenix', label: 'America/Phoenix (MST)' },
  { value: 'America/Los_Angeles', label: 'America/Los Angeles (PST)' },
  { value: 'America/Denver', label: 'America/Denver (MST)' },
  { value: 'America/Chicago', label: 'America/Chicago (CST)' },
  { value: 'America/New_York', label: 'America/New York (EST)' },
  { value: 'UTC', label: 'UTC' },
];

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
];

const CURRENCIES = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'CAD', label: 'CAD ($)' },
];

export default function UserSettingsPage() {
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  
  const [settings, setSettings] = useState<UserSettings>({
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true,
    notifyNewLead: true,
    notifyNewMessage: true,
    notifyAppointment: true,
    notifyPayment: true,
    notifyWeeklyReport: true,
    quietHoursEnabled: true,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
    timezone: 'America/Phoenix',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    language: 'en',
    currency: 'USD',
    theme: 'dark',
    compactMode: false,
    showAvatars: true,
    animationsEnabled: true,
    soundEnabled: true,
    defaultSmsSignature: '- Jeremy Waters, ChannelCast',
    defaultEmailSignature: 'Best regards,\nJeremy Waters\nFounder & CEO, ChannelCast',
    autoReplyEnabled: false,
    autoReplyMessage: 'Thanks for reaching out! I\'ll get back to you as soon as possible.',
  });

  const handleChange = <K extends keyof UserSettings>(field: K, value: UserSettings[K]) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaveMessage({ type: 'success', text: 'Settings saved successfully!' });
      setHasChanges(false);
    } catch (error) {
      setSaveMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <UserCog className="w-6 h-6 text-brand" />
            User Settings
          </h1>
          <p className="text-muted-foreground">Customize your preferences and notifications</p>
        </div>
        {hasChanges && (
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-brand hover:bg-brand/90"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </Button>
        )}
      </div>

      {/* Save Message */}
      {saveMessage && (
        <div className={cn(
          "mb-6 p-4 rounded-lg flex items-center gap-2",
          saveMessage.type === 'success' 
            ? "bg-green-500/10 border border-green-500/30 text-green-400"
            : "bg-red-500/10 border border-red-500/30 text-red-400"
        )}>
          {saveMessage.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {saveMessage.text}
        </div>
      )}

      <Tabs defaultValue="notifications" className="space-y-6">
        <TabsList className="bg-secondary">
          <TabsTrigger value="notifications" className="data-[state=active]:bg-muted">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="preferences" className="data-[state=active]:bg-muted">
            <Globe className="w-4 h-4 mr-2" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="display" className="data-[state=active]:bg-muted">
            <Monitor className="w-4 h-4 mr-2" />
            Display
          </TabsTrigger>
          <TabsTrigger value="communication" className="data-[state=active]:bg-muted">
            <MessageSquare className="w-4 h-4 mr-2" />
            Communication
          </TabsTrigger>
        </TabsList>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Notification Channels</CardTitle>
                <CardDescription>How you want to receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">Email Notifications</p>
                      <p className="text-sm text-muted-foreground">Receive updates via email</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.emailNotifications}
                    onChange={(checked) => handleChange('emailNotifications', checked)}
                  />
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">SMS Notifications</p>
                      <p className="text-sm text-muted-foreground">Receive updates via text message</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.smsNotifications}
                    onChange={(checked) => handleChange('smsNotifications', checked)}
                  />
                </div>
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">Push Notifications</p>
                      <p className="text-sm text-muted-foreground">Browser and mobile push</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.pushNotifications}
                    onChange={(checked) => handleChange('pushNotifications', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Notification Types</CardTitle>
                <CardDescription>What you want to be notified about</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: 'notifyNewLead', label: 'New Lead', desc: 'When a new lead is created' },
                  { key: 'notifyNewMessage', label: 'New Message', desc: 'When you receive a message' },
                  { key: 'notifyAppointment', label: 'Appointment Reminders', desc: 'Upcoming appointment alerts' },
                  { key: 'notifyPayment', label: 'Payment Received', desc: 'When a payment is processed' },
                  { key: 'notifyWeeklyReport', label: 'Weekly Report', desc: 'Weekly summary email' },
                ].map((item, idx, arr) => (
                  <div key={item.key} className={cn("flex items-center justify-between py-3", idx < arr.length - 1 && "border-b border-border")}>
                    <div>
                      <p className="font-medium text-foreground">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch
                      checked={settings[item.key as keyof UserSettings] as boolean}
                      onChange={(checked) => handleChange(item.key as keyof UserSettings, checked)}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  Quiet Hours
                </CardTitle>
                <CardDescription>Pause non-urgent notifications during these hours</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={settings.quietHoursEnabled}
                      onChange={(checked) => handleChange('quietHoursEnabled', checked)}
                    />
                    <span className="text-foreground">Enable Quiet Hours</span>
                  </div>
                  {settings.quietHoursEnabled && (
                    <div className="flex items-center gap-3">
                      <Input
                        type="time"
                        value={settings.quietHoursStart}
                        onChange={(e) => handleChange('quietHoursStart', e.target.value)}
                        className="bg-secondary border-border w-32"
                      />
                      <span className="text-muted-foreground">to</span>
                      <Input
                        type="time"
                        value={settings.quietHoursEnd}
                        onChange={(e) => handleChange('quietHoursEnd', e.target.value)}
                        className="bg-secondary border-border w-32"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  Date & Time
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Timezone</Label>
                  <select
                    value={settings.timezone}
                    onChange={(e) => handleChange('timezone', e.target.value)}
                    className="w-full h-10 px-3 mt-1 bg-secondary border border-border rounded-md text-foreground"
                  >
                    {TIMEZONES.map(tz => (
                      <option key={tz.value} value={tz.value}>{tz.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Date Format</Label>
                  <select
                    value={settings.dateFormat}
                    onChange={(e) => handleChange('dateFormat', e.target.value)}
                    className="w-full h-10 px-3 mt-1 bg-secondary border border-border rounded-md text-foreground"
                  >
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Time Format</Label>
                  <div className="flex gap-3 mt-2">
                    {['12h', '24h'].map((format) => (
                      <button
                        key={format}
                        onClick={() => handleChange('timeFormat', format as '12h' | '24h')}
                        className={cn(
                          'px-4 py-2 rounded-lg border-2 transition-colors',
                          settings.timeFormat === format
                            ? 'border-brand bg-brand/10 text-foreground'
                            : 'border-border hover:border-brand/50 text-muted-foreground'
                        )}
                      >
                        {format === '12h' ? '12:00 PM' : '14:00'}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Languages className="w-5 h-5 text-muted-foreground" />
                  Regional
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Language</Label>
                  <select
                    value={settings.language}
                    onChange={(e) => handleChange('language', e.target.value)}
                    className="w-full h-10 px-3 mt-1 bg-secondary border border-border rounded-md text-foreground"
                  >
                    {LANGUAGES.map(lang => (
                      <option key={lang.value} value={lang.value}>{lang.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Currency</Label>
                  <select
                    value={settings.currency}
                    onChange={(e) => handleChange('currency', e.target.value)}
                    className="w-full h-10 px-3 mt-1 bg-secondary border border-border rounded-md text-foreground"
                  >
                    {CURRENCIES.map(curr => (
                      <option key={curr.value} value={curr.value}>{curr.label}</option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Display Tab */}
        <TabsContent value="display" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Palette className="w-5 h-5 text-muted-foreground" />
                  Appearance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Theme</Label>
                  <div className="grid grid-cols-3 gap-3 mt-2">
                    {['dark', 'light', 'system'].map((theme) => (
                      <button
                        key={theme}
                        onClick={() => handleChange('theme', theme as 'dark' | 'light' | 'system')}
                        className={cn(
                          'p-3 rounded-lg border-2 transition-colors capitalize',
                          settings.theme === theme
                            ? 'border-brand bg-brand/10'
                            : 'border-border hover:border-brand/50'
                        )}
                      >
                        <Monitor className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                        <span className="text-sm text-foreground">{theme}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Display Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: 'compactMode', label: 'Compact Mode', desc: 'Reduce spacing for more content' },
                  { key: 'showAvatars', label: 'Show Avatars', desc: 'Display profile photos in lists' },
                  { key: 'animationsEnabled', label: 'Animations', desc: 'Enable UI animations' },
                  { key: 'soundEnabled', label: 'Sound Effects', desc: 'Play sounds for notifications', icon: Volume2 },
                ].map((item, idx, arr) => (
                  <div key={item.key} className={cn("flex items-center justify-between py-3", idx < arr.length - 1 && "border-b border-border")}>
                    <div>
                      <p className="font-medium text-foreground">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch
                      checked={settings[item.key as keyof UserSettings] as boolean}
                      onChange={(checked) => handleChange(item.key as keyof UserSettings, checked)}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Communication Tab */}
        <TabsContent value="communication" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Default Signatures</CardTitle>
                <CardDescription>Signatures appended to outgoing messages</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm text-muted-foreground">SMS Signature</Label>
                  <Input
                    value={settings.defaultSmsSignature}
                    onChange={(e) => handleChange('defaultSmsSignature', e.target.value)}
                    className="bg-secondary border-border mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Email Signature</Label>
                  <textarea
                    value={settings.defaultEmailSignature}
                    onChange={(e) => handleChange('defaultEmailSignature', e.target.value)}
                    className="w-full px-3 py-2 mt-1 bg-secondary border border-border rounded-md text-foreground min-h-[100px]"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Auto-Reply</CardTitle>
                <CardDescription>Automatic responses when unavailable</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium text-foreground">Enable Auto-Reply</p>
                    <p className="text-sm text-muted-foreground">Automatically respond to messages</p>
                  </div>
                  <Switch
                    checked={settings.autoReplyEnabled}
                    onChange={(checked) => handleChange('autoReplyEnabled', checked)}
                  />
                </div>
                {settings.autoReplyEnabled && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Auto-Reply Message</Label>
                    <textarea
                      value={settings.autoReplyMessage}
                      onChange={(e) => handleChange('autoReplyMessage', e.target.value)}
                      className="w-full px-3 py-2 mt-1 bg-secondary border border-border rounded-md text-foreground min-h-[100px]"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
