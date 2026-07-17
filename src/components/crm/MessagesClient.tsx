'use client';

import { useCallback, useEffect, useState } from 'react';
import { Send, MessageSquare, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PageShell, PageHeader, SectionCard, EmptyState } from '@/components/dashboard/page-parts';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  senderName: string | null;
  recipient: string | null;
  subject: string | null;
  body: string;
  readAt: string | null;
  createdAt: string;
}

function fmt(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  } catch {
    return '';
  }
}

export function MessagesClient() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [provisioned, setProvisioned] = useState(true);
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/crm/messages');
      const data = await res.json();
      setProvisioned(data.provisioned !== false);
      setMessages(Array.isArray(data.messages) ? data.messages : []);
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    try {
      await fetch('/api/crm/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient, subject, body }),
      });
      setRecipient('');
      setSubject('');
      setBody('');
      await load();
    } finally {
      setSending(false);
    }
  }

  async function markRead(id: string) {
    await fetch(`/api/crm/messages/${id}`, { method: 'PATCH' }).catch(() => {});
    setMessages((cur) => cur.map((m) => (m.id === id ? { ...m, readAt: new Date().toISOString() } : m)));
  }

  if (!loading && !provisioned) {
    return (
      <PageShell>
        <PageHeader eyebrow="Practice" title="Messages" description="Internal direct messages for the CFS team." />
        <EmptyState icon={Database} title="Database not provisioned yet" description="Apply the CRM migrations to your Supabase to enable messaging." />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader eyebrow="Practice" title="Messages" description="Internal direct messages for the CFS team." />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Compose */}
        <div className="lg:col-span-1">
          <SectionCard title="New message">
            <form onSubmit={send} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="to">To</Label>
                <Input id="to" value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="Teammate or Team" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="subj">Subject</Label>
                <Input id="subj" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Optional" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="body">Message</Label>
                <Textarea id="body" value={body} onChange={(e) => setBody(e.target.value)} rows={5} placeholder="Write a message…" />
              </div>
              <Button type="submit" disabled={sending || !body.trim()} className="w-full">
                <Send className="size-4" /> {sending ? 'Sending…' : 'Send'}
              </Button>
            </form>
          </SectionCard>
        </div>

        {/* Inbox */}
        <div className="lg:col-span-2">
          <SectionCard title="Inbox" bodyClassName="p-0">
            {loading ? (
              <p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>
            ) : messages.length === 0 ? (
              <div className="p-5">
                <EmptyState icon={MessageSquare} title="No messages yet" description="Send a message to start the thread." />
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {messages.map((m) => (
                  <li
                    key={m.id}
                    onClick={() => !m.readAt && markRead(m.id)}
                    className={cn('cursor-pointer px-5 py-4 transition-colors hover:bg-secondary/40', !m.readAt && 'bg-brand/5')}
                  >
                    <div className="flex items-center gap-2">
                      {!m.readAt && <span className="size-2 shrink-0 rounded-full bg-brand" />}
                      <span className="font-medium text-foreground">{m.senderName || 'Unknown'}</span>
                      <span className="text-xs text-muted-foreground">→ {m.recipient || 'Team'}</span>
                      <span className="ml-auto text-xs text-muted-foreground">{fmt(m.createdAt)}</span>
                    </div>
                    {m.subject && <p className="mt-1 text-sm font-medium text-foreground">{m.subject}</p>}
                    <p className="mt-0.5 text-sm text-muted-foreground">{m.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>
      </div>
    </PageShell>
  );
}
