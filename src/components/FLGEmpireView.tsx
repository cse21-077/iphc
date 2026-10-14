import React from 'react';
import { Building2, BriefcaseBusiness } from 'lucide-react';

export const FLGEmpireView: React.FC = () => (
  <div className="min-h-[calc(100vh-8rem)] bg-[#F8F9FA] pb-20">
    <header className="border-b border-slate-100 bg-white px-5 py-5">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#3F76C5]">
        FLG Empire
      </p>
      <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">Member directory</h1>
      <p className="mt-1 text-xs text-slate-500">Discover businesses submitted by IPHC members.</p>
    </header>
    <section className="p-4">
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#3F76C5]">
          <Building2 className="h-7 w-7" />
        </div>
        <h2 className="mt-4 text-base font-extrabold text-slate-900">No submissions yet</h2>
        <p className="mx-auto mt-2 max-w-xs text-xs leading-relaxed text-slate-500">
          Published member businesses will appear here once submissions are available.
        </p>
        <div className="mx-auto mt-6 inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-2 text-[10px] font-bold text-slate-500">
          <BriefcaseBusiness className="h-3.5 w-3.5" />
          Member directory
        </div>
      </div>
    </section>
  </div>
);
