'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Users,
  Shield,
  Plus,
  Search,
  Trash2,
  Check,
  AlertCircle,
  Loader2,
  Crown,
  Mail,
  X,
  Database,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ROLES,
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
  ROLE_PERMISSIONS,
  INTERNAL_ROLES,
  EXTERNAL_ROLES,
  USER_STATUSES,
  USER_STATUS_LABELS,
  roleLabel,
  statusLabel,
  type Role,
  type UserStatus,
} from '@/lib/rbac';

interface ApiUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  email: string;
  profilePhotoUrl: string | null;
  role: Role;
  title: string | null;
  status: UserStatus;
  lastLoginAt: string | null;
  createdAt: string;
}

type Msg = { type: 'success' | 'error'; text: string } | null;

const STATUS_STYLES: Partial<Record<UserStatus, string>> = {
  [USER_STATUSES.ACTIVE]: 'border-green-500 text-green-500',
  [USER_STATUSES.INVITED]: 'border-yellow-500 text-yellow-500',
  [USER_STATUSES.PENDING_SETUP]: 'border-yellow-500 text-yellow-500',
  [USER_STATUSES.PENDING_REVIEW]: 'border-blue-500 text-blue-500',
  [USER_STATUSES.SUSPENDED]: 'border-red-500 text-red-500',
  [USER_STATUSES.INACTIVE]: 'border-gray-500 text-gray-500',
  [USER_STATUSES.ARCHIVED]: 'border-gray-500 text-gray-500',
};

// Statuses an admin can set from the members table.
const ASSIGNABLE_STATUSES: UserStatus[] = [
  USER_STATUSES.ACTIVE,
  USER_STATUSES.SUSPENDED,
  USER_STATUSES.INACTIVE,
  USER_STATUSES.PENDING_REVIEW,
];

function permissionCount(role: Role): string {
  const perms = ROLE_PERMISSIONS[role] ?? [];
  if ((perms as readonly string[]).includes('*')) return 'All';
  return String(perms.length);
}

function fullName(u: ApiUser): string {
  return (
    u.displayName?.trim() ||
    `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() ||
    u.email
  );
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function RolesPage() {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [provisioned, setProvisioned] = useState(true);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>(ROLES.CLIENT_SERVICE_ASSOCIATE);
  const [inviteTitle, setInviteTitle] = useState('');
  const [inviteFirstName, setInviteFirstName] = useState('');
  const [inviteLastName, setInviteLastName] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  function flash(m: Msg) {
    setMsg(m);
    if (m) setTimeout(() => setMsg(null), 3500);
  }

  async function loadUsers() {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load users');
      setProvisioned(data.provisioned !== false);
      setUsers(data.users ?? []);
    } catch (err) {
      flash({ type: 'error', text: (err as Error).message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const userCountByRole = useMemo(() => {
    const counts = {} as Record<Role, number>;
    for (const u of users) counts[u.role] = (counts[u.role] ?? 0) + 1;
    return counts;
  }, [users]);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return users.filter(
      (u) =>
        fullName(u).toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        roleLabel(u.role).toLowerCase().includes(q),
    );
  }, [users, searchQuery]);

  async function handleInvite() {
    setSaving(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
          title: inviteTitle,
          firstName: inviteFirstName,
          lastName: inviteLastName,
          phone: invitePhone,
          mode: 'invite',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to invite user');
      setUsers((prev) => [...prev, data.user]);
      const emailNote = data.invite?.emailSent
        ? 'invite email sent'
        : data.invite?.error
          ? `user created, email not sent (${data.invite.error})`
          : 'user created';
      flash({ type: data.invite?.emailSent === false ? 'error' : 'success', text: `${inviteEmail}: ${emailNote}` });
      setShowInvite(false);
      setInviteEmail('');
      setInviteTitle('');
      setInviteFirstName('');
      setInviteLastName('');
      setInvitePhone('');
      setInviteRole(ROLES.CLIENT_SERVICE_ASSOCIATE);
    } catch (err) {
      flash({ type: 'error', text: (err as Error).message });
    } finally {
      setSaving(false);
    }
  }

  async function patchUser(id: string, patch: Record<string, unknown>, successText: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');
      setUsers((prev) => prev.map((u) => (u.id === id ? data.user : u)));
      flash({ type: 'success', text: successText });
    } catch (err) {
      flash({ type: 'error', text: (err as Error).message });
    } finally {
      setBusyId(null);
    }
  }

  async function archiveUser(id: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Archive failed');
      setUsers((prev) => prev.map((u) => (u.id === id ? data.user : u)));
      flash({ type: 'success', text: 'User archived' });
    } catch (err) {
      flash({ type: 'error', text: (err as Error).message });
    } finally {
      setBusyId(null);
    }
  }

  async function resendInvite(id: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/users/${id}/resend-invite`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Resend failed');
      setUsers((prev) => prev.map((u) => (u.id === id ? data.user : u)));
      flash({
        type: 'success',
        text: data.invite?.emailSent ? 'Invite email resent' : 'Invite reset (email not sent)',
      });
    } catch (err) {
      flash({ type: 'error', text: (err as Error).message });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-6 h-6 text-brand" />
            Roles &amp; Permissions
          </h1>
          <p className="text-muted-foreground">Manage team access, roles, and user status</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadUsers} disabled={loading}>
            <RefreshCw className={cn('w-4 h-4 mr-2', loading && 'animate-spin')} />
            Refresh
          </Button>
          <Button className="bg-brand hover:bg-brand/90" onClick={() => setShowInvite(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Invite User
          </Button>
        </div>
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

      {!provisioned && (
        <div className="mb-6 p-4 rounded-lg flex items-start gap-3 bg-yellow-500/10 border border-yellow-500/30 text-yellow-600 dark:text-yellow-400">
          <Database className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">User management database not provisioned</p>
            <p className="text-sm opacity-90">
              Apply the RBAC migration (<code>supabase/migrations/20260707000001_rbac_foundation.sql</code>)
              to your SIG360 Supabase project, then refresh. The role catalog below is available now;
              inviting and editing users needs the database.
            </p>
          </div>
        </div>
      )}

      {/* Role Catalog */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-foreground mb-1">Role Catalog</h2>
        <p className="text-sm text-muted-foreground mb-4">
          SIG360 uses a fixed set of roles. Fine-tune access per user via permission overrides.
        </p>

        <h3 className="text-sm font-medium text-muted-foreground mb-2">Internal</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          {INTERNAL_ROLES.map((role) => (
            <RoleCard key={role} role={role} count={userCountByRole[role] ?? 0} />
          ))}
        </div>

        <h3 className="text-sm font-medium text-muted-foreground mb-2">External / Portal</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {EXTERNAL_ROLES.map((role) => (
            <RoleCard key={role} role={role} count={userCountByRole[role] ?? 0} />
          ))}
        </div>
      </div>

      {/* Team Members */}
      <Card className="bg-card/50 border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-foreground">Users</CardTitle>
              <CardDescription>
                {loading ? 'Loading…' : `${users.length} user${users.length === 1 ? '' : 's'}`}
              </CardDescription>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users…"
                className="pl-9 bg-secondary border-border w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading users…
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {provisioned ? 'No users yet. Invite your first team member.' : 'Provision the database to add users.'}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((u) => {
                const name = fullName(u);
                const busy = busyId === u.id;
                return (
                  <div
                    key={u.id}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 bg-secondary rounded-lg"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <Avatar>
                        <AvatarImage src={u.profilePhotoUrl ?? undefined} />
                        <AvatarFallback className="bg-brand/20 text-brand">
                          {initials(name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground truncate">{name}</p>
                          <Badge
                            variant="outline"
                            className={cn('text-xs', STATUS_STYLES[u.status] ?? '')}
                          >
                            {statusLabel(u.status)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{u.email}</p>
                        {u.title && <p className="text-xs text-muted-foreground">{u.title}</p>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Role */}
                      <select
                        value={u.role}
                        disabled={busy}
                        onChange={(e) =>
                          patchUser(u.id, { role: e.target.value }, `Role updated for ${name}`)
                        }
                        className="h-8 px-2 bg-background border border-border rounded-md text-sm text-foreground disabled:opacity-50"
                      >
                        <optgroup label="Internal">
                          {INTERNAL_ROLES.map((r) => (
                            <option key={r} value={r}>
                              {ROLE_LABELS[r]}
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="External">
                          {EXTERNAL_ROLES.map((r) => (
                            <option key={r} value={r}>
                              {ROLE_LABELS[r]}
                            </option>
                          ))}
                        </optgroup>
                      </select>

                      {/* Status */}
                      <select
                        value={ASSIGNABLE_STATUSES.includes(u.status) ? u.status : ''}
                        disabled={busy}
                        onChange={(e) =>
                          patchUser(u.id, { status: e.target.value }, `Status updated for ${name}`)
                        }
                        className="h-8 px-2 bg-background border border-border rounded-md text-sm text-foreground disabled:opacity-50"
                      >
                        {!ASSIGNABLE_STATUSES.includes(u.status) && (
                          <option value="" disabled>
                            {statusLabel(u.status)}
                          </option>
                        )}
                        {ASSIGNABLE_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {USER_STATUS_LABELS[s]}
                          </option>
                        ))}
                      </select>

                      {u.status === USER_STATUSES.INVITED && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={busy}
                          onClick={() => resendInvite(u.id)}
                          title="Reset invite"
                        >
                          <Mail className="w-4 h-4" />
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={busy || u.status === USER_STATUSES.ARCHIVED}
                        onClick={() => archiveUser(u.id)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                        title="Archive user"
                      >
                        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-card border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-foreground">Invite User</CardTitle>
                <button onClick={() => setShowInvite(false)} aria-label="Close">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              <CardDescription>Creates the user with an “Invited” status.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm text-muted-foreground">Email Address</Label>
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@sig360.com"
                  className="bg-secondary border-border mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm text-muted-foreground">First name</Label>
                  <Input
                    value={inviteFirstName}
                    onChange={(e) => setInviteFirstName(e.target.value)}
                    placeholder="Jane"
                    className="bg-secondary border-border mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Last name</Label>
                  <Input
                    value={inviteLastName}
                    onChange={(e) => setInviteLastName(e.target.value)}
                    placeholder="Doe"
                    className="bg-secondary border-border mt-1"
                  />
                </div>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Phone (optional)</Label>
                <Input
                  type="tel"
                  value={invitePhone}
                  onChange={(e) => setInvitePhone(e.target.value)}
                  placeholder="480-555-0134"
                  className="bg-secondary border-border mt-1"
                />
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Title (optional)</Label>
                <Input
                  value={inviteTitle}
                  onChange={(e) => setInviteTitle(e.target.value)}
                  placeholder="e.g., Servicing Advisor"
                  className="bg-secondary border-border mt-1"
                />
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Role</Label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as Role)}
                  className="w-full h-10 px-3 mt-1 bg-secondary border border-border rounded-md text-foreground"
                >
                  <optgroup label="Internal">
                    {INTERNAL_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="External / Portal">
                    {EXTERNAL_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </option>
                    ))}
                  </optgroup>
                </select>
                <p className="text-xs text-muted-foreground mt-1">{ROLE_DESCRIPTIONS[inviteRole]}</p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowInvite(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleInvite}
                  disabled={saving || !inviteEmail}
                  className="bg-brand hover:bg-brand/90"
                >
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
                  Send Invite
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function RoleCard({ role, count }: { role: Role; count: number }) {
  const isSuper = role === ROLES.SUPER_ADMIN;
  return (
    <Card className="bg-card/50 border-border">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-brand/15 flex-shrink-0">
              {isSuper ? (
                <Crown className="w-4 h-4 text-brand" />
              ) : (
                <Shield className="w-4 h-4 text-brand" />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-foreground truncate">{ROLE_LABELS[role]}</p>
              <p className="text-xs text-muted-foreground">{count} user{count === 1 ? '' : 's'}</p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs whitespace-nowrap">
            {permissionCount(role)} perms
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">{ROLE_DESCRIPTIONS[role]}</p>
      </CardContent>
    </Card>
  );
}
