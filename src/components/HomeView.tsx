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
          <h1 className="text-2xl font-black text-[#181D20] tracking-tight">
            {member.title} {member.name}
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            {member.branch} • {member.council}
          </p>
        </div>

        <button
          id="home-notice-badge"
          onClick={onOpenNotifications}
          className="mt-1 p-2 text-[#181D20] hover:text-black active:scale-95 transition relative"
          title="Announcements & Notifications"
          aria-label="View Announcements"
        >
          <Bell className="w-5 h-5 text-[#181D20] stroke-[2]" />
          {announcements.some((n) => !n.isRead) && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#D13138] ring-2 ring-white" />
          )}
        </button>
      </div>

      {/* Hero Feature Card: Rich Color for Silo Digital Pass */}
      <div
        id="hero-silo-pass-card"
        onClick={onOpenMembershipPass}
        className="relative rounded-[24px] bg-gradient-to-br from-[#2B5249] via-[#21423A] to-[#18342D] text-white p-5 shadow-[0_12px_28px_rgba(33,66,58,0.22)] overflow-hidden cursor-pointer active:scale-[0.99] transition-transform duration-150 group border border-emerald-900/40"
      >
        {/* Soft atmospheric gradient accents */}
        <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full bg-emerald-400/10 blur-2xl pointer-events-none" />
        <div className="absolute left-1/4 -top-8 w-32 h-32 rounded-full bg-teal-200/10 blur-xl pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between gap-3">
          {/* Left Column: Typography & Clean Number */}
          <div className="flex-1 min-w-0">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-emerald-200 text-[10px] font-extrabold uppercase tracking-wider mb-2 backdrop-blur-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>IPHC Digital Pass</span>
            </span>

            <h2 className="text-xl font-black text-white tracking-tight leading-tight">
              Silo Digital Pass
            </h2>
            <p className="text-xs text-emerald-100/80 font-normal mt-1 leading-relaxed">
              Official membership & sacred pilgrimage clearance
            </p>

            <div className="mt-3.5 flex items-center gap-2 flex-wrap">
              <div className="px-3 py-1 rounded-full bg-white/15 border border-white/20 text-white font-mono text-xs font-bold backdrop-blur-xs">
                {member.membershipNumber}
              </div>
              <span className="text-[11px] font-bold text-emerald-300">
                100% Active
              </span>
            </div>
          </div>

          {/* Right Column: Circular Framed Avatar */}
          <div className="shrink-0 relative">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/60 shadow-md relative group-hover:scale-105 transition duration-200">
              <img
                src={member.photo}
                alt={member.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                <QrCode className="w-5 h-5 text-white" />
              </div>
            </div>
            <span className="block text-center text-[10px] font-bold text-emerald-200 mt-1 uppercase tracking-wider">
              Tap for QR
            </span>
          </div>
        </div>
      </div>

      {/* Popular Services: 2-Column Responsive Grid (Categories & Bulletin Banner Removed per Request) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-0.5">
          <h3 className="text-base font-extrabold text-[#181D20] tracking-tight">
            Popular Services
          </h3>
          <button
            onClick={() => onNavigateTab('calendar')}
            className="text-xs font-semibold text-slate-400 hover:text-slate-900 transition"
          >
            See All
          </button>
        </div>

        {/* 2-Column Photographic Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Service 1: Spring Silo Pilgrimage */}
          {upcomingCeremony && (
            <div
              id="home-card-upcoming-ceremony"
              onClick={() => onOpenCeremonyRegistration(upcomingCeremony)}
              className="relative rounded-[22px] overflow-hidden shadow-xs border border-slate-100 h-[195px] flex flex-col justify-end p-2.5 group cursor-pointer"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1544427920-c49ccfb85579?w=600&auto=format&fit=crop&q=80')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

              {/* Floating pill card overlay */}
              <div className="relative z-10 rounded-[16px] bg-slate-900/80 backdrop-blur-md border border-white/15 p-2.5 text-white shadow-lg flex items-center justify-between gap-1.5">
                <div className="min-w-0">
                  <h4 className="text-xs font-black text-white leading-tight truncate">
                    Silo 2026
                  </h4>
                  <p className="text-[10px] text-slate-300 font-medium mt-0.5 truncate">
                    Pilgrimage
                  </p>
                </div>

                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    onClick={(e) => toggleSave('silo', e)}
                    className={`p-1.5 transition ${
                      savedItems['silo']
                        ? 'text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Bookmark"
                  >
                    <Bookmark className="w-3.5 h-3.5 fill-current" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenCeremonyRegistration(upcomingCeremony);
                    }}
                    className="p-1.5 text-white hover:text-slate-200 transition active:scale-95"
                    title="Register"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Service 2: Sacred Karolo Giving */}
          <div
            id="home-card-giving"
            onClick={() => onOpenPayments('karolo')}
            className="relative rounded-[22px] overflow-hidden shadow-xs border border-slate-100 h-[195px] flex flex-col justify-end p-2.5 group cursor-pointer"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1543807535-eceef0bc6599?w=600&auto=format&fit=crop&q=80')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

            <div className="relative z-10 rounded-[16px] bg-slate-900/80 backdrop-blur-md border border-white/15 p-2.5 text-white shadow-lg flex items-center justify-between gap-1.5">
              <div className="min-w-0">
                <h4 className="text-xs font-black text-white leading-tight truncate">
                  Card Giving
                </h4>
                <p className="text-[10px] text-slate-300 font-medium mt-0.5 truncate">
                  Karolo & Tithing
                </p>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenPayments('karolo');
                }}
                className="p-1.5 text-white hover:text-slate-200 transition active:scale-95 shrink-0"
                title="Give with Card"
              >
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* Service 3: Sermons & Choirs */}
          <div
            id="home-card-media"
            onClick={onOpenMedia}
            className="relative rounded-[22px] overflow-hidden shadow-xs border border-slate-100 h-[195px] flex flex-col justify-end p-2.5 group cursor-pointer"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

            <div className="relative z-10 rounded-[16px] bg-slate-900/80 backdrop-blur-md border border-white/15 p-2.5 text-white shadow-lg flex items-center justify-between gap-1.5">
              <div className="min-w-0">
                <h4 className="text-xs font-black text-white leading-tight truncate">
                  Mmino wa Khotso
                </h4>
                <p className="text-[10px] text-slate-300 font-medium mt-0.5 truncate">
                  Choirs & Sermons
                </p>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenMedia();
                }}
                className="p-1.5 text-white hover:text-slate-200 transition active:scale-95 shrink-0"
                title="Listen to Media"
              >
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* Service 4: Sabbath Fast Check-In */}
          <div
            id="home-card-scan"
            onClick={() => onNavigateTab('scan')}
            className="relative rounded-[22px] overflow-hidden shadow-xs border border-slate-100 h-[195px] flex flex-col justify-end p-2.5 group cursor-pointer"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1519817650390-64a93db51149?w=600&auto=format&fit=crop&q=80')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

            <div className="relative z-10 rounded-[16px] bg-slate-900/80 backdrop-blur-md border border-white/15 p-2.5 text-white shadow-lg flex items-center justify-between gap-1.5">
              <div className="min-w-0">
                <h4 className="text-xs font-black text-white leading-tight truncate">
                  Sabbath Check-In
                </h4>
                <p className="text-[10px] text-slate-300 font-medium mt-0.5 truncate">
                  Fast QR Scan
                </p>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigateTab('scan');
                }}
                className="p-1.5 text-white hover:text-slate-200 transition active:scale-95 shrink-0"
                title="Open Scanner"
              >
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Spiritual Thought & Scripture Reading (Clean, serene styling) */}
      <div className="bg-white rounded-[24px] p-5 border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 text-[#3E655D] mb-2">
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
