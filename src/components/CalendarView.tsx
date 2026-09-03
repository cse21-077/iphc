import React, { useState } from 'react';
import { Ceremony, MemberProfile } from '../types';
import { Ribbon, RibbonColor } from './Ribbon';
import {
  Calendar as CalendarIcon,
  MapPin,
  Users,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronRight,
  Sparkles,
  Check,
  Plus,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CalendarViewProps {
  ceremonies: Ceremony[];
  member: MemberProfile;
  onPreRegister: (ceremonyId: string, familyMembers: string[]) => void;
  onOpenCard: () => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  ceremonies,
  member,
  onPreRegister,
  onOpenCard,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeCeremony, setActiveCeremony] = useState<Ceremony | null>(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  // Pre-registration form state
  const [selectedFamily, setSelectedFamily] = useState<string[]>([
    member.name,
    member.familyMembers[0]?.name || '',
  ].filter(Boolean));
  const [customFamilyName, setCustomFamilyName] = useState('');
  const [isSuccessState, setIsSuccessState] = useState(false);

  const categories = ['All', 'Monthend', 'Sethephu', 'Annual', 'Youth'];

  const filteredCeremonies =
    selectedCategory === 'All'
      ? ceremonies
      : ceremonies.filter((c) => c.category === selectedCategory);

  const handleOpenCeremony = (c: Ceremony) => {
    setActiveCeremony(c);
    setIsSuccessState(false);
  };

  const handleStartPreRegister = (c: Ceremony) => {
    setActiveCeremony(c);
    setSelectedFamily([
      member.name,
      ...(c.registeredFamilyMembers || [member.familyMembers[0]?.name].filter(Boolean)),
    ]);
    setShowRegisterModal(true);
    setIsSuccessState(false);
  };

  const toggleFamilyMember = (name: string) => {
    if (name === member.name) return; // Primary member always included
    setSelectedFamily((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const handleAddCustomFamily = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customFamilyName.trim()) return;
    if (!selectedFamily.includes(customFamilyName.trim())) {
      setSelectedFamily((prev) => [...prev, customFamilyName.trim()]);
    }
    setCustomFamilyName('');
  };

  const handleConfirmPreRegister = () => {
    if (!activeCeremony) return;

    onPreRegister(activeCeremony.id, selectedFamily);
    setIsSuccessState(true);

    try {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#3F76C5', '#D13138', '#10B981'],
      });
    } catch {
      // safe fallback
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col pb-20 max-w-md mx-auto">
      {/* Top Banner */}
      <div className="p-4 bg-white border-b border-gray-100">
        <h1 className="text-xl sm:text-2xl font-black text-[#181D20] tracking-tight">
          Silo Ceremonies
        </h1>
        <p className="text-xs text-slate-400 font-normal mt-0.5">
          Annual pilgrimage calendar & sacred gatherings
        </p>

        {/* Category Pills */}
        <div className="flex gap-2 mt-3.5 overflow-x-auto no-scrollbar pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-semibold shrink-0 transition-all duration-150 active:scale-95 ${
                selectedCategory === cat
                  ? 'bg-[#181D20] text-white shadow-xs'
                  : 'bg-[#F1F3F5] text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Ceremonies List: Photographic Cards with Floating Pill Overlay */}
      <div className="p-4 space-y-3.5 flex-1">
        {filteredCeremonies.map((ceremony) => {
          // Primary local images per category (use these as main images; do NOT use tumelolekolwane.jpg)
          const primaryMap: Record<string, string> = {
            Monthend: '/silo.jpg',
            Sethephu: '/watch.jpg',
            Annual: '/give.jpg',
            Youth: '/youthandyoung.jpg',
          };

          const imageSrc =
            primaryMap[ceremony.category] || ceremony.imageUrl ||
            'https://images.unsplash.com/photo-1544427920-c49ccfb85579?w=800&auto=format&fit=crop&q=80';

          return (
            <div
              key={ceremony.id}
              onClick={() => handleOpenCeremony(ceremony)}
              className="relative rounded-[26px] overflow-hidden shadow-xs border border-slate-100 h-[220px] flex flex-col justify-end p-3.5 group cursor-pointer"
              style={{
                backgroundImage: `url('${imageSrc}')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {/* Subtle gradient vignette */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

              {/* Minimalist Floating Card Overlay */}
              <div className="relative z-10 rounded-[20px] bg-slate-900/80 backdrop-blur-md border border-white/15 p-3.5 text-white shadow-lg flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-black text-white leading-tight truncate">
                    {ceremony.title}
                  </h3>
                  <p className="text-[11px] text-slate-300 font-medium mt-0.5 truncate">
                    {ceremony.dateRange} • {ceremony.location.split(',')[0]}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {ceremony.isRegistered ? (
                    <span className="text-[11px] font-bold text-emerald-300 px-2 py-1">
                      Registered
                    </span>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartPreRegister(ceremony);
                      }}
                      className="px-3.5 py-1.5 rounded-full bg-white text-[#181D20] text-xs font-bold hover:bg-slate-100 transition active:scale-95 shadow-xs"
                    >
                      Pre-Register
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Ceremony Details Modal */}
      {activeCeremony && !showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-[#3F76C5]">
                {activeCeremony.category} Ceremony
              </span>
              <button
                onClick={() => setActiveCeremony(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-3">
              <h3 className="text-xl font-black text-slate-900 leading-snug">
                {activeCeremony.title}
              </h3>
              {activeCeremony.sepediSubtitle && (
                <p className="text-xs font-medium text-slate-500 mt-0.5 italic">
                  {activeCeremony.sepediSubtitle}
                </p>
              )}
            </div>

            <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-800 font-bold">
                <CalendarIcon className="w-4 h-4 text-[#3F76C5]" />
                <span>{activeCeremony.dateRange}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 font-medium">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span>{activeCeremony.location}</span>
              </div>
            </div>

            <div className="mt-4">
              <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                About the Gathering
              </h4>
              <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                {activeCeremony.description}
              </p>
            </div>

            <div className="mt-4 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Important Information:</p>
                <p className="mt-0.5 leading-relaxed">{activeCeremony.importantNotice}</p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => handleStartPreRegister(activeCeremony)}
                className="flex-1 py-3 rounded-2xl bg-[#D13138] text-white font-bold text-sm shadow-md hover:bg-[#b8262d] transition"
              >
                {activeCeremony.isRegistered ? 'Update Pre-Registration' : 'Pre-Register Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pre-Registration Modal (One simple action flow per PRD Principle 2) */}
      {showRegisterModal && activeCeremony && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            {!isSuccessState ? (
              <>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#3F76C5]" />
                    <h3 className="text-base font-bold text-slate-900">Pre-Registration</h3>
                  </div>
                  <button
                    onClick={() => setShowRegisterModal(false)}
                    className="p-1 rounded-full text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="mt-3">
                  <p className="text-xs font-semibold text-[#D13138] uppercase">
                    {activeCeremony.title}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Select family members travelling with you to Silo. One pass covers all.
                  </p>
                </div>

                {/* Family Selection Checklist */}
                <div className="mt-4 space-y-2">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Attendees List:
                  </p>

                  {/* Primary Member */}
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-blue-50/80 border border-blue-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#3F76C5] text-white flex items-center justify-center text-xs font-bold">
                        ✓
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{member.name}</p>
                        <p className="text-[10px] text-slate-500">Primary Member (Passholder)</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-[#3F76C5] uppercase">Required</span>
                  </div>

                  {/* Family Members from Profile */}
                  {member.familyMembers.map((fam) => {
                    const isChecked = selectedFamily.includes(fam.name);
                    return (
                      <div
                        key={fam.id}
                        onClick={() => toggleFamilyMember(fam.name)}
                        className={`flex items-center justify-between p-3 rounded-2xl border transition cursor-pointer ${
                          isChecked
                            ? 'bg-emerald-50/80 border-emerald-200 text-slate-900'
                            : 'bg-slate-50 border-slate-200/70 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition ${
                              isChecked
                                ? 'bg-emerald-600 text-white'
                                : 'border-2 border-slate-300 bg-white text-transparent'
                            }`}
                          >
                            ✓
                          </div>
                          <div>
                            <p className="text-xs font-semibold">{fam.name}</p>
                            <p className="text-[10px] text-slate-500">{fam.relation}</p>
                          </div>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {isChecked ? 'Included' : '+ Add'}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Optional Custom Family Member Input */}
                <form onSubmit={handleAddCustomFamily} className="mt-3 flex gap-2">
                  <input
                    type="text"
                    placeholder="Add other family member name..."
                    value={customFamilyName}
                    onChange={(e) => setCustomFamilyName(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#3F76C5]"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </form>

                {/* Confirm Pre-Registration Action */}
                <div className="mt-6 pt-3 border-t border-slate-100">
                  <button
                    onClick={handleConfirmPreRegister}
                    className="w-full py-3 rounded-2xl bg-[#D13138] text-white font-bold text-sm hover:bg-[#b8262d] transition shadow-md active:scale-98"
                  >
                    Confirm Pre-Registration ({selectedFamily.length} Persons)
                  </button>
                </div>
              </>
            ) : (
              /* Big Unambiguous Registration Confirmation */
              <div className="py-4 text-center animate-in zoom-in-95 duration-200">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3 stroke-[2.2]" />

                <h3 className="text-2xl font-black text-slate-900">
                  Registered ✓
                </h3>
                <p className="text-xs font-semibold text-emerald-700 mt-1">
                  {activeCeremony.title}
                </p>

                <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2 text-xs text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Dates:</span>
                    <span className="font-bold text-slate-900">{activeCeremony.dateRange}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Location:</span>
                    <span className="font-bold text-slate-900">{activeCeremony.location}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200">
                    <span className="text-slate-500">Registered Persons:</span>
                    <span className="font-bold text-[#3F76C5]">
                      {selectedFamily.length} ({selectedFamily.join(', ')})
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-500 mt-4 leading-relaxed">
                  No ticket required. Simply show or scan your MMUSO membership card at Silo entry gates.
                </p>

                <div className="mt-5 space-y-2">
                  <button
                    onClick={() => {
                      setShowRegisterModal(false);
                      setActiveCeremony(null);
                      onOpenCard();
                    }}
                    className="w-full py-3 rounded-2xl bg-[#3F76C5] text-white font-bold text-sm hover:bg-[#3262a4] transition shadow-md"
                  >
                    View My Silo Pass / Card
                  </button>

                  <button
                    onClick={() => {
                      setShowRegisterModal(false);
                      setActiveCeremony(null);
                    }}
                    className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200"
                  >
                    Back to Calendar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
