import React, { useEffect, useRef, useState } from 'react';
import { motion, animate, useInView } from 'motion/react';
import { WeeklyDatum, HeatmapSlot } from '../../data/adminData';

const BLUE = '#3F76C5';
const NAVY = '#0A2A52';

// ---------------------------------------------------------------------------
// Count-up number: animates from 0 to value whenever it scrolls into view
// ---------------------------------------------------------------------------
interface AnimatedNumberProps {
  value: number;
  format?: (n: number) => string;
  duration?: number;
  className?: string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  format = (n) => n.toLocaleString('en-ZA'),
  duration = 1.4,
  className,
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [inView, value, duration]);

  return (
    <span ref={ref} className={className}>
      {format(Math.round(display))}
    </span>
  );
};

// ---------------------------------------------------------------------------
// Grouped bar chart: registrations vs check-ins, Sun–Sat
// ---------------------------------------------------------------------------
interface BarChartProps {
  data: WeeklyDatum[];
  seriesA: { key: 'registrations'; label: string; color: string };
  seriesB: { key: 'checkIns'; label: string; color: string };
  height?: number;
}

export const RegistrationsBarChart: React.FC<BarChartProps> = ({
  data,
  seriesA,
  seriesB,
  height = 220,
}) => {
  const max = Math.max(...data.map((d) => Math.max(d.registrations, d.checkIns)));
  const niceMax = Math.ceil(max / 1000) * 1000;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(niceMax * f));
  const chartH = height - 28; // room for x labels
  const rowH = chartH / ticks.length;

  return (
    <div>
      {/* Legend */}
      <div className="flex items-center gap-4 mb-3">
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
          <motion.span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: seriesA.color }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
          />
          {seriesA.label}
        </span>
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
          <motion.span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: seriesB.color }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.1 }}
          />
          {seriesB.label}
        </span>
      </div>

      <div className="flex">
        {/* Y axis */}
        <div className="flex flex-col justify-between text-right pr-2 text-[10px] font-semibold text-slate-400" style={{ height: chartH }}>
          {ticks.slice().reverse().map((t) => (
            <span key={t} style={{ height: rowH }} className="flex items-start justify-end">
              {t >= 1000 ? `${t / 1000}K` : t}
            </span>
          ))}
        </div>

        {/* Grid + bars */}
        <div className="flex-1">
          <div className="relative" style={{ height: chartH }}>
            {ticks.slice().reverse().map((t, i) => (
              <motion.div
                key={t}
                className="absolute left-0 right-0 border-t border-dashed border-slate-200"
                style={{ top: i * rowH }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 + i * 0.06 }}
              />
            ))}
            <div className="absolute inset-0 flex items-end justify-around">
              {data.map((d, dayIdx) => {
                const aH = Math.max((d.registrations / niceMax) * (chartH - 12), 4);
                const bH = Math.max((d.checkIns / niceMax) * (chartH - 12), 4);
                return (
                  <div key={d.day} className="flex items-end gap-1.5 h-full">
                    <motion.div
                      className="w-4 md:w-5 rounded-t-md cursor-pointer"
                      style={{ backgroundColor: seriesA.color, opacity: 0.85 }}
                      initial={{ height: 0 }}
                      animate={{ height: aH }}
                      transition={{ type: 'spring', stiffness: 120, damping: 18, delay: 0.15 + dayIdx * 0.07 }}
                      whileHover={{ opacity: 1 }}
                      title={`${d.day}: ${d.registrations.toLocaleString()} registrations`}
                    />
                    <motion.div
                      className="w-4 md:w-5 rounded-t-md cursor-pointer"
                      style={{ backgroundColor: seriesB.color }}
                      initial={{ height: 0 }}
                      animate={{ height: bH }}
                      transition={{ type: 'spring', stiffness: 120, damping: 18, delay: 0.25 + dayIdx * 0.07 }}
                      whileHover={{ opacity: 0.8 }}
                      title={`${d.day}: ${d.checkIns.toLocaleString()} check-ins`}
                    />
                  </div>
                );
              })}
            </div>
          </div>
          {/* X axis */}
          <div className="flex justify-around mt-2 text-[11px] font-semibold text-slate-500">
            {data.map((d, i) => (
              <motion.span
                key={d.day}
                className="w-10 text-center"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.05 }}
              >
                {d.day}
              </motion.span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Attendance heatmap: time slot rows × day columns, 5-step blue intensity
// ---------------------------------------------------------------------------
const HEAT_COLORS = ['#EFF4FB', '#C9D9F0', '#8FAEDD', '#3F76C5', NAVY];

export const AttendanceHeatmap: React.FC<{ slots: HeatmapSlot[] }> = ({ slots }) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return (
    <div className="flex gap-3">
      {/* Row labels */}
      <div className="flex flex-col justify-between py-0.5 text-[10px] font-semibold text-slate-400">
        {slots.map((s, i) => (
          <motion.span
            key={s.time}
            className="h-9 flex items-center"
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            {s.time}
          </motion.span>
        ))}
      </div>
      <div className="flex-1">
        <div className="space-y-1.5">
          {slots.map((s, rowIdx) => (
            <div key={s.time} className="flex gap-1.5">
              {s.values.map((v, colIdx) => (
                <motion.div
                  key={colIdx}
                  className="h-9 flex-1 rounded-lg"
                  style={{ backgroundColor: HEAT_COLORS[v] }}
                  initial={{ opacity: 0, scale: 0.4 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20, delay: rowIdx * 0.05 + colIdx * 0.02 }}
                  whileHover={{ scale: 1.12 }}
                  title={`${s.time} ${days[colIdx]} — level ${v}/4`}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="flex gap-1.5 mt-2">
          {days.map((d, i) => (
            <motion.span
              key={d}
              className="flex-1 text-center text-[10px] font-semibold text-slate-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 + i * 0.04 }}
            >
              {d}
            </motion.span>
          ))}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Semicircle gauge: membership cards issued vs pending
// ---------------------------------------------------------------------------
interface GaugeProps {
  issued: number;
  pending: number;
}

export const CardsGauge: React.FC<GaugeProps> = ({ issued, pending }) => {
  const total = issued + pending;
  const frac = issued / total;
  const R = 80;
  const CX = 100;
  const CY = 96;
  const arc = (from: number, to: number) => {
    const start = Math.PI * (1 - from);
    const end = Math.PI * (1 - to);
    const x1 = CX + R * Math.cos(start);
    const y1 = CY - R * Math.sin(start);
    const x2 = CX + R * Math.cos(end);
    const y2 = CY - R * Math.sin(end);
    const large = to - from > 0.5 ? 1 : 0;
    return `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2}`;
  };

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 108" className="w-full max-w-[240px]">
        <path d={arc(0, 1)} fill="none" stroke="#E6EDF6" strokeWidth="16" strokeLinecap="round" />
        <motion.path
          d={arc(0, Math.max(frac, 0.02))}
          fill="none"
          stroke={BLUE}
          strokeWidth="16"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        />
        <text x={CX} y={CY - 16} textAnchor="middle" className="fill-slate-400" fontSize="10" fontWeight="600">
          Total
        </text>
        <text x={CX} y={CY + 4} textAnchor="middle" className="fill-slate-900" fontSize="20" fontWeight="800">
          <AnimatedNumber value={total} />
        </text>
      </svg>
      <div className="w-full max-w-[240px] mt-2 space-y-1.5">
        <motion.div
          className="flex items-center justify-between text-xs"
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <span className="flex items-center gap-1.5 font-semibold text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: BLUE }} />
            Issued
          </span>
          <span className="font-bold text-slate-900">
            <AnimatedNumber value={issued} />
          </span>
        </motion.div>
        <motion.div
          className="flex items-center justify-between text-xs"
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.75 }}
        >
          <span className="flex items-center gap-1.5 font-semibold text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E6EDF6]" />
            Pending
          </span>
          <span className="font-bold text-slate-900">
            <AnimatedNumber value={pending} />
          </span>
        </motion.div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Horizontal progress bar (regions / sections)
// ---------------------------------------------------------------------------
export const ProgressRow: React.FC<{
  label: string;
  value: number;
  max: number;
  color?: string;
  suffix?: string;
  delay?: number;
}> = ({ label, value, max, color = BLUE, suffix, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
  >
    <div className="flex items-center justify-between text-xs mb-1">
      <span className="font-semibold text-slate-600 truncate">{label}</span>
      <span className="font-bold text-slate-900 ml-2 shrink-0">
        {value.toLocaleString('en-ZA')}
        {suffix}
      </span>
    </div>
    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.max((value / max) * 100, 2)}%` }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: delay + 0.1 }}
      />
    </div>
  </motion.div>
);
