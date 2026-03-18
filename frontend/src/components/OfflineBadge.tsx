'use client';
import { usePWA } from '@/lib/usePWA';

export default function OfflineBadge() {
  const { isOnline } = usePWA();
  if (isOnline) return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs bg-amber-500/20
                     text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
      Offline
    </span>
  );
}
