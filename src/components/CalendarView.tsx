import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, IdCard, MapPin } from 'lucide-react';
import { getEvents, MemberEvent } from '../api';
import { useTranslation } from '../data/i18n';

interface CalendarViewProps {
  onOpenCard: () => void;
}

const CARD_TINTS = [
  { bg: 'bg-[#EAF1FB]', icon: 'text-[#3F76C5]' },
  { bg: 'bg-[#FFF3D1]', icon: 'text-[#B98600]' },
  { bg: 'bg-[#FBE7E8]', icon: 'text-[#D13138]' },
];

const startOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const dayKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export const CalendarView: React.FC<CalendarViewProps> = ({ onOpenCard }) => {
  const { t, dateLocale } = useTranslation();
  const [events, setEvents] = useState<MemberEvent[]>([]);
  const [loadFailed, setLoadFailed] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState(dayKey(new Date()));

  useEffect(() => {
    let active = true;
    getEvents()
      .then((items) => {
        if (active) setEvents(items);
      })
      .catch(() => {
        if (active) setLoadFailed(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const eventsByDay = useMemo(() => {
    const grouped = new Map<string, MemberEvent[]>();
    events.forEach((event) => {
      const start = startOfDay(new Date(event.startsAt));
      const end = startOfDay(new Date(event.endsAt ?? event.startsAt));
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const key = dayKey(new Date(d));
        const list = grouped.get(key);
        if (list) list.push(event);
        else grouped.set(key, [event]);
      }
    });
    return grouped;
  }, [events]);

  const monthFormatter = new Intl.DateTimeFormat(dateLocale, { month: 'long', year: 'numeric' });
  const weekdayFormatter = new Intl.DateTimeFormat(dateLocale, { weekday: 'narrow' });
  const dayFormatter = new Intl.DateTimeFormat(dateLocale, { weekday: 'short', day: 'numeric', month: 'short' });
  const timeFormatter = new Intl.DateTimeFormat(dateLocale, { hour: '2-digit', minute: '2-digit' });

  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayKey = dayKey(new Date());

  const calendarCells: Array<{ key: string; day: number; inMonth: boolean }> = [];
  for (let i = 0; i < firstWeekday; i++) {
    const d = new Date(year, month, -(firstWeekday - 1 - i));
    calendarCells.push({ key: dayKey(d), day: d.getDate(), inMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push({ key: dayKey(new Date(year, month, d)), day: d, inMonth: true });
  }
  while (calendarCells.length % 7 !== 0) {
    const next = new Date(year, month, daysInMonth + (calendarCells.length % 7));
    calendarCells.push({ key: dayKey(next), day: next.getDate(), inMonth: false });
  }

  const weekdayLabels = Array.from({ length: 7 }, (_, i) =>
    weekdayFormatter.format(new Date(2024, 0, 7 + i))
  );

  const shiftMonth = (delta: number) => {
    setVisibleMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  const selectedEvents = eventsByDay.get(selectedDay) ?? [];
  const monthEventCount = Array.from(eventsByDay.keys()).filter((key) =>
    key.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)
  ).length;

  const renderEventCard = (event: MemberEvent, index: number) => {
    const tint = CARD_TINTS[index % CARD_TINTS.length];
    return (
      <div key={`${event.id}-${index}`} className={`rounded-[24px] p-4 ${tint.bg}`}>
        <div className="flex items-start justify-between gap-2">
          <span className={`text-[9px] font-extrabold uppercase tracking-[0.14em] ${tint.icon}`}>
            {event.category}
          </span>
          {event.branch && (
            <span className="rounded-full bg-white/80 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-slate-500">
              {event.branch}
            </span>
          )}
        </div>
        <h4 className="mt-1.5 text-sm font-black leading-snug text-[#0A2A52]">{event.title}</h4>
        <div className="mt-3 space-y-1.5 text-[11px] font-semibold text-slate-600">
          <p className="flex items-center gap-1.5">
            <Clock3 className={`h-3.5 w-3.5 shrink-0 ${tint.icon}`} />
            {dayFormatter.format(new Date(event.startsAt))}
            {' · '}
            {timeFormatter.format(new Date(event.startsAt))}
            {event.endsAt && ` – ${timeFormatter.format(new Date(event.endsAt))}`}
          </p>
          <p className="flex items-center gap-1.5">
            <MapPin className={`h-3.5 w-3.5 shrink-0 ${tint.icon}`} />
            <span className="truncate">{event.location}</span>
          </p>
        </div>
        {event.description && (
          <p className="mt-2.5 border-t border-white/60 pt-2 text-[11px] leading-relaxed text-slate-600">
            {event.description}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] pb-28 max-w-md mx-auto space-y-5 px-4 pt-3">
      {/* Header */}
      <div className="pt-2">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#3F76C5]">
          {t('tabs.silo')}
        </p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-[#0A2A52]">{t('calendar.heading')}</h1>
        <p className="mt-1 text-xs font-medium text-slate-500">{t('calendar.subheading')}</p>
      </div>

      {/* Month grid */}
      <section className="rounded-[28px] bg-white p-4 shadow-[0_10px_30px_rgba(10,42,82,0.08)]">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-[#0A2A52] capitalize">{monthFormatter.format(visibleMonth)}</h2>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              aria-label={t('calendar.prevMonth')}
              className="grid h-8 w-8 place-items-center rounded-full bg-slate-50 text-slate-500 transition hover:bg-slate-100 active:scale-95"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              aria-label={t('calendar.nextMonth')}
              className="grid h-8 w-8 place-items-center rounded-full bg-slate-50 text-slate-500 transition hover:bg-slate-100 active:scale-95"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-7 gap-1 text-center">
          {weekdayLabels.map((label, i) => (
            <span key={i} className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
              {label}
            </span>
          ))}
          {calendarCells.map((cell) => {
            const hasEvents = eventsByDay.has(cell.key);
            const isSelected = cell.key === selectedDay;
            const isToday = cell.key === todayKey;
            return (
              <button
                key={cell.key}
                type="button"
                onClick={() => setSelectedDay(cell.key)}
                className={`flex flex-col items-center rounded-xl py-1.5 transition active:scale-95 ${
                  isSelected
                    ? 'bg-[#0A2A52] text-white shadow-md'
                    : isToday
                      ? 'bg-[#EAF1FB] text-[#0A2A52]'
                      : cell.inMonth
                        ? 'text-slate-700 hover:bg-slate-50'
                        : 'text-slate-300'
                }`}
              >
                <span className="text-xs font-bold">{cell.day}</span>
                <span className={`mt-0.5 h-1.5 w-1.5 rounded-full ${hasEvents ? (isSelected ? 'bg-[#F5B301]' : 'bg-[#D13138]') : 'bg-transparent'}`} />
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-[10px] font-bold text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#D13138]" />
            {t('calendar.legendEvent')}
          </span>
          <span>{monthEventCount ? t('calendar.eventCount', { count: monthEventCount }) : t('calendar.noEventsDay')}</span>
        </div>
      </section>

      {/* Selected day events */}
      <section>
        <h3 className="mb-3 text-base font-extrabold tracking-tight text-[#0A2A52]">
          {dayFormatter.format(new Date(`${selectedDay}T12:00:00`))}
        </h3>
        {selectedEvents.length ? (
          <div className="space-y-3">
            {selectedEvents.map((event, index) => renderEventCard(event, index))}
          </div>
        ) : (
          <div className="rounded-[24px] border border-dashed border-slate-300 bg-white/70 px-5 py-8 text-center">
            <CalendarDays className="mx-auto h-7 w-7 text-slate-300" />
            <p className="mt-2 text-xs font-extrabold text-slate-600">{t('calendar.noEventsDay')}</p>
            {loadFailed && (
              <p className="mt-1 text-[11px] font-medium text-slate-400">{t('common.errorGeneric')}</p>
            )}
          </div>
        )}
      </section>

      {/* All upcoming gatherings */}
      {events.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between px-0.5">
            <h3 className="text-base font-extrabold tracking-tight text-[#0A2A52]">{t('calendar.gatherings')}</h3>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              {events.length === 1 ? t('calendar.eventCountOne', { count: events.length }) : t('calendar.eventCount', { count: events.length })}
            </span>
          </div>
          <div className="space-y-3">
            {events.map((event, index) => renderEventCard(event, index))}
          </div>
        </section>
      )}

      {/* Membership pass shortcut */}
      <button
        type="button"
        onClick={onOpenCard}
        className="flex w-full items-center justify-center gap-2 rounded-[24px] bg-gradient-to-r from-[#0A2A52] to-[#164A86] px-4 py-4 text-sm font-extrabold text-white transition active:scale-[0.98]"
      >
        <IdCard className="h-4 w-4" />
        {t('calendar.viewPass')}
      </button>
    </div>
  );
};
