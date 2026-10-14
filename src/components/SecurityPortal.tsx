import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { IScannerControls } from '@zxing/browser';
import {
  AlertCircle,
  ArrowLeft,
  Camera,
  CheckCircle2,
  ChevronDown,
  Clock3,
  DoorOpen,
  LoaderCircle,
  LogOut,
  ShieldCheck,
  UserRound,
  Users,
} from 'lucide-react';
import {
  getSecurityEvents,
  recordSecurityCheckIn,
  SecurityCheckIn,
  SecurityEvent,
  SecurityProfile,
} from '../api';

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Something went wrong. Please try again.';

const formatEventTime = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));

const QrScanner: React.FC<{
  enabled: boolean;
  onDetected: (value: string) => void;
}> = ({ enabled, onDetected }) => {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerControlsRef = useRef<IScannerControls | null>(null);

  const stopCamera = useCallback(() => {
    scannerControlsRef.current?.stop();
    scannerControlsRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  }, []);

  const startCamera = () => {
    setCameraError('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera access requires a supported browser on HTTPS or localhost. Enter the membership number below instead.');
      return;
    }
    setCameraActive(true);
  };

  useEffect(() => {
    if (!cameraActive || !enabled || !videoRef.current) return;
    let active = true;
    let detected = false;
    const startScanner = async () => {
      try {
        const { BrowserQRCodeReader } = await import('@zxing/browser');
        if (!active || !videoRef.current) return;
        const reader = new BrowserQRCodeReader();
        const controls = await reader.decodeFromVideoDevice(undefined, videoRef.current, (result, _error, scanControls) => {
          if (!active || detected || !result) return;
          detected = true;
          scanControls.stop();
          scannerControlsRef.current = null;
          setCameraActive(false);
          onDetected(result.getText().trim());
        });
        if (!active || detected) {
          controls.stop();
          return;
        }
        scannerControlsRef.current = controls;
      } catch (error) {
        if (!active) return;
        setCameraActive(false);
        setCameraError(
          error instanceof Error && error.name === 'NotAllowedError'
            ? 'Allow camera access in your browser settings, or enter the membership number below.'
            : 'Could not start the camera. Enter the membership number below instead.'
        );
      }
    };
    void startScanner();

    return () => {
      active = false;
      scannerControlsRef.current?.stop();
      scannerControlsRef.current = null;
    };
  }, [cameraActive, enabled, onDetected]);

  useEffect(() => {
    if (!enabled) stopCamera();
  }, [enabled, stopCamera]);

  return (
    <div className="space-y-3">
      {cameraActive ? (
        <div className="relative overflow-hidden rounded-2xl bg-slate-950 aspect-[4/3]">
          <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
          <div className="pointer-events-none absolute inset-8 rounded-3xl border-2 border-white/80 shadow-[0_0_0_999px_rgba(15,23,42,0.25)]" />
          <p className="absolute bottom-3 inset-x-3 text-center text-xs font-semibold text-white drop-shadow">
            Hold the member's QR code inside the frame
          </p>
          <button
            type="button"
            onClick={stopCamera}
            className="absolute right-3 top-3 rounded-full bg-black/50 px-3 py-1.5 text-xs font-bold text-white"
          >
            Stop camera
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={startCamera}
          disabled={!enabled}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0A2A52] px-4 py-3.5 text-sm font-extrabold text-white transition hover:bg-[#164A86] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Camera className="h-4 w-4" />
          Open camera scanner
        </button>
      )}
      {cameraError && (
        <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-900">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {cameraError}
        </p>
      )}
    </div>
  );
};

export const SecurityPortal: React.FC<{
  profile: SecurityProfile;
  onSignOut: () => Promise<void>;
}> = ({ profile, onSignOut }) => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [activeTab, setActiveTab] = useState<'check-in' | 'profile'>('check-in');
  const [membershipNumber, setMembershipNumber] = useState('');
  const [lastCheckIn, setLastCheckIn] = useState<SecurityCheckIn | null>(null);
  const [pageError, setPageError] = useState('');
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  const loadEvents = useCallback(async () => {
    const availableEvents = await getSecurityEvents();
    setEvents(availableEvents);
    setSelectedEventId((current) =>
      availableEvents.some((event) => event.id === current) ? current : availableEvents[0]?.id ?? ''
    );
  }, []);

  useEffect(() => {
    let active = true;
    loadEvents()
      .catch((error: unknown) => {
        if (active) setPageError(errorMessage(error));
      });
    return () => {
      active = false;
    };
  }, [loadEvents]);

  const submitCheckIn = useCallback(async (code: string) => {
    if (!selectedEventId || isCheckingIn) return;
    setIsCheckingIn(true);
    setPageError('');
    setLastCheckIn(null);
    try {
      const result = await recordSecurityCheckIn(selectedEventId, code);
      setLastCheckIn(result);
      setMembershipNumber('');
    } catch (error) {
      setPageError(errorMessage(error));
    } finally {
      setIsCheckingIn(false);
    }
  }, [isCheckingIn, selectedEventId]);

  const handleDetected = useCallback((code: string) => {
    void submitCheckIn(code);
  }, [submitCheckIn]);

  const handleSignOut = () => {
    void onSignOut();
  };

  const selectedEvent = events.find((event) => event.id === selectedEventId);

  return (
    <main className="min-h-screen bg-[#F3F6FA] pb-[env(safe-area-inset-bottom)] text-slate-900">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#081D3B] pt-[env(safe-area-inset-top)] text-white">
        <div className="mx-auto flex max-w-md items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
              <ShieldCheck className="h-5 w-5 text-blue-200" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-extrabold uppercase tracking-[0.17em] text-blue-200">IPHC • Gate team</p>
              <h1 className="truncate text-base font-black">Member check-in</h1>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-xs font-bold text-blue-100 transition hover:bg-white/10"
          >
            <LogOut className="h-4 w-4" /><span>Sign out</span>
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-md px-4 py-5 pb-24">
        <div className="mb-5">
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Welcome back</p>
            <h2 className="mt-1 text-xl font-black tracking-tight text-[#0A2A52]">{profile.name}</h2>
            <p className="mt-1 text-xs font-medium text-slate-500">
              {profile.branch ? `${profile.branch} gate team` : 'Church-wide access'}
            </p>
          </div>
        </div>

        {activeTab === 'check-in' ? (
          <div className="space-y-4">
            <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-5 flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-800">
                  <DoorOpen className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-950">Member check-in</h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">Choose the event, then scan the QR on the member's digital card.</p>
                </div>
              </div>

              <label className="mb-5 block">
                <span className="mb-1.5 block text-xs font-extrabold text-slate-700">Event</span>
                <span className="relative block">
                  <select
                    value={selectedEventId}
                    onChange={(event) => {
                      setSelectedEventId(event.target.value);
                      setLastCheckIn(null);
                      setPageError('');
                    }}
                    disabled={!events.length}
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-3 pl-4 pr-10 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
                  >
                    {events.length ? events.map((event) => (
                      <option key={event.id} value={event.id}>
                        {event.title} · {formatEventTime(event.startsAt)}
                      </option>
                    )) : <option value="">No events available</option>}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </span>
              </label>

              {pageError && (
                <p role="alert" className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{pageError}
                </p>
              )}

              {lastCheckIn && (
                <div role="status" className="mb-4 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <div>
                    <p className="text-sm font-extrabold text-emerald-900">Member checked in</p>
                    <p className="mt-1 text-xs font-semibold text-emerald-800">{lastCheckIn.memberName}</p>
                    <p className="mt-0.5 text-[11px] text-emerald-700">{lastCheckIn.membershipNumber} · {lastCheckIn.eventName}</p>
                  </div>
                </div>
              )}

              {events.length ? (
                <>
                  <QrScanner enabled={Boolean(selectedEventId) && !isCheckingIn} onDetected={handleDetected} />
                  <div className="my-5 flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    <span className="h-px flex-1 bg-slate-200" /> Or enter member number <span className="h-px flex-1 bg-slate-200" />
                  </div>
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      void submitCheckIn(membershipNumber.trim());
                    }}
                    className="flex gap-2"
                  >
                    <input
                      value={membershipNumber}
                      onChange={(event) => setMembershipNumber(event.target.value)}
                      required
                      maxLength={32}
                      placeholder="e.g. ZB-000123"
                      aria-label="Member number"
                      className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                    <button
                      type="submit"
                      disabled={!selectedEventId || isCheckingIn}
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-xs font-extrabold text-white transition hover:bg-blue-800 disabled:opacity-50"
                    >
                      {isCheckingIn ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      Check in
                    </button>
                  </form>
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
                  <Users className="mx-auto h-8 w-8 text-slate-300" />
                  <h4 className="mt-3 text-sm font-extrabold text-slate-800">No upcoming events</h4>
                  <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-slate-500">
                    Published events assigned to your gate will appear here when they are available.
                  </p>
                  <button
                    type="button"
                    onClick={() => void loadEvents().catch((error: unknown) => setPageError(errorMessage(error)))}
                    className="mt-4 text-xs font-extrabold text-blue-700 hover:underline"
                  >
                    Refresh events
                  </button>
                </div>
              )}
            </section>

            <aside className="space-y-4">
              <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Selected event</p>
                {selectedEvent ? (
                  <>
                    <h3 className="mt-3 text-base font-black leading-snug text-[#0A2A52]">{selectedEvent.title}</h3>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{selectedEvent.category}</p>
                    <div className="mt-4 space-y-2.5 border-t border-slate-100 pt-4 text-xs text-slate-600">
                      <p className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-blue-700" />{formatEventTime(selectedEvent.startsAt)}</p>
                      <p className="flex items-center gap-2"><DoorOpen className="h-4 w-4 text-blue-700" />{selectedEvent.location}</p>
                      {selectedEvent.branch && <p className="flex items-center gap-2"><Users className="h-4 w-4 text-blue-700" />{selectedEvent.branch}</p>}
                    </div>
                  </>
                ) : (
                  <p className="mt-3 text-xs text-slate-500">Choose an event to begin check-in.</p>
                )}
              </section>

              <section className="rounded-[26px] border border-blue-100 bg-blue-50/70 p-5">
                <div className="flex items-center gap-2 text-blue-900">
                  <ShieldCheck className="h-4 w-4" />
                  <h3 className="text-xs font-extrabold">Check-in guidance</h3>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-blue-900/75">
                  Scan the QR displayed on an approved member's digital card. Each member can be checked in once per event.
                </p>
              </section>
            </aside>
          </div>
        ) : (
          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-800">
                <UserRound className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-950">{profile.name}</h3>
                <p className="mt-1 text-xs font-semibold text-slate-500">Gate security staff</p>
              </div>
            </div>
            <dl className="mt-5 space-y-4">
              <div>
                <dt className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Work email</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-800">{profile.email}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Assigned branch</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-800">{profile.branch ?? 'All branches'}</dd>
              </div>
            </dl>
            <button
              type="button"
              onClick={() => setActiveTab('check-in')}
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#0A2A52] px-4 py-3 text-xs font-extrabold text-white hover:bg-[#164A86]"
            >
              <ArrowLeft className="h-4 w-4" /> Back to check-in
            </button>
          </section>
        )}
      </div>
      <nav
        className="fixed inset-x-0 bottom-0 z-20 mx-auto flex max-w-md border-t border-slate-200 bg-white/95 px-4 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] backdrop-blur"
        aria-label="Security app navigation"
      >
        <button
          type="button"
          onClick={() => setActiveTab('check-in')}
          className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-[10px] font-extrabold ${activeTab === 'check-in' ? 'text-blue-800' : 'text-slate-500'}`}
        >
          <QrCodeIcon /> Check-in
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-[10px] font-extrabold ${activeTab === 'profile' ? 'text-blue-800' : 'text-slate-500'}`}
        >
          <UserRound className="h-4 w-4" /> My profile
        </button>
      </nav>
    </main>
  );
};

const QrCodeIcon: React.FC = () => (
  <span aria-hidden="true" className="grid h-4 w-4 grid-cols-2 gap-0.5">
    <span className="rounded-[2px] border-2 border-current" />
    <span className="rounded-[2px] border-2 border-current" />
    <span className="rounded-[2px] border-2 border-current" />
    <span className="rounded-[2px] bg-current" />
  </span>
);
