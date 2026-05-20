'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  X,
  Send,
  Loader2,
  Paperclip,
  ChevronDown,
  FileText,
  Bold,
  Italic,
  Underline,
  List,
  Link,
  Image,
  Search,
  Plus,
  User,
  Building,
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

interface EmailComposeProps {
  isOpen: boolean;
  onClose: () => void;
  replyTo?: {
    to: string;
    subject: string;
    body?: string;
  };
  onSent?: () => void;
  onOpenTemplates?: () => void;
}

export function EmailCompose({ isOpen, onClose, replyTo, onSent, onOpenTemplates }: EmailComposeProps) {
  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isHtml, setIsHtml] = useState(false);
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [templateSearch, setTemplateSearch] = useState('');
  
  // Contact picker state
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showContactPicker, setShowContactPicker] = useState<'to' | 'cc' | 'bcc' | null>(null);
  const [contactSearch, setContactSearch] = useState('');
  
  const toInputRef = useRef<HTMLInputElement>(null);
  const ccInputRef = useRef<HTMLInputElement>(null);
  const bccInputRef = useRef<HTMLInputElement>(null);
  const templateDropdownRef = useRef<HTMLDivElement>(null);
  const contactDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (replyTo) {
      setTo(replyTo.to);
      setSubject(replyTo.subject.startsWith('Re:') ? replyTo.subject : `Re: ${replyTo.subject}`);
      if (replyTo.body) {
        setBody(`\n\n---\nOn previous email, ${replyTo.to} wrote:\n${replyTo.body}`);
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
      // Map leads to contacts with email addresses
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
          text: isHtml ? undefined : body,
          html: isHtml ? body : undefined,
        }),
      });

      const data = await response.json();

      if (data.error) {
        setError(data.details ? `${data.error}: ${data.details}` : data.error);
      } else {
        // Clear form
        setTo('');
        setCc('');
        setBcc('');
        setSubject('');
        setBody('');
        onSent?.();
        onClose();
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
    setIsHtml(!!template.html);
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

  const insertFormatting = (tag: string) => {
    if (!isHtml) {
      setIsHtml(true);
      setBody(`<p>${body}</p>`);
    }
    const selection = window.getSelection()?.toString() || '';
    if (selection) {
      setBody(body.replace(selection, `<${tag}>${selection}</${tag}>`));
    }
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
      className="absolute left-0 top-full mt-1 w-80 bg-card border border-border rounded-lg shadow-lg z-20"
    >
      <div className="p-2 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={contactSearch}
            onChange={(e) => setContactSearch(e.target.value)}
            placeholder="Search contacts..."
            className="pl-8 h-8 text-sm"
            autoFocus
          />
        </div>
      </div>
      <ScrollArea className="max-h-64">
        {filteredContacts.length === 0 ? (
          <p className="p-3 text-sm text-muted-foreground text-center">No contacts found</p>
        ) : (
          filteredContacts.slice(0, 20).map((contact) => (
            <button
              key={contact.id}
              onClick={() => addContact(contact, field)}
              className="w-full text-left px-3 py-2 hover:bg-secondary transition-colors flex items-start gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-brand/20 flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-4 h-4 text-brand" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground text-sm truncate">{contact.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {contact.email || contact.companyEmail}
                </p>
                {contact.company && (
                  <p className="text-xs text-muted-foreground/60 truncate flex items-center gap-1">
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="text-lg font-semibold text-foreground">
            {replyTo ? 'Reply' : 'New Email'}
          </h2>
          <div className="flex items-center gap-2">
            <div className="relative" ref={templateDropdownRef}>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowTemplates(!showTemplates)}
              >
                <FileText className="w-4 h-4 mr-2" />
                Templates
                <ChevronDown className="w-4 h-4 ml-1" />
              </Button>
              
              {showTemplates && (
                <div className="absolute right-0 top-full mt-1 w-72 bg-card border border-border rounded-lg shadow-lg z-10 overflow-hidden">
                  {/* Search */}
                  <div className="p-2 border-b border-border">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        value={templateSearch}
                        onChange={(e) => setTemplateSearch(e.target.value)}
                        placeholder="Search templates..."
                        className="pl-8 h-8 text-sm"
                        autoFocus
                      />
                    </div>
                  </div>
                  
                  <ScrollArea className="max-h-64">
                    {Object.keys(groupedTemplates).length === 0 ? (
                      <p className="p-3 text-sm text-muted-foreground text-center">No templates found</p>
                    ) : (
                      Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
                        <div key={category}>
                          <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-secondary/50 sticky top-0">
                            {category}
                          </div>
                          {categoryTemplates.map((template) => (
                            <button
                              key={template.id}
                              onClick={() => applyTemplate(template)}
                              className="w-full text-left px-4 py-2.5 hover:bg-secondary transition-colors"
                            >
                              <p className="font-medium text-foreground text-sm">{template.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{template.subject}</p>
                            </button>
                          ))}
                        </div>
                      ))
                    )}
                  </ScrollArea>
                </div>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-auto p-6">
          <div className="space-y-4">
            {/* To */}
            <div className="relative">
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground w-12">To:</label>
                <div className="relative flex-1">
                  <Input
                    ref={toInputRef}
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    onFocus={() => setShowContactPicker('to')}
                    placeholder="recipient@example.com or search contacts..."
                    className="flex-1 bg-secondary border-border pr-10"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowContactPicker(showContactPicker === 'to' ? null : 'to')}
                  >
                    <User className="w-4 h-4 text-muted-foreground" />
                  </Button>
                  {showContactPicker === 'to' && <ContactPickerDropdown field="to" />}
                </div>
                <div className="flex gap-1">
                  {!showCc && (
                    <Button variant="ghost" size="sm" onClick={() => setShowCc(true)}>
                      Cc
                    </Button>
                  )}
                  {!showBcc && (
                    <Button variant="ghost" size="sm" onClick={() => setShowBcc(true)}>
                      Bcc
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* CC */}
            {showCc && (
              <div className="relative flex items-center gap-2">
                <label className="text-sm text-muted-foreground w-12">Cc:</label>
                <div className="relative flex-1">
                  <Input
                    ref={ccInputRef}
                    value={cc}
                    onChange={(e) => setCc(e.target.value)}
                    onFocus={() => setShowContactPicker('cc')}
                    placeholder="cc@example.com"
                    className="flex-1 bg-secondary border-border pr-10"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowContactPicker(showContactPicker === 'cc' ? null : 'cc')}
                  >
                    <User className="w-4 h-4 text-muted-foreground" />
                  </Button>
                  {showContactPicker === 'cc' && <ContactPickerDropdown field="cc" />}
                </div>
              </div>
            )}

            {/* BCC */}
            {showBcc && (
              <div className="relative flex items-center gap-2">
                <label className="text-sm text-muted-foreground w-12">Bcc:</label>
                <div className="relative flex-1">
                  <Input
                    ref={bccInputRef}
                    value={bcc}
                    onChange={(e) => setBcc(e.target.value)}
                    onFocus={() => setShowContactPicker('bcc')}
                    placeholder="bcc@example.com"
                    className="flex-1 bg-secondary border-border pr-10"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowContactPicker(showContactPicker === 'bcc' ? null : 'bcc')}
                  >
                    <User className="w-4 h-4 text-muted-foreground" />
                  </Button>
                  {showContactPicker === 'bcc' && <ContactPickerDropdown field="bcc" />}
                </div>
              </div>
            )}

            {/* Subject */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground w-12">Subject:</label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject"
                className="flex-1 bg-secondary border-border"
              />
            </div>

            {/* Formatting Toolbar */}
            <div className="flex items-center gap-1 border-b border-border pb-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => insertFormatting('strong')}
              >
                <Bold className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => insertFormatting('em')}
              >
                <Italic className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => insertFormatting('u')}
              >
                <Underline className="w-4 h-4" />
              </Button>
              <div className="w-px h-4 bg-border mx-1" />
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <List className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Link className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Image className="w-4 h-4" />
              </Button>
              <div className="flex-1" />
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={isHtml}
                  onChange={(e) => setIsHtml(e.target.checked)}
                  className="rounded"
                />
                HTML Mode
              </label>
            </div>

            {/* Body */}
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your email..."
              className="min-h-[300px] bg-secondary border-border resize-none font-mono text-sm"
            />

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border shrink-0">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Paperclip className="w-4 h-4 mr-2" />
              Attach
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
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
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
