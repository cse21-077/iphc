import React, { useState } from 'react';
import { MemberProfile } from '../types';
import { QRCodeDisplay } from './QRCodeDisplay';
import {
  ShieldCheck,
  Maximize2,
  X,
  RotateCcw,
  Sun,
  SunMedium,
  CheckCircle2,
  Calendar,
  MapPin,
  IdCard,
} from 'lucide-react';

interface MembershipCardProps {
  member: MemberProfile;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export const MembershipCard: React.FC<MembershipCardProps> = ({
  member,
  isExpanded = false,
  onToggleExpand,
}) => {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [highBrightness, setHighBrightness] = useState(false);

  const expanded = isExpanded || internalExpanded;
  const toggle = onToggleExpand || (() => setInternalExpanded((prev) => !prev));

  return (
    <>
      {/* Mini Membership Card (Visible on Home) */}
      <div
        id="mini-membership-card"
        onClick={toggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && toggle()}
        className="relative w-full bg-[#3F76C5] rounded-2xl p-5 text-white overflow-hidden shadow-lg cursor-pointer transform transition-transform active:scale-[0.99] select-none"
      >
        {/* Circular translucent accent from theme */}
        <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full pointer-events-none" />

        {/* Member Card Top Info */}
        <div className="flex items-start gap-4 mb-4 relative z-10">
          <div className="w-14 h-14 bg-white rounded-xl flex-shrink-0 border-2 border-white/20 overflow-hidden shadow-xs">
            <img
              src={member.photo}
              alt={member.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-[10px] uppercase tracking-wider opacity-80">
              Membership Number
            </span>
            <span className="text-lg font-mono font-bold tracking-tight text-white truncate">
              {member.membershipNumber}
            </span>
            <span className="text-xs font-semibold text-white/90 truncate mt-0.5">
              {member.title} {member.name}
            </span>
          </div>
          <div className="shrink-0 bg-white/15 p-2 rounded-xl backdrop-blur-xs border border-white/20 text-white hover:bg-white/25 transition">
            <Maximize2 className="w-4 h-4" />
          </div>
        </div>

        {/* 2-Column Grid: Branch & Section */}
        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-white/15 relative z-10">
          <div>
            <p className="text-[10px] uppercase opacity-60 tracking-wider">Branch</p>
            <p className="text-[13px] font-semibold truncate text-white">{member.branch}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase opacity-60 tracking-wider">Section</p>
            <p className="text-[13px] font-semibold truncate text-white">{member.section}</p>
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-white/80 relative z-10">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="font-medium text-[10px] uppercase tracking-wide">Active Pass</span>
          </span>
          <span className="font-medium text-[10px] uppercase tracking-wider text-white/70">
            Tap for Usher QR →
          </span>
        </div>
      </div>

      {/* Full-Screen Expanded Card Modal */}
      {expanded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div
            className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl transition-all duration-300 relative ${
              highBrightness ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'
            }`}
          >
            {/* Header controls inside modal */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/30">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#3F76C5]" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  IPHC Digital Member Pass
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Brightness Booster for Scanner */}
                <button
                  id="card-brightness-btn"
                  onClick={() => setHighBrightness(!highBrightness)}
                  className={`p-2 rounded-full text-xs font-medium flex items-center gap-1 transition ${
                    highBrightness
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                  title="Toggle Maximum Screen Contrast for Usher Scanner"
                >
                  {highBrightness ? <Sun className="w-4 h-4 text-amber-600" /> : <SunMedium className="w-4 h-4" />}
                </button>

                {/* Flip Card */}
                <button
                  id="card-flip-btn"
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="p-2 rounded-full bg-slate-800 text-slate-300 hover:text-white transition"
                  title="Flip Card (Front / Back)"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                {/* Close */}
                <button
                  id="card-close-btn"
                  onClick={toggle}
                  className="p-2 rounded-full bg-slate-800 text-slate-300 hover:text-white transition ml-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Front of Card: High-contrast QR for Usher */}
            {!isFlipped ? (
              <div className="mt-4 text-center">
                <p className="text-xs font-semibold text-[#D13138] uppercase tracking-wider mb-2">
                  Usher Check-In Scan Code
                </p>

                {/* Big QR Code */}
                <div className="mx-auto w-fit p-4 rounded-2xl bg-white shadow-xl border-4 border-slate-100">
                  <QRCodeDisplay value={member.qrToken} size={210} />
                </div>

                {/* Member ID & Name */}
                <div className="mt-4">
                  <h4 className={`text-xl font-black tracking-tight ${highBrightness ? 'text-slate-900' : 'text-white'}`}>
                    {member.title} {member.name}
                  </h4>
                  <p className="text-xs text-slate-400 font-mono font-bold mt-0.5 tracking-wider">
                    {member.membershipNumber}
                  </p>
                  <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Valid for 2026 / 2027 Silo Entry</span>
                  </div>
                </div>

                {/* Simulated Barcode at bottom */}
                <div className="mt-4 pt-3 border-t border-slate-700/20">
                  <div className="flex justify-center items-end gap-[3px] h-9 mx-auto w-48 opacity-75">
                    {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 4, 1, 2, 3, 1, 4, 2, 1, 3, 2, 4, 1, 2].map((w, i) => (
                      <div
                        key={i}
                        className={`h-full ${highBrightness ? 'bg-slate-900' : 'bg-slate-300'}`}
                        style={{ width: `${w * 2}px` }}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono mt-1">
                    ZB-SILO-{member.membershipNumber.replace('IPHC-MM-', '')}-2026
                  </p>
                </div>
              </div>
            ) : (
              /* Back of Card: Member Records & Verification Details */
              <div className="mt-4 space-y-3.5 text-left">
                <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/40">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Church Branch & Section
                  </p>
                  <p className="text-sm font-bold text-white mt-0.5">{member.branch}</p>
                  <p className="text-xs text-blue-300 mt-0.5">{member.section}</p>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/40">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Baptism Number
                    </p>
                    <p className="text-xs font-mono font-bold text-white mt-1">
                      {member.baptismNumber}
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/40">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Member Since
                    </p>
                    <p className="text-xs font-bold text-white mt-1">
                      Year {member.joinYear}
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/40">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Emergency / Next of Kin
                  </p>
                  <p className="text-sm font-semibold text-white mt-0.5">
                    {member.nextOfKin.name} ({member.nextOfKin.relation})
                  </p>
                  <p className="text-xs text-slate-300 font-mono mt-0.5">
                    {member.nextOfKin.phone}
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-[#3F76C5]/10 border border-[#3F76C5]/20 text-[#3F76C5] text-[11px] leading-relaxed">
                  Notice: This digital credential is the official property of the International Pentecostal Holiness Church (IPHC). Non-transferable.
                </div>
              </div>
            )}

            {/* Close Button */}
            <div className="mt-5">
              <button
                onClick={toggle}
                className="w-full py-3 rounded-2xl bg-[#3F76C5] text-white font-bold text-sm hover:bg-[#3262a4] transition active:scale-98 shadow-md"
              >
                Close Pass
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
