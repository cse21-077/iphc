import React, { useState } from 'react';
import { BusinessListing, MemberProfile } from '../types';
import { Ribbon, RibbonColor } from './Ribbon';
import {
  Briefcase,
  Search,
  Phone,
  MessageSquare,
  MapPin,
  CheckCircle2,
  Plus,
  Building,
  ArrowUpRight,
  X,
  Edit2,
  Share2,
  Truck,
  ShoppingBag,
  Hammer,
  Utensils,
  Laptop,
  HeartPulse,
  Scale,
  Building2,
} from 'lucide-react';

interface FLGEmpireViewProps {
  businesses: BusinessListing[];
  member: MemberProfile;
  onAddOrUpdateBusiness: (listing: BusinessListing) => void;
}

export const FLGEmpireView: React.FC<FLGEmpireViewProps> = ({
  businesses,
  member,
  onAddOrUpdateBusiness,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showMyBusinessModal, setShowMyBusinessModal] = useState(false);

  // My Business Form State
  const existingOwnerBiz = businesses.find((b) => b.isOwner || b.ownerName === member.name);
  const [bizName, setBizName] = useState(existingOwnerBiz?.businessName || '');
  const [bizCategory, setBizCategory] = useState<BusinessListing['category']>(
    existingOwnerBiz?.category || 'Construction'
  );
  const [bizDesc, setBizDesc] = useState(existingOwnerBiz?.description || '');
  const [bizPhone, setBizPhone] = useState(existingOwnerBiz?.phone || member.phone);
  const [bizWhatsApp, setBizWhatsApp] = useState(
    existingOwnerBiz?.whatsapp || member.phone.replace(/[^0-9]/g, '')
  );
  const [bizLocation, setBizLocation] = useState(
    existingOwnerBiz?.location || 'Gauteng & Silo Region'
  );
  const [bizEmail, setBizEmail] = useState(existingOwnerBiz?.email || member.email);

  const categories = [
    'All',
    'Construction',
    'Transport',
    'Catering',
    'Legal & Accounting',
    'Agriculture',
    'Retail',
    'Services',
  ];

  const filteredBusinesses = businesses.filter((b) => {
    const matchesCategory =
      selectedCategory === 'All' || b.category === selectedCategory;
    const matchesSearch =
      b.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.location.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSaveBusiness = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bizName.trim() || !bizDesc.trim()) return;

    const newBiz: BusinessListing = {
      id: existingOwnerBiz?.id || `biz_${Date.now()}`,
      businessName: bizName.trim(),
      ownerName: `${member.title} ${member.name}`,
      ownerBranch: member.branch,
      category: bizCategory,
      description: bizDesc.trim(),
      phone: bizPhone.trim(),
      whatsapp: bizWhatsApp.trim().replace(/[^0-9]/g, ''),
      email: bizEmail.trim(),
      location: bizLocation.trim(),
      verifiedChurchMember: true,
      isOwner: true,
      createdAt: new Date().toISOString().split('T')[0],
    };

    onAddOrUpdateBusiness(newBiz);
    setShowMyBusinessModal(false);
  };

  const getCategoryDetails = (cat: string): { icon: React.ReactNode; color: RibbonColor } => {
    const c = cat.toLowerCase();
    if (c.includes('transport') || c.includes('logistics')) return { icon: <Truck className="w-4 h-4 text-[#3F76C5]" />, color: 'blue' };
    if (c.includes('retail') || c.includes('cloth') || c.includes('fashion')) return { icon: <ShoppingBag className="w-4 h-4 text-purple-600" />, color: 'purple' };
    if (c.includes('construct') || c.includes('build') || c.includes('property')) return { icon: <Hammer className="w-4 h-4 text-amber-600" />, color: 'amber' };
    if (c.includes('food') || c.includes('cater')) return { icon: <Utensils className="w-4 h-4 text-[#D13138]" />, color: 'red' };
    if (c.includes('tech') || c.includes('media') || c.includes('software')) return { icon: <Laptop className="w-4 h-4 text-blue-600" />, color: 'blue' };
    if (c.includes('health') || c.includes('wellness')) return { icon: <HeartPulse className="w-4 h-4 text-emerald-600" />, color: 'emerald' };
    if (c.includes('legal') || c.includes('finance') || c.includes('account')) return { icon: <Scale className="w-4 h-4 text-slate-700" />, color: 'slate' };
    return { icon: <Building2 className="w-4 h-4 text-slate-700" />, color: 'slate' };
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col pb-20 max-w-md mx-auto">
      {/* Top Banner */}
      <div className="p-4 bg-white border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#181D20] tracking-tight">
              Business Directory
            </h1>
            <p className="text-xs text-slate-400 font-normal mt-0.5">
              Member enterprises & professional services
            </p>
          </div>

          {/* My Business CTA Button */}
          <button
            id="flg-my-business-btn"
            onClick={() => setShowMyBusinessModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#181D20] text-white text-xs font-semibold shadow-xs hover:bg-black transition active:scale-95"
          >
            {existingOwnerBiz ? (
              <>
                <Edit2 className="w-3.5 h-3.5" />
                <span>My Listing</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>Add Listing</span>
              </>
            )}
          </button>
        </div>

        {/* Search Bar */}
        <div className="mt-3.5 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search businesses, services, transport..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#181D20] focus:bg-white transition"
          />
        </div>

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

      {/* Business Listings List */}
      <div className="p-4 space-y-3.5 flex-1">
        {filteredBusinesses.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-slate-500">
            <Building className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-slate-700">No businesses found</p>
            <p className="text-xs text-slate-500 mt-1">Try another search or category filter.</p>
          </div>
        ) : (
          filteredBusinesses.map((biz) => {
            const catInfo = getCategoryDetails(biz.category);

            return (
              <div
                key={biz.id}
                className="bg-white rounded-[22px] p-4.5 border border-slate-200/90 shadow-xs hover:border-slate-300 transition relative group"
              >
                {/* Header: Title, Category pill, and owner tag */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {catInfo.icon}
                    <h3 className="text-sm sm:text-base font-bold text-[#181D20] leading-tight truncate">
                      {biz.businessName}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                      {biz.category}
                    </span>
                    {biz.isOwner && (
                      <span className="text-[10px] font-bold text-slate-600 border border-slate-300 rounded-full px-2 py-0.5">
                        YOU
                      </span>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  {biz.description}
                </p>

                {/* Owner Info & Location */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="min-w-0">
                    <span className="font-semibold text-slate-800 truncate block">{biz.ownerName}</span>
                    <span className="text-[11px] text-slate-400 block">{biz.ownerBranch}</span>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] text-slate-500 shrink-0">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{biz.location}</span>
                  </div>
                </div>

                {/* Contact Actions (Direct WhatsApp / Call) */}
                <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center gap-2">
                  <a
                    href={`tel:${biz.phone}`}
                    className="flex-1 py-2 px-3 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-98"
                  >
                    <Phone className="w-3.5 h-3.5 text-slate-600" />
                    <span>Call</span>
                  </a>

                  <a
                    href={`https://wa.me/${biz.whatsapp}?text=Dumela%20Ntate/Mme,%20I%20saw%20your%20business%20on%20the%20IPHC%20MMUSO%20Platform.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 px-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-xs active:scale-98"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-white" />
                    <span>WhatsApp</span>
                  </a>

                  {biz.isOwner && (
                    <button
                      onClick={() => setShowMyBusinessModal(true)}
                      className="p-2 text-slate-500 hover:text-slate-800 transition"
                      title="Edit listing"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* "My Business" Creation / Edit Modal */}
      {showMyBusinessModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-[#3F76C5]" />
                <h3 className="text-base font-bold text-slate-900">
                  {existingOwnerBiz ? 'Edit My Business Listing' : 'List My Church Business'}
                </h3>
              </div>
              <button
                onClick={() => setShowMyBusinessModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBusiness} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Business Name *
                </label>
                <input
                  type="text"
                  required
                  value={bizName}
                  onChange={(e) => setBizName(e.target.value)}
                  placeholder="e.g. Lekolwane Electrical & Solar"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#3F76C5] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Category *
                </label>
                <select
                  value={bizCategory}
                  onChange={(e) => setBizCategory(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#3F76C5] focus:outline-hidden bg-white"
                >
                  <option value="Construction">Construction & Engineering</option>
                  <option value="Transport">Transport & Logistics</option>
                  <option value="Catering">Catering & Events</option>
                  <option value="Legal & Accounting">Legal & Accounting</option>
                  <option value="Agriculture">Agriculture & Fresh Produce</option>
                  <option value="Retail">Retail & Tailoring</option>
                  <option value="Health & Beauty">Health & Beauty</option>
                  <option value="Services">General Services</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Services Description *
                </label>
                <textarea
                  required
                  rows={3}
                  value={bizDesc}
                  onChange={(e) => setBizDesc(e.target.value)}
                  placeholder="Describe your services and special discounts for church members..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#3F76C5] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Contact Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={bizPhone}
                    onChange={(e) => setBizPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#3F76C5] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    WhatsApp Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={bizWhatsApp}
                    onChange={(e) => setBizWhatsApp(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#3F76C5] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Operating Location / Area
                </label>
                <input
                  type="text"
                  value={bizLocation}
                  onChange={(e) => setBizLocation(e.target.value)}
                  placeholder="e.g. Westonaria, Johannesburg, Silo"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#3F76C5] focus:outline-hidden"
                />
              </div>

              <div className="p-3 rounded-xl bg-blue-50 text-[#3F76C5] text-[11px] leading-relaxed">
                Listing will be published under your verified profile: <strong>{member.name} ({member.branch})</strong>.
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-[#D13138] text-white font-bold text-sm hover:bg-[#b8262d] transition shadow-md active:scale-98"
                >
                  Save & Publish to FLG Empire
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
