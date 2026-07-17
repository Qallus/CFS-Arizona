'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Plug,
  RefreshCw,
  Loader2,
  Check,
  AlertCircle,
  Users,
  Home,
  StickyNote,
  Calendar,
  Database,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Counts {
  households: number;
  contacts: number;
  notes: number;
  appointments: number;
}
interface Status {
  configured: boolean;
  lastRun: {
    id: string;
    status: string;
    started_at: string;
    finished_at: string | null;
    counts: Counts | null;
    error: string | null;
  } | null;
  totals: { contacts: number; households: number; notes: number; appointments: number } | null;
}

type Msg = { type: 'success' | 'error'; text: string } | null;

export default function IntegrationsPage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);

  function flash(m: Msg) {
    setMsg(m);
    if (m) setTimeout(() => setMsg(null), 5000);
  }

  async function loadStatus() {
    setLoading(true);
    try {
      const res = await fetch('/api/redtail/status');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load status');
      setStatus(data);
    } catch (err) {
      flash({ type: 'error', text: (err as Error).message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStatus();
  }, []);

  async function runSync() {
    setSyncing(true);
    setMsg(null);
    try {
      const res = await fetch('/api/redtail/sync', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Sync failed');
      const c = data.counts as Counts;
      flash({
        type: 'success',
        text: `Synced ${c.contacts} contacts, ${c.households} households, ${c.notes} notes, ${c.appointments} appointments.`,
      });
      await loadStatus();
    } catch (err) {
      flash({ type: 'error', text: (err as Error).message });
    } finally {
      setSyncing(false);
    }
  }

  const totals = status?.totals;
  const last = status?.lastRun;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Plug className="w-6 h-6 text-brand" />
            Integrations
          </h1>
          <p className="text-muted-foreground">Connect and sync external data sources</p>
        </div>
        <Button variant="outline" onClick={loadStatus} disabled={loading}>
          <RefreshCw className={cn('w-4 h-4 mr-2', loading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {msg && (
        <div
          className={cn(
            'mb-6 p-4 rounded-lg flex items-center gap-2',
            msg.type === 'success'
              ? 'bg-green-500/10 border border-green-500/30 text-green-500'
              : 'bg-red-500/10 border border-red-500/30 text-red-500',
          )}
        >
          {msg.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {msg.text}
        </div>
      )}

      <Card className="bg-card/50 border-border max-w-3xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-foreground flex items-center gap-2">
                Redtail CRM
                {status &&
                  (status.configured ? (
                    <Badge variant="outline" className="border-green-500 text-green-500">
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-yellow-500 text-yellow-500">
                      Not configured
                    </Badge>
                  ))}
              </CardTitle>
              <CardDescription>
                Read-only mirror of contacts, households, notes, and appointments into SIG360.
              </CardDescription>
            </div>
            <Button
              onClick={runSync}
              disabled={syncing || loading || !status?.configured}
              className="bg-brand hover:bg-brand/90"
            >
              {syncing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              {syncing ? 'Syncing…' : 'Sync now'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {!status?.configured && (
            <div className="p-3 rounded-lg flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/30 text-yellow-600 dark:text-yellow-400 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              Set <code>REDTAIL_API_KEY</code>, <code>REDTAIL_USERNAME</code>, and{' '}
              <code>REDTAIL_PASSWORD</code> in the environment, then refresh.
            </div>
          )}

          {/* Mirror totals */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat icon={<Users className="w-4 h-4" />} label="Contacts" value={totals?.contacts} />
            <Stat icon={<Home className="w-4 h-4" />} label="Households" value={totals?.households} />
            <Stat icon={<StickyNote className="w-4 h-4" />} label="Notes" value={totals?.notes} />
            <Stat icon={<Calendar className="w-4 h-4" />} label="Appointments" value={totals?.appointments} />
          </div>

          {/* Last run */}
          <div>
            <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
              <Database className="w-4 h-4 text-muted-foreground" /> Last sync
            </p>
            {last ? (
              <div className="text-sm text-muted-foreground space-y-1">
                <div className="flex items-center gap-2">
                  <StatusBadge status={last.status} />
                  <span>
                    {new Date(last.started_at).toLocaleString()}
                    {last.finished_at ? ` → ${new Date(last.finished_at).toLocaleTimeString()}` : ''}
                  </span>
                </div>
                {last.counts && (
                  <p>
                    {last.counts.contacts} contacts · {last.counts.households} households ·{' '}
                    {last.counts.notes} notes · {last.counts.appointments} appointments
                  </p>
                )}
                {last.error && <p className="text-red-500">Error: {last.error}</p>}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No syncs yet.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value?: number }) {
  return (
    <div className="p-3 bg-secondary rounded-lg">
      <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
        {icon}
        {label}
      </div>
      <p className="text-xl font-bold text-foreground">{value ?? '—'}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    success: 'border-green-500 text-green-500',
    running: 'border-blue-500 text-blue-500',
    partial: 'border-yellow-500 text-yellow-500',
    error: 'border-red-500 text-red-500',
  };
  return (
    <Badge variant="outline" className={cn('text-xs capitalize', map[status] ?? '')}>
      {status}
    </Badge>
  );
}
