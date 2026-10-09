import React, { useState } from 'react';
import {
  MemberProfile,
  Ceremony,
  AnnouncementNotification,
} from '../types';
import {
  ArrowRight,
  Bell,
  BookOpen,
  Sun,
  QrCode,
  ArrowUpRight,
  Bookmark,
} from 'lucide-react';

interface HomeViewProps {
  member: MemberProfile;
  upcomingCeremony: Ceremony;
  announcements: AnnouncementNotification[];
  attendanceCount: number;
  onNavigateTab: (tab: 'home' | 'calendar' | 'scan' | 'flg' | 'profile') => void;
  onOpenPayments: (categoryId?: string) => void;
  onOpenMedia: () => void;
  onOpenNotifications: () => void;
  onOpenCeremonyRegistration: (ceremony: Ceremony) => void;
  onOpenMembershipPass: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  member,
  upcomingCeremony,
  announcements,
  attendanceCount,
  onNavigateTab,
  onOpenPayments,
  onOpenMedia,
  onOpenNotifications,
  onOpenCeremonyRegistration,
  onOpenMembershipPass,
}) => {
  const [savedItems, setSavedItems] = useState<Record<string, boolean>>({
    silo: true,
  });

  const toggleSave = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col pb-28 max-w-md mx-auto space-y-5 px-4 pt-3">
      {/* Top Header Row (Modeled after Reference Image: "Good Morning" eyebrow + Anastasia Sya + Clean Bell) */}
      <div className="pt-2 pb-1 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-0.5">
            <Sun className="w-3.5 h-3.5 text-amber-500" />
            <span>Good Day • Kgotso</span>
          </div>
          <h1 className="text-2xl font-black text-[#0A2A52] tracking-tight">
            {member.title} {member.name}
          </h1>
          <p className="text-xs text-[#3F76C5] font-semibold mt-0.5">
            {member.branch}
          </p>
        </div>

        <button
          id="home-notice-badge"
          onClick={onOpenNotifications}
          className="mt-1 p-2 text-[#0A2A52] hover:text-[#3F76C5] active:scale-95 transition relative"
          title="Announcements & Notifications"
          aria-label="View Announcements"
        >
          <Bell className="w-5 h-5 text-[#0A2A52] stroke-[2]" />
          {announcements.some((n) => !n.isRead) && (
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
        {/* Soft atmospheric gradient accents */}
        <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute left-1/4 -top-8 w-32 h-32 rounded-full bg-white/5 blur-xl pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between gap-3">
          {/* Left Column: Digital ID Typography */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-blue-200/90">
                IPHC Digital ID
              </span>
              {member.isPending && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[9px] font-extrabold uppercase">
                  Pending
                </span>
              )}
            </div>
            <h2 className="text-xl font-black font-mono tracking-tight text-white mt-0.5 truncate">
              {member.membershipNumber}
            </h2>
            <p className="text-xs text-blue-100 font-semibold mt-0.5 truncate">
              {member.isPending ? `Verification by ${member.branch}` : 'Official Member Clearance'}
            </p>
          </div>

          {/* Right Column: Circular Framed Avatar */}
          <div className="shrink-0 relative">
            <div className="w-15 h-15 rounded-full overflow-hidden border-2 border-white/70 shadow-md relative group-hover:scale-105 transition duration-200">
              <img
                src={member.photo}
                alt={member.name}
                className="w-full h-full object-cover"
              />
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
            {member.isPending ? 'Pending Approval Notice →' : 'Tap for Scanner →'}
          </span>
        </div>
      </div>

      {/* Quick Actions (Formerly Popular Services): Long horizontal cards like reference image */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-0.5">
          <h3 className="text-base font-extrabold text-[#181D20] tracking-tight">
            Quick Actions
          </h3>
          <button
            onClick={() => onNavigateTab('calendar')}
            className="text-xs font-semibold text-slate-400 hover:text-slate-900 transition"
          >
            See All
          </button>
        </div>

        {/* Stacked Full-Width Long Cards with Icon Top Left */}
        <div className="space-y-3">
          {/* Card 1: Upcoming Ceremony */}
          {upcomingCeremony && (
            <div
              id="home-card-upcoming-ceremony"
              onClick={() => onOpenCeremonyRegistration(upcomingCeremony)}
              className="relative rounded-[22px] overflow-hidden shadow-md border border-slate-200/60 h-[115px] p-4 flex flex-col justify-between group cursor-pointer active:scale-[0.99] transition duration-150"
              style={{
                backgroundImage: `url('/silo.jpg')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {/* Dark Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/75 to-slate-950/40 group-hover:from-slate-950/95 transition duration-200" />

              {/* Top Row: Icon Top-Left + Action Arrow Top-Right */}
              <div className="relative z-10 flex items-center justify-between">
                <Sun className="w-5 h-5 text-white stroke-[2.2]" />
                <div className="w-7 h-7 rounded-full bg-white/10 group-hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 transition">
                  <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                </div>
              </div>

              {/* Bottom Row: Title in Church Language + Plain Date Subtitle */}
              <div className="relative z-10 min-w-0">
                <h4 className="text-sm font-black text-white leading-tight truncate">
                  {upcomingCeremony.title || 'Mokete wa Paseka'}
                </h4>
                <p className="text-xs text-slate-300 font-medium mt-0.5 truncate">
                  {upcomingCeremony.startDate ? `${upcomingCeremony.startDate} · Tap to register` : '12 April · Tap to register'}
                </p>
              </div>
            </div>
          )}

          {/* Card 2: Give */}
          <div
            id="home-card-giving"
            onClick={() => onOpenPayments('karolo')}
            className="relative rounded-[22px] overflow-hidden shadow-md border border-slate-200/60 h-[115px] p-4 flex flex-col justify-between group cursor-pointer active:scale-[0.99] transition duration-150"
            style={{
              backgroundImage: `url('/give.jpg')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/75 to-slate-950/40 group-hover:from-slate-950/95 transition duration-200" />

            {/* Top Row: Icon Top-Left + Action Arrow Top-Right */}
            <div className="relative z-10 flex items-center justify-between">
              <BookOpen className="w-5 h-5 text-white stroke-[2.2]" />
              <div className="w-7 h-7 rounded-full bg-white/10 group-hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 transition">
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>

            {/* Bottom Row: Clear Title & Subtitle */}
            <div className="relative z-10 min-w-0">
              <h4 className="text-sm font-black text-white leading-tight truncate">
                Give
              </h4>
              <p className="text-xs text-slate-300 font-medium mt-0.5 truncate">
                Karolo, Polokano & more
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

            {/* Top Row: Icon Top-Left + Action Arrow Top-Right */}
            <div className="relative z-10 flex items-center justify-between">
              <QrCode className="w-5 h-5 text-white stroke-[2.2]" />
              <div className="w-7 h-7 rounded-full bg-white/10 group-hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 transition">
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>

            {/* Bottom Row: Broad Title & Subtitle */}
            <div className="relative z-10 min-w-0">
              <h4 className="text-sm font-black text-white leading-tight truncate">
                Iphc Media
              </h4>
              <p className="text-xs text-slate-300 font-medium mt-0.5 truncate">
                Latest sermons and music
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Spiritual Thought & Scripture Reading (Clean, serene styling) */}
      <div className="bg-white rounded-[24px] p-5 border border-[#3F76C5]/15 shadow-sm">
      <div className="flex items-center gap-2 text-[#0A2A52] mb-2">
          <BookOpen className="w-4 h-4 stroke-[2.2]" />
          <span className="text-[11px] font-black uppercase tracking-wider">
            Daily Scripture Reflection
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
