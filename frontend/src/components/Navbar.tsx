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
    <nav className="sticky top-0 z-50 border-b border-[#30363d] bg-[#0d1117]/90 backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-2xl">🏏</span>
          <span className="font-display text-2xl font-bold">
            CRIC<span className="text-[#2aad56]">SCORE</span>
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                pathname === l.href
                  ? 'bg-[#1a7a3c]/30 text-[#2aad56]'
                  : 'text-gray-400 hover:text-white hover:bg-[#1c2330]'
              }`}
            >
              {l.label}
            </Link>
          ))}

          <div className="ml-3 pl-3 border-l border-[#30363d] flex items-center gap-2">
            <OfflineBadge />
            <span className="text-xs text-gray-500 hidden sm:block">{email}</span>
            <button
              onClick={handleLogout}
              className="text-xs text-gray-400 hover:text-white bg-[#1c2330] px-3 py-1.5 rounded-md transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
