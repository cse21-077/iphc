import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Share, PlusSquare, X } from 'lucide-react';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        id="pwa-install-btn"
        onClick={install}
        className={
          compact
            ? "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-[#D13138] text-white text-xs font-semibold shadow-sm hover:bg-[#b5262c] transition active:scale-95"
            : "flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#3F76C5] to-[#245196] text-white font-semibold text-sm shadow-md hover:shadow-lg transition active:scale-98"
        }
        title="Install IPHC MMUSO on your phone home screen"
      >
        <Download className="w-4 h-4" />
        <span>Install MMUSO App</span>
      </button>
    );
  }

  // iOS Safari flow or generic install guide
  return (
    <>
      <button
        id="pwa-install-ios-btn"
        onClick={() => setShowIOSGuide(true)}
        className={
          compact
            ? "flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#3F76C5]/10 text-[#3F76C5] border border-[#3F76C5]/20 text-xs font-semibold hover:bg-[#3F76C5]/20 transition active:scale-95"
            : "flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-white border border-slate-200 text-slate-800 font-semibold text-sm shadow-sm hover:bg-slate-50 transition"
        }
        title="Add to Home Screen"
      >
        <Download className="w-3.5 h-3.5 text-[#3F76C5]" />
        <span>Install App</span>
      </button>

      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <img src="/icon.svg" alt="MMUSO" className="w-8 h-8 rounded-xl shadow-xs" />
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">Install IPHC MMUSO</h3>
                  <p className="text-xs text-slate-500">Save to your mobile home screen</p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-sm text-slate-700">
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="p-2 rounded-lg bg-[#3F76C5]/10 text-[#3F76C5] shrink-0">
                  <Share className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-xs">Step 1</p>
                  <p className="text-xs text-slate-600">Tap the <span className="font-medium text-slate-900">Share</span> button at the bottom of Safari browser.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="p-2 rounded-lg bg-[#D13138]/10 text-[#D13138] shrink-0">
                  <PlusSquare className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-xs">Step 2</p>
                  <p className="text-xs text-slate-600">Scroll down and tap <span className="font-medium text-slate-900">"Add to Home Screen"</span>.</p>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs leading-relaxed">
                ✓ Once installed, MMUSO opens full-screen without address bars and works seamlessly offline at Silo!
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full rounded-xl bg-[#3F76C5] py-2.5 text-sm font-semibold text-white hover:bg-[#3465a8] transition shadow-md shadow-blue-500/20 active:scale-98"
            >
              Got it, Done
            </button>
          </div>
        </div>
      )}
    </>
  );
};
