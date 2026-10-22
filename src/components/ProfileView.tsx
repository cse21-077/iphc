import React, { useState, useEffect } from 'react';
import { MemberProfile } from '../types';
import {
  CreditCard,
  Bell,
  Clock,
  Lock,
  Edit3,
  Phone,
  Mail,
  MapPin,
  Users,
  BookOpen,
  GraduationCap,
  X,
  ChevronDown,
  ChevronRight,
  Info,
  QrCode,
  LogOut,
  UserPlus,
  UserRound,
} from 'lucide-react';

interface ProfileViewProps {
  member: MemberProfile;
  onUpdateMember: (updated: MemberProfile) => void;
  onNavigateToPayments: () => void;
  onNavigateToAttendance: () => void;
  onOpenNotifications: () => void;
  onOpenCard: () => void;
  onOpenAuthModal: () => void;
  onSignOut: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  member,
  onUpdateMember,
  onNavigateToPayments,
  onNavigateToAttendance,
  onOpenNotifications,
  onOpenCard,
  onOpenAuthModal,
  onSignOut,
}) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<string | null>('contact');

  // Form State
  const [phone, setPhone] = useState(member.phone);
  const [email, setEmail] = useState(member.email);
  const [address, setAddress] = useState(member.address);
  const [photo, setPhoto] = useState(member.photo);

  // Profile photo: show the member's image when available, otherwise initials
  const [photoFailed, setPhotoFailed] = useState(false);
  useEffect(() => setPhotoFailed(false), [member.photo]);
  const initials = member.name
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const toggleAccordion = (id: string) => {
    setOpenAccordion((prev) => (prev === id ? null : id));
  };

  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateMember({
      ...member,
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      photo: photo.trim(),
    });
    setShowEditModal(false);
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col pb-28 max-w-md mx-auto space-y-4 px-4 pt-3">
      {/* Profile Header Hero */}
      <div className="bg-white rounded-[26px] p-5 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <div className="w-18 h-18 rounded-full overflow-hidden border-2 border-slate-200 shadow-xs bg-[#0A2A52]">
              {member.photo && !photoFailed ? (
                <img
                  src={member.photo}
                  alt={member.name}
                  className="w-full h-full object-cover"
                  onError={() => setPhotoFailed(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white font-black text-xl tracking-wide">
                  {initials || <UserRound className="w-7 h-7" />}
                </div>
              )}
            </div>
            <button
              onClick={() => setShowEditModal(true)}
              className="absolute bottom-0 right-0 p-1.5 rounded-full bg-[#3F76C5] text-white shadow-md hover:bg-[#3566ac] transition active:scale-95"
              title="Edit photo or details"
              aria-label="Edit Profile"
            >
              <Edit3 className="w-3 h-3" />
            </button>
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-black text-[#181D20] leading-tight truncate">
              {member.title} {member.name}
            </h1>
            <p className="text-xs font-mono font-bold text-slate-500 mt-0.5">
              {member.membershipNumber}
            </p>
            <p className="text-xs text-slate-500 mt-0.5 truncate">
              {member.branch} • {member.section}
            </p>
          </div>
        </div>

        {/* Digital ID Pass Action Bar */}
        <div
          id="profile-open-pass-btn"
          onClick={onOpenCard}
          className="rounded-[20px] bg-gradient-to-r from-[#0A2A52] via-[#164A86] to-[#1D4ED8] text-white p-3.5 flex items-center justify-between cursor-pointer active:scale-[0.99] transition shadow-xs hover:shadow-md border border-blue-400/20 group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white shrink-0">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-black text-white leading-tight">
                IPHC Digital ID & Scanner Pass
              </h4>
              <p className="text-[10px] text-blue-100 font-medium mt-0.5 truncate">
                Tap to open scan code
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs font-bold text-blue-200 shrink-0 ml-2 group-hover:translate-x-0.5 transition">
            <span className="hidden sm:inline">View</span>
            <ChevronRight className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>

      {/* Profile Quick Links Hub: Modern 3-Column Clean Grid */}
      <div className="grid grid-cols-3 gap-2.5">
        <button
          id="profile-hub-payments"
          onClick={onNavigateToPayments}
          className="p-3.5 rounded-[22px] bg-white border border-slate-200/90 shadow-xs flex flex-col items-center text-center hover:border-slate-400 transition active:scale-95 group"
        >
          <CreditCard className="w-5 h-5 text-[#3F76C5] mb-1.5 group-hover:scale-110 transition" />
          <span className="text-xs font-bold text-slate-900">Payments</span>
          <span className="text-[10px] text-slate-400 mt-0.5 font-medium">Karolo & History</span>
        </button>

        <button
          id="profile-hub-attendance"
          onClick={onNavigateToAttendance}
          className="p-3.5 rounded-[22px] bg-white border border-slate-200/90 shadow-xs flex flex-col items-center text-center hover:border-slate-400 transition active:scale-95 group"
        >
          <Clock className="w-5 h-5 text-[#3F76C5] mb-1.5 group-hover:scale-110 transition" />
          <span className="text-xs font-bold text-slate-900">Attendance</span>
          <span className="text-[10px] text-slate-400 mt-0.5 font-medium">Check-In Log</span>
        </button>

        <button
          id="profile-hub-notifications"
          onClick={onOpenNotifications}
          className="p-3.5 rounded-[22px] bg-white border border-slate-200/90 shadow-xs flex flex-col items-center text-center hover:border-slate-400 transition active:scale-95 group"
        >
          <Bell className="w-5 h-5 text-[#3F76C5] mb-1.5 group-hover:scale-110 transition" />
          <span className="text-xs font-bold text-slate-900">Notices</span>
          <span className="text-[10px] text-slate-400 mt-0.5 font-medium">Bulletins</span>
        </button>
      </div>

      {/* Accordion Stack Section */}
      <div className="space-y-3">
        {/* Accordion 1: Contact Information */}
        <div className="bg-white rounded-[24px] border border-slate-200/90 shadow-xs overflow-hidden transition-all duration-200">
          <button
            onClick={() => toggleAccordion('contact')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/80 transition"
          >
            <div>
              <h3 className="text-sm font-bold text-[#181D20]">Contact Details</h3>
              <p className="text-[11px] text-slate-400">Personal communication info</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                id="btn-edit-contact"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowEditModal(true);
                }}
                className="px-2.5 py-1 rounded-full border border-slate-200 hover:bg-slate-100 text-[11px] font-semibold text-slate-700 flex items-center gap-1 transition active:scale-95"
              >
                <Edit3 className="w-3 h-3 text-slate-600" />
                <span>Edit</span>
              </button>
              <div className={`p-1 rounded-full bg-slate-100 text-slate-500 transition-transform duration-200 ${openAccordion === 'contact' ? 'rotate-180' : ''}`}>
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </button>

          {openAccordion === 'contact' && (
            <div className="px-4 pb-4 pt-1 border-t border-slate-100 space-y-3 text-xs animate-in fade-in duration-150">
              <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50">
                <Phone className="w-4 h-4 text-slate-500 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Phone Number</p>
                  <p className="font-semibold text-slate-900">{member.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50">
                <Mail className="w-4 h-4 text-slate-500 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Email Address</p>
                  <p className="font-semibold text-slate-900 truncate">{member.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-slate-50">
                <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Residential Address</p>
                  <p className="font-semibold text-slate-900 leading-snug">{member.address}</p>
                </div>
              </div>

              {member.postalAddress && (
                <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-slate-50">
                  <Mail className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Postal Address</p>
                    <p className="font-semibold text-slate-900 leading-snug">{member.postalAddress}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Accordion 2: Official Church Records */}
        <div className="bg-white rounded-[24px] border border-slate-200/90 shadow-xs overflow-hidden transition-all duration-200">
          <button
            onClick={() => toggleAccordion('records')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/80 transition"
          >
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-[#181D20]">Official Church Records</h3>
                <p className="text-[11px] text-slate-400">Verified membership & branch details</p>
              </div>
            </div>
            <div className={`p-1 rounded-full bg-slate-100 text-slate-500 transition-transform duration-200 ${openAccordion === 'records' ? 'rotate-180' : ''}`}>
              <ChevronDown className="w-4 h-4" />
            </div>
          </button>

          {openAccordion === 'records' && (
            <div className="px-4 pb-4 pt-1 border-t border-slate-100 space-y-3 text-xs animate-in fade-in duration-150">
              <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-2xl border border-slate-100 flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                <span>
                  Branch and baptism records are verified and maintained by Branch Administration.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Branch</p>
                  <p className="font-bold text-slate-900 mt-0.5 truncate">{member.branch}</p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Section</p>
                  <p className="font-bold text-slate-900 mt-0.5 truncate">{member.section}</p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Baptism Certificate</p>
                  <p className="font-mono font-bold text-slate-900 mt-0.5">{member.baptismNumber}</p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Member Since</p>
                  <p className="font-bold text-slate-900 mt-0.5">Year {member.joinYear}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Accordion 3: About & Qualifications */}
        <div className="bg-white rounded-[24px] border border-slate-200/90 shadow-xs overflow-hidden transition-all duration-200">
          <button
            onClick={() => toggleAccordion('about')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/80 transition"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-slate-700 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-[#181D20]">About & Qualifications</h3>
                <p className="text-[11px] text-slate-400">Biography, education & personal details</p>
              </div>
            </div>
            <div className={`p-1 rounded-full bg-slate-100 text-slate-500 transition-transform duration-200 ${openAccordion === 'about' ? 'rotate-180' : ''}`}>
              <ChevronDown className="w-4 h-4" />
            </div>
          </button>

          {openAccordion === 'about' && (
            <div className="px-4 pb-4 pt-1 border-t border-slate-100 space-y-3 text-xs animate-in fade-in duration-150">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Age</p>
                  <p className="font-bold text-slate-900 mt-0.5">{member.age ? `${member.age} years` : '—'}</p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Marriage Status</p>
                  <p className="font-bold text-slate-900 mt-0.5 truncate">{member.marriageStatus}</p>
                </div>
              </div>

              {member.biography && (
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                    <BookOpen className="w-3 h-3" /> Biography
                  </p>
                  <p className="font-semibold text-slate-800 leading-snug mt-1">{member.biography}</p>
                </div>
              )}

              {member.qualifications && (
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                    <GraduationCap className="w-3 h-3" /> Qualifications
                  </p>
                  <p className="font-semibold text-slate-800 leading-snug mt-1">{member.qualifications}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Accordion 4: Family & Next of Kin */}
        <div className="bg-white rounded-[24px] border border-slate-200/90 shadow-xs overflow-hidden transition-all duration-200">
          <button
            onClick={() => toggleAccordion('family')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/80 transition"
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-700 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-[#181D20]">Family & Next of Kin</h3>
                <p className="text-[11px] text-slate-400">Household members & emergency contacts</p>
              </div>
            </div>
            <div className={`p-1 rounded-full bg-slate-100 text-slate-500 transition-transform duration-200 ${openAccordion === 'family' ? 'rotate-180' : ''}`}>
              <ChevronDown className="w-4 h-4" />
            </div>
          </button>

          {openAccordion === 'family' && (
            <div className="px-4 pb-4 pt-1 border-t border-slate-100 space-y-3 text-xs animate-in fade-in duration-150">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Primary Next of Kin
                  </span>
                  <span className="font-bold text-slate-900">{member.nextOfKin.name}</span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    {member.nextOfKin.relation} • {member.nextOfKin.phone}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Household Members:
                </p>
                {member.familyMembers.map((fam) => (
                  <div
                    key={fam.id}
                    className="flex items-center justify-between py-2 px-3 rounded-xl bg-slate-50 text-slate-700"
                  >
                    <span className="font-semibold">{fam.name}</span>
                    <span className="text-[11px] text-slate-500">{fam.relation}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Account Session Actions */}
      <div className="bg-white rounded-[26px] p-4 border border-slate-200/90 shadow-xs space-y-2">
        <button
          onClick={onOpenAuthModal}
          className="w-full py-3 px-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100/80 text-slate-800 font-bold text-xs flex items-center justify-between transition active:scale-98"
        >
          <div className="flex items-center gap-2.5">
            <UserPlus className="w-4 h-4 text-slate-600" />
            <span>Register New Member / Switch Login</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        <button
          onClick={onSignOut}
          className="w-full py-3 px-4 rounded-2xl bg-red-50 border border-red-100 hover:bg-red-100/60 text-[#D13138] font-bold text-xs flex items-center justify-between transition active:scale-98"
        >
          <div className="flex items-center gap-2.5">
            <LogOut className="w-4 h-4 text-[#D13138]" />
            <span>Sign Out Current Account</span>
          </div>
          <ChevronRight className="w-4 h-4 text-[#D13138]" />
        </button>
      </div>

      {/* Edit Details Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-[#181D20]">Update Contact Information</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 transition"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveContact} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Cell Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-[#3F76C5] focus:outline-hidden text-slate-900 bg-slate-50/50"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-[#3F76C5] focus:outline-hidden text-slate-900 bg-slate-50/50"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Physical Residential Address *</label>
                <textarea
                  required
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-[#3F76C5] focus:outline-hidden text-slate-900 bg-slate-50/50"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Profile Photo URL</label>
                <input
                  type="url"
                  value={photo}
                  onChange={(e) => setPhoto(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-[#3F76C5] focus:outline-hidden text-slate-900 bg-slate-50/50"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-full bg-[#3F76C5] text-white font-bold text-sm hover:bg-[#3566ac] transition shadow-md active:scale-98"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
