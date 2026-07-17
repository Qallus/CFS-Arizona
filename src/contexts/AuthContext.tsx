'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  email: string;
  name: string;
  avatar?: string | null;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  permissions: string[];
  /** True if the user holds the permission (or the '*' wildcard). */
  can: (permission: string) => boolean;
  /** True if the user holds ANY of the permissions. */
  canAny: (permissions: string[]) => boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const res = await fetch('/api/me');
      const data = await res.json();
      if (res.ok && data.profile) {
        const p = data.profile;
        const name =
          p.displayName?.trim() ||
          `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() ||
          p.email;
        setUser({ email: p.email, name, avatar: p.profilePhotoUrl, role: p.role });
        setPermissions(Array.isArray(data.permissions) ? data.permissions : []);
      } else {
        setUser(null);
        setPermissions([]);
      }
    } catch {
      setUser(null);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  }

  const can = (permission: string) => permissions.includes('*') || permissions.includes(permission);
  const canAny = (perms: string[]) => permissions.includes('*') || perms.some((p) => permissions.includes(p));

  useEffect(() => {
    load();
  }, []);

  const signOut = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setPermissions([]);
    router.push('/login');
    router.refresh();
  };

  return (
    <AuthContext.Provider value={{ user, loading, permissions, can, canAny, signOut, refresh: load }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
