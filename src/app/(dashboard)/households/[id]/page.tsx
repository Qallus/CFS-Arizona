'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Loader2, Check, AlertCircle, Home, Users, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Household { id: string; name: string; source: string; }
interface Member {
  id: string; fullName: string | null; firstName: string | null; lastName: string | null;
  email: string | null; contactType: string | null;
}
type Msg = { type: 'success' | 'error'; text: string } | null;

export default function HouseholdDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [household, setHousehold] = useState<Household | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);

  function flash(m: Msg) { setMsg(m); if (m) setTimeout(() => setMsg(null), 3500); }

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/crm/households/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load');
        setHousehold(data.household); setName(data.household?.name ?? ''); setMembers(data.members ?? []);
      } catch (err) { flash({ type: 'error', text: (err as Error).message }); }
      finally { setLoading(false); }
    })();
  }, [id]);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/crm/households/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setHousehold(data.household); flash({ type: 'success', text: 'Saved' });
    } catch (err) { flash({ type: 'error', text: (err as Error).message }); }
    finally { setSaving(false); }
  }

  const mname = (m: Member) => m.fullName || `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim() || m.email || 'Unnamed';
  const initials = (n: string) => n.split(' ').map((x) => x[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  const dirty = household && name.trim() !== household.name;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/households" className="p-2 rounded-lg hover:bg-secondary text-muted-foreground"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><Home className="w-6 h-6 text-brand" /> {loading ? 'Loading…' : household?.name}</h1>
        </div>
        {dirty && (
          <Button onClick={save} disabled={saving} className="bg-brand hover:bg-brand/90">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Save
          </Button>
        )}
      </div>

      {msg && (
        <div className={cn('mb-6 p-4 rounded-lg flex items-center gap-2',
          msg.type === 'success' ? 'bg-green-500/10 border border-green-500/30 text-green-500' : 'bg-red-500/10 border border-red-500/30 text-red-500')}>
          {msg.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}{msg.text}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading…</div>
      ) : !household ? (
        <div className="text-center py-16 text-muted-foreground">Household not found.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="bg-card/50 border-border lg:col-span-1">
            <CardHeader><CardTitle className="text-foreground">Household</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <label className="text-sm text-muted-foreground block">Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-secondary border-border" />
              <Badge variant="outline" className="capitalize text-xs">{household.source}</Badge>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border lg:col-span-2">
            <CardHeader><CardTitle className="text-foreground flex items-center gap-2"><Users className="w-5 h-5 text-brand" /> Members ({members.length})</CardTitle></CardHeader>
            <CardContent className="p-0">
              {members.length === 0 ? (
                <p className="text-sm text-muted-foreground p-6">No members. Assign clients to this household from a client's page.</p>
              ) : (
                <div className="divide-y divide-border">
                  {members.map((m) => (
                    <Link key={m.id} href={`/clients/${m.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-secondary/50 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-brand/20 text-brand flex items-center justify-center text-xs font-medium flex-shrink-0">{initials(mname(m))}</div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">{mname(m)}</p>
                          <p className="text-sm text-muted-foreground truncate">{m.email || '—'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {m.contactType && <Badge variant="outline" className="text-xs capitalize">{m.contactType}</Badge>}
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
