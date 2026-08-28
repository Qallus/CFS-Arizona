/**
 * Make a user account whole, whichever half of it is missing.
 *
 *   node scripts/provision-user.mjs --email brent@cfsarizona.com --role super_admin
 *   node scripts/provision-user.mjs --email x@y.com --role fiduciary --password '…' --apply
 *
 * An account in this app is two records:
 *
 *   auth.users     credentials  — created by the Supabase dashboard, or here
 *   sig_profiles   role/status  — created by the app's invite flow, or here
 *
 * They are joined by sig_profiles.auth_user_id. Creating a user in the
 * Supabase dashboard makes only the first, which is why such an account
 * authenticates and then finds every screen closed to it. This script reports
 * which halves exist and repairs whichever are missing or unlinked.
 *
 * Dry run by default; pass --apply to write. Re-runnable — every step checks
 * before it acts, so running it twice is not a way to break an account.
 */
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

/* ----------------------------- args ----------------------------- */
function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}
const apply = process.argv.includes('--apply');
const email = (arg('email') || '').trim().toLowerCase();
const role = arg('role') || 'support_operations';
const password = arg('password');
const firstName = arg('first');
const lastName = arg('last');

if (!email) {
  console.error('Usage: node scripts/provision-user.mjs --email <address> [--role <role>] [--password <pw>] [--first X] [--last Y] [--apply]');
  process.exit(1);
}

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
const url = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.');
  console.error('Without the service-role key this script can neither read nor repair accounts.');
  process.exit(1);
}
const db = createClient(url, serviceKey, { auth: { persistSession: false } });

/* --------------------------- helpers --------------------------- */
const INTERNAL_ROLES = [
  'super_admin', 'admin', 'fiduciary', 'case_manager',
  'bookkeeper', 'support_operations', 'auditor',
];

function nameFromEmail(addr) {
  const local = addr.split('@')[0] ?? '';
  const parts = local.split(/[._-]+/).filter(Boolean);
  return { first: parts[0] ?? local, last: parts.slice(1).join(' ') };
}

/** Paginates auth.users — listUsers has no email filter. */
async function findAuthUser(addr) {
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(`Could not list auth users: ${error.message}`);
    const users = data?.users ?? [];
    const hit = users.find((u) => (u.email || '').toLowerCase() === addr);
    if (hit) return hit;
    if (users.length < 200) return null;
  }
  return null;
}

const say = (s) => console.log(s);
const step = (s) => console.log(`\n${s}`);
const wouldOrDid = (s) => (apply ? `  ✓ ${s}` : `  → would ${s}`);

/* ---------------------------- report ---------------------------- */
say(`\nAccount check for ${email}`);
say(apply ? 'Mode: APPLY (writing changes)' : 'Mode: dry run (pass --apply to write)');
say('─'.repeat(60));

let authUser = await findAuthUser(email);

const { data: profileRow, error: profileErr } = await db
  .from('sig_profiles')
  .select('id, email, role, status, auth_user_id, can_login')
  .ilike('email', email)
  .maybeSingle();

if (profileErr) {
  console.error(`\nCould not read sig_profiles: ${profileErr.message}`);
  if (/does not exist|could not find the table/i.test(profileErr.message)) {
    console.error('The RBAC migration has not been applied to this project.');
  }
  process.exit(1);
}

say(`\n  credentials (auth.users)   ${authUser ? `present  ${authUser.id}` : 'MISSING'}`);
if (authUser) {
  say(`  email confirmed            ${authUser.email_confirmed_at ? 'yes' : 'NO — sign-in is blocked'}`);
}
say(`  app profile (sig_profiles) ${profileRow ? `present  role=${profileRow.role} status=${profileRow.status}` : 'MISSING'}`);
if (authUser && profileRow) {
  const linked = profileRow.auth_user_id === authUser.id;
  say(`  linked                     ${linked ? 'yes' : 'NO — profile.auth_user_id does not match'}`);
}

/* ---------------------------- repair ---------------------------- */
step('Repairs');

if (!INTERNAL_ROLES.includes(role)) {
  console.error(`  ! '${role}' is not a known role. Expected one of: ${INTERNAL_ROLES.join(', ')}`);
  process.exit(1);
}

let didSomething = false;

// 1. Credentials.
if (!authUser) {
  if (!password) {
    say('  ! No auth user and no --password given. Re-run with --password to create one,');
    say('    or invite this person from the app so they choose their own.');
  } else if (password.length < 8) {
    say('  ! --password must be at least 8 characters.');
  } else {
    didSomething = true;
    say(wouldOrDid(`create auth user with a confirmed email`));
    if (apply) {
      const { data, error } = await db.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (error) {
        console.error(`  ✗ ${error.message}`);
        process.exit(1);
      }
      authUser = data.user;
      say(`    id ${authUser.id}`);
    }
  }
} else if (!authUser.email_confirmed_at) {
  // The most common dashboard-created failure: the account exists and the
  // password is right, but sign-in refuses it until the address is confirmed.
  didSomething = true;
  say(wouldOrDid('confirm the email address'));
  if (apply) {
    const { error } = await db.auth.admin.updateUserById(authUser.id, { email_confirm: true });
    if (error) console.error(`  ✗ ${error.message}`);
  }
} else if (password) {
  didSomething = true;
  say(wouldOrDid('reset the password on the existing auth user'));
  if (apply) {
    const { error } = await db.auth.admin.updateUserById(authUser.id, { password });
    if (error) console.error(`  ✗ ${error.message}`);
  }
}

// 2. Profile.
if (!profileRow) {
  didSomething = true;
  const fb = nameFromEmail(email);
  const first = firstName || fb.first;
  const last = lastName || fb.last;
  say(wouldOrDid(`create sig_profiles row (role=${role}, status=active)`));
  if (apply) {
    const { error } = await db.from('sig_profiles').insert({
      email,
      auth_user_id: authUser?.id ?? null,
      role,
      status: 'active',
      first_name: first,
      last_name: last,
      display_name: `${first} ${last}`.trim() || email,
      is_internal_user: true,
      is_external_user: false,
      can_login: true,
    });
    if (error) console.error(`  ✗ ${error.message}`);
  }
} else {
  const patch = {};
  if (authUser && profileRow.auth_user_id !== authUser.id) patch.auth_user_id = authUser.id;
  // Only `active` may sign in; anything else here is a half-finished invite.
  if (profileRow.status !== 'active') patch.status = 'active';
  if (!profileRow.can_login) patch.can_login = true;

  if (Object.keys(patch).length) {
    didSomething = true;
    say(wouldOrDid(`update profile (${Object.keys(patch).join(', ')})`));
    if (apply) {
      const { error } = await db.from('sig_profiles').update(patch).eq('id', profileRow.id);
      if (error) console.error(`  ✗ ${error.message}`);
    }
  }
}

if (!didSomething) say('  Nothing to repair — this account is complete.');

say('');
say(apply ? 'Done. Ask them to sign in.' : 'Dry run only. Re-run with --apply to make these changes.');
say('');
