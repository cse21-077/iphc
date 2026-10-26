import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  Download,
  QrCode,
  UserCheck,
  FileSpreadsheet,
  Phone,
  MapPin,
  PlayCircle,
  Lock,
  LayoutGrid,
  List,
  Plus,
  X,
  CalendarDays,
  Clock3,
  Eye,
  EyeOff,
  Archive,
  Sparkles,
} from 'lucide-react';
import {
  DEMO_MEMBERS,
  RECENT_CHECKINS,
  ALL_PAYMENTS,
  MONTHLY_PAYMENTS,
  WEEKLY_SERIES,
  ATTENDANCE_HEATMAP,
  UPCOMING_CEREMONIES,
  SECTION_BREAKDOWN,
  formatRand,
  formatNumber,
} from '../../data/adminData';
import { initialBusinesses, initialMediaItems, paymentCategories } from '../../data/initialData';
import { RegistrationsBarChart, AttendanceHeatmap, AnimatedNumber } from './AdminCharts';
import { SearchInput, ViewToggle } from './ViewControls';
import {
  AdminEvent,
  archiveAdminEvent,
  createAdminEvent,
  getAdminEvents,
  setAdminEventPublished,
} from '../../api';

const NAVY = '#0A2A52';
const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const rowVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE } },
};

const STATUS_STYLES: Record<string, string> = {
  Verified: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  New: 'bg-blue-50 text-[#3F76C5] border-blue-200',
  Pending: 'bg-amber-50 text-amber-600 border-amber-200',
};

const SectionShell: React.FC<{
  title: string;
  description: string;
  children: React.ReactNode;
}> = ({ title, description, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.4, ease: EASE }}
  >
    <h2 className="text-lg font-extrabold tracking-tight">{title}</h2>
    <p className="text-xs font-semibold text-slate-400 mt-0.5 mb-5">{description}</p>
    {children}
  </motion.div>
);

// ---------------------------------------------------------------------------
// Membership
// ---------------------------------------------------------------------------
export const MembershipSection: React.FC = () => {
  const [query, setQuery] = useState('');
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DEMO_MEMBERS.filter((m) => {
      const matchesQ =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.membershipNumber.toLowerCase().includes(q) ||
        m.branch.toLowerCase().includes(q);
      const matchesS = statusFilter === 'All' || m.status === statusFilter;
      return matchesQ && matchesS;
    });
  }, [query, statusFilter]);

  const counts = useMemo(
    () => ({
      All: DEMO_MEMBERS.length,
      Verified: DEMO_MEMBERS.filter((m) => m.status === 'Verified').length,
      New: DEMO_MEMBERS.filter((m) => m.status === 'New').length,
      Pending: DEMO_MEMBERS.filter((m) => m.status === 'Pending').length,
    }),
    []
  );

  return (
    <SectionShell title="Membership Management" description="Registered members across all branches and regions">
      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search name, membership no. or branch…"
          className="flex-1 max-w-sm"
        />
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-2 flex-wrap">
            {(['All', 'Verified', 'New', 'Pending'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-2 rounded-xl text-[11px] font-extrabold border transition ${
                  statusFilter === s
                    ? 'bg-[#3F76C5] text-white border-[#3F76C5] shadow-[0_6px_16px_rgba(63,118,197,0.3)]'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                }`}
              >
                {s} <span className="opacity-70">({counts[s]})</span>
              </button>
            ))}
          </div>
          <ViewToggle view={view} onChange={setView} />
        </div>
      </div>

      {view === 'list' ? (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_16px_rgba(15,42,82,0.05)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[640px]">
            <thead>
              <tr className="text-left text-slate-400 font-bold border-b border-slate-100 bg-slate-50/60">
                <th className="py-3 px-5">Member</th>
                <th className="py-3 px-3">Membership No.</th>
                <th className="py-3 px-3">Branch / Region</th>
                <th className="py-3 px-3">Section</th>
                <th className="py-3 px-3">Registered</th>
                <th className="py-3 px-5 text-right">Status</th>
              </tr>
            </thead>
            <motion.tbody variants={listVariants} initial="hidden" animate="show">
              {filtered.map((m) => (
                <motion.tr
                  key={m.id}
                  variants={rowVariants}
                  className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition"
                >
                  <td className="py-3 px-5 font-bold text-slate-800 whitespace-nowrap">{m.name}</td>
                  <td className="py-3 px-3 font-mono font-semibold text-slate-500">{m.membershipNumber}</td>
                  <td className="py-3 px-3 text-slate-500 font-semibold">
                    {m.branch}
                    <span className="block text-[9px] text-slate-400 font-bold">{m.region}</span>
                  </td>
                  <td className="py-3 px-3 text-slate-500 font-semibold">{m.section}</td>
                  <td className="py-3 px-3 text-slate-500 font-semibold whitespace-nowrap">{m.registeredAt}</td>
                  <td className="py-3 px-5 text-right">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${STATUS_STYLES[m.status]}`}>
                      {m.status}
                    </span>
                  </td>
                </motion.tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400 font-semibold">
                    No members match “{query}”.
                  </td>
                </tr>
              )}
            </motion.tbody>
          </table>
        </div>
      </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {filtered.map((m, i) => (
            <motion.div
              key={m.id}
              variants={rowVariants}
              initial="hidden"
              animate="show"
              transition={{ delay: i * 0.03 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_16px_rgba(15,42,82,0.05)] p-5"
            >
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#0A2A52] text-white flex items-center justify-center font-extrabold text-sm shrink-0">
                  {m.name.split(' ').filter(Boolean).map((word) => word[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-extrabold text-slate-900 truncate">{m.name}</h3>
                  <p className="text-[11px] font-mono font-semibold text-slate-400 truncate">{m.membershipNumber}</p>
                </div>
                <span className={`shrink-0 inline-block px-2 py-1 rounded-full text-[9px] font-extrabold border ${STATUS_STYLES[m.status]}`}>
                  {m.status}
                </span>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-50 space-y-1.5 text-[11px] font-semibold text-slate-500">
                <p className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-[#3F76C5] shrink-0" />{m.branch}<span className="text-slate-400">• {m.region}</span></p>
                <p className="flex items-center gap-2"><UserCheck className="w-3.5 h-3.5 text-[#3F76C5] shrink-0" />{m.section}</p>
                <p className="flex items-center gap-2"><CalendarDays className="w-3.5 h-3.5 text-[#3F76C5] shrink-0" />Registered {m.registeredAt}</p>
              </div>
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <div className="sm:col-span-2 xl:col-span-4 bg-white rounded-2xl border border-slate-100 py-10 text-center text-slate-400 text-xs font-semibold">
              No members match “{query}”.
            </div>
          )}
        </div>
      )}
    </SectionShell>
  );
};

// ---------------------------------------------------------------------------
// Silo Events
// ---------------------------------------------------------------------------
const EVENT_CATEGORIES = ['Service', 'Ceremony', 'Pilgrimage', 'Meeting', 'Special'];

const EVENT_TEMPLATES = [
  { id: 'wednesday', label: 'Wednesday Service', title: 'Wednesday Service', category: 'Service', startTime: '19:00', endTime: '22:00', weekday: 3 },
  { id: 'friday', label: 'Friday Service', title: 'Friday Service', category: 'Service', startTime: '19:00', endTime: '22:00', weekday: 5 },
  { id: 'saturday', label: 'Saturday Service', title: 'Saturday Service', category: 'Service', startTime: '09:00', endTime: '16:00', weekday: 6 },
];

const nextWeekdayDate = (weekday: number) => {
  const date = new Date();
  const offset = (weekday - date.getDay() + 7) % 7;
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
};

const formatEventDateTime = (value: string) =>
  new Intl.DateTimeFormat('en-ZA', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));

const formatEventTime = (value: string) =>
  new Intl.DateTimeFormat('en-ZA', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));

const emptyEventForm = {
  title: '',
  category: 'Service',
  date: '',
  startTime: '',
  endTime: '',
  location: 'Zuurbekom Headquarters (Silo)',
  description: '',
  isPublished: true,
};

export const CeremoniesSection: React.FC = () => {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [query, setQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState(emptyEventForm);
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState('');

  const loadEvents = async () => {
    try {
      setLoadError('');
      const list = await getAdminEvents();
      setEvents(list);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Could not load events.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadEvents();
  }, []);

  const filteredEvents = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return events;
    return events.filter((event) =>
      [event.title, event.category, event.location]
        .some((value) => value.toLowerCase().includes(q))
    );
  }, [query, events]);

  const openCreateModal = (template?: (typeof EVENT_TEMPLATES)[number]) => {
    setActionError('');
    setForm(
      template
        ? {
            ...emptyEventForm,
            title: template.title,
            category: template.category,
            date: nextWeekdayDate(template.weekday),
            startTime: template.startTime,
            endTime: template.endTime,
          }
        : { ...emptyEventForm, date: nextWeekdayDate(3) }
    );
    setShowCreateModal(true);
  };

  const submitCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title.trim() || !form.date || !form.startTime) return;
    setIsSaving(true);
    setActionError('');
    try {
      const created = await createAdminEvent({
        title: form.title.trim(),
        category: form.category,
        description: form.description.trim(),
        location: form.location.trim(),
        startsAt: new Date(`${form.date}T${form.startTime}`).toISOString(),
        endsAt: form.endTime ? new Date(`${form.date}T${form.endTime}`).toISOString() : null,
        isPublished: form.isPublished,
      });
      setEvents((prev) => [created, ...prev]);
      setShowCreateModal(false);
      setForm({ ...emptyEventForm });
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Could not create the event.');
    } finally {
      setIsSaving(false);
    }
  };

  const togglePublished = async (event: AdminEvent) => {
    setActionError('');
    try {
      const updated = await setAdminEventPublished(event.id, !event.isPublished);
      setEvents((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Could not update the event.');
    }
  };

  const archiveEvent = async (event: AdminEvent) => {
    setActionError('');
    try {
      const updated = await archiveAdminEvent(event.id);
      setEvents((prev) => [...prev.filter((item) => item.id !== updated.id), updated]);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Could not archive the event.');
    }
  };

  const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3F76C5]/40 focus:border-[#3F76C5] transition';

  return (
    <SectionShell title="Silo Events" description="Create and manage services, ceremonies and gatherings — published events appear in the security check-in portal">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search events by title, category or location…"
          className="w-full md:w-80"
        />
        <button
          type="button"
          onClick={() => openCreateModal()}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0A2A52] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#123d71] transition"
        >
          <Plus className="w-4 h-4" />
          Create event
        </button>
      </div>

      {/* Service templates */}
      <div className="mb-5">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400 mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3 h-3" /> Quick templates
        </p>
        <div className="flex flex-wrap gap-2">
          {EVENT_TEMPLATES.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => openCreateModal(template)}
              className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2.5 text-[11px] font-extrabold text-[#0A2A52] transition hover:bg-blue-100 active:scale-95"
            >
              <Clock3 className="w-3.5 h-3.5 text-[#3F76C5]" />
              {template.label}
              <span className="font-bold text-slate-500">
                {template.startTime}–{template.endTime}
              </span>
            </button>
          ))}
        </div>
      </div>

      {actionError && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
          {actionError}
        </p>
      )}

      {/* Event cards */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-100 py-14 text-center text-slate-400 text-xs font-semibold">
          Loading Silo events…
        </div>
      ) : loadError ? (
        <div className="bg-white rounded-2xl border border-slate-100 py-14 text-center">
          <p className="text-xs font-semibold text-red-600">{loadError}</p>
          <button
            type="button"
            onClick={() => void loadEvents()}
            className="mt-3 text-xs font-extrabold text-[#3F76C5] hover:underline"
          >
            Try again
          </button>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
          <CalendarDays className="mx-auto h-8 w-8 text-slate-300" />
          <h4 className="mt-3 text-sm font-extrabold text-slate-800">
            {query ? 'No events match this search' : 'No Silo events yet'}
          </h4>
          <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-slate-500">
            {query
              ? 'Try a different search term.'
              : 'Create your first event above, or start from a service template.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredEvents.map((event, i) => {
            const isArchived = Boolean(event.archivedAt);
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.4), duration: 0.35, ease: EASE }}
                className={`bg-white rounded-2xl border border-slate-100 shadow-[0_4px_16px_rgba(15,42,82,0.05)] p-5 ${isArchived ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-extrabold text-slate-900 truncate">{event.title}</h3>
                    <p className="text-[11px] font-bold text-[#3F76C5] mt-0.5">{event.category}</p>
                  </div>
                  {isArchived ? (
                    <span className="shrink-0 text-[9px] font-extrabold text-slate-500 bg-slate-100 rounded-full px-2.5 py-1">
                      Archived
                    </span>
                  ) : event.isPublished ? (
                    <span className="shrink-0 text-[9px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1">
                      Published
                    </span>
                  ) : (
                    <span className="shrink-0 text-[9px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1">
                      Hidden
                    </span>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-50 space-y-1.5 text-[11px] font-semibold text-slate-500">
                  <p className="flex items-center gap-2">
                    <CalendarDays className="w-3.5 h-3.5 text-[#3F76C5] shrink-0" />
                    {formatEventDateTime(event.startsAt)}
                    {event.endsAt && ` – ${formatEventTime(event.endsAt)}`}
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-[#3F76C5] shrink-0" />
                    <span className="truncate">{event.location}</span>
                  </p>
                </div>

                {!isArchived && (
                  <div className="mt-4 pt-3 border-t border-slate-50 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void togglePublished(event)}
                      className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[10px] font-extrabold border transition ${
                        event.isPublished
                          ? 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50'
                          : 'border-blue-200 text-[#3F76C5] bg-blue-50 hover:bg-blue-100'
                      }`}
                    >
                      {event.isPublished ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      {event.isPublished ? 'Hide' : 'Publish'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void archiveEvent(event)}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[10px] font-extrabold border border-slate-200 text-slate-500 bg-white hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition"
                    >
                      <Archive className="w-3 h-3" />
                      Archive
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create event modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-[#3F76C5]" />
                <h3 className="text-base font-extrabold text-slate-900">Create Silo Event</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={submitCreate} className="mt-4 space-y-3.5">
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">Title</span>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Wednesday Service"
                  className={inputClass}
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">Category</span>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className={inputClass}
                  >
                    {EVENT_CATEGORIES.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">Date</span>
                  <input
                    required
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className={inputClass}
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">Starts</span>
                  <input
                    required
                    type="time"
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    className={inputClass}
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">Ends</span>
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    className={inputClass}
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">Location</span>
                <input
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="Zuurbekom Headquarters (Silo)"
                  className={inputClass}
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">Description (optional)</span>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Short note about this event…"
                  className={`${inputClass} resize-none`}
                />
              </label>

              <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3">
                <span className="text-xs font-extrabold text-slate-700">Publish immediately</span>
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                  className="h-4 w-4 accent-[#3F76C5]"
                />
              </label>
              <p className="text-[10px] font-semibold text-slate-400 -mt-2">
                Published events are visible to the security team for member check-in at the gates.
              </p>

              {actionError && (
                <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
                  {actionError}
                </p>
              )}

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-700 font-bold text-sm hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3 rounded-2xl bg-[#0A2A52] text-white font-bold text-sm hover:bg-[#123d71] transition disabled:opacity-50"
                >
                  {isSaving ? 'Creating…' : 'Create event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </SectionShell>
  );
};

// ---------------------------------------------------------------------------
// Attendance
// ---------------------------------------------------------------------------
export const AttendanceSection: React.FC = () => {
  const [query, setQuery] = useState('');
  const [view, setView] = useState<'list' | 'grid'>('list');

  const filteredCheckins = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return RECENT_CHECKINS;
    return RECENT_CHECKINS.filter((c) =>
      [c.memberName, c.membershipNumber, c.service, c.branch]
        .some((value) => value.toLowerCase().includes(q))
    );
  }, [query]);

  return (
  <SectionShell title="Attendance & Check-Ins" description="QR scan activity at branch services and Silo ceremonies">
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">
      <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-[0_4px_16px_rgba(15,42,82,0.05)] p-5">
        <h3 className="text-sm font-extrabold mb-4">Weekly Check-Ins</h3>
        <RegistrationsBarChart
          data={WEEKLY_SERIES}
          seriesA={{ key: 'registrations', label: 'Registrations', color: '#A8C2E8' }}
          seriesB={{ key: 'checkIns', label: 'Check-Ins', color: '#3F76C5' }}
        />
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_16px_rgba(15,42,82,0.05)] p-5">
        <h3 className="text-sm font-extrabold mb-4">Service-Time Heatmap</h3>
        <AttendanceHeatmap slots={ATTENDANCE_HEATMAP} />
      </div>
    </div>

    <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_16px_rgba(15,42,82,0.05)] overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 pt-5 pb-3">
        <h3 className="text-sm font-extrabold">Latest QR Check-Ins</h3>
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search member, service or branch…"
            className="w-full md:w-64"
          />
          <ViewToggle view={view} onChange={setView} />
        </div>
      </div>

      {view === 'list' ? (
      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[640px]">
          <thead>
            <tr className="text-left text-slate-400 font-bold border-b border-slate-100 bg-slate-50/60">
              <th className="py-3 px-5">Member</th>
              <th className="py-3 px-3">Service</th>
              <th className="py-3 px-3">Branch</th>
              <th className="py-3 px-3">Date / Time</th>
              <th className="py-3 px-5 text-right">Method</th>
            </tr>
          </thead>
          <motion.tbody variants={listVariants} initial="hidden" animate="show">
            {filteredCheckins.map((c) => (
              <motion.tr key={c.id} variants={rowVariants} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition">
                <td className="py-3 px-5 font-bold text-slate-800 whitespace-nowrap">{c.memberName}</td>
                <td className="py-3 px-3 text-slate-600 font-semibold">{c.service}</td>
                <td className="py-3 px-3 text-slate-500 font-semibold">{c.branch}</td>
                <td className="py-3 px-3 text-slate-500 font-semibold whitespace-nowrap">{c.date} • {c.time}</td>
                <td className="py-3 px-5 text-right">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold border border-slate-200 text-slate-500 bg-slate-50">
                    <QrCode className="w-3 h-3" />
                    {c.method === 'self_qr' ? 'Self scan' : 'Usher scan'}
                  </span>
                </td>
              </motion.tr>
            ))}
            {filteredCheckins.length === 0 && (
              <tr>
                <td colSpan={5} className="py-10 text-center text-slate-400 font-semibold">
                  No check-ins match “{query}”.
                </td>
              </tr>
            )}
          </motion.tbody>
        </table>
      </div>
      ) : (
        <div className="p-5 pt-2 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredCheckins.map((c, i) => (
            <motion.div
              key={c.id}
              variants={rowVariants}
              initial="hidden"
              animate="show"
              transition={{ delay: i * 0.04 }}
              className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#3F76C5] flex items-center justify-center font-extrabold text-xs shrink-0">
                  {c.memberName.split(' ').filter(Boolean).map((word) => word[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-extrabold text-slate-900 truncate">{c.memberName}</h4>
                  <p className="text-[10px] font-mono font-semibold text-slate-400 truncate">{c.membershipNumber}</p>
                </div>
                <span className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-extrabold border border-slate-200 text-slate-500 bg-white">
                  <QrCode className="w-2.5 h-2.5" />
                  {c.method === 'self_qr' ? 'Self scan' : 'Usher scan'}
                </span>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 space-y-1 text-[11px] font-semibold text-slate-500">
                <p className="truncate">{c.service}</p>
                <p className="flex items-center gap-1.5"><MapPin className="w-3 h-3 text-[#3F76C5]" />{c.branch}</p>
                <p className="flex items-center gap-1.5"><Clock3 className="w-3 h-3 text-[#3F76C5]" />{c.date} • {c.time}</p>
              </div>
            </motion.div>
          ))}
          {filteredCheckins.length === 0 && (
            <div className="sm:col-span-2 xl:col-span-3 py-10 text-center text-slate-400 text-xs font-semibold">
              No check-ins match “{query}”.
            </div>
          )}
        </div>
      )}
    </div>
  </SectionShell>
  );
};

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------
export const PaymentsSection: React.FC = () => {
  const maxMonth = Math.max(...MONTHLY_PAYMENTS.map((m) => m.amount));
  const categoryTotals = paymentCategories.map((cat, i) => ({
    ...cat,
    total: 120000 + ((i * 98731) % 240000),
  }));

  return (
    <SectionShell title="Payments & Contributions" description="Karolo, Polokano, Monthends, Sethephu and approved contributions">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        {categoryTotals.map((cat, i) => (
          <motion.button
            key={cat.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.35, ease: EASE }}
            whileHover={{ y: -3 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_16px_rgba(15,42,82,0.05)] p-4 text-left"
          >
            <span className="w-8 h-8 rounded-xl flex items-center justify-center mb-2" style={{ backgroundColor: `${cat.color}18` }}>
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
            </span>
            <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wide truncate">{cat.name.split(' (')[0]}</span>
            <span className="block text-sm font-extrabold text-slate-900 mt-0.5">
              <AnimatedNumber value={cat.total} format={(n) => formatRand(n)} duration={1} />
            </span>
          </motion.button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_16px_rgba(15,42,82,0.05)] p-5">
          <h3 className="text-sm font-extrabold mb-4">Monthly Volume</h3>
          <div className="flex items-end justify-between gap-2 h-44">
            {MONTHLY_PAYMENTS.map((m, i) => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-[9px] font-bold text-slate-400">{`${m.amount / 1000}K`}</span>
                <motion.div
                  className="w-full max-w-8 rounded-t-lg bg-[#3F76C5] cursor-pointer"
                  initial={{ height: 0 }}
                  animate={{ height: Math.max((m.amount / maxMonth) * 120, 6) }}
                  transition={{ type: 'spring', stiffness: 120, damping: 18, delay: 0.1 + i * 0.07 }}
                  whileHover={{ backgroundColor: NAVY }}
                  title={`${m.month}: ${formatRand(m.amount)}`}
                />
                <span className="text-[10px] font-bold text-slate-500">{m.month}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-[0_4px_16px_rgba(15,42,82,0.05)] overflow-hidden">
          <h3 className="text-sm font-extrabold px-5 pt-5 pb-3">Recent Transactions</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[560px]">
              <thead>
                <tr className="text-left text-slate-400 font-bold border-b border-slate-100 bg-slate-50/60">
                  <th className="py-3 px-5">Receipt</th>
                  <th className="py-3 px-3">Member</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Method</th>
                  <th className="py-3 px-5 text-right">Amount</th>
                </tr>
              </thead>
              <motion.tbody variants={listVariants} initial="hidden" animate="show">
                {ALL_PAYMENTS.map((p) => (
                  <motion.tr key={p.id} variants={rowVariants} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition">
                    <td className="py-3 px-5 font-mono font-bold text-slate-500">{p.receipt}</td>
                    <td className="py-3 px-3 font-bold text-slate-800 whitespace-nowrap">{p.memberName}</td>
                    <td className="py-3 px-3">
                      <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold text-white" style={{ backgroundColor: p.color }}>
                        {p.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-semibold">{p.method}</td>
                    <td className="py-3 px-5 text-right font-extrabold text-slate-900">{formatRand(p.amount)}</td>
                  </motion.tr>
                ))}
              </motion.tbody>
            </table>
          </div>
        </div>
      </div>
    </SectionShell>
  );
};

// ---------------------------------------------------------------------------
// FLG Empire
// ---------------------------------------------------------------------------
export const FLGSection: React.FC = () => (
  <SectionShell title="FLG Empire Business Directory" description="Member-owned verified businesses — member-to-member commerce">
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {initialBusinesses.map((b, i) => (
        <motion.div
          key={b.id}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06, duration: 0.4, ease: EASE }}
          whileHover={{ y: -4 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_16px_rgba(15,42,82,0.05)] p-5"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0A2A52] text-white flex items-center justify-center font-extrabold text-sm shrink-0">
              {b.businessName.split(' ').map((w) => w[0]).slice(0, 2).join('')}
            </div>
            <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
              Verified Member
            </span>
          </div>
          <h3 className="text-sm font-extrabold text-slate-900 mt-3">{b.businessName}</h3>
          <p className="text-[11px] font-bold text-[#3F76C5]">{b.category}</p>
          <p className="text-[11px] text-slate-500 font-medium mt-2 leading-relaxed line-clamp-2">{b.description}</p>
          <div className="mt-3 space-y-1 text-[10px] font-semibold text-slate-400">
            <p className="flex items-center gap-1.5"><MapPin className="w-3 h-3" />{b.location}</p>
            <p className="flex items-center gap-1.5"><Phone className="w-3 h-3" />{b.phone}</p>
          </div>
          <p className="mt-3 pt-3 border-t border-slate-50 text-[10px] font-bold text-slate-400">
            Owner: {b.ownerName} • {b.ownerBranch}
          </p>
        </motion.div>
      ))}
    </div>
  </SectionShell>
);

// ---------------------------------------------------------------------------
// Media
// ---------------------------------------------------------------------------
export const MediaSection: React.FC = () => {
  const cats = ['All', ...Array.from(new Set(initialMediaItems.map((m) => m.category)))];
  const [cat, setCat] = useState('All');
  const items = initialMediaItems.filter((m) => cat === 'All' || m.category === cat);

  return (
    <SectionShell title="Church Media Platform" description="Sermons, announcements, ceremony content and the church archive">
      <div className="flex gap-2 mb-4 flex-wrap">
        {cats.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`px-3 py-2 rounded-xl text-[11px] font-extrabold border transition ${
              cat === c
                ? 'bg-[#0A2A52] text-white border-[#0A2A52]'
                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
            }`}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {items.map((m, i) => (
          <motion.div
            key={m.id}
            layout
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.04, duration: 0.35, ease: EASE }}
            whileHover={{ y: -4 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_16px_rgba(15,42,82,0.05)] overflow-hidden cursor-pointer"
          >
            <div className="relative h-36 bg-slate-100">
              <img src={m.thumbnail} alt={m.title} className="w-full h-full object-cover" loading="lazy" />
              {m.type === 'video' && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <PlayCircle className="w-10 h-10 text-white drop-shadow-lg" />
                </span>
              )}
              {m.isMemberOnly && (
                <span className="absolute top-2 right-2 flex items-center gap-1 text-[9px] font-extrabold text-white bg-black/50 backdrop-blur rounded-full px-2 py-1">
                  <Lock className="w-2.5 h-2.5" /> Members
                </span>
              )}
            </div>
            <div className="p-3.5">
              <span className="text-[9px] font-extrabold text-[#3F76C5] uppercase tracking-wide">{m.category}</span>
              <h3 className="text-xs font-extrabold text-slate-900 mt-1 leading-snug line-clamp-2">{m.title}</h3>
              <p className="text-[10px] font-semibold text-slate-400 mt-1.5">{m.speaker} • {m.date}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </SectionShell>
  );
};

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------
const REPORTS: Array<{ id: string; title: string; description: string; rows: string[][]; headers: string[] }> = [
  {
    id: 'membership',
    title: 'Membership Report',
    description: 'Total, new registrations and breakdown by branch, region and section',
    headers: ['Metric', 'Value'],
    rows: [
      ['Total registered members', formatNumber(43980)],
      ['Active members', formatNumber(38263)],
      ['New this month', '1,248'],
      ['Branches', '171'],
      ['Regions', '21'],
    ],
  },
  {
    id: 'attendance',
    title: 'Attendance Report',
    description: 'Daily, weekly and ceremony attendance with check-in trends',
    headers: ['Metric', 'Value'],
    rows: [
      ['Check-ins this week', '7,750'],
      ['Sabbath service average', '2,140'],
      ['Ceremony attendance (last)', '12,940'],
      ['First-time attendees', '312'],
      ['Six-month trend', '↗ 8.4%'],
    ],
  },
  {
    id: 'financial',
    title: 'Financial Report',
    description: 'Contributions by category: Karolo, Polokano, Monthends, Sethephu',
    headers: ['Category', 'Total'],
    rows: paymentCategories.map((c, i) => [c.name.split(' (')[0], formatRand(120000 + ((i * 98731) % 240000))]),
  },
  {
    id: 'ceremony',
    title: 'Ceremony Report',
    description: 'Registered vs checked-in per upcoming Silo ceremony',
    headers: ['Ceremony', 'Registered', 'Checked in'],
    rows: UPCOMING_CEREMONIES.slice(0, 5).map((c) => [
      c.title,
      formatNumber(c.registrations),
      c.checkedIn > 0 ? formatNumber(c.checkedIn) : '—',
    ]),
  },
];

function downloadCsv(id: string, headers: string[], rows: string[][]) {
  const csv = [headers, ...rows].map((r) => r.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mmuso-${id}-report.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export const ReportsSection: React.FC = () => (
  <SectionShell title="Reporting & Analytics" description="Management reports for leadership decision-making — export as CSV">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {REPORTS.map((r, i) => (
        <motion.div
          key={r.id}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07, duration: 0.4, ease: EASE }}
          className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_16px_rgba(15,42,82,0.05)] p-5"
        >
          <div className="flex items-start gap-3">
            <span className="w-10 h-10 rounded-xl bg-blue-50 text-[#3F76C5] flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-extrabold text-slate-900">{r.title}</h3>
              <p className="text-[11px] font-semibold text-slate-400 mt-0.5">{r.description}</p>
            </div>
          </div>
          <div className="mt-4 space-y-1.5">
            {r.rows.slice(0, 4).map((row) => (
              <div key={row[0]} className="flex items-center justify-between text-[11px] font-semibold text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
                <span className="truncate pr-2">{row[0]}</span>
                <span className="font-extrabold text-slate-900 shrink-0">{row[row.length - 1]}</span>
              </div>
            ))}
          </div>
          <motion.button
            onClick={() => downloadCsv(r.id, r.headers, r.rows)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="mt-4 w-full py-2.5 rounded-xl bg-[#3F76C5] text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-[0_6px_16px_rgba(63,118,197,0.3)] hover:bg-[#3566ac] transition"
          >
            <Download className="w-3.5 h-3.5" />
            Download CSV
          </motion.button>
        </motion.div>
      ))}
    </div>
  </SectionShell>
);
