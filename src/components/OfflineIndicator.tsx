import React from 'react';
import { useOnlineStatus } from '../hooks/usePWAInstall';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      id="pwa-offline-banner"
      className="fixed top-2 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-slate-900/90 text-white px-3.5 py-1.5 text-xs font-medium shadow-xl backdrop-blur-md border border-slate-700/50 animate-bounce"
    >
      <WifiOff className="w-3.5 h-3.5 text-amber-400" />
      <span>Offline Mode — Cached Silo Card & Data Available</span>
    </div>
  );
};
