import React, { useState } from 'react';
import { MemberProfile } from '../types';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Camera,
  Search,
  ShieldCheck,
  Smartphone,
  UserCheck,
  Building2,
  X,
  LogOut,
  User,
} from 'lucide-react';

interface RegistrationAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (phone: string) => boolean; // returns true if found
  onRegisterComplete: (newMember: MemberProfile) => void;
  currentMember: MemberProfile;
}

const CHURCH_BRANCHES = [
  'Zuurbekom Headquarters (Silo)',
  'Gaborone Branch',
  'Polokwane Central',
  'Soweto Meadowlands',
  'Pretoria West',
  'Rustenburg Silo',
  'Mamelodi Branch',
  'Bloemfontein Central',
  'Nelspruit Branch',
  'Durban Central',
  'East London Branch',
  'Capetown Silo',
  'Francistown Branch (Botswana)',
  'Windhoek Branch (Namibia)',
  'Harare Central (Zimbabwe)',
  'Bulawayo Branch (Zimbabwe)',
  'Maseru Central (Lesotho)',
];

export const RegistrationAuthModal: React.FC<RegistrationAuthModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  onRegisterComplete,
  currentMember,
}) => {
  const [mode, setMode] = useState<'welcome' | 'phone' | 'otp' | 'about' | 'review' | 'confirmation' | 'direct_login'>('welcome');

  // Form State
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [titlePrefix, setTitlePrefix] = useState<'Ntate' | 'Mme' | 'Rre'>('Ntate');
  const [fullName, setFullName] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [branchSearch, setBranchSearch] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');

  // Direct login state
  const [loginPhoneInput, setLoginPhoneInput] = useState('+27 82 459 1083');
  const [loginError, setLoginError] = useState('');

  if (!isOpen) return null;

  const filteredBranches = branchSearch.trim()
    ? CHURCH_BRANCHES.filter((b) => b.toLowerCase().includes(branchSearch.toLowerCase()))
    : [];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    setOtpCode('7492'); // Pre-fill mock OTP
    setMode('otp');
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setMode('about');
  };

  const handleCompleteRegistration = () => {
    const randomId = Math.floor(100000 + Math.random() * 900000);
    const finalBranch = selectedBranch || 'Zuurbekom Headquarters (Silo)';
    const newMember: MemberProfile = {
      id: `mem_new_${Date.now()}`,
      name: fullName.trim() || 'New Church Member',
      title: titlePrefix,
      membershipNumber: `IPHC-MM-${randomId}`,
      branch: finalBranch,
      section: 'General Membership',
      baptismNumber: `PENDING-${randomId}`,
      photo:
        photoUrl.trim() ||
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
      phone: phone || '+27 80 000 0000',
      email: `${fullName.toLowerCase().replace(/\s+/g, '.')}@member.iphc.org`,
      address: `Branch Member, ${finalBranch}`,
      nextOfKin: {
        name: 'To be updated',
        relation: 'Family',
        phone: '+27 80 000 0000',
      },
      marriageStatus: 'Single',
      familyMembers: [],
      joinYear: 2026,
      qrToken: `IPHC-PENDING-${randomId}-${finalBranch.toUpperCase().slice(0, 4)}`,
      isPending: true,
    };

    onRegisterComplete(newMember);
    setMode('confirmation');
  };

  const handleDirectLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const success = onLogin(loginPhoneInput.trim());
    if (success) {
      onClose();
    } else {
      setLoginError('No existing account found with this phone number. Please click Register.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl max-h-[92vh] flex flex-col relative overflow-hidden">
        {/* Top Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* SCREEN 1: Welcome */}
        {mode === 'welcome' && (
          <div className="py-4 space-y-6 text-center animate-in fade-in duration-150">
            <div className="w-16 h-16 rounded-full bg-slate-900 text-white mx-auto flex items-center justify-center shadow-lg">
              <Building2 className="w-8 h-8 text-blue-400" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-[#181D20] tracking-tight">
                Join International Pentecost Holiness Church
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-2 leading-relaxed px-2">
                Get your digital membership card, check in at services, and stay connected with your branch.
              </p>
            </div>

            <div className="pt-4 space-y-3">
              <button
                onClick={() => setMode('phone')}
                className="w-full py-4 rounded-full bg-[#181D20] text-white font-extrabold text-sm hover:bg-black transition shadow-lg active:scale-98 flex items-center justify-center gap-2"
              >
                <span>Register New Account</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setMode('direct_login')}
                className="text-xs font-bold text-slate-600 hover:text-black py-2 block mx-auto transition"
              >
                Already a member? <span className="underline text-slate-900">Log in</span>
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 2A: Phone Number Input */}
        {mode === 'phone' && (
          <div className="py-4 space-y-5 animate-in fade-in duration-150">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
              <span>Step 1 of 3</span>
            </div>

            <div>
              <h2 className="text-xl font-black text-[#181D20]">Enter Phone Number</h2>
              <p className="text-xs text-slate-500 mt-1">
                We'll send a 4-digit code to verify your phone. No passwords needed.
              </p>
            </div>

            <form onSubmit={handleSendCode} className="space-y-4 pt-2">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+27 82 000 0000"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-base font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#181D20]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-full bg-[#181D20] text-white font-extrabold text-sm hover:bg-black transition shadow-md active:scale-98"
              >
                Send Code via SMS
              </button>
            </form>
          </div>
        )}

        {/* SCREEN 2B: OTP Code Entry */}
        {mode === 'otp' && (
          <div className="py-4 space-y-5 animate-in fade-in duration-150">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
              <span>Verification</span>
            </div>

            <div>
              <h2 className="text-xl font-black text-[#181D20]">Verify 4-Digit Code</h2>
              <p className="text-xs text-slate-500 mt-1">
                Code sent to <strong className="text-slate-900">{phone}</strong>
              </p>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-4 pt-2">
              <div>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="7492"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-2xl font-mono font-black text-slate-900 text-center tracking-widest focus:outline-hidden focus:ring-2 focus:ring-[#181D20]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-full bg-[#181D20] text-white font-extrabold text-sm hover:bg-black transition shadow-md active:scale-98"
              >
                Verify & Continue
              </button>
            </form>
          </div>
        )}

        {/* SCREEN 3: About You */}
        {mode === 'about' && (
          <div className="py-2 space-y-4 animate-in fade-in duration-150 flex-1 overflow-y-auto pr-1">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
              <span>Step 2 of 3</span>
              <span>About You</span>
            </div>

            <div>
              <h2 className="text-xl font-black text-[#181D20]">About You</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Enter your name and select your home church branch.
              </p>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Title / Honorific Prefix */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Honorific Title *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Ntate', 'Mme', 'Rre'] as const).map((pref) => (
                    <button
                      key={pref}
                      type="button"
                      onClick={() => setTitlePrefix(pref)}
                      className={`py-2.5 rounded-xl font-extrabold text-xs transition border text-center active:scale-95 ${
                        titlePrefix === pref
                          ? 'bg-[#181D20] text-white border-[#181D20] shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {pref}
                    </button>
                  ))}
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Masego Tau"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#181D20]"
                />
              </div>

              {/* Photo option via direct file upload */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Profile Photo (Optional Upload)
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                    {photoUrl ? (
                      <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <label className="flex-1 cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <div className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 text-center transition flex items-center justify-center gap-2">
                      <Camera className="w-3.5 h-3.5 text-slate-500" />
                      <span>{photoUrl ? 'Change Photo' : 'Upload Image File'}</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Searchable Branch Selector - options only visible when typing search */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Home Branch * {selectedBranch && <span className="text-slate-900 font-extrabold">({selectedBranch})</span>}
                </label>
                <div className="relative mb-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={branchSearch}
                    onChange={(e) => setBranchSearch(e.target.value)}
                    placeholder="Search branch name e.g. Gaborone..."
                    className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#181D20]"
                  />
                </div>

                {/* Only render list if user has entered search query */}
                {branchSearch.trim().length > 0 && (
                  <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white shadow-lg animate-in fade-in duration-100 mt-1">
                    {filteredBranches.length > 0 ? (
                      filteredBranches.map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => {
                            setSelectedBranch(b);
                            setBranchSearch('');
                          }}
                          className={`w-full px-3 py-2 text-left text-xs font-semibold flex items-center justify-between transition ${
                            selectedBranch === b
                              ? 'bg-slate-900 text-white'
                              : 'text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <span>{b}</span>
                          {selectedBranch === b && <Check className="w-3.5 h-3.5 text-white" />}
                        </button>
                      ))
                    ) : (
                      <div className="p-3 text-xs text-slate-400 text-center">
                        No branches match "{branchSearch}"
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              disabled={!fullName.trim()}
              onClick={() => setMode('review')}
              className="w-full py-3.5 rounded-full bg-[#181D20] text-white font-extrabold text-sm hover:bg-black transition shadow-md active:scale-98 disabled:opacity-50 mt-2"
            >
              Continue to Review
            </button>
          </div>
        )}

        {/* SCREEN 4: Review */}
        {mode === 'review' && (
          <div className="py-3 space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
              <span>Step 3 of 3</span>
              <span>Review</span>
            </div>

            <div>
              <h2 className="text-xl font-black text-[#181D20]">Review Registration</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Confirm your details before submitting to branch administration.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-200 bg-white shrink-0">
                  <img
                    src={
                      photoUrl ||
                      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80'
                    }
                    alt="Member Avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">{fullName}</h4>
                  <p className="text-slate-500 font-mono font-bold mt-0.5">{phone}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/60 flex justify-between">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Home Branch:</span>
                <span className="font-bold text-slate-900">{selectedBranch}</span>
              </div>
            </div>

            <button
              onClick={handleCompleteRegistration}
              className="w-full py-3.5 rounded-full bg-[#181D20] text-white font-extrabold text-sm hover:bg-black transition shadow-lg active:scale-98"
            >
              Submit Registration
            </button>
          </div>
        )}

        {/* SCREEN 5: Confirmation */}
        {mode === 'confirmation' && (
          <div className="py-6 space-y-5 text-center animate-in fade-in duration-150">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 mx-auto flex items-center justify-center">
              <UserCheck className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-[#181D20]">You're almost in!</h2>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed px-2">
                <strong className="text-slate-900">{selectedBranch}</strong> will confirm your details, then your membership card will be ready. We'll let you know.
              </p>
            </div>

            <div className="pt-3">
              <button
                onClick={onClose}
                className="w-full py-4 rounded-full bg-[#181D20] text-white font-extrabold text-sm hover:bg-black transition shadow-lg active:scale-98"
              >
                Go to My Card
              </button>
            </div>
          </div>
        )}

        {/* DIRECT LOGIN MODAL MODE */}
        {mode === 'direct_login' && (
          <div className="py-4 space-y-5 animate-in fade-in duration-150">
            <div>
              <h2 className="text-xl font-black text-[#181D20]">Log In to IPHC</h2>
              <p className="text-xs text-slate-500 mt-1">
                Enter registered phone number to switch accounts.
              </p>
            </div>

            <form onSubmit={handleDirectLoginSubmit} className="space-y-4 pt-1">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Registered Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={loginPhoneInput}
                  onChange={(e) => setLoginPhoneInput(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#181D20]"
                />
              </div>

              {loginError && (
                <p className="text-xs text-red-600 font-semibold bg-red-50 p-2.5 rounded-xl border border-red-100">
                  {loginError}
                </p>
              )}

              <button
                type="submit"
                className="w-full py-3.5 rounded-full bg-[#181D20] text-white font-extrabold text-sm hover:bg-black transition shadow-md active:scale-98"
              >
                Log In
              </button>

              <div className="p-3 rounded-2xl bg-slate-50 text-[11px] text-slate-500 border border-slate-100">
                <span className="font-bold text-slate-800 block mb-0.5">Pre-configured Demo Login:</span>
                <code>+27 82 459 1083</code> (Tumelo Lekolwane)
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
