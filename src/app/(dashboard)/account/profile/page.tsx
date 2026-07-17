'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  User,
  Save,
  Camera,
  Mail,
  Phone,
  Clock,
  Loader2,
  Check,
  AlertCircle,
  Building,
  Briefcase,
  Link as LinkIcon,
  Database,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROLE_LABELS, statusLabel, type Role, type UserStatus } from '@/lib/rbac';

interface Profile {
  id: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  email: string;
  phone: string | null;
  mobilePhone: string | null;
  title: string | null;
  department: string | null;
  bio: string | null;
  calendarLink: string | null;
  timezone: string | null;
  profilePhotoUrl: string | null;
  role: Role;
  status: UserStatus;
  createdAt: string;
}

type Field =
  | 'firstName'
  | 'lastName'
  | 'title'
  | 'department'
  | 'phone'
  | 'mobilePhone'
  | 'bio'
  | 'calendarLink'
  | 'timezone';

type Msg = { type: 'success' | 'error'; text: string } | null;

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [provisioned, setProvisioned] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function flash(m: Msg) {
    setMsg(m);
    if (m) setTimeout(() => setMsg(null), 3500);
  }

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/me');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load profile');
        setProvisioned(data.provisioned !== false);
        setProfile(data.profile);
      } catch (err) {
        flash({ type: 'error', text: (err as Error).message });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function change(field: Field, value: string) {
    setProfile((p) => (p ? { ...p, [field]: value } : p));
    setHasChanges(true);
  }

  async function save() {
    if (!profile) return;
    setSaving(true);
    try {
      const res = await fetch('/api/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: profile.firstName ?? '',
          lastName: profile.lastName ?? '',
          title: profile.title ?? '',
          department: profile.department ?? '',
          phone: profile.phone ?? '',
          mobilePhone: profile.mobilePhone ?? '',
          bio: profile.bio ?? '',
          calendarLink: profile.calendarLink ?? '',
          timezone: profile.timezone ?? '',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setProfile(data.profile);
      setHasChanges(false);
      flash({ type: 'success', text: 'Profile updated' });
    } catch (err) {
      flash({ type: 'error', text: (err as Error).message });
    } finally {
      setSaving(false);
    }
  }

  async function onPhotoPicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/me/photo', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setProfile(data.profile);
      flash({ type: 'success', text: 'Photo updated' });
    } catch (err) {
      flash({ type: 'error', text: (err as Error).message });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  const name = profile
    ? profile.displayName?.trim() ||
      `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim() ||
      profile.email
    : '';
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <User className="w-6 h-6 text-brand" />
            My Profile
          </h1>
          <p className="text-muted-foreground">Manage your personal information and account details</p>
        </div>
        {hasChanges && (
          <Button onClick={save} disabled={saving} className="bg-brand hover:bg-brand/90">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
        )}
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
          <p className="text-sm">
            User database not provisioned. Apply the RBAC migration to enable profile editing.
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading profile…
        </div>
      ) : !profile ? (
        <div className="text-center py-20 text-muted-foreground">Profile unavailable.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Avatar */}
          <Card className="bg-card/50 border-border lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-foreground">Profile Photo</CardTitle>
              <CardDescription>Your avatar across the dashboard</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="relative">
                <Avatar className="w-32 h-32">
                  <AvatarImage src={profile.profilePhotoUrl ?? undefined} />
                  <AvatarFallback className="bg-brand/20 text-brand text-3xl">{initials}</AvatarFallback>
                </Avatar>
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="absolute bottom-0 right-0 p-2 bg-brand rounded-full hover:bg-brand/90 transition-colors disabled:opacity-60"
                  title="Change photo"
                >
                  {uploading ? (
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4 text-white" />
                  )}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  onChange={onPhotoPicked}
                />
              </div>
              <div className="mt-4 text-center">
                <h3 className="text-lg font-semibold text-foreground">{name}</h3>
                <p className="text-sm text-muted-foreground">{profile.title || '—'}</p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Badge variant="outline" className="border-brand/50 text-brand">
                    {ROLE_LABELS[profile.role] ?? profile.role}
                  </Badge>
                  <Badge variant="outline">{statusLabel(profile.status)}</Badge>
                </div>
              </div>
              <div className="mt-4 w-full space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{profile.email}</span>
                </div>
                {profile.timezone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{profile.timezone}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Personal Info */}
          <Card className="bg-card/50 border-border lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-foreground">Personal Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Labeled label="First Name">
                  <Input value={profile.firstName ?? ''} onChange={(e) => change('firstName', e.target.value)} className="bg-secondary border-border" />
                </Labeled>
                <Labeled label="Last Name">
                  <Input value={profile.lastName ?? ''} onChange={(e) => change('lastName', e.target.value)} className="bg-secondary border-border" />
                </Labeled>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Labeled label="Email" icon={<Mail className="w-4 h-4" />}>
                  <Input value={profile.email} disabled className="bg-secondary/50 border-border opacity-70" />
                </Labeled>
                <Labeled label="Phone" icon={<Phone className="w-4 h-4" />}>
                  <Input value={profile.phone ?? ''} onChange={(e) => change('phone', e.target.value)} className="bg-secondary border-border" />
                </Labeled>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Labeled label="Title" icon={<Briefcase className="w-4 h-4" />}>
                  <Input value={profile.title ?? ''} onChange={(e) => change('title', e.target.value)} className="bg-secondary border-border" />
                </Labeled>
                <Labeled label="Department" icon={<Building className="w-4 h-4" />}>
                  <Input value={profile.department ?? ''} onChange={(e) => change('department', e.target.value)} className="bg-secondary border-border" />
                </Labeled>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Labeled label="Calendar Link" icon={<LinkIcon className="w-4 h-4" />}>
                  <Input value={profile.calendarLink ?? ''} onChange={(e) => change('calendarLink', e.target.value)} placeholder="https://cal.com/…" className="bg-secondary border-border" />
                </Labeled>
                <Labeled label="Timezone" icon={<Clock className="w-4 h-4" />}>
                  <Input value={profile.timezone ?? ''} onChange={(e) => change('timezone', e.target.value)} placeholder="America/Phoenix" className="bg-secondary border-border" />
                </Labeled>
              </div>

              <Labeled label="Bio">
                <Textarea value={profile.bio ?? ''} onChange={(e) => change('bio', e.target.value)} className="bg-secondary border-border min-h-[100px]" placeholder="Tell your team about yourself…" />
              </Labeled>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function Labeled({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
        {icon} {label}
      </label>
      {children}
    </div>
  );
}
