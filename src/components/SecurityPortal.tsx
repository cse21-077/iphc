import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { IScannerControls } from '@zxing/browser';
import {
  AlertCircle,
  CalendarDays,
  Camera,
  CheckCircle2,
  Clock3,
  Home,
  LoaderCircle,
  LogOut,
  MapPin,
  Scan,
  ShieldCheck,
  UserRound,
  Users,
} from 'lucide-react';
import {
  getSecurityEvents,
  recordSecurityCheckIn,
  EVENT_QR_PREFIX,
  SecurityCheckIn,
  SecurityEvent,
  SecurityProfile,
} from '../api';
import { t, useTranslation } from '../data/i18n';
import { QRCodeDisplay } from './QRCodeDisplay';

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : t('common.errorGeneric');

const formatEventTime = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));

const formatEventClock = (value: string) =>
  new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(new Date(value));

const startOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const addDays = (date: Date, days: number) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const dayKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const CARD_TINTS = [
  { bg: 'bg-[#EAF1FB]', icon: 'text-[#3F76C5]' },
  { bg: 'bg-[#FFF3D1]', icon: 'text-[#B98600]' },
  { bg: 'bg-[#FBE7E8]', icon: 'text-[#D13138]' },
];

type SecurityTab = 'desk' | 'scan' | 'profile';

const QrScanner: React.FC<{
  enabled: boolean;
  onDetected: (value: string) => void;
}> = ({ enabled, onDetected }) => {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const { t } = useTranslation();
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
      setCameraError(t('security.cameraUnsupported'));
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
            ? t('security.cameraDenied')
            : t('security.cameraFailed')
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
            {t('security.cameraFrameHint')}
          </p>
          <button
            type="button"
            onClick={stopCamera}
            className="absolute right-3 top-3 rounded-full bg-black/50 px-3 py-1.5 text-xs font-bold text-white"
          >
            {t('security.stopCamera')}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={startCamera}
          disabled={!enabled}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#0A2A52] to-[#164A86] px-4 py-4 text-sm font-extrabold text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Camera className="h-4 w-4" />
          {t('security.openScanner')}
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
  const [activeTab, setActiveTab] = useState<SecurityTab>('desk');
  const [selectedDay, setSelectedDay] = useState('');
  const [membershipNumber, setMembershipNumber] = useState('');
  const [lastCheckIn, setLastCheckIn] = useState<SecurityCheckIn | null>(null);
  const [loadError, setLoadError] = useState('');
  const [pageError, setPageError] = useState('');
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const { t } = useTranslation();

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
      .then(() => {
        if (active) setLoadError('');
      })
      .catch((error: unknown) => {
        if (active) setLoadError(errorMessage(error));
      });
    return () => {
      active = false;
    };
  }, [loadEvents]);

  const today = useMemo(() => startOfDay(new Date()), []);
  const todayKey = dayKey(today);

  const eventsByDay = useMemo(() => {
    const grouped = new Map<string, SecurityEvent[]>();
    [...events]
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
      .forEach((event) => {
        const key = dayKey(new Date(event.startsAt));
        const list = grouped.get(key);
        if (list) list.push(event);
        else grouped.set(key, [event]);
      });
    return grouped;
  }, [events]);

  // Day strip spans the Sunday-to-Saturday window that covers today and every
  // published event (capped at four weeks) so nothing is ever unreachable.
  const stripDays = useMemo(() => {
    const eventDates = events.map((event) => startOfDay(new Date(event.startsAt)).getTime());
    const min = new Date(Math.min(today.getTime(), ...eventDates));
    const max = new Date(Math.max(today.getTime(), ...eventDates));
    const start = addDays(min, -min.getDay());
    const end = addDays(max, 6 - max.getDay());
    const days: Date[] = [];
    for (let d = start; days.length < 28 && d.getTime() <= end.getTime(); d = addDays(d, 1)) {
      days.push(d);
    }
    return days;
  }, [events, today]);

  const defaultDay = useMemo(() => {
    if (eventsByDay.has(todayKey)) return todayKey;
    for (const [key] of eventsByDay) return key;
    return todayKey;
  }, [eventsByDay, todayKey]);

  const effectiveDay = selectedDay || defaultDay;
  const dayEvents = eventsByDay.get(effectiveDay) ?? [];
  const selectedEvent = events.find((event) => event.id === selectedEventId);

  const refreshEvents = () => {
    setLoadError('');
    void loadEvents().catch((error: unknown) => setLoadError(errorMessage(error)));
  };

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

  const selectDay = (key: string) => {
    setSelectedDay(key);
    const dayList = eventsByDay.get(key);
    if (dayList?.length) setSelectedEventId(dayList[0].id);
    setLastCheckIn(null);
    setPageError('');
  };

  const selectEvent = (eventId: string) => {
    setSelectedEventId(eventId);
    setLastCheckIn(null);
    setPageError('');
  };

  const firstName = profile.name.split(' ').filter(Boolean)[0] ?? profile.name;
  const initials = profile.name
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const todayLabel = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' }).format(today);
  const todayCount = eventsByDay.get(todayKey)?.length ?? 0;

  const weekdayFormatter = new Intl.DateTimeFormat(undefined, { weekday: 'short' });

  const navItems: Array<{ id: SecurityTab; label: string; icon: React.ReactNode }> = [
    { id: 'desk', label: t('security.desk'), icon: <Home className="h-5 w-5" /> },
    { id: 'scan', label: t('security.scan'), icon: <Scan className="h-5 w-5" /> },
    { id: 'profile', label: t('security.profile'), icon: <UserRound className="h-5 w-5" /> },
  ];

  return (
    <main className="min-h-screen bg-[#F3F6FA] pb-[env(safe-area-inset-bottom)] text-slate-900">
      <div className="mx-auto max-w-md px-4 pb-32 pt-[calc(env(safe-area-inset-top)+1.25rem)]">
        {/* Greeting header: avatar + hello/date + sign out */}
        <header className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#164A86] to-[#0A2A52] text-sm font-black tracking-wide text-white shadow-md ring-2 ring-white">
                {initials}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-[#F5B301] ring-2 ring-[#F3F6FA]" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-black tracking-tight text-[#0A2A52]">{t('security.hello', { name: firstName })}</h1>
              <p className="text-xs font-semibold text-slate-500">{t('security.today', { date: todayLabel })}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            aria-label={t('security.signOutAria')}
            title={t('security.signOut')}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-[#0A2A52] shadow-sm transition hover:text-[#D13138] active:scale-95"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </header>

        {loadError && (
          <p role="alert" className="mt-4 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{loadError}
          </p>
        )}

        {activeTab === 'desk' && (
          <div className="mt-5 space-y-5">
            {/* Hero card */}
            <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#E7EFFC] to-[#D7E5F9] p-5 shadow-[0_10px_30px_rgba(10,42,82,0.10)]">
              <div className="pointer-events-none absolute -right-5 -top-6 h-24 w-24 rounded-full bg-[#D13138] opacity-90 shadow-[0_10px_24px_rgba(209,49,56,0.35)]" />
              <div className="pointer-events-none absolute right-12 top-8 h-14 w-14 rounded-full bg-[#F5B301] opacity-90 shadow-[0_10px_24px_rgba(245,179,1,0.35)]" />
              <div className="pointer-events-none absolute -bottom-7 right-2 h-20 w-20 rounded-full bg-[#0A2A52] opacity-95 shadow-[0_10px_24px_rgba(10,42,82,0.35)]" />
              <div className="pointer-events-none absolute -bottom-10 right-16 h-16 w-16 rounded-full bg-[#3F76C5] opacity-70 blur-[1px]" />

              <div className="relative z-10 max-w-[68%]">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#0A2A52]">
                  <ShieldCheck className="h-3 w-3 text-[#D13138]" />
                  IPHC • Gate team
                </span>
                <h2 className="mt-3 text-2xl font-black tracking-tight text-[#0A2A52]">{t('security.gateDuty')}</h2>
                <p className="mt-1 text-xs font-semibold leading-relaxed text-[#3D5876]">
                  {t('security.gateDutySub')}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-extrabold text-[#0A2A52] shadow-sm">
                    {t(events.length === 1 ? 'security.upcomingEvents' : 'security.upcomingEventsPlural', { count: events.length })}
                  </span>
                  <span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-extrabold text-[#0A2A52] shadow-sm">
                    {t('security.todayCount', { count: todayCount })}
                  </span>
                </div>
              </div>
            </section>

            {/* Week strip */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pt-1">
              {stripDays.map((day) => {
                const key = dayKey(day);
                const hasEvents = eventsByDay.has(key);
                const isSelected = key === effectiveDay;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => selectDay(key)}
                    className={`flex w-12 shrink-0 flex-col items-center rounded-2xl py-2.5 transition active:scale-95 ${
                      isSelected
                        ? 'bg-[#0A2A52] text-white shadow-lg shadow-[#0A2A52]/25'
                        : 'bg-white text-slate-500 shadow-sm'
                    }`}
                  >
                    <span className={`text-[9px] font-extrabold uppercase tracking-wider ${isSelected ? 'text-blue-200' : 'text-slate-400'}`}>
                      {weekdayFormatter.format(day)}
                    </span>
                    <span className="text-sm font-black">{day.getDate()}</span>
                    <span className={`mt-1 h-1.5 w-1.5 rounded-full ${hasEvents ? (isSelected ? 'bg-[#F5B301]' : 'bg-[#D13138]') : 'bg-transparent'}`} />
                  </button>
                );
              })}
            </div>

            {/* Your events grid */}
            <section>
              <h3 className="text-lg font-black tracking-tight text-[#0A2A52]">{t('security.yourEvents')}</h3>
              {dayEvents.length ? (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {dayEvents.map((event, index) => {
                    const tint = CARD_TINTS[index % CARD_TINTS.length];
                    const isSelected = event.id === selectedEventId;
                    return (
                      <button
                        key={event.id}
                        type="button"
                        onClick={() => selectEvent(event.id)}
                        className={`relative flex flex-col rounded-[24px] p-4 text-left transition active:scale-[0.97] ${tint.bg} ${
                          isSelected ? 'ring-2 ring-[#0A2A52] ring-offset-2 ring-offset-[#F3F6FA]' : ''
                        }`}
                      >
                        {isSelected && (
                          <span className="absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full bg-[#0A2A52] text-white">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </span>
                        )}
                        <span className={`text-[9px] font-extrabold uppercase tracking-[0.14em] ${tint.icon}`}>
                          {event.category}
                        </span>
                        <h4 className="mt-1.5 pr-5 text-sm font-black leading-snug text-[#0A2A52]">{event.title}</h4>
                        <div className="mt-3 space-y-1.5 text-[11px] font-semibold text-slate-600">
                          <p className="flex items-center gap-1.5">
                            <Clock3 className={`h-3.5 w-3.5 shrink-0 ${tint.icon}`} />
                            {formatEventClock(event.startsAt)}
                          </p>
                          <p className="flex items-center gap-1.5">
                            <MapPin className={`h-3.5 w-3.5 shrink-0 ${tint.icon}`} />
                            <span className="truncate">{event.location}</span>
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : events.length ? (
                <div className="mt-3 rounded-[24px] border border-dashed border-slate-300 bg-white/70 px-5 py-8 text-center">
                  <CalendarDays className="mx-auto h-7 w-7 text-slate-300" />
                  <p className="mt-2 text-sm font-extrabold text-slate-700">{t('security.noEventsThisDay')}</p>
                  <p className="mt-1 text-xs font-medium text-slate-500">{t('security.noEventsThisDaySub')}</p>
                </div>
              ) : (
                <div className="mt-3 rounded-[24px] border border-dashed border-slate-300 bg-white/70 px-5 py-10 text-center">
                  <Users className="mx-auto h-8 w-8 text-slate-300" />
                  <h4 className="mt-3 text-sm font-extrabold text-slate-800">{t('security.noUpcomingEvents')}</h4>
                  <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-slate-500">
                    {t('security.noUpcomingSub')}
                  </p>
                  <button
                    type="button"
                    onClick={refreshEvents}
                    className="mt-4 text-xs font-extrabold text-[#3F76C5] hover:underline"
                  >
                    {t('security.refreshEvents')}
                  </button>
                </div>
              )}
            </section>

            {/* Selected event + official QR */}
            {selectedEvent && (
              <section className="rounded-[28px] bg-white p-5 shadow-[0_10px_30px_rgba(10,42,82,0.08)]">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">{t('security.selectedEvent')}</p>
                  <span className="rounded-full bg-[#EAF1FB] px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider text-[#3F76C5]">
                    {selectedEvent.category}
                  </span>
                </div>
                <h3 className="mt-2 text-base font-black leading-snug text-[#0A2A52]">{selectedEvent.title}</h3>
                <div className="mt-3 space-y-2 text-xs font-semibold text-slate-600">
                  <p className="flex items-center gap-2"><Clock3 className="h-4 w-4 shrink-0 text-[#3F76C5]" />{formatEventTime(selectedEvent.startsAt)}</p>
                  <p className="flex items-center gap-2"><MapPin className="h-4 w-4 shrink-0 text-[#3F76C5]" />{selectedEvent.location}</p>
                  {selectedEvent.branch && <p className="flex items-center gap-2"><Users className="h-4 w-4 shrink-0 text-[#3F76C5]" />{selectedEvent.branch}</p>}
                </div>
                <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 text-center">
                  <p className="text-xs font-extrabold text-slate-800">{t('security.officialQr')}</p>
                  <p className="mt-1 text-[11px] font-medium text-slate-500">{t('security.officialQrSub')}</p>
                  <div className="mt-3 inline-flex rounded-2xl border border-slate-200 bg-white p-3">
                    <QRCodeDisplay value={`${EVENT_QR_PREFIX}${selectedEvent.id}`} size={160} />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('scan')}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#0A2A52] to-[#164A86] px-4 py-3.5 text-sm font-extrabold text-white transition active:scale-[0.98]"
                >
                  <Scan className="h-4 w-4" />
                  {t('security.openScanner')}
                </button>
              </section>
            )}

            {/* Guidance */}
            <section className="rounded-[24px] bg-[#FEF6E0] p-4">
              <div className="flex items-center gap-2 text-amber-900">
                <ShieldCheck className="h-4 w-4 text-[#B98600]" />
                <h3 className="text-xs font-extrabold">{t('security.guidance')}</h3>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-amber-900/75">
                {t('security.guidanceSub')}
              </p>
            </section>
          </div>
        )}

        {activeTab === 'scan' && (
          <div className="mt-5 space-y-4">
            {selectedEvent ? (
              <>
                <section className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#0A2A52] via-[#164A86] to-[#1D4ED8] p-5 text-white shadow-[0_12px_28px_rgba(10,42,82,0.28)]">
                  <div className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
                  <div className="pointer-events-none absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-[#F5B301]/20 blur-xl" />
                  <div className="relative z-10">
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-blue-200">{t('security.scanningFor')}</p>
                    <h2 className="mt-1.5 text-lg font-black leading-snug">{selectedEvent.title}</h2>
                    <div className="mt-2.5 space-y-1.5 text-xs font-semibold text-blue-100">
                      <p className="flex items-center gap-2"><Clock3 className="h-3.5 w-3.5 shrink-0" />{formatEventTime(selectedEvent.startsAt)}</p>
                      <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 shrink-0" />{selectedEvent.location}</p>
                    </div>
                  </div>
                </section>

                <section className="rounded-[28px] bg-white p-5 shadow-[0_10px_30px_rgba(10,42,82,0.08)]">
                  <h3 className="text-base font-black text-slate-950">{t('security.memberCheckIn')}</h3>
                  <p className="mt-1 text-xs font-medium text-slate-500">{t('security.memberCheckInSub')}</p>

                  {pageError && (
                    <p role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{pageError}
                    </p>
                  )}

                  {lastCheckIn && (
                    <div role="status" className="mt-4 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                      <div>
                        <p className="text-sm font-extrabold text-emerald-900">{t('security.checkedIn')}</p>
                        <p className="mt-1 text-xs font-semibold text-emerald-800">{lastCheckIn.memberName}</p>
                        <p className="mt-0.5 text-[11px] text-emerald-700">{lastCheckIn.membershipNumber} · {lastCheckIn.eventName}</p>
                      </div>
                    </div>
                  )}

                  <div className="mt-4">
                    <QrScanner enabled={!isCheckingIn} onDetected={handleDetected} />
                  </div>

                  <div className="my-5 flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    <span className="h-px flex-1 bg-slate-200" /> {t('security.orEnterNumber')} <span className="h-px flex-1 bg-slate-200" />
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
                      placeholder={t('security.memberNumberPh')}
                      aria-label={t('security.memberNumber')}
                      className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-[#3F76C5] focus:ring-2 focus:ring-[#3F76C5]/15"
                    />
                    <button
                      type="submit"
                      disabled={isCheckingIn}
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0A2A52] to-[#164A86] px-4 py-3 text-xs font-extrabold text-white transition active:scale-95 disabled:opacity-50"
                    >
                      {isCheckingIn ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      {t('security.checkIn')}
                    </button>
                  </form>
                </section>
              </>
            ) : (
              <div className="rounded-[24px] border border-dashed border-slate-300 bg-white/70 px-5 py-12 text-center">
                <Camera className="mx-auto h-8 w-8 text-slate-300" />
                <h4 className="mt-3 text-sm font-extrabold text-slate-800">{t('security.noEventToScan')}</h4>
                <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-slate-500">
                  {t('security.noEventToScanSub')}
                </p>
                <button
                  type="button"
                  onClick={refreshEvents}
                  className="mt-4 text-xs font-extrabold text-[#3F76C5] hover:underline"
                >
                  {t('security.refreshEvents')}
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="mt-5">
            <section className="rounded-[28px] bg-white p-6 shadow-[0_10px_30px_rgba(10,42,82,0.08)]">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#164A86] to-[#0A2A52] text-2xl font-black tracking-wide text-white shadow-md ring-4 ring-[#EAF1FB]">
                  {initials}
                </div>
                <h3 className="mt-4 text-lg font-black text-slate-950">{profile.name}</h3>
                <span className="mt-2 rounded-full bg-[#EAF1FB] px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#3F76C5]">
                  {t('security.profileRole')}
                </span>
              </div>
              <dl className="mt-6 space-y-4 border-t border-slate-100 pt-5">
                <div>
                  <dt className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">{t('security.workEmail')}</dt>
                  <dd className="mt-1 text-sm font-semibold text-slate-800">{profile.email}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">{t('security.assignedBranch')}</dt>
                  <dd className="mt-1 text-sm font-semibold text-slate-800">{profile.branch ?? t('security.allBranches')}</dd>
                </div>
              </dl>
              <button
                type="button"
                onClick={handleSignOut}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FBE7E8] px-4 py-3.5 text-sm font-extrabold text-[#D13138] transition hover:bg-[#F8DBDD] active:scale-[0.98]"
              >
                <LogOut className="h-4 w-4" />
                {t('security.signOut')}
              </button>
            </section>
          </div>
        )}
      </div>

      {/* Floating pill navigation */}
      <nav
        aria-label="Security app navigation"
        className="fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-md justify-center px-6 pb-[calc(env(safe-area-inset-bottom)+1rem)]"
      >
        <div className="flex items-center gap-1.5 rounded-full bg-white/95 p-2 shadow-[0_12px_40px_rgba(10,42,82,0.16)] ring-1 ring-slate-900/5 backdrop-blur-xl">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                aria-label={item.label}
                title={item.label}
                className={`grid h-11 w-11 place-items-center rounded-full transition active:scale-95 ${
                  isActive
                    ? 'bg-[#0A2A52] text-white shadow-lg shadow-[#0A2A52]/25'
                    : 'text-slate-400 hover:text-[#0A2A52]'
                }`}
              >
                {item.icon}
              </button>
            );
          })}
        </div>
      </nav>
    </main>
  );
};
