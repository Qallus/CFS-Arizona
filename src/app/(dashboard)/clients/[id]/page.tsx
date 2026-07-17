'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, Save, Loader2, Check, AlertCircle, StickyNote, Calendar, Home, Building2, UserCog,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/lib/rbac';

interface Contact {
  id: string; firstName: string | null; lastName: string | null; fullName: string | null;
  email: string | null; phone: string | null; mobilePhone: string | null; companyName: string | null;
  contactType: string | null; status: string | null; city: string | null; state: string | null; zipCode: string | null;
  householdId: string | null; assignedStaffId: string | null;
  servicingAdvisor: string | null; assignedPlanner: string | null; source: string;
}
interface HouseholdOpt { id: string; name: string; }
interface StaffOpt { id: string; name: string; roleLabel: string; }
interface Note { id: string; body: string | null; category: string | null; author: string | null; createdAt: string | null; }
interface Appt { id: string; title: string | null; startAt: string | null; status: string | null; location: string | null; }
type Msg = { type: 'success' | 'error'; text: string } | null;
type Field = 'firstName' | 'lastName' | 'email' | 'phone' | 'mobilePhone' | 'companyName' | 'status' | 'city' | 'state' | 'zipCode';

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { can } = useAuth();
  const canAssign = can(PERMISSIONS.CLIENTS_ASSIGN_ADVISORS);
  const [contact, setContact] = useState<Contact | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [appts, setAppts] = useState<Appt[]>([]);
  const [households, setHouseholds] = useState<HouseholdOpt[]>([]);
  const [staff, setStaff] = useState<StaffOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);

  function flash(m: Msg) { setMsg(m); if (m) setTimeout(() => setMsg(null), 3500); }

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/crm/contacts/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load');
        setContact(data.contact); setNotes(data.notes ?? []); setAppts(data.appointments ?? []);
      } catch (err) { flash({ type: 'error', text: (err as Error).message }); }
      finally { setLoading(false); }
    })();
  }, [id]);

  // Assignment options (households always; staff only if allowed to assign).
  useEffect(() => {
    (async () => {
      try {
        const hr = await fetch('/api/crm/households?limit=200');
        const hd = await hr.json();
        if (hr.ok) setHouseholds((hd.households ?? []).map((h: HouseholdOpt) => ({ id: h.id, name: h.name })));
      } catch { /* ignore */ }
      if (canAssign) {
        try {
          const sr = await fetch('/api/crm/assignable');
          const sd = await sr.json();
          if (sr.ok) setStaff(sd.staff ?? []);
        } catch { /* ignore */ }
      }
    })();
  }, [canAssign]);

  async function patchAssignment(partial: Record<string, unknown>, successText: string) {
    setAssigning(true);
    try {
      const res = await fetch(`/api/crm/contacts/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(partial),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');
      setContact(data.contact); flash({ type: 'success', text: successText });
    } catch (err) { flash({ type: 'error', text: (err as Error).message }); }
    finally { setAssigning(false); }
  }

  function change(f: Field, v: string) { setContact((c) => (c ? { ...c, [f]: v } : c)); setDirty(true); }

  async function save() {
    if (!contact) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/crm/contacts/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: contact.firstName ?? '', lastName: contact.lastName ?? '', email: contact.email ?? '',
          phone: contact.phone ?? '', mobilePhone: contact.mobilePhone ?? '', companyName: contact.companyName ?? '',
          status: contact.status ?? '', city: contact.city ?? '', state: contact.state ?? '', zipCode: contact.zipCode ?? '',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setContact(data.contact); setDirty(false); flash({ type: 'success', text: 'Saved' });
    } catch (err) { flash({ type: 'error', text: (err as Error).message }); }
    finally { setSaving(false); }
  }

  const name = contact ? (contact.fullName || `${contact.firstName ?? ''} ${contact.lastName ?? ''}`.trim() || contact.companyName || 'Unnamed') : '';

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/clients" className="p-2 rounded-lg hover:bg-secondary text-muted-foreground"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{loading ? 'Loading…' : name}</h1>
            {contact && (
              <div className="flex items-center gap-2 mt-1">
                {contact.contactType && <Badge variant="outline" className="capitalize text-xs">{contact.contactType}</Badge>}
                <Badge variant="outline" className="text-xs capitalize">{contact.source}</Badge>
              </div>
            )}
          </div>
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
      ) : !contact ? (
        <div className="text-center py-16 text-muted-foreground">Client not found.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="bg-card/50 border-border lg:col-span-2">
            <CardHeader><CardTitle className="text-foreground">Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <F label="First name"><Input value={contact.firstName ?? ''} onChange={(e) => change('firstName', e.target.value)} className="bg-secondary border-border" /></F>
                <F label="Last name"><Input value={contact.lastName ?? ''} onChange={(e) => change('lastName', e.target.value)} className="bg-secondary border-border" /></F>
                <F label="Email"><Input value={contact.email ?? ''} onChange={(e) => change('email', e.target.value)} className="bg-secondary border-border" /></F>
                <F label="Phone"><Input value={contact.phone ?? ''} onChange={(e) => change('phone', e.target.value)} className="bg-secondary border-border" /></F>
                <F label="Mobile"><Input value={contact.mobilePhone ?? ''} onChange={(e) => change('mobilePhone', e.target.value)} className="bg-secondary border-border" /></F>
                <F label="Company"><Input value={contact.companyName ?? ''} onChange={(e) => change('companyName', e.target.value)} className="bg-secondary border-border" /></F>
                <F label="Status"><Input value={contact.status ?? ''} onChange={(e) => change('status', e.target.value)} className="bg-secondary border-border" /></F>
                <F label="City"><Input value={contact.city ?? ''} onChange={(e) => change('city', e.target.value)} className="bg-secondary border-border" /></F>
                <F label="State"><Input value={contact.state ?? ''} onChange={(e) => change('state', e.target.value)} className="bg-secondary border-border" /></F>
                <F label="Zip"><Input value={contact.zipCode ?? ''} onChange={(e) => change('zipCode', e.target.value)} className="bg-secondary border-border" /></F>
              </div>
              <div className="flex flex-wrap gap-4 pt-2 text-sm text-muted-foreground">
                {contact.householdId && (
                  <Link href={`/households/${contact.householdId}`} className="flex items-center gap-1 text-brand hover:underline">
                    <Home className="w-4 h-4" /> View household
                  </Link>
                )}
                {contact.servicingAdvisor && <span className="flex items-center gap-1"><Building2 className="w-4 h-4" /> Advisor: {contact.servicingAdvisor}</span>}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="bg-card/50 border-border">
              <CardHeader><CardTitle className="text-foreground flex items-center gap-2 text-base"><UserCog className="w-4 h-4 text-brand" /> Assignment</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm text-muted-foreground mb-1 block">Household</Label>
                  <select
                    value={contact.householdId ?? ''}
                    disabled={assigning}
                    onChange={(e) => patchAssignment({ householdId: e.target.value || null }, 'Household updated')}
                    className="w-full h-10 px-3 bg-secondary border border-border rounded-md text-foreground disabled:opacity-50"
                  >
                    <option value="">— None —</option>
                    {households.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
                  </select>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground mb-1 block">Assigned advisor</Label>
                  {canAssign ? (
                    <select
                      value={contact.assignedStaffId ?? ''}
                      disabled={assigning}
                      onChange={(e) => patchAssignment({ assignedStaffId: e.target.value || null }, 'Advisor updated')}
                      className="w-full h-10 px-3 bg-secondary border border-border rounded-md text-foreground disabled:opacity-50"
                    >
                      <option value="">— Unassigned —</option>
                      {staff.map((s) => <option key={s.id} value={s.id}>{s.name} · {s.roleLabel}</option>)}
                    </select>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {contact.servicingAdvisor || contact.assignedPlanner || 'Not assigned'}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border">
              <CardHeader><CardTitle className="text-foreground flex items-center gap-2 text-base"><StickyNote className="w-4 h-4 text-brand" /> Notes</CardTitle></CardHeader>
              <CardContent>
                {notes.length === 0 ? <p className="text-sm text-muted-foreground">No notes.</p> : (
                  <div className="space-y-3">
                    {notes.map((n) => (
                      <div key={n.id} className="text-sm border-l-2 border-border pl-3">
                        <p className="text-foreground whitespace-pre-wrap">{n.body || '—'}</p>
                        <p className="text-xs text-muted-foreground mt-1">{[n.author, n.createdAt ? new Date(n.createdAt).toLocaleDateString() : null].filter(Boolean).join(' · ')}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border">
              <CardHeader><CardTitle className="text-foreground flex items-center gap-2 text-base"><Calendar className="w-4 h-4 text-brand" /> Appointments</CardTitle></CardHeader>
              <CardContent>
                {appts.length === 0 ? <p className="text-sm text-muted-foreground">No appointments.</p> : (
                  <div className="space-y-3">
                    {appts.map((a) => (
                      <div key={a.id} className="text-sm border-l-2 border-border pl-3">
                        <p className="text-foreground">{a.title || 'Appointment'}</p>
                        <p className="text-xs text-muted-foreground mt-1">{[a.startAt ? new Date(a.startAt).toLocaleString() : null, a.status].filter(Boolean).join(' · ')}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (<div><Label className="text-sm text-muted-foreground mb-1 block">{label}</Label>{children}</div>);
}
