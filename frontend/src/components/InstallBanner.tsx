'use client';
import { usePWA } from '@/lib/usePWA';
import { useState } from 'react';

export default function InstallBanner() {
  const { installPrompt, isInstalled, triggerInstall } = usePWA();
  const [dismissed, setDismissed] = useState(false);

  if (isInstalled || dismissed || !installPrompt) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4
                    bg-[#161b22] border-t border-[#30363d]
                    flex items-center gap-3 shadow-2xl">
      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#1a7a3c]/20
                      flex items-center justify-center text-xl">
        🏏
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white">Install CricScore</p>
        <p className="text-xs text-gray-400 truncate">Score matches offline from your home screen</p>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <button
          onClick={() => setDismissed(true)}
          className="text-xs text-gray-500 px-3 py-2 hover:text-gray-300 transition-colors"
        >
          Not now
        </button>
        <button
          onClick={triggerInstall}
          className="text-xs bg-[#1a7a3c] hover:bg-[#2aad56] text-white
                     px-4 py-2 rounded-lg font-semibold transition-colors"
        >
          Install
        </button>
      </div>
    </div>
  );
}
