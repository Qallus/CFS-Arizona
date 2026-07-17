'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ShieldCheck,
  Percent,
  Clock,
  AlertTriangle,
  Upload,
  FileText,
  Check,
  X,
  Database,
  ExternalLink,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerHeader, DrawerTitle, DrawerDescription, DrawerBody, DrawerFooter } from '@/components/ui/drawer';
import {
  PageShell,
  PageHeader,
  StatTile,
  SectionCard,
  StatusPill,
  TableWrap,
  Th,
  Td,
  Tr,
  EmptyState,
} from '@/components/dashboard/page-parts';
import { cn } from '@/lib/utils';

interface DocType {
  id: string;
  key: string;
  name: string;
  description: string | null;
  category: string;
  required: boolean;
  tracksExpiry: boolean;
}
interface EmployeeDoc {
  id: string;
  profileId: string;
  docTypeId: string;
  fileName: string | null;
  fileUrl: string | null;
  status: 'uploaded' | 'verified' | 'rejected';
  expiresAt: string | null;
  uploadedAt: string | null;
}
interface Compliance {
  id: string;
  name: string;
  email: string;
  role: string | null;
  requiredTotal: number;
  verifiedCount: number;
  pendingCount: number;
  pct: number;
  complete: boolean;
  missing: string[];
}

const roleLabel = (r: string | null) => (r ? r.replace(/_/g, ' ') : '—');

function Progress({ value }: { value: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
      <div
        className={cn('h-full rounded-full transition-all', value === 100 ? 'bg-emerald-500' : value >= 50 ? 'bg-brand' : 'bg-amber-500')}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

export function EmployeeDocsClient() {
  const [employees, setEmployees] = useState<Compliance[]>([]);
  const [docTypes, setDocTypes] = useState<DocType[]>([]);
  const [stats, setStats] = useState({ total: 0, upToDate: 0, avgPct: 0, pendingVerification: 0 });
  const [canViewAll, setCanViewAll] = useState(false);
  const [canVerify, setCanVerify] = useState(false);
  const [me, setMe] = useState<string | null>(null);
  const [myDocs, setMyDocs] = useState<EmployeeDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [provisioned, setProvisioned] = useState(true);
  const [review, setReview] = useState<Compliance | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hr/compliance');
      const data = await res.json();
      setProvisioned(data.provisioned !== false);
      setEmployees(Array.isArray(data.employees) ? data.employees : []);
      setDocTypes(Array.isArray(data.docTypes) ? data.docTypes : []);
      setStats(data.stats ?? { total: 0, upToDate: 0, avgPct: 0, pendingVerification: 0 });
      setCanViewAll(Boolean(data.canViewAll));
      setCanVerify(Boolean(data.canVerify));
      setMe(data.me ?? null);
      if (data.me) {
        const dres = await fetch(`/api/hr/documents?profileId=${data.me}`);
        const ddata = await dres.json();
        setMyDocs(Array.isArray(ddata.documents) ? ddata.documents : []);
      }
    } catch {
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!loading && !provisioned) {
    return (
      <PageShell>
        <PageHeader eyebrow="Team" title="Employee Documents" description="Insurance, driving records, and agreements." />
        <EmptyState icon={Database} title="Database not provisioned yet" description="Apply the HR migrations to your Supabase to enable the document portal." />
      </PageShell>
    );
  }

  const behind = Math.max(0, stats.total - stats.upToDate);

  return (
    <PageShell>
      <PageHeader
        eyebrow="Team"
        title="Employee Documents"
        description={
          canViewAll
            ? 'Insurance, driving records, and agreements — upload your own and verify the team’s.'
            : 'Upload and keep your CFS records current.'
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile
          label="Fully up to date"
          value={`${stats.upToDate}/${stats.total}`}
          icon={ShieldCheck}
          tone="good"
          hint={stats.total ? `${Math.round((stats.upToDate / stats.total) * 100)}% of staff` : undefined}
        />
        <StatTile label="Avg. completion" value={`${stats.avgPct}%`} icon={Percent} tone="brand" />
        <StatTile label="Awaiting verification" value={stats.pendingVerification} icon={Clock} tone="warning" />
        <StatTile label="Not fully current" value={behind} icon={AlertTriangle} tone={behind > 0 ? 'critical' : 'default'} />
      </div>

      {/* My documents */}
      <div className="mb-4">
        <MyDocuments docTypes={docTypes} docs={myDocs} me={me} onChanged={load} />
      </div>

      {/* Team compliance */}
      {canViewAll && (
        <SectionCard
          title="Team compliance"
          description="Completion against the required checklist — click an employee to review."
          bodyClassName="p-0"
        >
          {loading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>
          ) : employees.length === 0 ? (
            <div className="p-5">
              <EmptyState icon={Users} title="No staff yet" description="Add team members in Settings → Roles & Permissions." />
            </div>
          ) : (
            <TableWrap>
              <thead>
                <tr>
                  <Th>Employee</Th>
                  <Th>Role</Th>
                  <Th className="w-56">Completion</Th>
                  <Th className="text-right">Verified</Th>
                  <Th className="text-right">Pending</Th>
                  <Th className="text-right">Status</Th>
                </tr>
              </thead>
              <tbody>
                {employees.map((e) => (
                  <Tr key={e.id} className="cursor-pointer">
                    <Td>
                      <button onClick={() => setReview(e)} className="flex items-center gap-3 text-left">
                        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold text-muted-foreground">
                          {e.name[0]?.toUpperCase()}
                        </span>
                        <span>
                          <span className="block font-medium text-foreground hover:underline">{e.name}</span>
                          <span className="block text-xs text-muted-foreground">{e.email}</span>
                        </span>
                      </button>
                    </Td>
                    <Td className="capitalize text-muted-foreground">{roleLabel(e.role)}</Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <Progress value={e.pct} />
                        <span className="w-10 shrink-0 text-right text-sm font-medium tabular-nums text-foreground">{e.pct}%</span>
                      </div>
                    </Td>
                    <Td className="text-right tabular-nums text-muted-foreground">
                      {e.verifiedCount}/{e.requiredTotal}
                    </Td>
                    <Td className="text-right">
                      {e.pendingCount > 0 ? <StatusPill tone="warning">{e.pendingCount}</StatusPill> : <span className="text-muted-foreground">—</span>}
                    </Td>
                    <Td className="text-right">
                      {e.complete ? (
                        <StatusPill tone="good">Up to date</StatusPill>
                      ) : (
                        <StatusPill tone={e.pct === 0 ? 'critical' : 'warning'}>{e.missing.length} missing</StatusPill>
                      )}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </TableWrap>
          )}
        </SectionCard>
      )}

      <ReviewDrawer
        employee={review}
        docTypes={docTypes}
        canVerify={canVerify}
        onOpenChange={(v) => !v && setReview(null)}
        onChanged={load}
      />
    </PageShell>
  );
}

/* ------------------------- My documents checklist ------------------------ */
function MyDocuments({
  docTypes,
  docs,
  me,
  onChanged,
}: {
  docTypes: DocType[];
  docs: EmployeeDoc[];
  me: string | null;
  onChanged: () => void;
}) {
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});

  if (!me) {
    return (
      <SectionCard title="My documents">
        <EmptyState icon={FileText} title="No staff profile" description="Your account isn't linked to a staff profile yet, so uploads are unavailable." />
      </SectionCard>
    );
  }

  async function upload(docTypeId: string, file: File) {
    setError('');
    setUploading(docTypeId);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('docTypeId', docTypeId);
      const res = await fetch('/api/hr/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed.');
      onChanged();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(null);
    }
  }

  const mine = (id: string) => docs.find((d) => d.docTypeId === id);

  return (
    <SectionCard title="My documents" description="Upload your records — PDF, JPG, PNG or WebP (max 10MB)." bodyClassName="p-0">
      {error && <p className="mx-5 mt-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      <ul className="divide-y divide-border">
        {docTypes.map((t) => {
          const doc = mine(t.id);
          return (
            <li key={t.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
              <span
                className={cn(
                  'grid size-8 shrink-0 place-items-center rounded-full',
                  doc?.status === 'verified'
                    ? 'bg-emerald-500/15 text-emerald-500'
                    : doc?.status === 'uploaded'
                      ? 'bg-amber-500/15 text-amber-500'
                      : 'bg-secondary text-muted-foreground',
                )}
              >
                {doc?.status === 'verified' ? <Check className="size-4" /> : <FileText className="size-4" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 font-medium text-foreground">
                  {t.name}
                  {!t.required && <span className="text-xs font-normal text-muted-foreground">(optional)</span>}
                </p>
                {t.description && <p className="truncate text-xs text-muted-foreground">{t.description}</p>}
              </div>

              {doc ? (
                <StatusPill tone={doc.status === 'verified' ? 'good' : doc.status === 'rejected' ? 'critical' : 'warning'}>
                  {doc.status === 'uploaded' ? 'Awaiting verification' : doc.status}
                </StatusPill>
              ) : (
                <StatusPill tone={t.required ? 'critical' : 'neutral'}>{t.required ? 'Missing' : 'Not provided'}</StatusPill>
              )}

              {doc?.fileUrl && (
                <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground" title="View file">
                  <ExternalLink className="size-4" />
                </a>
              )}

              <input
                ref={(el) => { inputs.current[t.id] = el; }}
                type="file"
                accept="application/pdf,image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) upload(t.id, f);
                  e.target.value = '';
                }}
              />
              <Button size="xs" variant="outline" disabled={uploading === t.id} onClick={() => inputs.current[t.id]?.click()}>
                <Upload className="size-3.5" /> {uploading === t.id ? 'Uploading…' : doc ? 'Replace' : 'Upload'}
              </Button>
            </li>
          );
        })}
      </ul>
    </SectionCard>
  );
}

/* --------------------------- Admin review drawer -------------------------- */
function ReviewDrawer({
  employee,
  docTypes,
  canVerify,
  onOpenChange,
  onChanged,
}: {
  employee: Compliance | null;
  docTypes: DocType[];
  canVerify: boolean;
  onOpenChange: (v: boolean) => void;
  onChanged: () => void;
}) {
  const [docs, setDocs] = useState<EmployeeDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!employee) return;
    setLoading(true);
    fetch(`/api/hr/documents?profileId=${employee.id}`)
      .then((r) => r.json())
      .then((d) => setDocs(Array.isArray(d.documents) ? d.documents : []))
      .catch(() => setDocs([]))
      .finally(() => setLoading(false));
  }, [employee]);

  async function setStatus(id: string, status: 'verified' | 'rejected') {
    setBusy(id);
    try {
      await fetch(`/api/hr/documents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const r = await fetch(`/api/hr/documents?profileId=${employee!.id}`);
      const d = await r.json();
      setDocs(Array.isArray(d.documents) ? d.documents : []);
      onChanged();
    } finally {
      setBusy(null);
    }
  }

  return (
    <Drawer open={Boolean(employee)} onOpenChange={onOpenChange}>
      {employee && (
        <>
          <DrawerHeader>
            <DrawerTitle>{employee.name}</DrawerTitle>
            <DrawerDescription>
              {employee.verifiedCount} of {employee.requiredTotal} required documents verified · {employee.pct}%
            </DrawerDescription>
          </DrawerHeader>
          <DrawerBody className="space-y-2">
            {loading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
            ) : (
              docTypes.map((t) => {
                const doc = docs.find((d) => d.docTypeId === t.id);
                return (
                  <div key={t.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-center gap-2">
                      <p className="flex-1 font-medium text-foreground">
                        {t.name}
                        {!t.required && <span className="ml-2 text-xs font-normal text-muted-foreground">(optional)</span>}
                      </p>
                      {doc ? (
                        <StatusPill tone={doc.status === 'verified' ? 'good' : doc.status === 'rejected' ? 'critical' : 'warning'}>
                          {doc.status === 'uploaded' ? 'Pending' : doc.status}
                        </StatusPill>
                      ) : (
                        <StatusPill tone={t.required ? 'critical' : 'neutral'}>{t.required ? 'Missing' : '—'}</StatusPill>
                      )}
                    </div>

                    {doc && (
                      <div className="mt-2 flex items-center gap-2">
                        {doc.fileUrl ? (
                          <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs text-brand hover:underline">
                            <ExternalLink className="size-3.5" /> {doc.fileName || 'View file'}
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">{doc.fileName || 'No file on record'}</span>
                        )}
                        {canVerify && (
                          <div className="ml-auto flex gap-1.5">
                            {doc.status !== 'verified' && (
                              <Button size="xs" variant="outline" disabled={busy === doc.id} onClick={() => setStatus(doc.id, 'verified')}>
                                <Check className="size-3.5" /> Verify
                              </Button>
                            )}
                            {doc.status !== 'rejected' && (
                              <Button
                                size="xs"
                                variant="ghost"
                                className="text-destructive hover:text-destructive"
                                disabled={busy === doc.id}
                                onClick={() => setStatus(doc.id, 'rejected')}
                              >
                                <X className="size-3.5" /> Reject
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </DrawerBody>
          <DrawerFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          </DrawerFooter>
        </>
      )}
    </Drawer>
  );
}
