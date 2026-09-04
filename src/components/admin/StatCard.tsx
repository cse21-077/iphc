import React from 'react';
import { TrendingUp, TrendingDown, MoreVertical } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string;
  animatedValue?: React.ReactNode; // count-up replacement for `value`
  sub?: string;
  trend: number; // percent, negative renders red
  trendLabel: string;
  highlighted?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  animatedValue,
  sub,
  trend,
  trendLabel,
  highlighted = false,
}) => {
  const positive = trend >= 0;
  const TrendIcon = positive ? TrendingUp : TrendingDown;

  return (
    <div
      className={`rounded-2xl p-5 relative transition-shadow duration-300 ${
        highlighted
          ? 'bg-[#3F76C5] text-white shadow-[0_12px_30px_rgba(63,118,197,0.35)]'
          : 'bg-white border border-slate-100 shadow-[0_4px_16px_rgba(15,42,82,0.05)]'
      }`}
    >
      <div className="flex items-start justify-between">
        <span
          className={`text-xs font-bold ${
            highlighted ? 'text-blue-100' : 'text-slate-400'
          }`}
        >
          {label}
        </span>
        <button
          className={`p-1 rounded-full transition ${
            highlighted ? 'text-blue-100 hover:bg-white/10' : 'text-slate-300 hover:bg-slate-50'
          }`}
          aria-label="More options"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-1.5">
        {animatedValue ?? (
          <span className={`text-[26px] leading-none font-extrabold tracking-tight ${highlighted ? 'text-white' : 'text-slate-900'}`}>
            {value}
          </span>
        )}
        {sub && (
          <span className={`block text-[11px] font-semibold mt-1 ${highlighted ? 'text-blue-100' : 'text-slate-400'}`}>
            {sub}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5 mt-3 text-[11px] font-bold">
        <TrendIcon className={`w-3.5 h-3.5 ${positive ? (highlighted ? 'text-emerald-300' : 'text-emerald-500') : highlighted ? 'text-red-300' : 'text-[#D13138]'}`} />
        <span className={positive ? (highlighted ? 'text-emerald-300' : 'text-emerald-600') : highlighted ? 'text-red-300' : 'text-[#D13138]'}>
          {positive ? '↗' : '↘'} {Math.abs(trend)}%
        </span>
        <span className={highlighted ? 'text-blue-100 font-semibold' : 'text-slate-400 font-semibold'}>
          {trendLabel}
        </span>
      </div>
    </div>
  );
};
