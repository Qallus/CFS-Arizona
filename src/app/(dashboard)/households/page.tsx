'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Home, Search, Plus, Loader2, Check, AlertCircle, X, Database, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Household { id: string; name: string; memberCount?: number; source: string; }
type Msg = { type: 'success' | 'error'; text: string } | null;

export default function HouseholdsPage() {
  const [households, setHouseholds] = useState<Household[]>([]);
  const [total, setTotal] = useState(0);
  const [provisioned, setProvisioned] = useState(true);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState<Msg>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  function flash(m: Msg) { setMsg(m); if (m) setTimeout(() => setMsg(null), 3500); }

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      const res = await fetch(`/api/crm/households?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setProvisioned(data.provisioned !== false);
      setHouseholds(data.households ?? []);
      setTotal(data.total ?? 0);
    } catch (err) { flash({ type: 'error', text: (err as Error).message }); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  async function add() {
    setSaving(true);
    try {
      const res = await fetch('/api/crm/households', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Create failed');
      setShowAdd(false); setName(''); flash({ type: 'success', text: 'Household created' }); load();
    } catch (err) { flash({ type: 'error', text: (err as Error).message }); }
    finally { setSaving(false); }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><Home className="w-6 h-6 text-brand" /> Households</h1>
          <p className="text-muted-foreground">{loading ? 'Loading…' : `${total} household${total === 1 ? '' : 's'}`}</p>
        </div>
        <Button className="bg-brand hover:bg-brand/90" onClick={() => setShowAdd(true)}><Plus className="w-4 h-4 mr-2" /> Add Household</Button>
      </div>

      {msg && (
        <div className={cn('mb-6 p-4 rounded-lg flex items-center gap-2',
          msg.type === 'success' ? 'bg-green-500/10 border border-green-500/30 text-green-500' : 'bg-red-500/10 border border-red-500/30 text-red-500')}>
          {msg.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}{msg.text}
        </div>
      )}

      {!provisioned && (
        <div className="mb-6 p-4 rounded-lg flex items-start gap-3 bg-yellow-500/10 border border-yellow-500/30 text-yellow-600 dark:text-yellow-400">
          <Database className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <p className="text-sm">CRM tables not provisioned. Apply the Redtail mirror migration to enable Households.</p>
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); load(); }} className="relative mb-4">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search households…" className="pl-9 bg-secondary border-border w-72" />
      </form>

      <Card className="bg-card/50 border-border">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading…</div>
          ) : households.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">{provisioned ? 'No households yet.' : 'Provision the database to see households.'}</div>
          ) : (
            <div className="divide-y divide-border">
              {households.map((h) => (
                <Link key={h.id} href={`/households/${h.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-brand/20 text-brand flex items-center justify-center flex-shrink-0"><Home className="w-4 h-4" /></div>
                    <p className="font-medium text-foreground truncate">{h.name}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <Badge variant="outline" className="text-xs">{h.memberCount ?? 0} member{h.memberCount === 1 ? '' : 's'}</Badge>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-sm bg-card border-border">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Add Household</h2>
                <button onClick={() => setShowAdd(false)} aria-label="Close"><X className="w-5 h-5 text-muted-foreground" /></button>
              </div>
              <div><Label className="text-sm text-muted-foreground">Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., The Johnson Family" className="bg-secondary border-border mt-1" /></div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
                <Button onClick={add} disabled={saving || !name.trim()} className="bg-brand hover:bg-brand/90">
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />} Create
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
