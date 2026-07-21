'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, Repeat, MessageSquare, Bot, Send, Phone, Mail, X } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export function AssistantFab() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating action button */}
      <button
        onClick={() => setOpen(true)}
        className={cn(
          'fixed bottom-6 right-6 z-40 flex size-14 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-lg transition-transform hover:scale-105 active:scale-95',
        )}
        aria-label="Ask Eve"
        title="Ask Eve"
      >
        <Sparkles className="size-6" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent hideCloseButton className="max-w-lg bg-card border-border p-0 text-foreground">
          <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
            <div className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-lg bg-brand/15 text-brand">
                <Sparkles className="size-4" />
              </span>
              <span className="font-semibold text-foreground">Eve</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
          </div>

          <Tabs defaultValue="eve" className="w-full">
            <div className="px-5 pt-4">
              <TabsList className="w-full">
                <TabsTrigger value="eve" className="flex-1 gap-1.5">
                  <Bot className="size-4" /> Eve
                </TabsTrigger>
                <TabsTrigger value="followup" className="flex-1 gap-1.5">
                  <Repeat className="size-4" /> Follow-up
                </TabsTrigger>
                <TabsTrigger value="messages" className="flex-1 gap-1.5">
                  <MessageSquare className="size-4" /> Messages
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-5">
              <TabsContent value="eve">
                <EveTab />
              </TabsContent>
              <TabsContent value="followup">
                <FollowUpTab />
              </TabsContent>
              <TabsContent value="messages">
                <MessagesTab />
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* -------------------------------- Follow-up ------------------------------ */
interface SeqStep { id: string; offsetDays: number; channel: string; message: string | null }
interface Sequence { id: string; name: string; stallStage: string; steps: SeqStep[] }

const channelIcon: Record<string, typeof Phone> = { phone: Phone, email: Mail, sms: MessageSquare, mail: Send };

function FollowUpTab() {
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/crm/sequences')
      .then((r) => r.json())
      .then((d) => setSequences(Array.isArray(d.sequences) ? d.sequences : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <p className="mb-3 text-sm text-muted-foreground">
        Configurable follow-up cadences — intervals &amp; copy finalized by CFS.
      </p>
      {loading ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>
      ) : sequences.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">No cadences configured yet.</p>
      ) : (
        <div className="space-y-5">
          {sequences.map((seq) => (
            <div key={seq.id}>
              <p className="mb-2 text-sm font-semibold text-foreground">{seq.name}</p>
              <ol className="space-y-2">
                {seq.steps.map((step) => {
                  const Icon = channelIcon[step.channel] ?? Send;
                  return (
                    <li key={step.id} className="flex items-start gap-3 rounded-lg border border-border p-3">
                      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold text-foreground">
                        D{step.offsetDays}
                      </span>
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 text-sm font-medium capitalize text-foreground">
                          <Icon className="size-3.5" /> {step.channel}
                        </p>
                        {step.message && <p className="text-xs text-muted-foreground">{step.message}</p>}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          ))}
        </div>
      )}
      <p className="mt-4 text-xs text-muted-foreground">Automated sending arrives in a later phase.</p>
    </div>
  );
}

/* -------------------------------- Messages ------------------------------- */
interface Message { id: string; senderName: string | null; recipient: string | null; subject: string | null; body: string; createdAt: string }

function MessagesTab() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [recipient, setRecipient] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const load = () =>
    fetch('/api/crm/messages')
      .then((r) => r.json())
      .then((d) => setMessages(Array.isArray(d.messages) ? d.messages.slice(0, 6) : []))
      .catch(() => {});

  useEffect(() => {
    load();
  }, []);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    try {
      await fetch('/api/crm/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient, body }),
      });
      setBody('');
      setRecipient('');
      await load();
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={send} className="space-y-2">
        <Input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="To (teammate or Team)" />
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={2} placeholder="Quick message…" />
        <div className="flex items-center justify-between">
          <Link href="/messages" className="text-xs text-brand hover:underline">
            Open full inbox
          </Link>
          <Button type="submit" size="sm" disabled={sending || !body.trim()}>
            <Send className="size-4" /> Send
          </Button>
        </div>
      </form>

      <div className="space-y-2 border-t border-border pt-3">
        {messages.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No messages yet.</p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className="rounded-lg border border-border p-2.5">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{m.senderName || 'Unknown'}</span>
                <span>→ {m.recipient || 'Team'}</span>
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">{m.body}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ---------------------------------- Eve ---------------------------------- */
interface EveTurn {
  role: 'user' | 'assistant';
  content: string;
}

const EVE_STARTERS = [
  'What is this page for?',
  'Which pages have live data?',
  'How do I invite a teammate?',
];

function EveTab() {
  const pathname = usePathname();
  const [turns, setTurns] = useState<EveTurn[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns, thinking]);

  const ask = useCallback(
    async (question: string) => {
      const text = question.trim();
      if (!text || thinking) return;
      setError('');
      setInput('');
      const next: EveTurn[] = [...turns, { role: 'user', content: text }];
      setTurns(next);
      setThinking(true);
      try {
        const res = await fetch('/api/eve/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: next, pathname }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Eve could not answer.');
        setTurns((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setThinking(false);
      }
    },
    [turns, thinking, pathname],
  );

  return (
    <div className="flex flex-col">
      {turns.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-brand/15 text-brand">
            <Bot className="size-7" />
          </span>
          <div>
            <p className="font-semibold text-foreground">Ask Eve</p>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              She knows her way around the dashboard. She can&apos;t read records or make
              changes yet.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 pt-1">
            {EVE_STARTERS.map((s) => (
              <button
                key={s}
                onClick={() => ask(s)}
                className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3 pb-3">
          {turns.map((t, i) => (
            <div key={i} className={cn('flex', t.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div
                className={cn(
                  'max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm',
                  t.role === 'user'
                    ? 'bg-brand text-brand-foreground'
                    : 'bg-secondary text-foreground',
                )}
              >
                {t.content}
              </div>
            </div>
          ))}
          {thinking && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-secondary px-3.5 py-2 text-sm text-muted-foreground">
                Eve is thinking…
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
      )}

      {error && (
        <p className="mb-2 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="flex items-end gap-2 border-t border-border pt-3"
      >
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              ask(input);
            }
          }}
          rows={1}
          placeholder="Ask Eve about this dashboard…"
          className="max-h-32 min-h-[40px] flex-1 resize-none"
        />
        <Button type="submit" size="sm" disabled={thinking || !input.trim()}>
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}
