/**
 * Import the CFS 2025 referrals sheet into sig_referrals.
 *
 *   node scripts/import-referrals.mjs [--dry-run] [--file path]
 *
 * Idempotent: keyed on (client_name, referral_date), so re-running updates
 * rather than duplicating. That matters because a partial failure halfway
 * through 426 rows should be fixable by running it again.
 *
 * Status handling: the sheet uses 20 different phrasings for what is really
 * six outcomes. The normalized value drives the board; the original string is
 * kept verbatim in status_detail, because "Refd to A. Lambson for acctg" is
 * information that a bucket label throws away.
 */
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const DEFAULT_FILE = 'Docs/contacts/CFS - 2025 REFERRALS - RECEIVED.csv';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const fileArg = args.indexOf('--file');
const file = fileArg >= 0 ? args[fileArg + 1] : DEFAULT_FILE;

/* ----------------------------- env ----------------------------- */
function readEnvLocal() {
  const out = {};
  try {
    for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
      const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
      if (m) out[m[1]] = m[2];
    }
  } catch {
    /* fall back to the real environment */
  }
  return out;
}
const env = { ...readEnvLocal(), ...process.env };
const url = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}
const supabase = createClient(url, key);

/* ----------------------------- CSV ----------------------------- */
/** Minimal RFC-4180 parser: quoted fields, embedded commas, doubled quotes. */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
      continue;
    }
    if (c === '"') inQuotes = true;
    else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (c !== '\r') field += c;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/* --------------------------- mapping --------------------------- */
/** M/D/YYYY → YYYY-MM-DD, built locally so no timezone can shift the day. */
function toIsoDate(value) {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec((value || '').trim());
  if (!m) return null;
  const [, mm, dd, yyyy] = m;
  return `${yyyy}-${String(Number(mm)).padStart(2, '0')}-${String(Number(dd)).padStart(2, '0')}`;
}

/**
 * The sheet's wording → a board column.
 *
 * Precedence is deliberate and was corrected against the real values:
 *  - "pending" first, so "Pending CFS Decline" is pending a decision rather
 *    than already declined — it has not been declined yet.
 *  - "declin" next, so "Declined; Referred to G. Gloria" records the outcome
 *    (declined) rather than the courtesy onward referral.
 *  - "referred"/"refd"/"advised" after that. Matching the word alone rather
 *    than "referred to" is what catches the lone "Referred Out", which an
 *    earlier version silently dropped into Awaiting.
 */
function normalizeStatus(raw) {
  const s = (raw || '').trim().toLowerCase();
  if (!s || s === 'awaiting status') return 'awaiting';
  if (s.includes('pending')) return 'pending_decision';
  if (s.includes('declin')) return 'declined';
  if (s.startsWith('refd') || s.startsWith('referred') || s.startsWith('advised')) {
    return 'referred_out';
  }
  if (s.includes('accept')) return 'accepted';
  if (s.includes('nominat')) return 'nominated';
  return 'awaiting';
}

const clean = (v) => {
  const t = (v ?? '').trim();
  return t === '' ? null : t;
};

/* ---------------------------- import --------------------------- */
const text = readFileSync(file, 'utf8').replace(/^﻿/, '');
const rows = parseCsv(text).filter((r) => r.some((c) => c.trim() !== ''));
const header = rows.shift().map((h) => h.trim());

const col = (name) => {
  const i = header.indexOf(name);
  if (i < 0) throw new Error(`CSV is missing the "${name}" column. Found: ${header.join(' | ')}`);
  return i;
};

const IDX = {
  clientName: col('Client Name'),
  pFirst: col('Primary First Name'),
  pLast: col('Primary Last Name'),
  sFirst: col('Secondary First Name'),
  sLast: col('Secondary Last Name'),
  pEmail: col('Primary Email'),
  sEmail: col('Secondary Email'),
  pPhone: col('Primary Phone'),
  sPhone: col('Secondary Phone'),
  date: col('Referral Date'),
  referredBy: col('Referred By'),
  type: col('Referral Type'),
  appt: col('Notes / Appointment / Focal'),
  attorney: col('Attorney (as applicable)'),
  status: col('Status'),
  notes: col('Notes'),
};

const records = [];
const skipped = [];
const statusCounts = {};

for (const [n, r] of rows.entries()) {
  const clientName = clean(r[IDX.clientName]);
  if (!clientName) {
    skipped.push({ line: n + 2, reason: 'no client name' });
    continue;
  }
  const rawStatus = clean(r[IDX.status]);
  const status = normalizeStatus(rawStatus);
  statusCounts[status] = (statusCounts[status] ?? 0) + 1;

  records.push({
    client_name: clientName,
    primary_first_name: clean(r[IDX.pFirst]),
    primary_last_name: clean(r[IDX.pLast]),
    secondary_first_name: clean(r[IDX.sFirst]),
    secondary_last_name: clean(r[IDX.sLast]),
    primary_email: clean(r[IDX.pEmail]),
    secondary_email: clean(r[IDX.sEmail]),
    primary_phone: clean(r[IDX.pPhone]),
    secondary_phone: clean(r[IDX.sPhone]),
    referral_date: toIsoDate(r[IDX.date]),
    referred_by: clean(r[IDX.referredBy]),
    referral_type: clean(r[IDX.type]),
    appointment_notes: clean(r[IDX.appt]),
    attorney: clean(r[IDX.attorney]),
    status,
    status_detail: rawStatus,
    notes: clean(r[IDX.notes]),
  });
}

console.log(`Parsed ${records.length} referrals from ${file}`);
if (skipped.length) console.log(`Skipped ${skipped.length}:`, skipped.slice(0, 5));
console.log('Status distribution:', statusCounts);
console.log('Sample:', JSON.stringify(records[0], null, 2));

if (dryRun) {
  console.log('\n--dry-run: nothing written.');
  process.exit(0);
}

/* Re-runnable: skip anything already present with the same name + date. */
const { data: existing, error: readErr } = await supabase
  .from('sig_referrals')
  .select('client_name, referral_date');
if (readErr) {
  console.error('Could not read existing referrals:', readErr.message);
  process.exit(1);
}
const seen = new Set(
  (existing ?? []).map((e) => `${e.client_name}||${e.referral_date ?? ''}`.toLowerCase()),
);
const fresh = records.filter(
  (r) => !seen.has(`${r.client_name}||${r.referral_date ?? ''}`.toLowerCase()),
);
console.log(`\n${existing?.length ?? 0} already present; inserting ${fresh.length}.`);

let inserted = 0;
const BATCH = 100;
for (let i = 0; i < fresh.length; i += BATCH) {
  const batch = fresh.slice(i, i + BATCH);
  const { error } = await supabase.from('sig_referrals').insert(batch);
  if (error) {
    console.error(`Batch ${i / BATCH + 1} failed:`, error.message);
    console.error('First row of failed batch:', JSON.stringify(batch[0], null, 2));
    process.exit(1);
  }
  inserted += batch.length;
  console.log(`  inserted ${inserted}/${fresh.length}`);
}

const { count } = await supabase
  .from('sig_referrals')
  .select('id', { count: 'exact', head: true });
console.log(`\nDone. sig_referrals now holds ${count} rows.`);
