/**
 * Load the CFS PNFF Clients sheet as CONTACTS, and reconcile the 2025
 * referrals against it.
 *
 *   node scripts/import-pnff-clients.mjs            # dry run (default)
 *   node scripts/import-pnff-clients.mjs --apply    # write
 *
 * Dry run is the DEFAULT here, unlike the referrals importer: this one
 * deletes rows, so the safe mode is the one you get by forgetting a flag.
 *
 * Three steps:
 *   1. Delete the seeded demo contacts (sample-data migration). Real
 *      contacts — anything not in that known demo set — are kept.
 *   2. Insert the PNFF rows as contacts. Idempotent on lower(full name)
 *      + email, so re-running updates nothing and duplicates nothing.
 *   3. Match the referrals against the new list. A referral that appears
 *      in it is marked converted and linked to its contact; one that does
 *      not is left exactly as it is, still a referral.
 */
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const FILE = 'Docs/contacts/CFS PNFF Clients - 2025.csv';
const apply = process.argv.includes('--apply');

/** The 8 rows created by 20260715000002_crm_sample_data.sql. */
const DEMO_CONTACT_NAMES = [
  'margaret ellison',
  'the hartley trust',
  'dorothy kwan',
  'frank delacroix',
  'nguyen family',
  'paul rutherford',
  'albert simmons',
  'rosa & manuel ibarra',
];

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
const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
);

/* ----------------------------- CSV ----------------------------- */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false;
      } else field += c;
      continue;
    }
    if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

/** Blank, and the sheet's redaction marker, both mean "no value". */
function clean(v) {
  const t = (v ?? '').trim();
  if (!t || /^\*+$/.test(t)) return null;
  return t;
}

/** M/D/YY or M/D/YYYY → YYYY-MM-DD, built locally so no timezone shifts it. */
function toIsoDate(value) {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec((value || '').trim());
  if (!m) return null;
  let [, mm, dd, yy] = m;
  let year = Number(yy);
  // Two-digit years on this sheet are 2000s: it is a 2022-2025 caseload.
  if (year < 100) year += 2000;
  return `${year}-${String(Number(mm)).padStart(2, '0')}-${String(Number(dd)).padStart(2, '0')}`;
}

/** Comparable name key: lowercase, punctuation-free, sorted tokens. */
function nameKey(...parts) {
  const raw = parts.filter(Boolean).join(' ').toLowerCase();
  const tokens = raw
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t && !['the', 'and', 'obo', 'family', 'trust', 'estate', 'of'].includes(t));
  return [...new Set(tokens)].sort().join(' ');
}

/* ---------------------------- parse ---------------------------- */
const rows = parseCsv(readFileSync(FILE, 'utf8').replace(/^﻿/, '')).filter((r) =>
  r.some((c) => c.trim() !== ''),
);
const header = rows.shift().map((h) => h.trim());
const at = (r, name) => {
  const i = header.indexOf(name);
  if (i < 0) throw new Error(`Missing column "${name}". Found: ${header.join(' | ')}`);
  return r[i];
};

const contacts = [];
for (const r of rows) {
  const last = clean(at(r, 'Client 1 Last Name'));
  const first = clean(at(r, 'Client 1 First Name'));
  if (!last && !first) continue;

  // Some rows put the whole name in one cell: "Jacobson, Cliff & Betty".
  const fullName = last && first ? `${first} ${last}` : first || last;

  contacts.push({
    source: 'pnff_2025',
    first_name: first,
    last_name: last,
    full_name: fullName,
    secondary_first_name: clean(at(r, 'Client 2 First Name')),
    email: clean(at(r, 'Email'))?.toLowerCase() ?? null,
    secondary_email: clean(at(r, 'Email 2'))?.toLowerCase() ?? null,
    mobile_phone: clean(at(r, 'Phone')),
    secondary_phone: clean(at(r, 'Phone 2')),
    status: clean(at(r, 'Status')),
    cc_fee_due: clean(at(r, 'CC Fee Due')),
    staff_contact: clean(at(r, 'Staff Contact')),
    last_contact_type: clean(at(r, 'Contact Type')),
    contact_date: toIsoDate(at(r, 'Contact Date')),
    referral_date: toIsoDate(at(r, 'Referral Date')),
    send_follow_up_email_at: toIsoDate(at(r, 'Send Follow Up Email')),
    email_follow_up_at: toIsoDate(at(r, 'Email Follow Up')),
    final_closure_notice_at: toIsoDate(at(r, 'Final Email/Closure Notice')),
    notes: clean(at(r, 'Notes')),
    status_notes: clean(at(r, 'Status/Notes')),
  });
}

console.log(`Parsed ${contacts.length} PNFF clients from ${FILE}`);
console.log('Sample:', JSON.stringify(contacts[0], null, 2));

/* ------------------------- current state ------------------------ */
const { data: existingContacts, error: cErr } = await supabase
  .from('sig_contacts')
  .select('id, full_name, email, source');
if (cErr) {
  console.error('Could not read contacts:', cErr.message);
  process.exit(1);
}
const { data: referrals, error: rErr } = await supabase
  .from('sig_referrals')
  .select('id, client_name, primary_first_name, primary_last_name, contact_id, status');
if (rErr) {
  console.error('Could not read referrals:', rErr.message);
  process.exit(1);
}

const demo = existingContacts.filter((c) =>
  DEMO_CONTACT_NAMES.includes((c.full_name || '').trim().toLowerCase()),
);
const keptContacts = existingContacts.filter((c) => !demo.includes(c));

console.log(`\nContacts today: ${existingContacts.length}`);
console.log(`  demo rows to delete: ${demo.length} (${demo.map((d) => d.full_name).join(', ')})`);
console.log(`  kept: ${keptContacts.length} (${keptContacts.map((d) => d.full_name).join(', ')})`);

// Do not re-insert anyone already present under the same name.
const presentKeys = new Set(keptContacts.map((c) => nameKey(c.full_name)));
const fresh = contacts.filter((c) => !presentKeys.has(nameKey(c.full_name)));
console.log(`\nPNFF rows to insert: ${fresh.length} (${contacts.length - fresh.length} already present)`);

// Referral reconciliation.
const pnffKeys = new Map();
for (const c of contacts) {
  pnffKeys.set(nameKey(c.full_name), c);
  if (c.last_name && c.first_name) pnffKeys.set(nameKey(c.first_name, c.last_name), c);
}
const matched = [];
const unmatched = [];
for (const ref of referrals) {
  const key =
    nameKey(ref.primary_first_name, ref.primary_last_name) || nameKey(ref.client_name);
  const alt = nameKey(ref.client_name);
  if ((key && pnffKeys.has(key)) || (alt && pnffKeys.has(alt))) matched.push(ref);
  else unmatched.push(ref);
}
console.log(`\nReferrals: ${referrals.length}`);
console.log(`  in the PNFF list  -> mark converted + link: ${matched.length}`);
console.log(`  not in the list   -> left as referrals:     ${unmatched.length}`);
console.log('  sample matches:', matched.slice(0, 5).map((m) => m.client_name));

if (!apply) {
  console.log('\nDRY RUN — nothing written. Re-run with --apply to commit.');
  process.exit(0);
}

/* ---------------------------- apply ---------------------------- */
if (demo.length) {
  const { error } = await supabase.from('sig_contacts').delete().in('id', demo.map((d) => d.id));
  if (error) { console.error('Demo delete failed:', error.message); process.exit(1); }
  console.log(`\nDeleted ${demo.length} demo contacts.`);
}

let inserted = 0;
const BATCH = 100;
const insertedRows = [];
for (let i = 0; i < fresh.length; i += BATCH) {
  const batch = fresh.slice(i, i + BATCH);
  const { data, error } = await supabase.from('sig_contacts').insert(batch).select('id, full_name');
  if (error) {
    console.error(`Batch ${i / BATCH + 1} failed:`, error.message);
    console.error('First row:', JSON.stringify(batch[0], null, 2));
    process.exit(1);
  }
  insertedRows.push(...data);
  inserted += batch.length;
  console.log(`  inserted ${inserted}/${fresh.length}`);
}

// Link matched referrals to the contact that now represents them.
const contactByKey = new Map(insertedRows.map((c) => [nameKey(c.full_name), c.id]));
let linked = 0;
for (const ref of matched) {
  const key = nameKey(ref.primary_first_name, ref.primary_last_name) || nameKey(ref.client_name);
  const contactId = contactByKey.get(key) ?? contactByKey.get(nameKey(ref.client_name));
  const { error } = await supabase
    .from('sig_referrals')
    .update({ status: 'converted', contact_id: contactId ?? null })
    .eq('id', ref.id);
  if (!error) linked++;
}
console.log(`\nMarked ${linked} referrals converted (${unmatched.length} left as referrals).`);

const { count } = await supabase.from('sig_contacts').select('id', { count: 'exact', head: true });
console.log(`Done. sig_contacts now holds ${count} rows.`);
