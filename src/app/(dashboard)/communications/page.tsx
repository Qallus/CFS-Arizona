'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Phone, 
  PhoneOutgoing, 
  Voicemail, 
  History, 
  MessageSquare,
  Users,
  Contact,
  Mail,
  FileText,
  Send,
  Bot,
  Mic,
  PhoneCall,
  PhoneIncoming,
  Settings,
  Zap,
} from 'lucide-react';
import { Dialpad } from '@/components/communications/Dialpad';
import { CallHistory } from '@/components/communications/CallHistory';
import { VoicemailList } from '@/components/communications/VoicemailList';
import { ActiveCall } from '@/components/communications/ActiveCall';
import { SmsInbox } from '@/components/communications/SmsInbox';
import { BulkSms } from '@/components/communications/BulkSms';
import { ContactsList } from '@/components/communications/ContactsList';
import { EmailInbox } from '@/components/email/EmailInbox';
import { EmailCompose } from '@/components/email/EmailCompose';
import { EmailComposePage } from '@/components/email/EmailComposePage';
import { EmailTemplates } from '@/components/email/EmailTemplates';

export default function CommunicationsPage() {
  const [activeCall, setActiveCall] = useState<any>(null);
  const [voicemailCount, setVoicemailCount] = useState(0);
  const [activeTab, setActiveTab] = useState('calls');
  
  // State for passing contact info to SMS/Calls
  const [smsContact, setSmsContact] = useState<{ phone: string; name: string } | null>(null);
  const [callContact, setCallContact] = useState<{ phone: string; name: string } | null>(null);
  
  // Email state
  const [showComposeEmail, setShowComposeEmail] = useState(false);
  const [emailView, setEmailView] = useState<'inbox' | 'compose'>('inbox');
  const [emailReplyTo, setEmailReplyTo] = useState<{ to: string; subject: string; body?: string } | null>(null);

  // Read URL query params on load (from appointments page navigation)
  useEffect(() => {
    // Use window.location as fallback for more reliable param reading
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    const phone = params.get('phone');
    const name = params.get('name');

    console.log('[Communications] URL params:', { tab, phone, name });

    if (tab && ['calls', 'sms', 'contacts', 'bulk', 'email', 'templates'].includes(tab)) {
      setActiveTab(tab);
    }

    if (phone) {
      if (tab === 'sms') {
        setSmsContact({ phone, name: name || '' });
      } else if (tab === 'calls') {
        setCallContact({ phone, name: name || '' });
      }
    }
  }, []); // Run once on mount

  useEffect(() => {
    // Fetch unread voicemail count
    fetch('/api/voicemails?unread=true')
      .then(res => res.json())
      .then(data => setVoicemailCount(data.unreadCount || 0))
      .catch(console.error);
  }, []);

  const handleSmsFromContact = (phone: string, contactName: string) => {
    setSmsContact({ phone, name: contactName });
    setActiveTab('sms');
  };

  const handleCallFromContact = (phone: string, contactName: string) => {
    setCallContact({ phone, name: contactName });
    setActiveTab('calls');
    // TODO: Could auto-dial here
  };

  const clearSmsContact = () => {
    setSmsContact(null);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Phone className="w-8 h-8 text-brand" />
          <h1 className="text-3xl font-bold text-foreground">Communications</h1>
        </div>
        <p className="text-muted-foreground">Voice calls, SMS messaging, email, contacts, and voicemail</p>
      </div>

      {/* Active Call Banner */}
      {activeCall && (
        <ActiveCall 
          call={activeCall} 
          onEnd={() => setActiveCall(null)} 
        />
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-secondary">
          <TabsTrigger value="calls" className="data-[state=active]:bg-muted">
            <Phone className="w-4 h-4 mr-2" />
            Calls
          </TabsTrigger>
          <TabsTrigger value="sms" className="data-[state=active]:bg-muted">
            <MessageSquare className="w-4 h-4 mr-2" />
            SMS
          </TabsTrigger>
          <TabsTrigger value="email" className="data-[state=active]:bg-muted">
            <Mail className="w-4 h-4 mr-2" />
            Email
          </TabsTrigger>
          <TabsTrigger value="templates" className="data-[state=active]:bg-muted">
            <FileText className="w-4 h-4 mr-2" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="contacts" className="data-[state=active]:bg-muted">
            <Contact className="w-4 h-4 mr-2" />
            Contacts
          </TabsTrigger>
          <TabsTrigger value="bulk" className="data-[state=active]:bg-muted">
            <Users className="w-4 h-4 mr-2" />
            Bulk SMS
          </TabsTrigger>
          <TabsTrigger value="ai-voice" className="data-[state=active]:bg-muted">
            <Bot className="w-4 h-4 mr-2" />
            AI Voice
          </TabsTrigger>
        </TabsList>

        {/* Calls Tab */}
        <TabsContent value="calls" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Dialpad */}
            <div className="lg:col-span-1">
              <Card className="bg-card/50 border-border">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <PhoneOutgoing className="w-5 h-5 text-green-500" />
                    Dialpad
                    {callContact && (
                      <span className="text-sm font-normal text-muted-foreground ml-2">
                        → {callContact.name}
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Dialpad onCallStart={setActiveCall} initialNumber={callContact?.phone} />
                </CardContent>
              </Card>
            </div>

            {/* Call History & Voicemails */}
            <div className="lg:col-span-2">
              <Card className="bg-card/50 border-border">
                <Tabs defaultValue="history" className="w-full">
                  <CardHeader className="pb-0">
                    <TabsList className="bg-secondary">
                      <TabsTrigger value="history" className="data-[state=active]:bg-muted">
                        <History className="w-4 h-4 mr-2" />
                        Call History
                      </TabsTrigger>
                      <TabsTrigger value="voicemail" className="data-[state=active]:bg-muted">
                        <Voicemail className="w-4 h-4 mr-2" />
                        Voicemail
                        {voicemailCount > 0 && (
                          <span className="ml-2 px-2 py-0.5 text-xs bg-brand rounded-full">
                            {voicemailCount}
                          </span>
                        )}
                      </TabsTrigger>
                    </TabsList>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <TabsContent value="history" className="mt-0">
                      <CallHistory onCallBack={(number) => {
                        // Could trigger dialpad with number
                      }} />
                    </TabsContent>
                    <TabsContent value="voicemail" className="mt-0">
                      <VoicemailList onCountChange={setVoicemailCount} />
                    </TabsContent>
                  </CardContent>
                </Tabs>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* SMS Tab */}
        <TabsContent value="sms" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-500" />
                  SMS Inbox
                  {smsContact && (
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      → {smsContact.name}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SmsInbox 
                  initialContact={smsContact?.phone}
                  contactName={smsContact?.name}
                  onClearContact={clearSmsContact}
                />
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Phone className="w-5 h-5 text-brand" />
                  Quick Info
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-secondary/50 rounded-lg">
                    <p className="text-muted-foreground text-sm">Your SMS Number</p>
                    <p className="text-foreground text-lg font-mono">(480) 999-9906</p>
                  </div>
                  <div className="p-4 bg-secondary/50 rounded-lg">
                    <p className="text-muted-foreground text-sm mb-2">Tips</p>
                    <ul className="text-foreground/80 text-sm space-y-1">
                      <li>• Click a conversation to view messages</li>
                      <li>• Press Enter to send (Shift+Enter for new line)</li>
                      <li>• Incoming messages appear automatically</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Email Tab */}
        <TabsContent value="email" className="mt-0">
          {emailView === 'inbox' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card className="bg-card/50 border-border min-h-[750px]">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-foreground flex items-center gap-2">
                      <Mail className="w-5 h-5 text-blue-500" />
                      Inbox
                    </CardTitle>
                    <button
                      onClick={() => {
                        setEmailReplyTo(null);
                        setEmailView('compose');
                      }}
                      className="px-4 py-2 bg-brand hover:bg-brand/90 text-white rounded-lg text-sm font-medium flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Compose
                    </button>
                  </CardHeader>
                  <CardContent>
                    <EmailInbox
                      onCompose={() => {
                        setEmailReplyTo(null);
                        setEmailView('compose');
                      }}
                      onReply={(email) => {
                        setEmailReplyTo({
                          to: email.from,
                          subject: email.subject,
                          body: email.body,
                        });
                        setEmailView('compose');
                      }}
                    />
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-card/50 border-border">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Mail className="w-5 h-5 text-brand" />
                    Email Info
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-secondary/50 rounded-lg">
                      <p className="text-muted-foreground text-sm">Your Email</p>
                      <p className="text-foreground text-lg font-mono">hello@channelcast.io</p>
                    </div>
                    <div className="p-4 bg-secondary/50 rounded-lg">
                      <p className="text-muted-foreground text-sm mb-2">Server Settings</p>
                      <ul className="text-foreground/80 text-xs space-y-1 font-mono">
                        <li>IMAP: imap.hostinger.com:993</li>
                        <li>SMTP: smtp.hostinger.com:465</li>
                      </ul>
                    </div>
                    <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <p className="text-green-400 text-sm">✓ Connected via Hostinger</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="bg-card/50 border-border min-h-[750px] flex flex-col">
              <EmailComposePage
                replyTo={emailReplyTo || undefined}
                onBack={() => {
                  setEmailView('inbox');
                  setEmailReplyTo(null);
                }}
                onSent={() => {
                  // Could refresh inbox here
                }}
                onOpenTemplates={() => {
                  setEmailView('inbox');
                  setActiveTab('templates');
                }}
              />
            </Card>
          )}
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="mt-0">
          <Card className="bg-card/50 border-border min-h-[750px]">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-500" />
                Email Templates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EmailTemplates />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contacts Tab */}
        <TabsContent value="contacts" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card/50 border-border min-h-[750px]">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Contact className="w-5 h-5 text-purple-500" />
                  Fluent CRM Contacts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ContactsList 
                  onSendSms={handleSmsFromContact}
                  onCall={handleCallFromContact}
                />
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Users className="w-5 h-5 text-brand" />
                  Contact Info
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-secondary/50 rounded-lg">
                    <p className="text-muted-foreground text-sm">Connected to</p>
                    <p className="text-foreground text-lg">Fluent CRM Pro</p>
                    <p className="text-muted-foreground text-xs mt-1">channelcast.io</p>
                  </div>
                  <div className="p-4 bg-secondary/50 rounded-lg">
                    <p className="text-muted-foreground text-sm mb-2">Features</p>
                    <ul className="text-foreground/80 text-sm space-y-1">
                      <li>• Search contacts by name, email, phone</li>
                      <li>• View tags, lists, and company info</li>
                      <li>• Click SMS or Call to contact directly</li>
                      <li>• Synced in real-time with WordPress</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <p className="text-green-400 text-sm">✓ Connected</p>
                    <p className="text-muted-foreground text-xs mt-1">
                      Your Fluent CRM contacts are synced and available.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Bulk SMS Tab */}
        <TabsContent value="bulk" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-500" />
                  Bulk SMS Sender
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BulkSms />
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-brand" />
                  Bulk SMS Guide
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-secondary/50 rounded-lg">
                    <p className="text-muted-foreground text-sm mb-2">CSV Format</p>
                    <pre className="text-foreground/80 text-xs bg-background p-2 rounded">
{`phone,name
+14255551234,John Doe
+14255555678,Jane Smith`}
                    </pre>
                  </div>
                  <div className="p-4 bg-secondary/50 rounded-lg">
                    <p className="text-muted-foreground text-sm mb-2">Template Variables</p>
                    <ul className="text-foreground/80 text-sm space-y-1">
                      <li><code className="bg-background px-1 rounded">{'{{name}}'}</code> - Contact&apos;s name</li>
                      <li><code className="bg-background px-1 rounded">{'{{phone}}'}</code> - Phone number</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <p className="text-yellow-400 text-sm">⚠️ Rate Limits</p>
                    <p className="text-muted-foreground text-xs mt-1">
                      Twilio has rate limits. Large batches are sent with small delays between messages.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AI Voice Tab */}
        <TabsContent value="ai-voice" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Overview Card */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <Bot className="w-6 h-6 text-purple-500" />
                    </div>
                    AI Voice Agent
                    <span className="ml-auto text-xs font-normal px-2 py-1 bg-purple-500/20 rounded-full text-purple-400">
                      Coming Soon
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-6">
                    Powered by <span className="text-purple-400 font-medium">Dograh</span> — an open-source AI voice agent framework 
                    that enables intelligent phone conversations for your business.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-secondary/50 rounded-lg">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-green-500/20 rounded-lg">
                          <PhoneIncoming className="w-5 h-5 text-green-500" />
                        </div>
                        <h3 className="font-medium">Inbound Calls</h3>
                      </div>
                      <ul className="text-sm text-muted-foreground space-y-2">
                        <li>• Answer calls 24/7 automatically</li>
                        <li>• Natural conversation handling</li>
                        <li>• Appointment scheduling</li>
                        <li>• FAQ & support queries</li>
                        <li>• Transfer to human when needed</li>
                      </ul>
                    </div>
                    
                    <div className="p-4 bg-secondary/50 rounded-lg">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                          <PhoneOutgoing className="w-5 h-5 text-blue-500" />
                        </div>
                        <h3 className="font-medium">Outbound Calls</h3>
                      </div>
                      <ul className="text-sm text-muted-foreground space-y-2">
                        <li>• Appointment reminders</li>
                        <li>• Follow-up calls</li>
                        <li>• Survey & feedback collection</li>
                        <li>• Lead qualification</li>
                        <li>• Payment reminders</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Features Preview */}
              <Card className="bg-card/50 border-border">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    Planned Features
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Mic className="w-5 h-5 text-purple-500" />
                        <div>
                          <p className="font-medium text-sm">Custom Voice Personas</p>
                          <p className="text-xs text-muted-foreground">Create unique AI personalities for your brand</p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">Planned</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Settings className="w-5 h-5 text-blue-500" />
                        <div>
                          <p className="font-medium text-sm">Call Flow Builder</p>
                          <p className="text-xs text-muted-foreground">Design conversation flows visually</p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">Planned</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <History className="w-5 h-5 text-green-500" />
                        <div>
                          <p className="font-medium text-sm">Call Transcripts & Analytics</p>
                          <p className="text-xs text-muted-foreground">Full transcription and sentiment analysis</p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">Planned</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <PhoneCall className="w-5 h-5 text-brand" />
                        <div>
                          <p className="font-medium text-sm">Live Call Monitoring</p>
                          <p className="text-xs text-muted-foreground">Listen in and take over calls when needed</p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">Planned</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Status & Quick Actions */}
            <div className="space-y-6">
              <Card className="bg-card/50 border-border">
                <CardHeader>
                  <CardTitle className="text-foreground text-lg">Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Dograh Integration</span>
                      <span className="px-2 py-1 text-xs bg-yellow-500/20 text-yellow-400 rounded">
                        Pending Setup
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Twilio Voice</span>
                      <span className="px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded">
                        Connected
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">AI Voice Agents</span>
                      <span className="px-2 py-1 text-xs bg-secondary text-muted-foreground rounded">
                        0 Active
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border">
                <CardHeader>
                  <CardTitle className="text-foreground text-lg">About Dograh</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <p className="text-muted-foreground">
                      Dograh is an open-source framework for building AI-powered voice agents 
                      that can handle real phone conversations.
                    </p>
                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <p className="text-blue-400 text-xs mb-2">Key Capabilities:</p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• Real-time speech recognition</li>
                        <li>• Natural language understanding</li>
                        <li>• Dynamic response generation</li>
                        <li>• Twilio/SIP integration</li>
                        <li>• Custom tool/API calling</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-secondary/30 border-dashed border-muted-foreground/30">
                <CardContent className="p-6 text-center">
                  <Bot className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground mb-3">
                    AI Voice configuration will appear here once Dograh is integrated.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Share your Dograh overview when ready to begin setup.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Email Compose Modal */}
      <EmailCompose
        isOpen={showComposeEmail}
        onClose={() => {
          setShowComposeEmail(false);
          setEmailReplyTo(null);
        }}
        replyTo={emailReplyTo || undefined}
        onSent={() => {
          // Could refresh inbox here if needed
        }}
        onOpenTemplates={() => {
          setShowComposeEmail(false);
          setActiveTab('templates');
        }}
      />
    </div>
  );
}
