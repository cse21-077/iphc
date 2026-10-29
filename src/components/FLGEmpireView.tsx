import React from 'react';
import { BriefcaseBusiness, Building2, ChevronRight } from 'lucide-react';
import { useTranslation } from '../data/i18n';

export const FLGEmpireView: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-[calc(100vh-8rem)] pb-28 max-w-md mx-auto space-y-5 px-4 pt-3">
      {/* Header */}
      <div className="pt-2">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#3F76C5]">
          {t('directory.title')}
        </p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-[#0A2A52]">
          {t('directory.memberDirectory')}
        </h1>
        <p className="mt-1 text-xs font-medium text-slate-500">{t('directory.discover')}</p>
      </div>

      {/* Hero card — same pastel treatment as the security gate-duty card */}
      <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#E7EFFC] to-[#D7E5F9] p-5 shadow-[0_10px_30px_rgba(10,42,82,0.10)]">
        <div className="pointer-events-none absolute -right-5 -top-6 h-24 w-24 rounded-full bg-[#D13138] opacity-90 shadow-[0_10px_24px_rgba(209,49,56,0.35)]" />
        <div className="pointer-events-none absolute right-12 top-8 h-14 w-14 rounded-full bg-[#F5B301] opacity-90 shadow-[0_10px_24px_rgba(245,179,1,0.35)]" />
        <div className="pointer-events-none absolute -bottom-7 right-2 h-20 w-20 rounded-full bg-[#0A2A52] opacity-95 shadow-[0_10px_24px_rgba(10,42,82,0.35)]" />

        <div className="relative z-10 max-w-[68%]">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#0A2A52]">
            <BriefcaseBusiness className="h-3 w-3 text-[#D13138]" />
            {t('directory.title')}
          </span>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-[#0A2A52]">
            {t('directory.memberDirectory')}
          </h2>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-[#3D5876]">
            {t('directory.discover')}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-extrabold text-[#0A2A52] shadow-sm">
              0 {t('directory.empty').toLowerCase()}
            </span>
          </div>
        </div>
      </section>

      {/* Clean empty state */}
      <section className="rounded-[28px] border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-[0_10px_30px_rgba(10,42,82,0.06)]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF1FB] text-[#3F76C5]">
          <Building2 className="h-7 w-7" />
        </div>
        <h2 className="mt-4 text-base font-extrabold text-slate-900">{t('directory.empty')}</h2>
        <p className="mx-auto mt-2 max-w-xs text-xs leading-relaxed text-slate-500">
          {t('directory.emptySub')}
        </p>
        <div className="mx-auto mt-6 inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-2 text-[10px] font-bold text-slate-500">
          {t('directory.memberDirectory')}
          <ChevronRight className="h-3.5 w-3.5" />
        </div>
      </section>
    </div>
  );
};
