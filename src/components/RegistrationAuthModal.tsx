import React, { useState } from 'react';
import { RegistrationPayload } from '../api';
import { BRANCH_REGION_GROUPS } from '../data/branches';
import {
  ArrowRight,
  Check,
  Camera,
  Search,
  UserCheck,
  Building2,
  X,
  User,
  Mail,
  MapPin,
  BookOpen,
  GraduationCap,
  Users,
  Heart,
  Plus,
  Trash2,
  ChevronDown,
} from 'lucide-react';

interface RegistrationAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (identifier: string, password: string) => Promise<void>; // identifier = email or phone
  onRegisterComplete: (registration: RegistrationPayload) => Promise<void>;
}

interface CountryDial {
  name: string;
  dial: string;
  flag: string;
}

const COUNTRY_DIALS: CountryDial[] = [
  { name: 'South Africa', dial: '+27', flag: '🇿🇦' },
  { name: 'Botswana', dial: '+267', flag: '🇧🇼' },
  { name: 'Lesotho', dial: '+266', flag: '🇱🇸' },
  { name: 'Namibia', dial: '+264', flag: '🇳🇦' },
  { name: 'Zimbabwe', dial: '+263', flag: '🇿🇼' },
  { name: 'Mozambique', dial: '+258', flag: '🇲🇿' },
  { name: 'Eswatini', dial: '+268', flag: '🇸🇿' },
  { name: 'Zambia', dial: '+260', flag: '🇿🇲' },
];

const SECTION_OPTIONS = [
  'BaPriest',
  'Bo Ntate',
  'Difate',
  'Dinaledi',
  'Badisa',
  'Ayobaness',
];

const MARRIAGE_OPTIONS = ['Single', 'Married', 'Divorced', 'Widowed'];

const KIN_RELATIONS = ['Spouse', 'Parent', 'Child', 'Sibling', 'Grandparent', 'Other Relative'];

const inputClass =
  'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#3F76C5]';
const labelClass =
  'text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1';
const subHeadingClass =
  'text-[11px] font-black text-slate-900 uppercase tracking-widest pt-1 flex items-center gap-1.5';

export const RegistrationAuthModal: React.FC<RegistrationAuthModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  onRegisterComplete,
}) => {
  const [mode, setMode] = useState<'welcome' | 'phone' | 'about' | 'review' | 'confirmation' | 'direct_login'>('welcome');

  // Form State
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [titlePrefix, setTitlePrefix] = useState<'Ntate' | 'Mme'>('Ntate');
  const [fullName, setFullName] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');

  // Searchable branch picker state
  const [branchPickerOpen, setBranchPickerOpen] = useState(false);
  const [branchQuery, setBranchQuery] = useState('');

  // Country code picker state
  const [dialCode, setDialCode] = useState('+27');
  const [localNumber, setLocalNumber] = useState('');
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  // Proposed Member Information fields
  const [age, setAge] = useState('');
  const [biography, setBiography] = useState('');
  const [qualifications, setQualifications] = useState('');
  const [section, setSection] = useState('BaPriest');
  const [email, setEmail] = useState('');
  const [physicalAddress, setPhysicalAddress] = useState('');
  const [postalAddress, setPostalAddress] = useState('');
  const [marriageStatus, setMarriageStatus] = useState('Single');
  const [kinName, setKinName] = useState('');
  const [kinRelation, setKinRelation] = useState('Spouse');
  const [kinPhone, setKinPhone] = useState('');
  const [familyMembers, setFamilyMembers] = useState<Array<{ name: string; relation: string }>>([]);

  // Direct login state
  const [loginPhoneInput, setLoginPhoneInput] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fullPhone = `${dialCode} ${localNumber}`.trim();
  const selectedCountry = COUNTRY_DIALS.find((c) => c.dial === dialCode) ?? COUNTRY_DIALS[0];
  const filteredCountries = countrySearch.trim()
    ? COUNTRY_DIALS.filter(
        (c) =>
          c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
          c.dial.includes(countrySearch.trim())
      )
    : COUNTRY_DIALS;

  const branchQueryTrimmed = branchQuery.trim().toLowerCase();
  const filteredBranchGroups = BRANCH_REGION_GROUPS.map((group) => ({
    region: group.region,
    branches: branchQueryTrimmed
      ? group.branches.filter(
          (b) =>
            b.toLowerCase().includes(branchQueryTrimmed) ||
            group.region.toLowerCase().includes(branchQueryTrimmed)
        )
      : group.branches,
  })).filter((group) => group.branches.length > 0);
  const totalFilteredBranches = filteredBranchGroups.reduce((sum, g) => sum + g.branches.length, 0);

  if (!isOpen) return null;

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
    if (!localNumber.trim() || password.length < 8) return;
    setPhone(fullPhone);
    setFormError('');
    setMode('about');
  };

  const updateFamilyMember = (index: number, field: 'name' | 'relation', value: string) => {
    setFamilyMembers((prev) => prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)));
  };

  const handleCompleteRegistration = async () => {
    setIsSubmitting(true);
    setFormError('');
    try {
      await onRegisterComplete({
        phone: phone || fullPhone,
        email: email.trim() || undefined,
        password,
        title: titlePrefix,
        fullName: fullName.trim(),
        branch: selectedBranch,
        section,
        age: age.trim() ? parseInt(age, 10) : undefined,
        biography: biography.trim() || undefined,
        qualifications: qualifications.trim() || undefined,
        photoUrl: photoUrl.trim() || undefined,
        physicalAddress: physicalAddress.trim() || undefined,
        postalAddress: postalAddress.trim() || undefined,
        marriageStatus,
        nextOfKin: kinName.trim()
          ? { fullName: kinName.trim(), relation: kinRelation, phone: kinPhone.trim() || phone || fullPhone }
          : undefined,
        familyMembers: familyMembers
          .filter((member) => member.name.trim())
          .map((member) => ({ fullName: member.name.trim(), relation: member.relation.trim() || 'Family' })),
      });
      setMode('confirmation');
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Registration could not be completed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDirectLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsSubmitting(true);
    try {
      await onLogin(loginPhoneInput.trim(), loginPassword);
      onClose();
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Unable to sign in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const CountryPicker = ({ idPrefix }: { idPrefix: string }) => (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => {
          setCountryPickerOpen(!countryPickerOpen);
          setCountrySearch('');
        }}
        className="h-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 flex items-center gap-1.5 hover:bg-slate-100 transition focus:outline-hidden focus:ring-2 focus:ring-[#3F76C5]"
        aria-label="Select country code"
      >
        <span className="text-base leading-none">{selectedCountry.flag}</span>
        <span className="font-mono">{dialCode}</span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {countryPickerOpen && (
        <div className="absolute left-0 top-full mt-1 w-60 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 overflow-hidden animate-in fade-in duration-100">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                id={`${idPrefix}-country-search`}
                type="text"
                autoFocus
                value={countrySearch}
                onChange={(e) => setCountrySearch(e.target.value)}
                placeholder="Search country or code"
                className="w-full pl-7 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-[#3F76C5]"
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filteredCountries.map((c) => (
              <button
                key={c.dial}
                type="button"
                onClick={() => {
                  setDialCode(c.dial);
                  setCountryPickerOpen(false);
                }}
                className={`w-full px-3 py-2 text-left text-xs font-semibold flex items-center gap-2.5 transition ${
                  c.dial === dialCode ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="text-base leading-none">{c.flag}</span>
                <span className="flex-1">{c.name}</span>
                <span className={`font-mono ${c.dial === dialCode ? 'text-white' : 'text-slate-400'}`}>{c.dial}</span>
              </button>
            ))}
            {filteredCountries.length === 0 && (
              <div className="p-3 text-xs text-slate-400 text-center">No countries match "{countrySearch}"</div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-xs p-0 sm:p-4 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl max-h-[92vh] flex flex-col relative overflow-hidden">
        {/* Top Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 transition z-10"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* SCREEN 1: Welcome */}
        {mode === 'welcome' && (
          <div className="py-4 space-y-6 text-center animate-in fade-in duration-150">
            <div className="w-20 h-20 mx-auto flex items-center justify-center">
              <img src="/App%20logo.png" alt="IPHC logo" className="w-full h-full object-contain" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-[#0A2A52] tracking-tight">
                International Pentecost Holiness Church
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-2 leading-relaxed px-2">
                Get your digital membership card, check in at services, and stay connected with your branch.
              </p>
            </div>

            <div className="pt-4 space-y-3">
              <button
                onClick={() => setMode('phone')}
                className="w-full py-4 rounded-full bg-[#0A2A52] text-white font-extrabold text-sm hover:bg-[#164A86] transition shadow-lg active:scale-98 flex items-center justify-center gap-2"
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
              <h2 className="text-xl font-black text-[#0A2A52]">Enter Phone Number</h2>
              <p className="text-xs text-slate-500 mt-1">
                Create a secure account with your phone number and a password.
              </p>
            </div>

            <form onSubmit={handleSendCode} className="space-y-4 pt-2">
              <div>
                  <label className={labelClass}>Mobile Number *</label>
                <div className="flex gap-2">
                  <CountryPicker idPrefix="reg" />
                  <input
                    type="tel"
                    required
                    value={localNumber}
                    onChange={(e) => setLocalNumber(e.target.value)}
                    placeholder="82 000 0000"
                    className="flex-1 min-w-0 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#3F76C5]"
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Password (at least 8 characters) *</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-full bg-[#0A2A52] text-white font-extrabold text-sm hover:bg-[#164A86] transition shadow-md active:scale-98"
              >
                Continue
              </button>
            </form>
          </div>
        )}

        {/* SCREEN 3: Member Information */}
        {mode === 'about' && (
          <div className="py-2 space-y-4 animate-in fade-in duration-150 flex-1 overflow-y-auto pr-1">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
              <span>Step 2 of 3</span>
              <span>Member Information</span>
            </div>

            <div>
              <h2 className="text-xl font-black text-[#0A2A52]">Member Information</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Provide your details as they should appear on your membership record.
              </p>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Personal Details */}
              <h3 className={subHeadingClass}>
                <User className="w-3.5 h-3.5" /> Personal Details
              </h3>

              <div>
                <label className={labelClass}>Honorific Title *</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Ntate', 'Mme'] as const).map((pref) => (
                    <button
                      key={pref}
                      type="button"
                      onClick={() => setTitlePrefix(pref)}
                      className={`py-2.5 rounded-xl font-extrabold text-xs transition border text-center active:scale-95 ${
                        titlePrefix === pref
                          ? 'bg-[#0A2A52] text-white border-[#0A2A52] shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {pref}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelClass}>Full Name *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Masego Tau"
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className={labelClass}>Age</label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="e.g. 34"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Marriage Status</label>
                  <select
                    value={marriageStatus}
                    onChange={(e) => setMarriageStatus(e.target.value)}
                    className={inputClass}
                  >
                    {MARRIAGE_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Profile Picture */}
              <div>
                <label className={labelClass}>Profile Picture (Optional Upload)</label>
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

              {/* Background */}
              <h3 className={subHeadingClass}>
                <BookOpen className="w-3.5 h-3.5" /> Biography & Qualifications
              </h3>

              <div>
                <label className={labelClass}>Biography</label>
                <textarea
                  value={biography}
                  onChange={(e) => setBiography(e.target.value)}
                  placeholder="A short introduction about yourself, your faith journey, and service in the church..."
                  rows={3}
                  className={`${inputClass} resize-none`}
                />
              </div>

              <div>
                <label className={labelClass}>Qualifications (Education Background)</label>
                <textarea
                  value={qualifications}
                  onChange={(e) => setQualifications(e.target.value)}
                  placeholder="e.g. Diploma in Education, University of Limpopo (2015)"
                  rows={2}
                  className={`${inputClass} resize-none`}
                />
              </div>

              {/* Church */}
              <h3 className={subHeadingClass}>
                <Building2 className="w-3.5 h-3.5" /> Church Details
              </h3>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className={labelClass}>Section</label>
                  <select
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    className={inputClass}
                  >
                    {SECTION_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Branch *</label>
                  {branchPickerOpen ? (
                    <div className="border border-slate-200 rounded-xl bg-white shadow-lg overflow-hidden animate-in fade-in duration-100">
                      <div className="relative border-b border-slate-100">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          autoFocus
                          value={branchQuery}
                          onChange={(e) => setBranchQuery(e.target.value)}
                          placeholder="Type to filter 171 branches..."
                          className="w-full pl-8 pr-8 py-2.5 text-xs font-semibold text-slate-900 focus:outline-hidden"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setBranchPickerOpen(false);
                            setBranchQuery('');
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-700 transition"
                          aria-label="Close branch search"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="max-h-56 overflow-y-auto">
                        {totalFilteredBranches > 0 ? (
                          filteredBranchGroups.map((group) => (
                            <div key={group.region}>
                              <div className="px-3 py-1.5 bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest sticky top-0">
                                {group.region}
                              </div>
                              {group.branches.map((b) => (
                                <button
                                  key={`${group.region}-${b}`}
                                  type="button"
                                  onClick={() => {
                                    setSelectedBranch(b);
                                    setBranchPickerOpen(false);
                                    setBranchQuery('');
                                  }}
                                  className={`w-full px-3 py-2 text-left text-xs font-semibold flex items-center justify-between transition ${
                                    selectedBranch === b
                                      ? 'bg-slate-900 text-white'
                                      : 'text-slate-700 hover:bg-slate-100'
                                  }`}
                                >
                                  <span>{b}</span>
                                  {selectedBranch === b && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                                </button>
                              ))}
                            </div>
                          ))
                        ) : (
                          <div className="p-3 text-xs text-slate-400 text-center">
                            No branches match "{branchQuery}"
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setBranchPickerOpen(true)}
                      className={`w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold flex items-center justify-between gap-2 transition text-left ${
                        selectedBranch
                          ? 'text-slate-900'
                          : 'text-slate-400'
                      } hover:bg-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#3F76C5]`}
                    >
                      <span className="truncate">{selectedBranch || 'Search & select your branch...'}</span>
                      <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </button>
                  )}
                </div>
              </div>

              {/* Contact */}
              <h3 className={subHeadingClass}>
                <Mail className="w-3.5 h-3.5" /> Contact Details
              </h3>

              <div>
                <label className={labelClass}>Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. masego.tau@gmail.com"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Physical Address</label>
                <textarea
                  value={physicalAddress}
                  onChange={(e) => setPhysicalAddress(e.target.value)}
                  placeholder="Stand / Street, Town, Province / District"
                  rows={2}
                  className={`${inputClass} resize-none`}
                />
              </div>

              <div>
                <label className={labelClass}>Postal Address</label>
                <input
                  type="text"
                  value={postalAddress}
                  onChange={(e) => setPostalAddress(e.target.value)}
                  placeholder="P.O. Box, Town, Postal Code"
                  className={inputClass}
                />
              </div>

              {/* Family */}
              <h3 className={subHeadingClass}>
                <Heart className="w-3.5 h-3.5" /> Next of Kin & Family Members
              </h3>

              <div className="p-3 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2.5">
                <div>
                  <label className={labelClass}>Next of Kin — Full Name</label>
                  <input
                    type="text"
                    value={kinName}
                    onChange={(e) => setKinName(e.target.value)}
                    placeholder="e.g. Mme Kea Tau"
                    className={inputClass}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className={labelClass}>Relation</label>
                    <select
                      value={kinRelation}
                      onChange={(e) => setKinRelation(e.target.value)}
                      className={inputClass}
                    >
                      {KIN_RELATIONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Next of Kin Phone</label>
                    <input
                      type="tel"
                      value={kinPhone}
                      onChange={(e) => setKinPhone(e.target.value)}
                      placeholder="+27 83 000 0000"
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={`${labelClass} mb-0`}>Family Members (If Applicable)</label>
                  <button
                    type="button"
                    onClick={() => setFamilyMembers((prev) => [...prev, { name: '', relation: '' }])}
                    className="flex items-center gap-1 text-[10px] font-extrabold text-slate-900 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-full transition active:scale-95"
                  >
                    <Plus className="w-3 h-3" /> Add Member
                  </button>
                </div>

                {familyMembers.length === 0 ? (
                  <p className="text-[11px] text-slate-400 font-medium px-1">
                    No family members added. Use "Add Member" to register household members.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {familyMembers.map((member, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={member.name}
                          onChange={(e) => updateFamilyMember(idx, 'name', e.target.value)}
                          placeholder="Full name"
                          className={`${inputClass} flex-1 min-w-0`}
                        />
                        <input
                          type="text"
                          value={member.relation}
                          onChange={(e) => updateFamilyMember(idx, 'relation', e.target.value)}
                          placeholder="e.g. Spouse, Son (12)"
                          className={`${inputClass} w-28 shrink-0`}
                        />
                        <button
                          type="button"
                          onClick={() => setFamilyMembers((prev) => prev.filter((_, i) => i !== idx))}
                          className="p-2 rounded-xl text-red-500 hover:bg-red-50 transition shrink-0"
                          aria-label="Remove family member"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
                disabled={!fullName.trim() || !selectedBranch}
              onClick={() => setMode('review')}
              className="w-full py-3.5 rounded-full bg-[#0A2A52] text-white font-extrabold text-sm hover:bg-[#164A86] transition shadow-md active:scale-98 disabled:opacity-50 mt-2"
            >
              Continue to Review
            </button>
          </div>
        )}

        {/* SCREEN 4: Review */}
        {mode === 'review' && (
          <div className="py-3 space-y-4 animate-in fade-in duration-150 flex-1 overflow-y-auto pr-1">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
              <span>Step 3 of 3</span>
              <span>Review</span>
            </div>

            <div>
              <h2 className="text-xl font-black text-[#0A2A52]">Review Registration</h2>
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
                <div className="min-w-0">
                  <h4 className="font-extrabold text-sm text-slate-900">
                    {titlePrefix} {fullName}
                  </h4>
                  <p className="text-slate-500 font-mono font-bold mt-0.5">{phone || fullPhone}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/60 space-y-2">
                {[
                  ['Age', age ? `${age} years` : '—'],
                  ['Marriage Status', marriageStatus],
                  ['Section', section],
                  ['Branch', selectedBranch || 'Silo'],
                  ['Email', email || '—'],
                  ['Physical Address', physicalAddress || '—'],
                  ['Postal Address', postalAddress || '—'],
                  ['Qualifications', qualifications || '—'],
                  ['Next of Kin', kinName ? `${kinName} (${kinRelation})` : '—'],
                  ['Next of Kin Phone', kinPhone || '—'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3">
                    <span className="text-slate-400 font-bold uppercase text-[10px] shrink-0">{k}:</span>
                    <span className="font-bold text-slate-900 text-right break-words min-w-0">{v}</span>
                  </div>
                ))}
              </div>

              {biography.trim() && (
                <div className="pt-2 border-t border-slate-200/60">
                  <span className="text-slate-400 font-bold uppercase text-[10px] block mb-0.5">Biography:</span>
                  <p className="font-semibold text-slate-800 leading-snug">{biography}</p>
                </div>
              )}

              {familyMembers.some((m) => m.name.trim()) && (
                <div className="pt-2 border-t border-slate-200/60">
                  <span className="text-slate-400 font-bold uppercase text-[10px] block mb-1">
                    Family Members ({familyMembers.filter((m) => m.name.trim()).length}):
                  </span>
                  <ul className="space-y-1">
                    {familyMembers
                      .filter((m) => m.name.trim())
                      .map((m, i) => (
                        <li key={i} className="font-bold text-slate-900 flex items-center gap-1.5">
                          <Users className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>
                            {m.name} <span className="text-slate-500 font-semibold">— {m.relation || 'Family'}</span>
                          </span>
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </div>

            {formError && (
              <p className="text-xs text-red-600 font-semibold bg-red-50 p-2.5 rounded-xl border border-red-100">
                {formError}
              </p>
            )}

            <button
              onClick={handleCompleteRegistration}
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-full bg-[#0A2A52] text-white font-extrabold text-sm hover:bg-[#164A86] transition shadow-lg active:scale-98 disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting…' : 'Submit Registration'}
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
              <h2 className="text-2xl font-black text-[#0A2A52]">You're almost in!</h2>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed px-2">
                <strong className="text-slate-900">{selectedBranch || 'Silo'}</strong> will confirm your details, then your membership card will be ready. We'll let you know.
              </p>
            </div>

            <div className="pt-3">
              <button
                onClick={onClose}
                className="w-full py-4 rounded-full bg-[#0A2A52] text-white font-extrabold text-sm hover:bg-[#164A86] transition shadow-lg active:scale-98"
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
              <h2 className="text-xl font-black text-[#0A2A52]">Log In to IPHC</h2>
              <p className="text-xs text-slate-500 mt-1">
                Enter your registered email address or phone number.
              </p>
            </div>

            <form onSubmit={handleDirectLoginSubmit} className="space-y-4 pt-1">
              <div>
                <label className={labelClass}>Email or Phone Number *</label>
                <input
                  type="text"
                  required
                  autoComplete="username"
                  placeholder="you@example.com or +27 82 000 0000"
                  value={loginPhoneInput}
                  onChange={(e) => setLoginPhoneInput(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#3F76C5]"
                />
              </div>

              <div>
                <label className={labelClass}>Password *</label>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#3F76C5]"
                />
              </div>

              {loginError && (
                <p className="text-xs text-red-600 font-semibold bg-red-50 p-2.5 rounded-xl border border-red-100">
                  {loginError}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-full bg-[#0A2A52] text-white font-extrabold text-sm hover:bg-[#164A86] transition shadow-md active:scale-98 disabled:opacity-50"
              >
                {isSubmitting ? 'Signing in…' : 'Log In'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
