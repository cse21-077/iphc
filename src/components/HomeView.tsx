import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  BookOpen,
  Clock3,
  MapPin,
  QrCode,
  Sun,
  UserRound,
} from 'lucide-react';
import { MemberProfile } from '../types';
import { getEvents, MemberEvent } from '../api';
import { useTranslation } from '../data/i18n';

interface HomeViewProps {
  member: MemberProfile;
  hasUnseenNotices: boolean;
  onNavigateTab: (tab: 'home' | 'calendar' | 'scan' | 'flg' | 'profile') => void;
  onOpenEvents: () => void;
  onOpenAttendance: () => void;
  onOpenMedia: () => void;
  onOpenNotifications: () => void;
  onOpenMembershipPass: () => void;
}

const CARD_TINTS = [
  { bg: 'bg-[#EAF1FB]', icon: 'text-[#3F76C5]' },
  { bg: 'bg-[#FFF3D1]', icon: 'text-[#B98600]' },
  { bg: 'bg-[#FBE7E8]', icon: 'text-[#D13138]' },
];

export const HomeView: React.FC<HomeViewProps> = ({
  member,
  hasUnseenNotices,
  onNavigateTab,
  onOpenEvents,
  onOpenAttendance,
  onOpenMedia,
  onOpenNotifications,
  onOpenMembershipPass,
}) => {
  const { t, dateLocale } = useTranslation();
  const [events, setEvents] = useState<MemberEvent[]>([]);
  const [eventsFailed, setEventsFailed] = useState(false);
  const [photoFailed, setPhotoFailed] = useState(false);

  useEffect(() => setPhotoFailed(false), [member.photo]);

  useEffect(() => {
    let active = true;
    getEvents()
      .then((items) => {
        if (active) setEvents(items);
      })
      .catch(() => {
        if (active) setEventsFailed(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const initials = member.name
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const nextEvent = events[0];
  const nextEventDate = nextEvent
    ? new Intl.DateTimeFormat(dateLocale, { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(nextEvent.startsAt))
    : '';
  const formatClock = (value: string) =>
    new Intl.DateTimeFormat(dateLocale, { hour: '2-digit', minute: '2-digit' }).format(new Date(value));

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col pb-28 max-w-md mx-auto space-y-5 px-4 pt-3">
      {/* Top Header Row: photo avatar + greeting + clean bell */}
      <div className="pt-2 pb-1 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-slate-200 shadow-xs bg-[#0A2A52]">
              {member.photo && !photoFailed ? (
                <img
                  src={member.photo}
                  alt={member.name}
                  className="w-full h-full object-cover"
                  onError={() => setPhotoFailed(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white font-black text-sm tracking-wide">
                  {initials || <UserRound className="w-5 h-5" />}
                </div>
              )}
            </div>
            {!member.isPending && (
              <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-0.5">
              <Sun className="w-3.5 h-3.5 text-[#3F76C5]" />
              <span>{t('home.kgotso')}</span>
            </div>
            <h1 className="text-xl font-black text-[#0A2A52] tracking-tight truncate">
              {member.title} {member.name}
            </h1>
            <p className="text-xs text-[#3F76C5] font-semibold mt-0.5 truncate">
              {member.branch}
            </p>
          </div>
        </div>

        <button
          id="home-notice-badge"
          onClick={onOpenNotifications}
          className="mt-1 p-2 text-[#0A2A52] hover:text-[#3F76C5] active:scale-95 transition relative"
          title={t('notifications.titleTooltip')}
          aria-label={t('notifications.viewAria')}
        >
          <Bell className="w-5 h-5 text-[#0A2A52] stroke-[2]" />
          {hasUnseenNotices && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#D13138] ring-2 ring-white" />
          )}
        </button>
      </div>

      {/* Hero Feature Card: Blue Digital ID Card */}
      <div
        id="hero-silo-pass-card"
        onClick={onOpenMembershipPass}
        className={`relative rounded-[24px] text-white p-5 overflow-hidden cursor-pointer active:scale-[0.99] transition-all duration-150 group border select-none ${
          member.isPending
            ? 'bg-slate-800/90 border-slate-700/80 shadow-md grayscale-[30%]'
            : 'bg-gradient-to-br from-[#0A2A52] via-[#164A86] to-[#1D4ED8] shadow-[0_12px_28px_rgba(10,42,82,0.28)] border-blue-300/25'
        }`}
      >
        <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute left-1/4 -top-8 w-32 h-32 rounded-full bg-white/5 blur-xl pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-blue-200/90">
                {t('home.digitalId')}
              </span>
              {member.isPending && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[9px] font-extrabold uppercase">
                  {t('home.pending')}
                </span>
              )}
            </div>
            <h2 className="text-xl font-black font-mono tracking-tight text-white mt-0.5 truncate">
              {member.membershipNumber}
            </h2>
            <p className="text-xs text-blue-100 font-semibold mt-0.5 truncate">
              {member.isPending ? t('home.verificationBy', { branch: member.branch }) : t('home.officialClearance')}
            </p>
          </div>

          <div className="shrink-0 relative">
            <div className="w-15 h-15 rounded-full overflow-hidden border-2 border-white/70 shadow-md relative group-hover:scale-105 transition duration-200 bg-white/20">
              {member.photo && !photoFailed ? (
                <img
                  src={member.photo}
                  alt={member.name}
                  className="w-full h-full object-cover"
                  onError={() => setPhotoFailed(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white font-black text-base tracking-wide bg-[#3F76C5]">
                  {initials}
                </div>
              )}
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                <QrCode className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Clean Footer Row */}
        <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between text-xs relative z-10">
          <span className="font-semibold text-blue-100 truncate">
            {member.section}
          </span>
          <span className="text-[11px] font-bold text-blue-200 uppercase tracking-wider">
            {member.isPending ? t('home.pendingNotice') : t('home.tapForScanner')}
          </span>
        </div>
      </div>

      {/* Upcoming events — same tinted card design as the security gate duty */}
      <section>
        <div className="flex items-center justify-between px-0.5 mb-3">
          <h3 className="text-base font-extrabold text-[#181D20] tracking-tight">
            {t('home.upcomingEvents')}
          </h3>
          <button
            onClick={onOpenEvents}
            className="text-xs font-semibold text-slate-400 hover:text-slate-900 transition"
          >
            {t('common.seeAll')}
          </button>
        </div>

        {events.length ? (
          <div className="grid grid-cols-2 gap-3">
            {events.slice(0, 4).map((event, index) => {
              const tint = CARD_TINTS[index % CARD_TINTS.length];
              return (
                <button
                  key={event.id}
                  type="button"
                  onClick={onOpenEvents}
                  className={`flex flex-col rounded-[24px] p-4 text-left transition active:scale-[0.97] ${tint.bg}`}
                >
                  <span className={`text-[9px] font-extrabold uppercase tracking-[0.14em] ${tint.icon}`}>
                    {event.category}
                  </span>
                  <h4 className="mt-1.5 text-sm font-black leading-snug text-[#0A2A52] line-clamp-2">
                    {event.title}
                  </h4>
                  <div className="mt-3 space-y-1.5 text-[11px] font-semibold text-slate-600">
                    <p className="flex items-center gap-1.5">
                      <Clock3 className={`h-3.5 w-3.5 shrink-0 ${tint.icon}`} />
                      {formatClock(event.startsAt)}
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
        ) : (
          <button
            type="button"
            onClick={onOpenEvents}
            className="w-full rounded-[24px] border border-dashed border-slate-300 bg-white/70 px-5 py-6 text-center transition active:scale-[0.99]"
          >
            <p className="text-xs font-extrabold text-slate-600">
              {eventsFailed ? t('common.errorGeneric') : t('home.noEvents')}
            </p>
            <p className="mt-1 text-[11px] font-medium text-slate-400">{t('home.events')}</p>
          </button>
        )}
      </section>

      {/* Quick Actions: long image cards */}
      <div className="space-y-3">
        <h3 className="text-base font-extrabold text-[#181D20] tracking-tight px-0.5">
          {t('home.quickActions')}
        </h3>

        <div className="space-y-3">
          {/* Card 1: Events → calendar */}
          <div
            id="home-card-events"
            onClick={onOpenEvents}
            className="relative rounded-[22px] overflow-hidden shadow-md border border-slate-200/60 h-[115px] p-4 flex flex-col justify-between group cursor-pointer active:scale-[0.99] transition duration-150"
            style={{
              backgroundImage: `url('/silo.jpg')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/75 to-slate-950/40 group-hover:from-slate-950/95 transition duration-200" />

            <div className="relative z-10 flex items-center justify-between">
              <Sun className="w-5 h-5 text-white stroke-[2.2]" />
              <div className="w-7 h-7 rounded-full bg-white/10 group-hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 transition">
                <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>

            <div className="relative z-10 min-w-0">
              <h4 className="text-sm font-black text-white leading-tight truncate">
                {nextEvent?.title ?? t('home.events')}
              </h4>
              <p className="text-xs text-slate-300 font-medium mt-0.5 truncate">
                {nextEvent ? `${nextEventDate} · ${nextEvent.location}` : t('home.events')}
              </p>
            </div>
          </div>

          {/* Card 2: Attendance history (replaces the retired Give card) */}
          <div
            id="home-card-attendance"
            onClick={onOpenAttendance}
            className="relative rounded-[22px] overflow-hidden shadow-md border border-slate-200/60 h-[115px] p-4 flex flex-col justify-between group cursor-pointer active:scale-[0.99] transition duration-150 bg-gradient-to-br from-[#0A2A52] via-[#164A86] to-[#1D4ED8]"
          >
            <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-white/10 blur-2xl pointer-events-none" />

            <div className="relative z-10 flex items-center justify-between">
              <Clock3 className="w-5 h-5 text-white stroke-[2.2]" />
              <div className="w-7 h-7 rounded-full bg-white/10 group-hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 transition">
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>

            <div className="relative z-10 min-w-0">
              <h4 className="text-sm font-black text-white leading-tight truncate">
                {t('profile.hubAttendance')}
              </h4>
              <p className="text-xs text-blue-100 font-medium mt-0.5 truncate">
                {t('profile.hubAttendanceSub')}
              </p>
            </div>
          </div>

          {/* Card 3: Watch & Listen */}
          <div
            id="home-card-media"
            onClick={onOpenMedia}
            className="relative rounded-[22px] overflow-hidden shadow-md border border-slate-200/60 h-[115px] p-4 flex flex-col justify-between group cursor-pointer active:scale-[0.99] transition duration-150"
            style={{
              backgroundImage: `url('/watch.jpg')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/75 to-slate-950/40 group-hover:from-slate-950/95 transition duration-200" />

            <div className="relative z-10 flex items-center justify-between">
              <QrCode className="w-5 h-5 text-white stroke-[2.2]" />
              <div className="w-7 h-7 rounded-full bg-white/10 group-hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 transition">
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>

            <div className="relative z-10 min-w-0">
              <h4 className="text-sm font-black text-white leading-tight truncate">
                {t('media.titleCard')}
              </h4>
              <p className="text-xs text-slate-300 font-medium mt-0.5 truncate">
                {t('media.subCard')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Spiritual Thought */}
      <div className="bg-white rounded-[24px] p-5 border border-[#3F76C5]/15 shadow-sm">
        <div className="flex items-center gap-2 text-[#0A2A52] mb-2">
          <BookOpen className="w-4 h-4 stroke-[2.2]" />
          <span className="text-[11px] font-black uppercase tracking-wider">
            {t('home.dailyReflection')}
          </span>
        </div>
        <p className="text-xs italic text-slate-700 leading-relaxed font-medium">
          “Morena ke modisa wa ka, nke ke ka hloka letho. O mphomotsa mafulong a matala, o nkisa metsing a khutsitseng.”
        </p>
        <span className="block text-[11px] font-extrabold text-slate-400 mt-2">
          — Pesalema 23:1-2
        </span>
      </div>
    </div>
  );
};
