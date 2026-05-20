'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  email: string;
  name: string;
}

interface AuthContextType {
  user: User;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hardcoded user since there's only one
const ADMIN_USER: User = {
  email: 'jw@channelcast.io',
  name: 'Jeremy Waters',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  const signOut = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <AuthContext.Provider value={{ user: ADMIN_USER, signOut }}>
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
