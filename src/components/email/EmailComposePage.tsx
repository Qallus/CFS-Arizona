'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import {
  Send,
  Loader2,
  Paperclip,
  ChevronDown,
  FileText,
  Search,
  Plus,
  User,
  Building,
  ArrowLeft,
  X,
  Check,
  Code,
  Eye,
  Type,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html: string;
  text?: string;
  category: string;
  variables?: string[];
}

interface Contact {
  id: string;
  name: string;
  email: string | null;
  company?: string;
  companyEmail?: string | null;
}

interface EmailComposePageProps {
  replyTo?: {
    to: string;
    subject: string;
    body?: string;
  };
  onSent?: () => void;
  onBack?: () => void;
  onOpenTemplates?: () => void;
}

export function EmailComposePage({ replyTo, onSent, onBack, onOpenTemplates }: EmailComposePageProps) {
  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [editorMode, setEditorMode] = useState<'visual' | 'html' | 'preview'>('visual');
  const [showTemplates, setShowTemplates] = useState(false);
  const [templateSearch, setTemplateSearch] = useState('');
  
  // Contact picker state
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showContactPicker, setShowContactPicker] = useState<'to' | 'cc' | 'bcc' | null>(null);
  const [contactSearch, setContactSearch] = useState('');
  
  const templateDropdownRef = useRef<HTMLDivElement>(null);
  const contactDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (replyTo) {
      setTo(replyTo.to);
      setSubject(replyTo.subject.startsWith('Re:') ? replyTo.subject : `Re: ${replyTo.subject}`);
      if (replyTo.body) {
        setBody(`<p><br></p><hr><p>On previous email, ${replyTo.to} wrote:</p>${replyTo.body}`);
      }
    }
  }, [replyTo]);

  useEffect(() => {
    fetchTemplates();
    fetchContacts();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (templateDropdownRef.current && !templateDropdownRef.current.contains(e.target as Node)) {
        setShowTemplates(false);
      }
      if (contactDropdownRef.current && !contactDropdownRef.current.contains(e.target as Node)) {
        setShowContactPicker(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/email/templates');
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (err) {
      console.error('Error fetching templates:', err);
    }
  };

  const fetchContacts = async () => {
    try {
      const response = await fetch('/api/leads');
      const data = await response.json();
      const contactList = (data.leads || [])
        .filter((l: any) => l.email || l.companyEmail)
        .map((l: any) => ({
          id: l.id,
          name: l.name,
          email: l.email,
          company: l.company,
          companyEmail: l.companyEmail,
        }));
      setContacts(contactList);
    } catch (err) {
      console.error('Error fetching contacts:', err);
    }
  };

  const handleSend = async () => {
    if (!to || !subject) {
      setError('To and Subject are required');
      return;
    }

    setSending(true);
    setError(null);

    try {
      const response = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to,
          cc: cc || undefined,
          bcc: bcc || undefined,
          subject,
          html: body,
        }),
      });

      const data = await response.json();

      if (data.error) {
        setError(data.details ? `${data.error}: ${data.details}` : data.error);
      } else {
        setSent(true);
        onSent?.();
        // Auto-redirect after success
        setTimeout(() => {
          onBack?.();
        }, 2000);
      }
    } catch (err) {
      setError('Failed to send email');
    } finally {
      setSending(false);
    }
  };

  const applyTemplate = (template: EmailTemplate) => {
    setSubject(template.subject);
    setBody(template.html || template.text || '');
    // Switch to HTML mode for templates with complex HTML
    if (template.html && (template.html.includes('<table') || template.html.includes('<style') || template.html.includes('style="'))) {
      setEditorMode('html');
    }
    setShowTemplates(false);
    setTemplateSearch('');
  };

  const addContact = (contact: Contact, field: 'to' | 'cc' | 'bcc') => {
    const email = contact.email || contact.companyEmail || '';
    const formatted = `${contact.name} <${email}>`;
    
    const setValue = field === 'to' ? setTo : field === 'cc' ? setCc : setBcc;
    const currentValue = field === 'to' ? to : field === 'cc' ? cc : bcc;
    
    if (currentValue) {
      setValue(`${currentValue}, ${formatted}`);
    } else {
      setValue(formatted);
    }
    
    setShowContactPicker(null);
    setContactSearch('');
  };

  const clearForm = () => {
    setTo('');
    setCc('');
    setBcc('');
    setSubject('');
    setBody('');
    setError(null);
    setSent(false);
  };

  // Filter templates by search
  const filteredTemplates = templates.filter(t => 
    templateSearch === '' ||
    t.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
    t.category.toLowerCase().includes(templateSearch.toLowerCase())
  );

  // Group templates by category
  const groupedTemplates = filteredTemplates.reduce((acc, t) => {
    if (!acc[t.category]) acc[t.category] = [];
    acc[t.category].push(t);
    return acc;
  }, {} as Record<string, EmailTemplate[]>);

  // Filter contacts by search
  const filteredContacts = contacts.filter(c => 
    contactSearch === '' ||
    c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
    (c.email && c.email.toLowerCase().includes(contactSearch.toLowerCase())) ||
    (c.company && c.company.toLowerCase().includes(contactSearch.toLowerCase()))
  );

  const ContactPickerDropdown = ({ field }: { field: 'to' | 'cc' | 'bcc' }) => (
    <div 
      ref={contactDropdownRef}
      className="absolute left-0 top-full mt-1 w-96 bg-card border border-border rounded-lg shadow-lg z-20"
    >
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={contactSearch}
            onChange={(e) => setContactSearch(e.target.value)}
            placeholder="Search contacts by name, email, or company..."
            className="pl-10 h-10"
            autoFocus
          />
        </div>
      </div>
      <ScrollArea className="max-h-72">
        {filteredContacts.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-sm text-muted-foreground mb-2">No contacts found</p>
            <p className="text-xs text-muted-foreground">Type any email directly in the field above</p>
          </div>
        ) : (
          filteredContacts.slice(0, 25).map((contact) => (
            <button
              key={contact.id}
              onClick={() => addContact(contact, field)}
              className="w-full text-left px-4 py-3 hover:bg-secondary transition-colors flex items-start gap-3 border-b border-border/50 last:border-0"
            >
              <div className="w-10 h-10 rounded-full bg-brand/20 flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-brand" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">{contact.name}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {contact.email || contact.companyEmail}
                </p>
                {contact.company && (
                  <p className="text-xs text-muted-foreground/60 truncate flex items-center gap-1 mt-0.5">
                    <Building className="w-3 h-3" />
                    {contact.company}
                  </p>
                )}
              </div>
            </button>
          ))
        )}
      </ScrollArea>
    </div>
  );

  // Success state
  if (sent) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Card className="bg-card/50 border-border max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Email Sent!</h2>
            <p className="text-muted-foreground mb-6">Your email has been sent successfully.</p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={clearForm}>
                Compose Another
              </Button>
              <Button onClick={onBack} className="bg-brand hover:bg-brand/90">
                Back to Inbox
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <h2 className="text-xl font-semibold text-foreground">
            {replyTo ? 'Reply' : 'Compose Email'}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          {/* Template Selector */}
          <div className="flex items-center gap-2">
            <div className="relative" ref={templateDropdownRef}>
              <Button 
                variant="outline" 
                onClick={() => setShowTemplates(!showTemplates)}
              >
                <FileText className="w-4 h-4 mr-2" />
                Templates
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
              
              {showTemplates && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-lg shadow-xl z-30 overflow-hidden">
                  {/* Search */}
                  <div className="p-3 border-b border-border">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        value={templateSearch}
                        onChange={(e) => setTemplateSearch(e.target.value)}
                        placeholder="Search templates..."
                        className="pl-10"
                        autoFocus
                      />
                    </div>
                  </div>
                  
                  <ScrollArea className="max-h-80">
                    {Object.keys(groupedTemplates).length === 0 ? (
                      <p className="p-4 text-sm text-muted-foreground text-center">No templates found</p>
                    ) : (
                      Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
                        <div key={category}>
                          <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-secondary/50 sticky top-0">
                            {category}
                          </div>
                          {categoryTemplates.map((template) => (
                            <button
                              key={template.id}
                              onClick={() => applyTemplate(template)}
                              className="w-full text-left px-4 py-3 hover:bg-secondary transition-colors"
                            >
                              <p className="font-medium text-foreground">{template.name}</p>
                              <p className="text-sm text-muted-foreground truncate">{template.subject}</p>
                            </button>
                          ))}
                        </div>
                      ))
                    )}
                  </ScrollArea>
                </div>
              )}
            </div>
            
            {/* Create Template Button */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => onOpenTemplates?.()}
              title="Create New Template"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <Button 
            onClick={handleSend} 
            disabled={sending || !to || !subject}
            className="bg-brand hover:bg-brand/90"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Send Email
          </Button>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Error */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center justify-between">
              <p className="text-sm text-red-400">{error}</p>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setError(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Recipients Card */}
          <Card className="bg-card/50 border-border">
            <CardContent className="p-6 space-y-4">
              {/* To */}
              <div className="relative">
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium text-muted-foreground w-16">To:</label>
                  <div className="relative flex-1">
                    <Input
                      value={to}
                      onChange={(e) => setTo(e.target.value)}
                      placeholder="email@example.com (type or select from contacts)"
                      className="pr-12"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                      onClick={() => setShowContactPicker(showContactPicker === 'to' ? null : 'to')}
                      title="Select from contacts"
                    >
                      <User className="w-4 h-4 text-muted-foreground" />
                    </Button>
                    {showContactPicker === 'to' && <ContactPickerDropdown field="to" />}
                  </div>
                  <div className="flex gap-2">
                    {!showCc && (
                      <Button variant="ghost" size="sm" onClick={() => setShowCc(true)}>
                        + Cc
                      </Button>
                    )}
                    {!showBcc && (
                      <Button variant="ghost" size="sm" onClick={() => setShowBcc(true)}>
                        + Bcc
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* CC */}
              {showCc && (
                <div className="relative flex items-center gap-4">
                  <label className="text-sm font-medium text-muted-foreground w-16">Cc:</label>
                  <div className="relative flex-1">
                    <Input
                      value={cc}
                      onChange={(e) => setCc(e.target.value)}
                      placeholder="cc@example.com"
                      className="pr-12"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                      onClick={() => setShowContactPicker(showContactPicker === 'cc' ? null : 'cc')}
                      title="Select from contacts"
                    >
                      <User className="w-4 h-4 text-muted-foreground" />
                    </Button>
                    {showContactPicker === 'cc' && <ContactPickerDropdown field="cc" />}
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setShowCc(false); setCc(''); }}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* BCC */}
              {showBcc && (
                <div className="relative flex items-center gap-4">
                  <label className="text-sm font-medium text-muted-foreground w-16">Bcc:</label>
                  <div className="relative flex-1">
                    <Input
                      value={bcc}
                      onChange={(e) => setBcc(e.target.value)}
                      placeholder="bcc@example.com"
                      className="pr-12"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                      onClick={() => setShowContactPicker(showContactPicker === 'bcc' ? null : 'bcc')}
                      title="Select from contacts"
                    >
                      <User className="w-4 h-4 text-muted-foreground" />
                    </Button>
                    {showContactPicker === 'bcc' && <ContactPickerDropdown field="bcc" />}
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setShowBcc(false); setBcc(''); }}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* Subject */}
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-muted-foreground w-16">Subject:</label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Email subject"
                  className="flex-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Editor Card */}
          <Card className="bg-card/50 border-border">
            <CardContent className="p-0">
              {/* Editor Mode Tabs */}
              <div className="flex items-center gap-1 px-4 py-3 border-b border-border bg-secondary/30">
                <Button
                  variant={editorMode === 'visual' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setEditorMode('visual')}
                  className={editorMode === 'visual' ? 'bg-brand hover:bg-brand/90' : ''}
                >
                  <Type className="w-4 h-4 mr-2" />
                  Visual Editor
                </Button>
                <Button
                  variant={editorMode === 'html' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setEditorMode('html')}
                  className={editorMode === 'html' ? 'bg-brand hover:bg-brand/90' : ''}
                >
                  <Code className="w-4 h-4 mr-2" />
                  HTML Code
                </Button>
                <Button
                  variant={editorMode === 'preview' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setEditorMode('preview')}
                  className={editorMode === 'preview' ? 'bg-brand hover:bg-brand/90' : ''}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
                <div className="flex-1" />
                <span className="text-xs text-muted-foreground">
                  {editorMode === 'html' ? 'Edit raw HTML — preserves all styles' : 
                   editorMode === 'preview' ? 'Preview how email will look' :
                   'Rich text — for simple emails'}
                </span>
              </div>

              {/* Visual Editor */}
              {editorMode === 'visual' && (
                <RichTextEditor
                  content={body}
                  onChange={setBody}
                  placeholder="Write your email..."
                  className="border-0 rounded-none"
                />
              )}

              {/* HTML Code Editor */}
              {editorMode === 'html' && (
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="<html>&#10;  <body>&#10;    Write your HTML email here...&#10;  </body>&#10;</html>"
                  className="min-h-[500px] border-0 rounded-none resize-none focus-visible:ring-0 font-mono text-sm p-4 bg-[#1a1a2e]"
                />
              )}

              {/* Preview */}
              {editorMode === 'preview' && (
                <div className="min-h-[500px] p-4 bg-white">
                  <div 
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: body }}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attachments Bar */}
          <Card className="bg-card/50 border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm">
                  <Paperclip className="w-4 h-4 mr-2" />
                  Attach Files
                </Button>
                <span className="text-sm text-muted-foreground">
                  Drag and drop files here or click to browse
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
