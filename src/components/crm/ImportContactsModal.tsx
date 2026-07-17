'use client';

import { useRef, useState } from 'react';
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

// Target CRM fields we can import into.
const TARGETS: { key: string; label: string; synonyms: string[] }[] = [
  { key: 'firstName', label: 'First name', synonyms: ['first name', 'firstname', 'first', 'fname', 'given name'] },
  { key: 'lastName', label: 'Last name', synonyms: ['last name', 'lastname', 'last', 'lname', 'surname', 'family name'] },
  { key: 'email', label: 'Email', synonyms: ['email', 'e-mail', 'email address'] },
  { key: 'mobilePhone', label: 'Mobile phone', synonyms: ['mobile', 'cell', 'mobile phone', 'cell phone'] },
  { key: 'phone', label: 'Other phone', synonyms: ['phone', 'home phone', 'telephone', 'other phone'] },
  { key: 'matterType', label: 'Matter type', synonyms: ['matter', 'matter type', 'type', 'service'] },
  { key: 'referralSource', label: 'Referral source', synonyms: ['referral', 'referral source', 'source', 'referred by'] },
  { key: 'city', label: 'City', synonyms: ['city', 'town'] },
  { key: 'state', label: 'State', synonyms: ['state', 'province'] },
  { key: 'zipCode', label: 'ZIP', synonyms: ['zip', 'zip code', 'postal', 'postal code'] },
];

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();

type Row = Record<string, unknown>;

export function ImportContactsModal({
  open,
  onOpenChange,
  onImported,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onImported: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ created: number; failed: number } | null>(null);

  function reset() {
    setFileName('');
    setHeaders([]);
    setRows([]);
    setMapping({});
    setError('');
    setResult(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  function autoMap(hdrs: string[]): Record<string, string> {
    const map: Record<string, string> = {};
    for (const t of TARGETS) {
      const hit = hdrs.find((h) => {
        const n = norm(h);
        return t.synonyms.some((s) => n === s || n.includes(s));
      });
      if (hit) map[t.key] = hit;
    }
    return map;
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setResult(null);
    setBusy(true);
    try {
      const buf = await file.arrayBuffer();
      const XLSX = await import('xlsx');
      const wb = XLSX.read(buf, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Row>(ws, { defval: '' });
      if (json.length === 0) {
        setError('That file has no data rows.');
        setBusy(false);
        return;
      }
      const hdrs = Object.keys(json[0]);
      setFileName(file.name);
      setHeaders(hdrs);
      setRows(json);
      setMapping(autoMap(hdrs));
    } catch {
      setError('Could not read that file. Use a .csv or .xlsx export.');
    } finally {
      setBusy(false);
    }
  }

  async function runImport() {
    setBusy(true);
    setError('');
    try {
      const mapped = rows.map((r) => {
        const out: Record<string, string> = {};
        for (const t of TARGETS) {
          const col = mapping[t.key];
          if (col) out[t.key] = String(r[col] ?? '').trim();
        }
        return out;
      });
      const res = await fetch('/api/crm/contacts/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: mapped }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed.');
      setResult({ created: data.created ?? 0, failed: data.failed ?? 0 });
      onImported();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function close() {
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(true) : close())}>
      <DialogContent className="max-w-2xl bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="text-foreground">Import contacts</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Upload a CSV or Excel file. Each row becomes a contact and enters the funnel at Awareness.
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-4">
          {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

          {result ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <CheckCircle2 className="size-10 text-emerald-500" />
              <div>
                <p className="text-lg font-semibold text-foreground">Imported {result.created} contact{result.created === 1 ? '' : 's'}</p>
                {result.failed > 0 && (
                  <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="size-4" /> {result.failed} row{result.failed === 1 ? '' : 's'} skipped
                  </p>
                )}
              </div>
            </div>
          ) : headers.length === 0 ? (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex w-full flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-secondary/30 px-6 py-12 text-center transition-colors hover:border-brand/50"
            >
              <UploadCloud className="size-8 text-muted-foreground" />
              <span className="font-medium text-foreground">Choose a CSV or Excel file</span>
              <span className="text-sm text-muted-foreground">.csv, .xlsx, or .xls</span>
            </button>
          ) : (
            <>
              <div className="flex items-center gap-2 rounded-md border border-border bg-secondary/30 px-3 py-2 text-sm">
                <FileSpreadsheet className="size-4 text-brand" />
                <span className="font-medium text-foreground">{fileName}</span>
                <span className="text-muted-foreground">· {rows.length} rows</span>
                <button type="button" onClick={reset} className="ml-auto text-muted-foreground hover:text-foreground">
                  Change
                </button>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-foreground">Match your columns</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {TARGETS.map((t) => (
                    <div key={t.key} className="flex items-center gap-2">
                      <Label className="w-28 shrink-0 text-xs text-muted-foreground">{t.label}</Label>
                      <select
                        value={mapping[t.key] ?? ''}
                        onChange={(e) => setMapping((m) => ({ ...m, [t.key]: e.target.value }))}
                        className="h-8 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      >
                        <option value="">— skip —</option>
                        {headers.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" onChange={onFile} className="hidden" />
        </DialogBody>
        <DialogFooter>
          {result ? (
            <Button onClick={close}>Done</Button>
          ) : (
            <>
              <Button type="button" variant="ghost" onClick={close}>Cancel</Button>
              <Button onClick={runImport} disabled={busy || headers.length === 0}>
                {busy ? 'Importing…' : `Import ${rows.length || ''} contacts`}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
