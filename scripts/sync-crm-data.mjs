/**
 * Bring sig_contacts in line with the two CFS sheets.
 *
 *   node scripts/sync-crm-data.mjs            # dry run (default)
 *   node scripts/sync-crm-data.mjs --apply    # write
 *
 * Steps, each idempotent so the script can be re-run safely:
 *   1. Delete the 8 seeded demo contacts.
 *   2. Give every referral a contact (source 'referral'), so all 426 appear
 *      under the Contacts > Referrals tab.
 *   3. Overlay the PNFF sheet: enrich the matching referral-derived contacts,
 *      and add contacts for PNFF rows that were never referrals.
 *   4. Give every contact an OPPORTUNITY.
 *
 * Step 4 is not optional. The Contacts page lists opportunities and embeds
 * their contact, so a contact without one is invisible there — importing
 * without this looks exactly like the import silently failed.
 *
 * Step 3 is skipped automatically if migration 006 has not been applied,
 * so steps 1, 2 and 4 still deliver.
 */
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const PNFF_FILE = 'Docs/contacts/CFS PNFF Clients - 2025.csv';
const apply = process.argv.includes('--apply');

const DEMO_CONTACT_NAMES = [
  'margaret ellison', 'the hartley trust', 'dorothy kwan', 'frank delacroix',
  'nguyen family', 'paul rutherford', 'albert simmons', 'rosa & manuel ibarra',
];

/* ----------------------------- env ----------------------------- */
function readEnvLocal() {
  const out = {};
  try {
    for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
      const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
      if (m) out[m[1]] = m[2];
    }
  } catch { /* fall back to the real environment */ }
  return out;
}
const env = { ...readEnvLocal(), ...process.env };
const db = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
);

/* --------------------------- helpers --------------------------- */
function parseCsv(text) {
  const rows = []; let row = []; let field = ''; let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; }
      else field += c;
      continue;
    }
    if (c === '"') q = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const clean = (v) => {
  const t = (v ?? '').trim();
  return !t || /^\*+$/.test(t) ? null : t;
};

function toIsoDate(value) {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec((value || '').trim());
  if (!m) return null;
  let year = Number(m[3]);
  if (year < 100) year += 2000;
  return `${year}-${String(Number(m[1])).padStart(2, '0')}-${String(Number(m[2])).padStart(2, '0')}`;
}

const STOP = ['the', 'and', 'obo', 'family', 'trust', 'estate', 'of'];
function nameKey(...parts) {
  const raw = parts.filter(Boolean).join(' ').toLowerCase();
  const toks = raw.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((t) => t && !STOP.includes(t));
  return [...new Set(toks)].sort().join(' ');
}

/**
 * Where a record sits in the funnel.
 *
 * Referral statuses and PNFF statuses are different vocabularies describing
 * the same journey, so both map here. A declined or referred-out prospect
 * becomes an Exit rather than being dropped — the record of having said no
 * is worth keeping.
 */
function funnelFor(status) {
  const s = (status || '').toLowerCase();
  // PNFF sheet
  if (s === 'transferred to ff') return { stage: 'nurture', disposition: 'active' };
  if (s === 'pending onboarding') return { stage: 'intake', disposition: 'active' };
  if (s === 'confirmed nomination') return { stage: 'interest', disposition: 'active' };
  if (s === 'pending decision') return { stage: 'interest', disposition: 'active' };
  if (s === 'initial contact') return { stage: 'awareness', disposition: 'active' };
  // Referral table
  if (s === 'accepted') return { stage: 'intake', disposition: 'active' };
  if (s === 'nominated') return { stage: 'interest', disposition: 'active' };
  if (s === 'pending_decision') return { stage: 'interest', disposition: 'active' };
  if (s === 'declined' || s === 'referred_out') return { stage: 'awareness', disposition: 'exit' };
  return { stage: 'awareness', disposition: 'active' };
}

/* ------------------------ has migration 006? ------------------- */
const probe = await db.from('sig_contacts').select('last_contact_type').limit(1);
const has006 = !probe.error;
console.log(has006
  ? 'Migration 006 detected — PNFF fields will be written.'
  : 'Migration 006 NOT applied — steps 1, 2 and 4 only; PNFF overlay skipped.');

/* --------------------------- load state ------------------------ */
const { data: contacts } = await db.from('sig_contacts').select('id, full_name, source');
const { data: referrals } = await db
  .from('sig_referrals')
  .select('id, client_name, primary_first_name, primary_last_name, secondary_first_name, ' +
          'secondary_last_name, primary_email, secondary_email, primary_phone, secondary_phone, ' +
          'referral_date, referred_by, referral_type, attorney, appointment_notes, notes, ' +
          'status, contact_id');
const { data: opps } = await db.from('sig_opportunities').select('id, contact_id');

const demo = contacts.filter((c) => DEMO_CONTACT_NAMES.includes((c.full_name || '').trim().toLowerCase()));
const kept = contacts.filter((c) => !demo.includes(c));
const byName = new Map(kept.map((c) => [nameKey(c.full_name), c.id]));

console.log(`\nContacts ${contacts.length} | referrals ${referrals.length} | opportunities ${opps.length}`);
console.log(`  demo to delete: ${demo.length}`);

/* --------- step 2: a contact for every referral ---------------- */
const newFromReferral = [];
for (const r of referrals) {
  const full = [r.primary_first_name, r.primary_last_name].filter(Boolean).join(' ').trim() || r.client_name;
  if (byName.has(nameKey(full))) continue;
  newFromReferral.push({
    referralId: r.id,
    status: r.status,
    row: {
      // sig_contacts is the Redtail mirror: external_id is NOT NULL and
      // UNIQUE per source. Rows that did not come from Redtail get a UUID,
      // which is what the app's own createContact does.
      external_id: randomUUID(),
      source: 'referral',
      first_name: r.primary_first_name,
      last_name: r.primary_last_name,
      full_name: full,
      email: r.primary_email,
      mobile_phone: r.primary_phone,
      secondary_first_name: r.secondary_first_name,
      secondary_last_name: r.secondary_last_name,
      secondary_email: r.secondary_email,
      secondary_phone: r.secondary_phone,
      referral_date: r.referral_date,
      referral_source: r.referred_by,
      referral_type: r.referral_type,
      attorney: r.attorney,
      appointment_notes: r.appointment_notes,
      notes: r.notes,
      status: r.status,
    },
  });
}
console.log(`\nStep 2 — contacts to create from referrals: ${newFromReferral.length}`);

/* --------- step 3: PNFF overlay -------------------------------- */
const pnffRows = [];
if (has006) {
  const rows = parseCsv(readFileSync(PNFF_FILE, 'utf8').replace(/^﻿/, '')).filter((r) => r.some((c) => c.trim()));
  const header = rows.shift().map((h) => h.trim());
  const at = (r, n) => r[header.indexOf(n)];
  for (const r of rows) {
    const last = clean(at(r, 'Client 1 Last Name'));
    const first = clean(at(r, 'Client 1 First Name'));
    if (!last && !first) continue;
    const full = last && first ? `${first} ${last}` : first || last;
    pnffRows.push({
      full,
      status: clean(at(r, 'Status')),
      row: {
        first_name: first, last_name: last, full_name: full,
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
      },
    });
  }
  const refKeys = new Set(newFromReferral.map((n) => nameKey(n.row.full_name)));
  const enrich = pnffRows.filter((p) => refKeys.has(nameKey(p.full)) || byName.has(nameKey(p.full)));
  const brandNew = pnffRows.filter((p) => !refKeys.has(nameKey(p.full)) && !byName.has(nameKey(p.full)));
  console.log(`Step 3 — PNFF rows ${pnffRows.length}: enrich ${enrich.length}, new contacts ${brandNew.length}`);
}

const projectedContacts =
  kept.length + newFromReferral.length +
  (has006 ? pnffRows.filter((p) => !newFromReferral.some((n) => nameKey(n.row.full_name) === nameKey(p.full)) && !byName.has(nameKey(p.full))).length : 0);
console.log(`\nProjected contacts after sync: ${projectedContacts}`);
console.log(`Projected "Referrals" tab count: ${newFromReferral.length + kept.filter((c) => c.source === 'referral').length}`);

if (!apply) {
  console.log('\nDRY RUN — nothing written. Re-run with --apply.');
  process.exit(0);
}

/* ----------------------------- apply --------------------------- */
if (demo.length) {
  await db.from('sig_opportunities').delete().in('contact_id', demo.map((d) => d.id));
  const { error } = await db.from('sig_contacts').delete().in('id', demo.map((d) => d.id));
  if (error) { console.error('Demo delete failed:', error.message); process.exit(1); }
  console.log(`\nDeleted ${demo.length} demo contacts.`);
}

// Step 2 — insert referral-derived contacts and link them back.
const created = [];
const BATCH = 100;
for (let i = 0; i < newFromReferral.length; i += BATCH) {
  const slice = newFromReferral.slice(i, i + BATCH);
  const { data, error } = await db.from('sig_contacts').insert(slice.map((n) => n.row)).select('id, full_name');
  if (error) { console.error('Contact insert failed:', error.message); process.exit(1); }
  data.forEach((c, j) => created.push({ ...slice[j], contactId: c.id, full_name: c.full_name }));
  console.log(`  contacts from referrals: ${Math.min(i + BATCH, newFromReferral.length)}/${newFromReferral.length}`);
}
for (const c of created) {
  await db.from('sig_referrals').update({ contact_id: c.contactId }).eq('id', c.referralId);
}

// Step 3 — PNFF overlay.
if (has006) {
  const nameToId = new Map([...byName, ...created.map((c) => [nameKey(c.full_name), c.contactId])]);
  let enriched = 0;
  const fresh = [];
  for (const p of pnffRows) {
    const id = nameToId.get(nameKey(p.full));
    if (id) {
      const { error } = await db.from('sig_contacts').update(p.row).eq('id', id);
      if (!error) enriched++;
    } else {
      fresh.push({ ...p.row, source: 'pnff_2025', external_id: randomUUID() });
    }
  }
  console.log(`  PNFF enriched ${enriched} existing contacts`);
  for (let i = 0; i < fresh.length; i += BATCH) {
    const { error } = await db.from('sig_contacts').insert(fresh.slice(i, i + BATCH));
    if (error) { console.error('PNFF insert failed:', error.message); process.exit(1); }
  }
  console.log(`  PNFF created ${fresh.length} new contacts`);
}

// Step 4 — every contact needs an opportunity or it is invisible.
const { data: allContacts } = await db.from('sig_contacts').select('id, status');
const { data: allOpps } = await db.from('sig_opportunities').select('contact_id');
const haveOpp = new Set(allOpps.map((o) => o.contact_id));
const needOpp = allContacts.filter((c) => !haveOpp.has(c.id));
console.log(`\nStep 4 — contacts needing an opportunity: ${needOpp.length}`);

for (let i = 0; i < needOpp.length; i += BATCH) {
  const slice = needOpp.slice(i, i + BATCH).map((c) => {
    const f = funnelFor(c.status);
    return { source: 'import', contact_id: c.id, stage: f.stage, disposition: f.disposition };
  });
  const { error } = await db.from('sig_opportunities').insert(slice);
  if (error) { console.error('Opportunity insert failed:', error.message); process.exit(1); }
  console.log(`  opportunities: ${Math.min(i + BATCH, needOpp.length)}/${needOpp.length}`);
}

const { count: cCount } = await db.from('sig_contacts').select('id', { count: 'exact', head: true });
const { count: oCount } = await db.from('sig_opportunities').select('id', { count: 'exact', head: true });
console.log(`\nDone. contacts=${cCount} opportunities=${oCount}`);
