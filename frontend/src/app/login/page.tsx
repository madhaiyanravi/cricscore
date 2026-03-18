'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const fn = mode === 'login' ? authApi.login : authApi.register;
      const { data } = await fn(email, password);
      setAuth(data.token, data.email);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-3 mb-2">
          <span className="text-5xl">🏏</span>
          <h1 className="font-display text-5xl font-bold text-white tracking-wide">
            CRIC<span className="text-[#2aad56]">SCORE</span>
          </h1>
        </div>
        <p className="text-gray-400 text-sm">Live cricket scoring, simplified</p>
      </div>

      {/* Card */}
      <div className="card w-full max-w-md p-8">
        {/* Tabs */}
        <div className="flex rounded-lg overflow-hidden border border-[#30363d] mb-7">
          {(['login', 'register'] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); }}
              className={`flex-1 py-2.5 text-sm font-semibold capitalize transition-colors ${
                mode === m
                  ? 'bg-[#1a7a3c] text-white'
                  : 'text-gray-400 hover:text-white hover:bg-[#1c2330]'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-semibold uppercase tracking-wider">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-semibold uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input"
              required
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>

      <p className="mt-6 text-xs text-gray-600">
        CricScore MVP — built for quick match tracking
      </p>
    </div>
  );
}
