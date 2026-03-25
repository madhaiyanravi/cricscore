'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { useToast } from '@/components/providers/ToastProvider';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const { toast } = useToast();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fn = mode === 'login' ? authApi.login : authApi.register;
      const { data } = await fn(email, password);
      setAuth(data.token, data.email);
      toast(mode === 'login' ? 'Welcome back!' : 'Account created successfully!', 'success');
      router.push('/dashboard');
    } catch (err: any) {
       toast(err.response?.data?.error || 'Authentication failed. Please check your credentials.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-background transition-colors duration-300">
      {/* Branding */}
      <div className="mb-12 text-center animate-in fade-in zoom-in duration-700">
        <div className="inline-flex items-center gap-4 mb-3">
          <div className="relative">
             <span className="text-6xl drop-shadow-lg scale-110 inline-block rotate-12">🏏</span>
             <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full border-4 border-background" />
          </div>
          <h1 className="text-6xl md:text-7xl font-black tracking-tighter text-text italic">
            CRIC<span className="text-primary not-italic">SCORE</span>
          </h1>
        </div>
        <div className="relative inline-block">
           <p className="text-muted font-medium tracking-[0.2em] uppercase text-xs">Live scoring, simplified</p>
           <div className="absolute -bottom-2 left-0 right-0 h-0.5 bg-primary/20 rounded-full" />
        </div>
      </div>

      {/* Auth Container */}
      <Card className="w-full max-w-md p-8 shadow-2xl shadow-primary/5 border-primary/10 overflow-hidden relative group">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {/* Tab Switcher */}
        <div className="flex bg-muted/5 p-1 rounded-2xl border border-border/50 mb-8 relative z-10">
          {(['login', 'register'] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); }}
              className={cn(
                "flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-300",
                mode === m
                  ? "bg-primary text-white shadow-lg shadow-primary/20 scale-102"
                  : "text-muted hover:text-text hover:bg-muted/10"
              )}
            >
              {m === 'login' ? 'Sign In' : 'Join Now'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            required
            autoComplete="email"
            autoFocus
          />
          
          <Input
            label="Security Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            required
            autoComplete="current-password"
          />

          <Button 
            type="submit" 
            isLoading={loading} 
            className="w-full py-7 text-lg font-black uppercase tracking-[0.1em] mt-4 shadow-xl shadow-primary/10"
          >
            {mode === 'login' ? 'Enter Dashboard' : 'Create My Account'}
          </Button>
          
          <div className="text-center">
             <p className="text-[10px] text-muted font-bold uppercase tracking-widest opacity-60">
                Secure 256-bit encrypted session
             </p>
          </div>
        </form>
      </Card>

      <footer className="mt-12 text-center space-y-2 opacity-50 hover:opacity-100 transition-opacity duration-500">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted">
          CricScore Professional MVP
        </p>
        <div className="flex items-center justify-center gap-4 text-muted text-lg">
           <span>⚡</span>
           <div className="h-px w-8 bg-muted/20" />
           <span>✨</span>
           <div className="h-px w-8 bg-muted/20" />
           <span>🔥</span>
        </div>
      </footer>
    </div>
  );
}
