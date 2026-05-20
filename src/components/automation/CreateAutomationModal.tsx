'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Zap,
  ArrowRight,
  ArrowLeft,
  Check,
  Plus,
  Trash2,
  Clock,
  Users,
  Mail,
  MessageSquare,
  Phone,
  Bell,
  Calendar,
  Tag,
  GitBranch,
  Webhook,
  Timer,
  UserPlus,
  ShoppingCart,
  MousePointer,
  Slack,
  Send,
  FileText,
  Database,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreateAutomationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (automation: any) => void;
}

type Step = 'basics' | 'trigger' | 'actions' | 'review';

interface TriggerOption {
  id: string;
  name: string;
  description: string;
  icon: any;
  category: string;
}

interface ActionOption {
  id: string;
  name: string;
  description: string;
  icon: any;
  category: string;
}

const triggerOptions: TriggerOption[] = [
  { id: 'new_contact', name: 'New Contact Added', description: 'When a new contact is created', icon: UserPlus, category: 'contacts' },
  { id: 'tag_added', name: 'Tag Added', description: 'When a tag is added to a contact', icon: Tag, category: 'contacts' },
  { id: 'appointment_scheduled', name: 'Appointment Scheduled', description: 'When an appointment is booked', icon: Calendar, category: 'appointments' },
  { id: 'appointment_reminder', name: 'Appointment Reminder', description: 'Before an appointment starts', icon: Bell, category: 'appointments' },
  { id: 'form_submitted', name: 'Form Submitted', description: 'When a form is submitted', icon: FileText, category: 'forms' },
  { id: 'email_opened', name: 'Email Opened', description: 'When an email is opened', icon: Mail, category: 'email' },
  { id: 'link_clicked', name: 'Link Clicked', description: 'When a link is clicked', icon: MousePointer, category: 'email' },
  { id: 'schedule', name: 'Scheduled Time', description: 'At a specific time or interval', icon: Clock, category: 'time' },
  { id: 'webhook', name: 'Webhook Received', description: 'When a webhook is triggered', icon: Webhook, category: 'advanced' },
  { id: 'manual', name: 'Manual Trigger', description: 'Run manually when needed', icon: MousePointer, category: 'advanced' },
];

const actionOptions: ActionOption[] = [
  { id: 'send_email', name: 'Send Email', description: 'Send an email to the contact', icon: Mail, category: 'communication' },
  { id: 'send_sms', name: 'Send SMS', description: 'Send a text message', icon: MessageSquare, category: 'communication' },
  { id: 'make_call', name: 'Make Call', description: 'Initiate an automated call', icon: Phone, category: 'communication' },
  { id: 'slack_message', name: 'Slack Message', description: 'Send a Slack notification', icon: Slack, category: 'notifications' },
  { id: 'push_notification', name: 'Push Notification', description: 'Send a push notification', icon: Bell, category: 'notifications' },
  { id: 'add_tag', name: 'Add Tag', description: 'Add a tag to the contact', icon: Tag, category: 'crm' },
  { id: 'remove_tag', name: 'Remove Tag', description: 'Remove a tag from contact', icon: Tag, category: 'crm' },
  { id: 'create_task', name: 'Create Task', description: 'Create a follow-up task', icon: Check, category: 'crm' },
  { id: 'update_contact', name: 'Update Contact', description: 'Update contact properties', icon: Users, category: 'crm' },
  { id: 'wait', name: 'Wait / Delay', description: 'Wait before next action', icon: Timer, category: 'flow' },
  { id: 'condition', name: 'If/Then Condition', description: 'Branch based on conditions', icon: GitBranch, category: 'flow' },
  { id: 'webhook_call', name: 'Call Webhook', description: 'Make an HTTP request', icon: Webhook, category: 'advanced' },
  { id: 'n8n_workflow', name: 'Run n8n Workflow', description: 'Trigger an n8n workflow', icon: ExternalLink, category: 'advanced' },
];

export function CreateAutomationModal({ isOpen, onClose, onCreated }: CreateAutomationModalProps) {
  const [step, setStep] = useState<Step>('basics');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('workflow');
  const [selectedTrigger, setSelectedTrigger] = useState<TriggerOption | null>(null);
  const [selectedActions, setSelectedActions] = useState<ActionOption[]>([]);
  const [triggerConfig, setTriggerConfig] = useState<Record<string, any>>({});

  const steps: { key: Step; label: string }[] = [
    { key: 'basics', label: 'Basics' },
    { key: 'trigger', label: 'Trigger' },
    { key: 'actions', label: 'Actions' },
    { key: 'review', label: 'Review' },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === step);

  const canProceed = () => {
    switch (step) {
      case 'basics': return name.trim().length > 0;
      case 'trigger': return selectedTrigger !== null;
      case 'actions': return selectedActions.length > 0;
      case 'review': return true;
      default: return false;
    }
  };

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setStep(steps[nextIndex].key);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setStep(steps[prevIndex].key);
    }
  };

  const handleCreate = () => {
    const automation = {
      id: Date.now().toString(),
      name,
      description,
      category,
      trigger: selectedTrigger?.name || '',
      actions: selectedActions.map(a => a.name),
      status: 'draft',
      runCount: 0,
      successRate: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    onCreated(automation);
    handleClose();
  };

  const handleClose = () => {
    setStep('basics');
    setName('');
    setDescription('');
    setSelectedTrigger(null);
    setSelectedActions([]);
    onClose();
  };

  const addAction = (action: ActionOption) => {
    setSelectedActions(prev => [...prev, action]);
  };

  const removeAction = (index: number) => {
    setSelectedActions(prev => prev.filter((_, i) => i !== index));
  };

  const categories = ['workflow', 'communication', 'reminder', 'marketing', 'integration'];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] bg-card border-border max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-brand" />
            Create Automation
          </DialogTitle>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between px-4 py-3 bg-secondary/30 rounded-lg mb-4">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                i < currentStepIndex ? 'bg-green-500 text-white' :
                i === currentStepIndex ? 'bg-brand text-brand-foreground' :
                'bg-secondary text-muted-foreground'
              )}>
                {i < currentStepIndex ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className={cn(
                'ml-2 text-sm font-medium',
                i === currentStepIndex ? 'text-foreground' : 'text-muted-foreground'
              )}>
                {s.label}
              </span>
              {i < steps.length - 1 && (
                <ArrowRight className="w-4 h-4 mx-4 text-muted-foreground" />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <ScrollArea className="flex-1 pr-4">
          {step === 'basics' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Automation Name *
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., New Lead Welcome Sequence"
                  className="bg-secondary border-border"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Description
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What does this automation do?"
                  className="bg-secondary border-border resize-none"
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Category
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={cn(
                        'px-3 py-2 rounded-lg text-sm font-medium capitalize transition-colors',
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
            </div>
          )}

          {step === 'trigger' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                Choose what starts this automation
              </p>
              <div className="grid grid-cols-2 gap-3">
                {triggerOptions.map((trigger) => (
                  <button
                    key={trigger.id}
                    onClick={() => setSelectedTrigger(trigger)}
                    className={cn(
                      'flex items-start gap-3 p-4 rounded-lg text-left transition-all',
                      selectedTrigger?.id === trigger.id
                        ? 'bg-brand/20 border-2 border-brand'
                        : 'bg-secondary/50 border-2 border-transparent hover:border-brand/50'
                    )}
                  >
                    <div className={cn(
                      'p-2 rounded-lg',
                      selectedTrigger?.id === trigger.id ? 'bg-brand/30' : 'bg-secondary'
                    )}>
                      <trigger.icon className={cn(
                        'w-5 h-5',
                        selectedTrigger?.id === trigger.id ? 'text-brand' : 'text-muted-foreground'
                      )} />
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">{trigger.name}</p>
                      <p className="text-xs text-muted-foreground">{trigger.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'actions' && (
            <div className="space-y-4">
              {/* Selected Actions */}
              {selectedActions.length > 0 && (
                <div className="space-y-2 mb-6">
                  <label className="text-sm font-medium text-foreground">Action Sequence</label>
                  <div className="space-y-2">
                    {selectedActions.map((action, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg"
                      >
                        <span className="w-6 h-6 rounded-full bg-brand text-brand-foreground text-xs flex items-center justify-center">
                          {index + 1}
                        </span>
                        <action.icon className="w-4 h-4 text-muted-foreground" />
                        <span className="flex-1 text-sm text-foreground">{action.name}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-red-500/20 hover:text-red-500"
                          onClick={() => removeAction(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Available Actions */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Add Actions
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {actionOptions.map((action) => (
                    <button
                      key={action.id}
                      onClick={() => addAction(action)}
                      className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors text-left"
                    >
                      <div className="p-1.5 rounded bg-secondary">
                        <action.icon className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{action.name}</p>
                        <p className="text-xs text-muted-foreground">{action.description}</p>
                      </div>
                      <Plus className="w-4 h-4 text-muted-foreground ml-auto" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 'review' && (
            <div className="space-y-6">
              <div className="p-4 bg-secondary/30 rounded-lg">
                <h3 className="font-semibold text-foreground mb-2">{name}</h3>
                {description && (
                  <p className="text-sm text-muted-foreground mb-3">{description}</p>
                )}
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-secondary rounded text-xs text-muted-foreground capitalize">
                    {category}
                  </span>
                  <span className="px-2 py-1 bg-yellow-500/20 text-yellow-500 rounded text-xs">
                    Draft
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-foreground mb-2">Trigger</h4>
                {selectedTrigger && (
                  <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
                    <selectedTrigger.icon className="w-5 h-5 text-brand" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{selectedTrigger.name}</p>
                      <p className="text-xs text-muted-foreground">{selectedTrigger.description}</p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-sm font-medium text-foreground mb-2">Actions ({selectedActions.length})</h4>
                <div className="space-y-2">
                  {selectedActions.map((action, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
                      <span className="w-6 h-6 rounded-full bg-brand text-brand-foreground text-xs flex items-center justify-center">
                        {index + 1}
                      </span>
                      <action.icon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">{action.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
          <Button
            variant="outline"
            onClick={currentStepIndex === 0 ? handleClose : handleBack}
          >
            {currentStepIndex === 0 ? 'Cancel' : (
              <>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </>
            )}
          </Button>
          
          {step === 'review' ? (
            <Button
              onClick={handleCreate}
              className="bg-brand hover:bg-brand/90"
            >
              <Zap className="w-4 h-4 mr-2" />
              Create Automation
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="bg-brand hover:bg-brand/90"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
