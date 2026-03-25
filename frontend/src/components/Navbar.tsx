'use client';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { useEffect } from 'react';
import OfflineBadge from '@/components/OfflineBadge';

const navLinks = [
  { href: '/dashboard',    label: 'Dashboard' },
  { href: '/teams',        label: 'Teams' },
  { href: '/players',      label: 'Players' },
  { href: '/analytics',    label: 'Analytics' },
  { href: '/match/create', label: '+ Match' },
];

import ThemeToggle from '@/components/ui/ThemeToggle';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { email, logout, init } = useAuthStore();

  useEffect(() => { init(); }, [init]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <span className="text-2xl transition-transform group-hover:scale-110">🏏</span>
          <span className="font-display text-2xl font-bold tracking-tight">
            CRIC<span className="text-primary">SCORE</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                pathname === l.href
                  ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                  : 'text-muted hover:text-text hover:bg-primary/10'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-card border border-border rounded-full">
            <OfflineBadge />
            <span className="text-xs text-muted font-medium truncate max-w-[120px]">{email}</span>
          </div>
          
          <ThemeToggle />
          
          <button
            onClick={handleLogout}
            className="md:px-4 md:py-2 p-2 text-sm font-medium text-danger border border-danger/20 hover:bg-danger/10 rounded-lg transition-colors"
            title="Logout"
          >
            <span className="hidden md:inline">Logout</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="md:hidden"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" x2="9" y1="12" y2="12" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Mobile Nav Links */}
      <div className="md:hidden flex items-center justify-around py-2 border-t border-border bg-background/50">
        {navLinks.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`flex flex-col items-center gap-0.5 transition-colors ${
              pathname === l.href ? 'text-primary' : 'text-muted'
            }`}
          >
            <span className="text-[10px] uppercase font-bold tracking-wider">{l.label.replace('+ ', '')}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
