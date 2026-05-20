'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Send,
  Upload,
  Loader2,
  CheckCircle,
  XCircle,
  Users,
  MessageSquare,
  Trash2,
  Plus,
} from 'lucide-react';

interface Contact {
  phone: string;
  name?: string;
}

interface SendResult {
  phone: string;
  status: 'sent' | 'failed';
  error?: string;
}

export function BulkSms() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [newPhone, setNewPhone] = useState('');
  const [newName, setNewName] = useState('');
  const [template, setTemplate] = useState('');
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState<SendResult[] | null>(null);
  const [progress, setProgress] = useState({ sent: 0, total: 0 });

  const addContact = () => {
    if (!newPhone.trim()) return;
    setContacts([...contacts, { phone: newPhone.trim(), name: newName.trim() || undefined }]);
    setNewPhone('');
    setNewName('');
  };

  const removeContact = (index: number) => {
    setContacts(contacts.filter((_, i) => i !== index));
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      const newContacts: Contact[] = [];
      lines.forEach((line, index) => {
        // Skip header row if present
        if (index === 0 && (line.toLowerCase().includes('phone') || line.toLowerCase().includes('name'))) {
          return;
        }
        
        const parts = line.split(',').map(p => p.trim().replace(/"/g, ''));
        if (parts[0]) {
          newContacts.push({
            phone: parts[0],
            name: parts[1] || undefined,
          });
        }
      });
      
      setContacts([...contacts, ...newContacts]);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const sendBulkSms = async () => {
    if (contacts.length === 0 || !template.trim()) return;

    setSending(true);
    setResults(null);
    setProgress({ sent: 0, total: contacts.length });

    try {
      const response = await fetch('/api/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bulk',
          contacts,
          template,
          bulkId: Date.now().toString(),
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        const allResults: SendResult[] = [
          ...data.results.map((r: any) => ({ phone: r.phone, status: 'sent' as const })),
          ...data.errors.map((e: any) => ({ phone: e.phone, status: 'failed' as const, error: e.error })),
        ];
        setResults(allResults);
        setProgress({ sent: data.sent, total: contacts.length });
      }
    } catch (error) {
      console.error('Error sending bulk SMS:', error);
    } finally {
      setSending(false);
    }
  };

  const formatPhoneDisplay = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  const previewMessage = (contact: Contact) => {
    let preview = template;
    if (contact.name) {
      preview = preview.replace(/\{\{name\}\}/gi, contact.name);
    }
    preview = preview.replace(/\{\{phone\}\}/gi, contact.phone);
    return preview;
  };

  // Results View
  if (results) {
    const successCount = results.filter(r => r.status === 'sent').length;
    const failCount = results.filter(r => r.status === 'failed').length;

    return (
      <div className="space-y-4">
        <div className="text-center py-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <span className="text-2xl font-bold text-white">{successCount}</span>
            <span className="text-zinc-400">sent</span>
            {failCount > 0 && (
              <>
                <span className="text-zinc-500 mx-2">•</span>
                <XCircle className="w-6 h-6 text-red-500" />
                <span className="text-xl font-bold text-white">{failCount}</span>
                <span className="text-zinc-400">failed</span>
              </>
            )}
          </div>
        </div>

        <div className="max-h-60 overflow-y-auto space-y-1">
          {results.map((result, i) => (
            <div
              key={i}
              className={`flex items-center justify-between p-2 rounded ${
                result.status === 'sent' ? 'bg-green-500/10' : 'bg-red-500/10'
              }`}
            >
              <span className="text-zinc-300">{formatPhoneDisplay(result.phone)}</span>
              {result.status === 'sent' ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <span className="text-red-400 text-sm">{result.error || 'Failed'}</span>
              )}
            </div>
          ))}
        </div>

        <Button
          onClick={() => {
            setResults(null);
            setContacts([]);
            setTemplate('');
          }}
          className="w-full"
          variant="outline"
        >
          Send Another Batch
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-brand" />
          Bulk SMS
        </h3>
        <span className="text-zinc-400 text-sm">{contacts.length} contacts</span>
      </div>

      {/* Add Contacts */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <Input
            placeholder="Phone number"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            className="bg-zinc-800 border-zinc-700 text-white"
          />
          <Input
            placeholder="Name (optional)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="bg-zinc-800 border-zinc-700 text-white w-32"
          />
          <Button onClick={addContact} size="icon" variant="secondary">
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex-1">
            <input
              type="file"
              accept=".csv"
              onChange={handleCsvUpload}
              className="hidden"
            />
            <Button variant="outline" className="w-full" asChild>
              <span>
                <Upload className="w-4 h-4 mr-2" />
                Upload CSV
              </span>
            </Button>
          </label>
        </div>
        <p className="text-zinc-500 text-xs">CSV format: phone,name (name is optional)</p>
      </div>

      {/* Contact List */}
      {contacts.length > 0 && (
        <div className="max-h-32 overflow-y-auto space-y-1 p-2 bg-zinc-800/50 rounded-lg">
          {contacts.map((contact, i) => (
            <div key={i} className="flex items-center justify-between py-1">
              <span className="text-zinc-300 text-sm">
                {formatPhoneDisplay(contact.phone)}
                {contact.name && <span className="text-zinc-500 ml-2">({contact.name})</span>}
              </span>
              <button
                onClick={() => removeContact(i)}
                className="text-zinc-500 hover:text-red-400"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Message Template */}
      <div className="space-y-2">
        <label className="text-sm text-zinc-400 flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Message Template
        </label>
        <Textarea
          placeholder="Type your message... Use {{name}} for personalization"
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
          className="bg-zinc-800 border-zinc-700 text-white resize-none"
          rows={4}
        />
        <p className="text-zinc-500 text-xs">
          Variables: {'{{name}}'} = contact name, {'{{phone}}'} = phone number
        </p>
      </div>

      {/* Preview */}
      {template && contacts.length > 0 && (
        <div className="p-3 bg-zinc-800/50 rounded-lg">
          <p className="text-zinc-500 text-xs mb-1">Preview (first contact):</p>
          <p className="text-zinc-300 text-sm">{previewMessage(contacts[0])}</p>
        </div>
      )}

      {/* Send Button */}
      <Button
        onClick={sendBulkSms}
        disabled={contacts.length === 0 || !template.trim() || sending}
        className="w-full bg-brand hover:bg-brand/90"
      >
        {sending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Sending {progress.sent}/{progress.total}...
          </>
        ) : (
          <>
            <Send className="w-4 h-4 mr-2" />
            Send to {contacts.length} contacts
          </>
        )}
      </Button>
    </div>
  );
}
