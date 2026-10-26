import React from 'react';
import { LayoutGrid, List, Search } from 'lucide-react';

export const SearchInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}> = ({ value, onChange, placeholder, className = '' }) => (
  <label className={`relative block ${className}`}>
    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3F76C5]/40 focus:border-[#3F76C5] transition"
    />
  </label>
);

export const ViewToggle: React.FC<{
  view: 'list' | 'grid';
  onChange: (view: 'list' | 'grid') => void;
}> = ({ view, onChange }) => (
  <div className="flex p-1 rounded-xl bg-slate-100 shrink-0" role="group" aria-label="Layout view">
    <button
      type="button"
      onClick={() => onChange('list')}
      aria-pressed={view === 'list'}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-extrabold transition ${
        view === 'list' ? 'bg-white text-[#0A2A52] shadow-sm' : 'text-slate-500 hover:text-slate-800'
      }`}
    >
      <List className="w-3.5 h-3.5" />
      List
    </button>
    <button
      type="button"
      onClick={() => onChange('grid')}
      aria-pressed={view === 'grid'}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-extrabold transition ${
        view === 'grid' ? 'bg-white text-[#0A2A52] shadow-sm' : 'text-slate-500 hover:text-slate-800'
      }`}
    >
      <LayoutGrid className="w-3.5 h-3.5" />
      Cards
    </button>
  </div>
);
