'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Zap,
  Save,
  Clock,
  Mail,
  MessageSquare,
  Phone,
  Bell,
  Slack,
  GitBranch,
  Trash2,
  Plus,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
  // Configuration
  config?: {
    triggerConfig?: Record<string, any>;
    actionConfigs?: Array<{
      type: string;
      config: Record<string, any>;
    }>;
  };
}

interface EditAutomationModalProps {
  isOpen: boolean;
  onClose: () => void;
  automation: Automation | null;
  onSave: (automation: Automation) => void;
}

export function EditAutomationModal({ isOpen, onClose, automation, onSave }: EditAutomationModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'workflow' | 'communication' | 'reminder' | 'marketing' | 'integration'>('workflow');
  const [trigger, setTrigger] = useState('');
  const [actions, setActions] = useState<string[]>([]);
  const [status, setStatus] = useState<'active' | 'paused' | 'draft'>('draft');
  
  // Action configurations
  const [emailTo, setEmailTo] = useState('{{contact.email}}');
  const [emailSubject, setEmailSubject] = useState('Welcome to our community!');
  const [emailBody, setEmailBody] = useState('Hi {{contact.first_name}},\n\nThank you for your interest...');
  const [smsTo, setSmsTo] = useState('{{contact.phone}}');
  const [smsBody, setSmsBody] = useState('Hi {{contact.first_name}}! Thanks for connecting.');

  useEffect(() => {
    if (automation) {
      setName(automation.name);
      setDescription(automation.description);
      setCategory(automation.category as 'workflow' | 'communication' | 'reminder' | 'marketing' | 'integration');
      setTrigger(automation.trigger);
      setActions(automation.actions);
      setStatus(automation.status);
      
      // Load saved configs if they exist
      if (automation.config?.actionConfigs) {
        const emailConfig = automation.config.actionConfigs.find(a => a.type === 'email');
        const smsConfig = automation.config.actionConfigs.find(a => a.type === 'sms');
        
        if (emailConfig) {
          setEmailTo(emailConfig.config.to || '{{contact.email}}');
          setEmailSubject(emailConfig.config.subject || '');
          setEmailBody(emailConfig.config.body || '');
        }
        if (smsConfig) {
          setSmsTo(smsConfig.config.to || '{{contact.phone}}');
          setSmsBody(smsConfig.config.body || '');
        }
      }
    }
  }, [automation]);

  const handleSave = () => {
    if (!automation) return;
    
    const updatedAutomation: Automation = {
      ...automation,
      name,
      description,
      category,
      trigger,
      actions,
      status,
      config: {
        triggerConfig: {},
        actionConfigs: [
          {
            type: 'email',
            config: {
              to: emailTo,
              subject: emailSubject,
              body: emailBody,
            }
          },
          {
            type: 'sms',
            config: {
              to: smsTo,
              body: smsBody,
            }
          }
        ]
      }
    };
    
    onSave(updatedAutomation);
    onClose();
  };

  const categories: Array<'workflow' | 'communication' | 'reminder' | 'marketing' | 'integration'> = ['workflow', 'communication', 'reminder', 'marketing', 'integration'];

  if (!automation) return null;

  const hasEmailAction = actions.some(a => a.toLowerCase().includes('email'));
  const hasSmsAction = actions.some(a => a.toLowerCase().includes('sms'));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-card border-border max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-brand" />
            Edit Automation
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            {/* Warning Banner */}
            <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-500">Automation Engine Not Yet Connected</p>
                <p className="text-muted-foreground mt-1">
                  This automation is configured but not yet executing. Backend integration needed to trigger actions automatically.
                </p>
              </div>
            </div>

            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Basic Information</h3>
              
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>
              
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Description</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-secondary border-border resize-none"
                  rows={2}
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Category</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors',
                        category === cat
                          ? 'bg-brand text-brand-foreground'
                          : 'bg-secondary text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Status</label>
                <div className="flex gap-2">
                  {(['active', 'paused', 'draft'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatus(s)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors',
                        status === s
                          ? s === 'active' ? 'bg-green-500 text-white' :
                            s === 'paused' ? 'bg-yellow-500 text-white' :
                            'bg-gray-500 text-white'
                          : 'bg-secondary text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Trigger */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                Trigger
              </h3>
              <div className="p-3 bg-secondary/30 rounded-lg">
                <p className="text-sm text-foreground">{trigger}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-purple-500" />
                Actions ({actions.length})
              </h3>
              <div className="space-y-2">
                {actions.map((action, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-secondary/30 rounded-lg">
                    <span className="w-5 h-5 rounded-full bg-brand text-brand-foreground text-xs flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="text-sm text-foreground flex-1">{action}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Email Configuration */}
            {hasEmailAction && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-500" />
                  Email Configuration
                </h3>
                <div className="space-y-3 p-4 bg-secondary/20 rounded-lg">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">To (recipient)</label>
                    <Input
                      value={emailTo}
                      onChange={(e) => setEmailTo(e.target.value)}
                      className="bg-secondary border-border text-sm"
                      placeholder="{{contact.email}} or specific@email.com"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Use {"{{contact.email}}"} to send to the lead's email
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Subject</label>
                    <Input
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      className="bg-secondary border-border text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Body</label>
                    <Textarea
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      className="bg-secondary border-border resize-none text-sm font-mono"
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Variables: {"{{contact.first_name}}"}, {"{{contact.last_name}}"}, {"{{contact.email}}"}, {"{{contact.company}}"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* SMS Configuration */}
            {hasSmsAction && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-green-500" />
                  SMS Configuration
                </h3>
                <div className="space-y-3 p-4 bg-secondary/20 rounded-lg">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">To (phone number)</label>
                    <Input
                      value={smsTo}
                      onChange={(e) => setSmsTo(e.target.value)}
                      className="bg-secondary border-border text-sm"
                      placeholder="{{contact.phone}} or +1234567890"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Message</label>
                    <Textarea
                      value={smsBody}
                      onChange={(e) => setSmsBody(e.target.value)}
                      className="bg-secondary border-border resize-none text-sm"
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {smsBody.length}/160 characters
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-brand hover:bg-brand/90">
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
