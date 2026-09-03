import React from 'react';
import { PWAInstallButton } from './PWAInstallButton';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallOverlay: React.FC = () => {
  const { isInstalled } = usePWAInstall();

  // If already installed, don't show the overlay
  if (isInstalled) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('/silo.jpg')` }}
      />

      <div className="relative z-10 w-full max-w-sm p-6 rounded-3xl bg-white/90 backdrop-blur-sm border border-white/40">
        <div className="flex items-center gap-3">
          <img src="/icon.svg" alt="MMUSO" className="w-12 h-12 rounded-lg shadow-sm" />
          <div>
            <h3 className="text-lg font-black text-slate-900">Install IPHC MMUSO</h3>
            <p className="text-xs text-slate-600 mt-1">Add to your home screen for full-screen offline Silo experience.</p>
          </div>
        </div>

        <div className="mt-4 text-sm text-slate-700 space-y-3">
          <p>To continue, install the app to enable the dedicated Silo background and offline access.</p>
          <ul className="list-disc pl-5 text-xs text-slate-600">
            <li>Tap <strong>Install</strong> (or use Safari Share → Add to Home Screen on iOS).</li>
            <li>After installation the app will launch full-screen and show the Silo background.</li>
          </ul>
        </div>

        <div className="mt-5">
          <PWAInstallButton />
        </div>
      </div>
    </div>
  );
};

export default PWAInstallOverlay;
