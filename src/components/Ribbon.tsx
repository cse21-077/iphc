import React from 'react';

export type RibbonColor = 'blue' | 'red' | 'purple' | 'emerald' | 'amber' | 'dark' | 'indigo' | 'slate';

export interface RibbonProps {
  label: string;
  color?: RibbonColor;
  position?: 'right' | 'left';
  className?: string;
  icon?: React.ReactNode;
  size?: 'sm' | 'md';
}

const colorStyles: Record<RibbonColor, string> = {
  blue: 'bg-[#3F76C5] text-white shadow-md shadow-[#3F76C5]/20',
  red: 'bg-[#D13138] text-white shadow-md shadow-[#D13138]/20',
  purple: 'bg-[#7C3AED] text-white shadow-md shadow-[#7C3AED]/20',
  emerald: 'bg-[#059669] text-white shadow-md shadow-[#059669]/20',
  amber: 'bg-[#D97706] text-white shadow-md shadow-[#D97706]/20',
  dark: 'bg-[#1E293B] text-white shadow-md shadow-[#1E293B]/20',
  indigo: 'bg-[#4F46E5] text-white shadow-md shadow-[#4F46E5]/20',
  slate: 'bg-[#334155] text-white shadow-md shadow-slate-700/20',
};

/**
 * Reusable hanging ribbon starting at the top edge of a card and falling down into it.
 * Replaces faint/light pills with a solid, tactile, modern ribbon banner.
 */
export const Ribbon: React.FC<RibbonProps> = ({
  label,
  color = 'blue',
  position = 'right',
  className = '',
  icon,
  size = 'md',
}) => {
  const posClass = position === 'right' ? 'right-4' : 'left-4';
  const sizeClass = size === 'sm' ? 'px-2.5 pt-1.5 pb-2 text-[9px]' : 'px-3 pt-1.5 pb-2.5 text-[10px]';

  return (
    <div
      className={`absolute top-0 ${posClass} ${sizeClass} font-extrabold uppercase tracking-wider rounded-b-md flex items-center gap-1 z-20 select-none ${colorStyles[color]} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="leading-none">{label}</span>
    </div>
  );
};
