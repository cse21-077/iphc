import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  Users,
  UserCog,
  CalendarDays,
  ScanLine,
  CreditCard,
  BriefcaseBusiness,
  Clapperboard,
  BarChart3,
  LifeBuoy,
  Settings,
  Moon,
  Bell,
  ChevronDown,
  Filter,
  LogOut,
} from 'lucide-react';
import { MemberProfile } from '../../types';
import {
  ADMIN_SUMMARY,
  WEEKLY_SERIES,
  ATTENDANCE_HEATMAP,
  SECTION_BREAKDOWN,
  REGION_STATS,
  CARDS_GAUGE,
  RECENT_REGISTRATIONS,
  RECENT_PAYMENTS,
  UPCOMING_CEREMONIES,
  RegistrationRow,
  WeeklyDatum,
  formatRand,
  formatNumber,
} from '../../data/adminData';
import { initialNotifications } from '../../data/initialData';
import { StatCard } from './StatCard';
import { AdminUsersSection } from './AdminUsersSection';
import { RegistrationsBarChart, AttendanceHeatmap, CardsGauge, ProgressRow, AnimatedNumber } from './AdminCharts';
import {
  MembershipSection,
  CeremoniesSection,
  AttendanceSection,
  PaymentsSection,
  FLGSection,
  MediaSection,
  ReportsSection,
} from './AdminSections';

const NAVY = '#0A2A52';
const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

import {
  AdminUser,
  createAdminUser,
  getAdminUsers,
  RegistrationPayload,
} from '../../api';

type SectionId =
  | 'dashboard'
  | 'membership'
  | 'accounts'
  | 'ceremonies'
  | 'attendance'
  | 'payments'
  | 'flg'
  | 'media'
  | 'reports';

interface AdminDashboardProps {
  liveMembers: MemberProfile[];
  onExit: () => void;
}

const NAV_ITEMS: Array<{ id: SectionId; icon: React.ElementType; label: string }> = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'membership', icon: Users, label: 'Membership' },
  { id: 'accounts', icon: UserCog, label: 'Accounts' },
  { id: 'ceremonies', icon: CalendarDays, label: 'Silo Events' },
  { id: 'attendance', icon: ScanLine, label: 'Attendance' },
  { id: 'payments', icon: CreditCard, label: 'Payments' },
  { id: 'flg', icon: BriefcaseBusiness, label: 'FLG Empire' },
  { id: 'media', icon: Clapperboard, label: 'Media' },
  { id: 'reports', icon: BarChart3, label: 'Reports' },
];

const SECTION_META: Record<Exclude<SectionId, 'dashboard'>, { title: string; blurb: string }> = {
  membership: { title: 'Membership', blurb: 'Registration & member management' },
  accounts: { title: 'Accounts', blurb: 'User accounts, roles & access' },
  ceremonies: { title: 'Silo Events', blurb: 'Services, ceremonies & gatherings' },
  attendance: { title: 'Attendance', blurb: 'QR check-ins & trends' },
  payments: { title: 'Payments', blurb: 'Contributions & reconciliation' },
  flg: { title: 'FLG Empire', blurb: 'Member business directory' },
  media: { title: 'Media', blurb: 'Sermons, events & archive' },
  reports: { title: 'Reports', blurb: 'Leadership reporting & exports' },
};

// User accounts come from the live API — master administrators only.
const AccountsSection: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const loadUsers = async () => {
    try {
      setLoadError('');
      setUsers(await getAdminUsers());
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Could not load user accounts.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const handleCreateUser = async (payload: RegistrationPayload) => {
    await createAdminUser(payload);
    await loadUsers();
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 py-14 text-center text-slate-400 text-xs font-semibold">
        Loading user accounts…
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 py-14 text-center">
        <p className="text-xs font-semibold text-red-600">{loadError}</p>
        <p className="mt-2 text-[11px] font-semibold text-slate-400">Sign in with a master administrator account to manage accounts.</p>
        <button
          type="button"
          onClick={() => void loadUsers()}
          className="mt-3 text-xs font-extrabold text-[#3F76C5] hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return <AdminUsersSection users={users} onCreateUser={handleCreateUser} />;
};

const STATUS_STYLES: Record<RegistrationRow['status'], string> = {
  Verified: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  New: 'bg-blue-50 text-[#3F76C5] border-blue-200',
  Pending: 'bg-amber-50 text-amber-600 border-amber-200',
};

const PERIODS = ['This Week', 'Last Week', 'This Month'] as const;
const PERIOD_SCALE: Record<(typeof PERIODS)[number], number> = {
  'This Week': 1,
  'Last Week': 0.82,
  'This Month': 4.1,
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ liveMembers, onExit }) => {
  const [activeSection, setActiveSection] = useState<SectionId>('dashboard');
  const [periodIdx, setPeriodIdx] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);

  const period = PERIODS[periodIdx];
  const chartData: WeeklyDatum[] = WEEKLY_SERIES.map((d) => ({
    ...d,
    registrations: Math.round(d.registrations * PERIOD_SCALE[period]),
    checkIns: Math.round(d.checkIns * PERIOD_SCALE[period]),
  }));

  // Merge members actually registered through the MMUSO app on top of the
  // demo snapshot so real registrations showcase immediately.
  const liveRows: RegistrationRow[] = liveMembers.map((m) => ({
    id: `live_${m.id}`,
    name: `${m.title} ${m.name}`.trim(),
    branch: m.branch,
    region: 'Registered via App',
    section: m.section,
    date: new Date().toISOString().slice(0, 10),
    status: m.isPending ? 'Pending' : 'New',
  }));
  const recentRegistrations = [...liveRows, ...RECENT_REGISTRATIONS];

  const totalMembers = ADMIN_SUMMARY.totalMembers + liveMembers.length;
  const maxSection = Math.max(...SECTION_BREAKDOWN.map((s) => s.count));
  const topRegions = REGION_STATS.slice(0, 6);
  const maxRegion = topRegions[0]?.count ?? 1;
  const meta = activeSection === 'dashboard' ? null : SECTION_META[activeSection];

  const kpiCards = [
    {
      label: 'Registered Members',
      value: formatNumber(totalMembers),
      renderValue: (
        <AnimatedNumber value={totalMembers} className="text-[26px] leading-none font-extrabold tracking-tight text-white" />
      ),
      sub: `${ADMIN_SUMMARY.branches} branches • ${ADMIN_SUMMARY.regions} regions`,
      trend: 12.5,
      trendLabel: 'from last month',
      highlighted: true,
      section: 'membership' as SectionId,
    },
    {
      label: 'Ceremony Registrations',
      value: formatNumber(ADMIN_SUMMARY.ceremonyRegistrations),
      renderValue: (
        <AnimatedNumber value={ADMIN_SUMMARY.ceremonyRegistrations} className="text-[26px] leading-none font-extrabold tracking-tight text-slate-900" />
      ),
      sub: 'Upcoming Silo ceremonies',
      trend: 8.1,
      trendLabel: 'from last ceremony',
      highlighted: false,
      section: 'ceremonies' as SectionId,
    },
    {
      label: 'Attendance Check-Ins',
      value: formatNumber(ADMIN_SUMMARY.checkIns),
      renderValue: (
        <AnimatedNumber value={ADMIN_SUMMARY.checkIns} className="text-[26px] leading-none font-extrabold tracking-tight text-slate-900" />
      ),
      sub: 'QR scans this week',
      trend: -5.2,
      trendLabel: 'vs last week',
      highlighted: false,
      section: 'attendance' as SectionId,
    },
    {
      label: 'Payments Collected',
      value: formatRand(ADMIN_SUMMARY.paymentsTotal),
      renderValue: (
        <AnimatedNumber
          value={ADMIN_SUMMARY.paymentsTotal}
          format={(n) => formatRand(n)}
          className="text-[26px] leading-none font-extrabold tracking-tight text-slate-900"
        />
      ),
      sub: 'Karolo, Polokano & more',
      trend: 1.2,
      trendLabel: 'from yesterday',
      highlighted: false,
      section: 'payments' as SectionId,
    },
  ];

  const renderSection = () => {
    switch (activeSection) {
      case 'membership':
        return <MembershipSection key="membership" />;
      case 'accounts':
        return <AccountsSection key="accounts" />;
      case 'ceremonies':
        return <CeremoniesSection key="ceremonies" />;
      case 'attendance':
        return <AttendanceSection key="attendance" />;
      case 'payments':
        return <PaymentsSection key="payments" />;
      case 'flg':
        return <FLGSection key="flg" />;
      case 'media':
        return <MediaSection key="media" />;
      case 'reports':
        return <ReportsSection key="reports" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F4F9] text-slate-900 flex">
      {/* ---------------------------------------------------------------- */}
      {/* Sidebar                                                          */}
      {/* ---------------------------------------------------------------- */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-100 sticky top-0 h-screen shrink-0">
        <div className="flex items-center gap-3 px-6 pt-7 pb-6">
          <img
            src="/assets/logoicon.webp"
            alt="IPHC MMUSO"
            className="w-10 h-10 rounded-xl object-cover shadow-sm"
          />
          <div>
            <div className="font-extrabold tracking-[0.2em] text-sm" style={{ color: NAVY }}>
              MMUSO
            </div>
            <div className="text-[9px] font-bold tracking-[0.14em] text-slate-400 mt-0.5">
              IPHC • SILO ZUURBEKOM
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {NAV_ITEMS.map(({ id, icon: Icon, label }) => {
            const active = activeSection === id;
            return (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={`relative w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-bold transition-colors duration-200 ${
                  active ? 'text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="admin-nav-pill"
                    className="absolute inset-0 rounded-xl bg-[#3F76C5] shadow-[0_8px_20px_rgba(63,118,197,0.35)]"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                <Icon className="w-4.5 h-4.5 relative z-10" />
                <span className="relative z-10">{label}</span>
              </button>
            );
          })}
        </nav>

        <div className="px-3 pb-6 space-y-1 border-t border-slate-100 pt-4 mx-3 px-0">
          <button className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition">
            <LifeBuoy className="w-4.5 h-4.5" />
            Help
          </button>
          <button className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition">
            <Settings className="w-4.5 h-4.5" />
            Settings
          </button>
          <button
            onClick={onExit}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-bold text-slate-400 hover:bg-red-50 hover:text-[#D13138] transition"
          >
            <LogOut className="w-4.5 h-4.5" />
            Back to App
          </button>
        </div>
      </aside>

      {/* ---------------------------------------------------------------- */}
      {/* Main                                                             */}
      {/* ---------------------------------------------------------------- */}
      <div className="flex-1 min-w-0">
        {/* Mobile top bar (small screens only) */}
        <div className="lg:hidden sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-slate-100 px-4 py-3">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2.5">
              <img src="/assets/logoicon.webp" alt="IPHC MMUSO" className="w-8 h-8 rounded-lg object-cover" />
              <span className="font-extrabold tracking-[0.18em] text-sm" style={{ color: NAVY }}>
                MMUSO ADMIN
              </span>
            </div>
            <button onClick={onExit} className="text-xs font-bold text-[#3F76C5]">
              Back to App
            </button>
          </div>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {NAV_ITEMS.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-extrabold whitespace-nowrap transition ${
                  activeSection === id ? 'bg-[#3F76C5] text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <main className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto">
          {/* Header row */}
          <div className="flex items-center justify-between gap-4 mb-5">
            <div>
              <h1 className="text-xl md:text-2xl font-extrabold tracking-tight flex items-center gap-2">
                {meta ? meta.title : 'Dashboard Overview'}
                {!meta && <span className="text-xl">👋</span>}
              </h1>
              <p className="text-xs text-slate-400 font-semibold mt-1">
                {meta
                  ? meta.blurb
                  : `National Administration • ${ADMIN_SUMMARY.regions} Regions • ${ADMIN_SUMMARY.branches} Branches`}
              </p>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                className="p-2.5 rounded-full bg-white border border-slate-100 text-slate-500 hover:text-slate-800 transition shadow-sm"
                aria-label="Toggle theme"
              >
                <Moon className="w-4 h-4" />
              </button>
              <div className="relative">
                <button
                  onClick={() => setNotifOpen((o) => !o)}
                  className="p-2.5 rounded-full bg-white border border-slate-100 text-slate-500 hover:text-slate-800 transition shadow-sm relative"
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-[#D13138]" />
                </button>
                <AnimatePresence>
                  {notifOpen && (
                    <>
                      <div className="fixed inset-0 z-20" onClick={() => setNotifOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.98 }}
                        transition={{ duration: 0.18, ease: EASE }}
                        className="absolute right-0 z-30 mt-2 w-80 bg-white rounded-2xl border border-slate-100 shadow-[0_20px_50px_rgba(15,42,82,0.18)] overflow-hidden"
                      >
                        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                          <span className="text-xs font-extrabold">Announcements</span>
                          <span className="text-[10px] font-extrabold text-[#3F76C5] bg-blue-50 rounded-full px-2 py-0.5">
                            {initialNotifications.filter((n) => !n.isRead).length} new
                          </span>
                        </div>
                        <div className="max-h-72 overflow-y-auto">
                          {initialNotifications.map((n, i) => (
                            <motion.div
                              key={n.id}
                              initial={{ opacity: 0, x: 10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.05 }}
                              className={`px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition ${n.isRead ? 'opacity-60' : ''}`}
                            >
                              <p className="text-[11px] font-extrabold text-slate-800 leading-snug">{n.title}</p>
                              <p className="text-[10px] text-slate-400 font-semibold mt-0.5 line-clamp-2">{n.body}</p>
                              <p className="text-[9px] font-bold text-slate-300 mt-1">{n.date} • {n.scope}</p>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
              <button className="flex items-center gap-2.5 pl-1.5 pr-2.5 py-1.5 rounded-full bg-white border border-slate-100 shadow-sm hover:border-slate-200 transition">
                <img
                  src="/tumelolekolwane.jpg"
                  alt="Administrator"
                  className="w-8 h-8 rounded-full object-cover"
                />
                <span className="hidden md:block text-left">
                  <span className="block text-[11px] font-extrabold leading-tight">Tumelo Lekolwane</span>
                  <span className="block text-[9px] font-bold text-slate-400 leading-tight">National Administrator</span>
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {activeSection !== 'dashboard' ? (
              renderSection()
            ) : (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4, ease: EASE }}
                className="space-y-5"
              >
                {/* KPI row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  {kpiCards.map((k, i) => (
                    <motion.button
                      key={k.label}
                      onClick={() => setActiveSection(k.section)}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.07, duration: 0.45, ease: EASE }}
                      whileHover={{ y: -4 }}
                      className="text-left"
                    >
                      <StatCard
                        highlighted={k.highlighted}
                        label={k.label}
                        value={k.value}
                        animatedValue={k.renderValue}
                        sub={k.sub}
                        trend={k.trend}
                        trendLabel={k.trendLabel}
                      />
                    </motion.button>
                  ))}
                </div>

                {/* Charts row */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                  <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-[0_4px_16px_rgba(15,42,82,0.05)] p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-extrabold">Registrations & Check-Ins</h3>
                      <button
                        onClick={() => setPeriodIdx((p) => (p + 1) % PERIODS.length)}
                        className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 border border-slate-200 rounded-lg px-2.5 py-1.5 hover:bg-slate-50 transition"
                      >
                        <Filter className="w-3.5 h-3.5" />
                        {period}
                      </button>
                    </div>
                    <RegistrationsBarChart
                      data={chartData}
                      seriesA={{ key: 'registrations', label: 'Registrations', color: '#A8C2E8' }}
                      seriesB={{ key: 'checkIns', label: 'Check-Ins', color: '#3F76C5' }}
                    />
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_16px_rgba(15,42,82,0.05)] p-5">
                    <h3 className="text-sm font-extrabold mb-1">Silo Attendance Heatmap</h3>
                    <p className="text-[11px] font-bold text-slate-400 mb-4">
                      {formatNumber(ADMIN_SUMMARY.checkIns * 4)} visits{' '}
                      <span className="text-emerald-600">↗ 0.4%</span>{' '}
                      <span className="font-semibold">this month</span>
                    </p>
                    <AttendanceHeatmap slots={ATTENDANCE_HEATMAP} />
                  </div>
                </div>

                {/* Gauge + recent registrations */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_16px_rgba(15,42,82,0.05)] p-5 flex flex-col">
                    <h3 className="text-sm font-extrabold mb-4">Membership Cards Issued</h3>
                    <div className="flex-1 flex items-center justify-center">
                      <CardsGauge issued={CARDS_GAUGE.issued} pending={CARDS_GAUGE.pending} />
                    </div>
                  </div>

                  <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-[0_4px_16px_rgba(15,42,82,0.05)] p-5 overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-extrabold">Recent Member Registrations</h3>
                      <button
                        onClick={() => setActiveSection('membership')}
                        className="text-[11px] font-bold text-[#3F76C5] bg-blue-50 rounded-full px-2.5 py-1 hover:bg-blue-100 transition"
                      >
                        {liveMembers.length > 0 ? `+${liveMembers.length} live from app` : 'Demo data'} — View all
                      </button>
                    </div>
                    <div className="overflow-x-auto -mx-5 px-5">
                      <table className="w-full text-xs min-w-[560px]">
                        <thead>
                          <tr className="text-left text-slate-400 font-bold border-b border-slate-100">
                            <th className="pb-2.5 pr-3 w-8">
                              <input type="checkbox" className="accent-[#3F76C5]" defaultChecked />
                            </th>
                            <th className="pb-2.5 pr-3">Member</th>
                            <th className="pb-2.5 pr-3">Branch</th>
                            <th className="pb-2.5 pr-3">Section</th>
                            <th className="pb-2.5 pr-3">Date</th>
                            <th className="pb-2.5 text-right">Status</th>
                          </tr>
                        </thead>
                        <motion.tbody
                          initial="hidden"
                          animate="show"
                          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
                        >
                          {recentRegistrations.slice(0, 8).map((r) => (
                            <motion.tr
                              key={r.id}
                              variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE } } }}
                              className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition"
                            >
                              <td className="py-3 pr-3">
                                <input type="checkbox" className="accent-[#3F76C5]" />
                              </td>
                              <td className="py-3 pr-3 font-bold text-slate-800 whitespace-nowrap">{r.name}</td>
                              <td className="py-3 pr-3 text-slate-500 font-semibold whitespace-nowrap">
                                {r.branch}
                                <span className="block text-[9px] text-slate-400 font-bold">{r.region}</span>
                              </td>
                              <td className="py-3 pr-3 text-slate-500 font-semibold">{r.section}</td>
                              <td className="py-3 pr-3 text-slate-500 font-semibold whitespace-nowrap">{r.date}</td>
                              <td className="py-3 text-right">
                                <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${STATUS_STYLES[r.status]}`}>
                                  {r.status}
                                </span>
                              </td>
                            </motion.tr>
                          ))}
                        </motion.tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Sections / Regions / Ceremonies */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_16px_rgba(15,42,82,0.05)] p-5">
                    <h3 className="text-sm font-extrabold mb-4">Members by Section (Makgotla)</h3>
                    <div className="space-y-3.5">
                      {SECTION_BREAKDOWN.map((s, i) => (
                        <ProgressRow
                          key={s.section}
                          label={s.section}
                          value={s.count}
                          max={maxSection}
                          color={['#3F76C5', '#0A2A52', '#D13138', '#F59E0B', '#10B981', '#8B5CF6', '#64748B'][i]}
                          delay={i * 0.05}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_16px_rgba(15,42,82,0.05)] p-5">
                    <h3 className="text-sm font-extrabold mb-4">Top Regions by Membership</h3>
                    <div className="space-y-3.5">
                      {topRegions.map((r, i) => (
                        <ProgressRow key={r.region} label={r.region} value={r.count} max={maxRegion} delay={i * 0.05} />
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_16px_rgba(15,42,82,0.05)] p-5 md:col-span-2 xl:col-span-1">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-extrabold">Upcoming Ceremonies</h3>
                      <button
                        onClick={() => setActiveSection('ceremonies')}
                        className="text-[10px] font-extrabold text-[#3F76C5] hover:underline"
                      >
                        View all
                      </button>
                    </div>
                    <div className="space-y-3">
                      {UPCOMING_CEREMONIES.map((c, i) => (
                        <motion.div
                          key={c.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.06, duration: 0.35, ease: EASE }}
                          className="flex items-center gap-3"
                        >
                          <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#3F76C5] flex flex-col items-center justify-center shrink-0">
                            <span className="text-[8px] font-extrabold leading-none">
                              {c.dateRange.split('–')[0].trim().split(' ')[0]}
                            </span>
                            <span className="text-[10px] font-extrabold leading-none">
                              {c.dateRange.split('–')[0].trim().split(' ')[1]?.slice(0, 3)}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-800 truncate">{c.title}</p>
                            <p className="text-[10px] font-semibold text-slate-400 truncate">{c.dateRange}</p>
                          </div>
                          <span className="text-[10px] font-extrabold text-[#3F76C5] bg-blue-50 rounded-full px-2 py-1 shrink-0">
                            {formatNumber(c.registrations)}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Recent payments */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_16px_rgba(15,42,82,0.05)] p-5 overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-extrabold">Recent Payments</h3>
                    <button
                      onClick={() => setActiveSection('payments')}
                      className="text-[11px] font-bold text-[#3F76C5] hover:underline"
                    >
                      View all
                    </button>
                  </div>
                  <div className="overflow-x-auto -mx-5 px-5">
                    <table className="w-full text-xs min-w-[560px]">
                      <thead>
                        <tr className="text-left text-slate-400 font-bold border-b border-slate-100">
                          <th className="pb-2.5 pr-3">Receipt</th>
                          <th className="pb-2.5 pr-3">Member</th>
                          <th className="pb-2.5 pr-3">Category</th>
                          <th className="pb-2.5 pr-3">Method</th>
                          <th className="pb-2.5 pr-3">Date</th>
                          <th className="pb-2.5 text-right">Amount</th>
                        </tr>
                      </thead>
                      <motion.tbody
                        initial="hidden"
                        animate="show"
                        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
                      >
                        {RECENT_PAYMENTS.map((p) => (
                          <motion.tr
                            key={p.id}
                            variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE } } }}
                            className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition"
                          >
                            <td className="py-3 pr-3 font-mono font-bold text-slate-500">{p.receipt}</td>
                            <td className="py-3 pr-3 font-bold text-slate-800 whitespace-nowrap">{p.memberName}</td>
                            <td className="py-3 pr-3">
                              <span
                                className="inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold text-white"
                                style={{ backgroundColor: p.color }}
                              >
                                {p.category}
                              </span>
                            </td>
                            <td className="py-3 pr-3 text-slate-500 font-semibold">{p.method}</td>
                            <td className="py-3 pr-3 text-slate-500 font-semibold whitespace-nowrap">{p.date}</td>
                            <td className="py-3 text-right font-extrabold text-slate-900">{formatRand(p.amount)}</td>
                          </motion.tr>
                        ))}
                      </motion.tbody>
                    </table>
                  </div>
                </div>

                <p className="text-center text-[10px] font-semibold text-slate-400 pb-4">
                  MMUSO Administration • Demo showcase data — connects to live registrations when the
                  national backend is deployed.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};
