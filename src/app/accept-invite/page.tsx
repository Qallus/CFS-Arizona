'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Loader2, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';

type Phase = 'checking' | 'ready' | 'invalid' | 'saving' | 'done';

export default function AcceptInvitePage() {
  const supabase = useMemo<SupabaseClient | null>(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    return createClient(url, key, {
      auth: { detectSessionInUrl: true, persistSession: true, autoRefreshToken: true },
    });
  }, []);

  const [phase, setPhase] = useState<Phase>('checking');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!supabase) {
      setPhase('invalid');
      setError('Supabase is not configured.');
      return;
    }
    let cancelled = false;
    // Give detectSessionInUrl a tick to exchange the token in the URL hash.
    (async () => {
      for (let i = 0; i < 10 && !cancelled; i++) {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          setEmail(data.session.user.email ?? '');
          setPhase('ready');
          return;
        }
        await new Promise((r) => setTimeout(r, 200));
      }
      if (!cancelled) {
        setPhase('invalid');
        setError('This invite link is invalid or has expired. Ask an admin to resend it.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (!supabase) return;
    setPhase('saving');
    try {
      const { error: updErr } = await supabase.auth.updateUser({ password });
      if (updErr) throw new Error(updErr.message);

      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (token) {
        await fetch('/api/invite/activate', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setPhase('done');
    } catch (err) {
      setError((err as Error).message);
      setPhase('ready');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand rounded-2xl mb-4">
            <span className="text-2xl font-bold text-white">SIG</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Accept your invitation</h1>
          <p className="text-gray-400 mt-2">Set a password to activate your SIG360 account</p>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8">
          {phase === 'checking' && (
            <div className="flex items-center justify-center text-gray-300 py-8">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Verifying invite…
            </div>
          )}

          {phase === 'invalid' && (
            <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {phase === 'done' && (
            <div className="text-center py-4">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-white font-medium mb-1">Account activated</p>
              <p className="text-gray-400 text-sm mb-4">Your password has been set.</p>
              <a
                href="/login"
                className="inline-block py-2.5 px-6 bg-brand hover:bg-brand/90 text-white font-medium rounded-lg transition-colors"
              >
                Continue to sign in
              </a>
            </div>
          )}

          {(phase === 'ready' || phase === 'saving') && (
            <form onSubmit={submit} className="space-y-5">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}
              {email && (
                <p className="text-sm text-gray-400">
                  Setting password for <span className="text-gray-200">{email}</span>
                </p>
              )}
              <PasswordField label="New Password" value={password} onChange={setPassword} />
              <PasswordField label="Confirm Password" value={confirm} onChange={setConfirm} />
              <button
                type="submit"
                disabled={phase === 'saving'}
                className="w-full py-3 px-4 bg-brand hover:bg-brand/90 disabled:bg-brand/50 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {phase === 'saving' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Activating…
                  </>
                ) : (
                  'Activate Account'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input
          type="password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all"
          placeholder="••••••••"
          required
          autoComplete="new-password"
        />
      </div>
    </div>
  );
}
