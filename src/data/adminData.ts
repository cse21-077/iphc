// Deterministic demo dataset for the MMUSO Administration Dashboard.
// Seeded PRNG keeps every number stable between reloads so the showcase
// looks like a real, consistent reporting snapshot.
import { BRANCH_REGION_GROUPS, CHURCH_BRANCHES } from './branches';
import { initialCeremonies, paymentCategories } from './initialData';

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260903);
const between = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;

export interface AdminSummary {
  totalMembers: number;
  activeMembers: number;
  branches: number;
  regions: number;
  ceremonyRegistrations: number;
  checkIns: number;
  paymentsTotal: number;
  businesses: number;
  mediaItems: number;
}

export interface WeeklyDatum {
  day: string;
  registrations: number;
  checkIns: number;
}

export interface HeatmapSlot {
  time: string;
  values: number[]; // 7 entries (Sun..Sat), intensity 0–4
}

export interface SectionStat {
  section: string;
  count: number;
}

export interface RegionStat {
  region: string;
  count: number;
}

export interface RegistrationRow {
  id: string;
  name: string;
  branch: string;
  region: string;
  section: string;
  date: string;
  status: 'New' | 'Verified' | 'Pending';
}

export interface AdminPaymentRow {
  id: string;
  receipt: string;
  memberName: string;
  category: string;
  color: string;
  method: string;
  amount: number;
  date: string;
}

export interface CeremonyRegStat {
  id: string;
  title: string;
  dateRange: string;
  location: string;
  registrations: number;
  checkedIn: number;
}

// ---------------------------------------------------------------------------
// Core summary
// ---------------------------------------------------------------------------
const REGION_WEIGHTS: Record<string, number> = {
  'Limpopo 3': 1.4, 'Limpopo 1': 1.25, 'Limpopo 5': 1.15, 'Limpopo 2': 1.0,
  'Limpopo 4': 1.05, 'Mpumalanga 3': 1.1, 'Mpumalanga 2': 1.0, 'Mpumalanga 1': 0.9,
  'Johannesburg': 1.2, 'Pretoria': 1.1, 'Mavulindlela': 0.95, 'Vaalfreestate': 0.9,
  'Northwest 1': 0.85, 'Northwest 2': 0.6, 'Waterberg': 0.6, 'Botswana': 0.8,
  'Lesotho': 0.65, 'Mozambique': 0.55, 'Namibia': 0.35, 'Eastern Cape': 0.4,
  'Thaba ya sione': 0.35,
};

export const REGION_STATS: RegionStat[] = BRANCH_REGION_GROUPS.map((g) => ({
  region: g.region,
  count: Math.round(g.branches.length * 265 * (REGION_WEIGHTS[g.region] ?? 0.8) * (0.92 + rand() * 0.16)),
})).sort((a, b) => b.count - a.count);

const TOTAL_MEMBERS = REGION_STATS.reduce((sum, r) => sum + r.count, 0);
const ACTIVE_MEMBERS = Math.round(TOTAL_MEMBERS * 0.87);

// ---------------------------------------------------------------------------
// Weekly registrations & check-ins (Sun–Sat)
// ---------------------------------------------------------------------------
export const WEEKLY_SERIES: WeeklyDatum[] = [
  { day: 'Sun', registrations: 2310, checkIns: 1840 },
  { day: 'Mon', registrations: 1140, checkIns: 690 },
  { day: 'Tue', registrations: 980, checkIns: 520 },
  { day: 'Wed', registrations: 1245, checkIns: 610 },
  { day: 'Thu', registrations: 1420, checkIns: 780 },
  { day: 'Fri', registrations: 1860, checkIns: 1120 },
  { day: 'Sat', registrations: 2740, checkIns: 2190 },
];

// ---------------------------------------------------------------------------
// Attendance heatmap: service time slot × day of week (0 = empty … 4 = full)
// ---------------------------------------------------------------------------
export const ATTENDANCE_HEATMAP: HeatmapSlot[] = [
  { time: '6AM', values: [2, 1, 1, 1, 2, 3, 3] },
  { time: '9AM', values: [4, 2, 2, 2, 3, 4, 4] },
  { time: '12PM', values: [3, 2, 1, 2, 2, 3, 3] },
  { time: '3PM', values: [2, 1, 1, 1, 2, 3, 3] },
  { time: '6PM', values: [3, 1, 1, 1, 2, 3, 4] },
  { time: '8PM', values: [2, 0, 0, 1, 1, 2, 3] },
];

// ---------------------------------------------------------------------------
// Membership by section (Makgotla)
// ---------------------------------------------------------------------------
export const SECTION_BREAKDOWN: SectionStat[] = [
  { section: 'Dinaledi', count: Math.round(TOTAL_MEMBERS * 0.24) },
  { section: 'Difate', count: Math.round(TOTAL_MEMBERS * 0.21) },
  { section: 'Bo Ntate', count: Math.round(TOTAL_MEMBERS * 0.17) },
  { section: 'Badisa', count: Math.round(TOTAL_MEMBERS * 0.14) },
  { section: 'Ayobaness', count: Math.round(TOTAL_MEMBERS * 0.11) },
  { section: 'BaPriest', count: Math.round(TOTAL_MEMBERS * 0.08) },
  { section: 'EXCO', count: Math.round(TOTAL_MEMBERS * 0.05) },
];

// ---------------------------------------------------------------------------
// Membership cards gauge
// ---------------------------------------------------------------------------
export const CARDS_GAUGE = {
  issued: Math.round(TOTAL_MEMBERS * 0.84),
  pending: 0,
};
CARDS_GAUGE.pending = TOTAL_MEMBERS - CARDS_GAUGE.issued;

// ---------------------------------------------------------------------------
// Recent registrations (demo rows — live app registrations are merged on top
// by AdminDashboard from localStorage)
// ---------------------------------------------------------------------------
export const RECENT_REGISTRATIONS: RegistrationRow[] = [
  { id: 'reg_001', name: 'Mme Keaobaka Mohlala', branch: 'Seshego', region: 'Limpopo 2', section: 'Dinaledi', date: '2026-09-02', status: 'Verified' },
  { id: 'reg_002', name: 'Ntate Samuel Kgwedi', branch: 'Tembisa', region: 'Johannesburg', section: 'Bo Ntate', date: '2026-09-02', status: 'New' },
  { id: 'reg_003', name: 'Mme Naledi Tshehla', branch: 'Thohoyandou', region: 'Limpopo 4', section: 'Badisa', date: '2026-09-01', status: 'Pending' },
  { id: 'reg_004', name: 'Ntate Piet Motaung', branch: 'Bethlehem', region: 'Vaalfreestate', section: 'Difate', date: '2026-09-01', status: 'Verified' },
  { id: 'reg_005', name: 'Mme Lerato Dlamini', branch: 'Kwamhlanga', region: 'Mpumalanga 2', section: 'Ayobaness', date: '2026-08-31', status: 'Verified' },
  { id: 'reg_006', name: 'Ntate Oupa Chiloane', branch: 'Bushbuckridge', region: 'Mpumalanga 1', section: 'BaPriest', date: '2026-08-31', status: 'New' },
  { id: 'reg_007', name: 'Mme Refilwe Mashaba', branch: 'Tzaneen', region: 'Limpopo 5', section: 'Dinaledi', date: '2026-08-30', status: 'Verified' },
  { id: 'reg_008', name: 'Ntate Victor Sebola', branch: 'Mokerong', region: 'Limpopo 3', section: 'Bo Ntate', date: '2026-08-30', status: 'Pending' },
];

// ---------------------------------------------------------------------------
// Recent payments
// ---------------------------------------------------------------------------
const PAYMENT_METHODS = ['Instant EFT', 'Card', 'Ozow / PayFast', 'Branch Cash Reference'];

export const RECENT_PAYMENTS: AdminPaymentRow[] = Array.from({ length: 6 }, (_, i) => {
  const cat = paymentCategories[i % paymentCategories.length];
  const first = ['Tumelo', 'Mpho', 'Kabelo', 'Grace', 'Johannes', 'Naledi', 'David', 'Joyce'][i];
  const last = ['Lekolwane', 'Radebe', 'Motsepe', 'Tshehla', 'Mokoena', 'Ndlovu', 'Khumalo', 'Mohlala'][i];
  return {
    id: `apay_${i + 1}`,
    receipt: `IPHC-RCP-2026-09-${String(4100 - i * 137).padStart(4, '0')}`,
    memberName: `${first} ${last}`,
    category: cat.name.split(' (')[0],
    color: cat.color,
    method: PAYMENT_METHODS[between(0, PAYMENT_METHODS.length - 1)],
    amount: cat.suggestedAmounts[between(0, cat.suggestedAmounts.length - 1)],
    date: `2026-09-0${(i % 3) + 1}`,
  };
});

// ---------------------------------------------------------------------------
// Upcoming ceremonies with pre-registration volumes
// ---------------------------------------------------------------------------
export const UPCOMING_CEREMONIES: CeremonyRegStat[] = initialCeremonies
  .filter((c) => c.startDate >= '2026-09-03')
  .slice(0, 6)
  .map((c, i) => {
    const registrations = between(4200, 14800) + i * 350;
    return {
      id: c.id,
      title: c.title,
      dateRange: c.dateRange,
      location: c.location,
      registrations,
      checkedIn: c.startDate <= '2026-09-03' ? Math.round(registrations * 0.92) : 0,
    };
  });

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
export const ADMIN_SUMMARY: AdminSummary = {
  totalMembers: TOTAL_MEMBERS,
  activeMembers: ACTIVE_MEMBERS,
  branches: CHURCH_BRANCHES.length,
  regions: BRANCH_REGION_GROUPS.length,
  ceremonyRegistrations: UPCOMING_CEREMONIES.reduce((s, c) => s + c.registrations, 0),
  checkIns: WEEKLY_SERIES.reduce((s, d) => s + d.checkIns, 0),
  paymentsTotal: 2847500 + between(0, 9000),
  businesses: 128,
  mediaItems: 342,
};

export const formatRand = (n: number) =>
  'R ' + n.toLocaleString('en-ZA', { maximumFractionDigits: 0 });

export const formatNumber = (n: number) => n.toLocaleString('en-ZA');

// ---------------------------------------------------------------------------
// Demo member directory (Membership section)
// ---------------------------------------------------------------------------
const FIRST_NAMES = [
  'Tumelo', 'Kabelo', 'Lerato', 'Mpho', 'Keaobaka', 'Samuel', 'Naledi', 'Piet',
  'Refilwe', 'Victor', 'Thabang', 'Palesa', 'Kgosi', 'Modise', 'Dineo', 'Tshepo',
  'Bontle', 'Katlego', 'Neo', 'Ofentse', 'Kamogelo', 'Tebogo', 'Mmabatho',
  'Boitumelo', 'Karabo', 'Lethabo', 'Onalenna', 'Mapule', 'Seipati', 'Aubrey',
];
const LAST_NAMES = [
  'Lekolwane', 'Mohlala', 'Kgwedi', 'Tshehla', 'Motaung', 'Dlamini', 'Chiloane',
  'Mashaba', 'Sebola', 'Radebe', 'Motsepe', 'Mokoena', 'Ndlovu', 'Khumalo',
  'Mokwena', 'Sithole', 'Nkosi', 'Baloyi', 'Chauke', 'Maseko', 'Zulu',
  'Tshabalala', 'Mogale', 'Kekana',
];
const SECTION_NAMES = SECTION_BREAKDOWN.map((s) => s.section);

export interface DemoMember {
  id: string;
  name: string;
  membershipNumber: string;
  branch: string;
  region: string;
  section: string;
  status: RegistrationRow['status'];
  registeredAt: string;
}

const STATUS_ROLL: RegistrationRow['status'][] = [
  'Verified', 'Verified', 'Verified', 'Verified', 'New',
  'Verified', 'Verified', 'Pending', 'Verified', 'Verified',
];

export const DEMO_MEMBERS: DemoMember[] = Array.from({ length: 48 }, (_, i) => {
  const regionIdx = i % BRANCH_REGION_GROUPS.length;
  const group = BRANCH_REGION_GROUPS[regionIdx];
  const branch = group.branches[i % group.branches.length];
  const day = between(1, 28);
  const month = between(5, 9);
  return {
    id: `mem_${String(i + 1).padStart(3, '0')}`,
    name: `${FIRST_NAMES[i % FIRST_NAMES.length]} ${LAST_NAMES[(i * 7 + 3) % LAST_NAMES.length]}`,
    membershipNumber: `IPHC-MM-${String(100000 + i * 7919).slice(0, 6)}`,
    branch,
    region: group.region,
    section: SECTION_NAMES[i % SECTION_NAMES.length],
    status: STATUS_ROLL[i % STATUS_ROLL.length],
    registeredAt: `2026-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
  };
});

// ---------------------------------------------------------------------------
// Recent QR check-ins (Attendance section)
// ---------------------------------------------------------------------------
const SERVICES = [
  'Sabbath Morning Service', 'Monthend Pilgrimage', 'Evening Prayer',
  'Youth Revival Service', 'Dikgaboi Holy Communion', 'Midweek Service',
];

export interface CheckinRow {
  id: string;
  memberName: string;
  membershipNumber: string;
  service: string;
  branch: string;
  date: string;
  time: string;
  method: 'self_qr' | 'usher_scan';
}

export const RECENT_CHECKINS: CheckinRow[] = Array.from({ length: 10 }, (_, i) => {
  const m = DEMO_MEMBERS[i * 3];
  return {
    id: `chk_${i + 1}`,
    memberName: m.name,
    membershipNumber: m.membershipNumber,
    service: SERVICES[i % SERVICES.length],
    branch: m.branch,
    date: `2026-09-0${(i % 3) + 1}`,
    time: `${between(6, 11)}:${between(10, 59)} AM`,
    method: i % 3 === 0 ? 'usher_scan' : 'self_qr',
  };
});

// ---------------------------------------------------------------------------
// Payments (extended)
// ---------------------------------------------------------------------------
export const ALL_PAYMENTS: AdminPaymentRow[] = Array.from({ length: 12 }, (_, i) => {
  const cat = paymentCategories[i % paymentCategories.length];
  const member = DEMO_MEMBERS[i];
  return {
    id: `apay_all_${i + 1}`,
    receipt: `IPHC-RCP-2026-09-${String(4100 - i * 137).padStart(4, '0')}`,
    memberName: member.name,
    category: cat.name.split(' (')[0],
    color: cat.color,
    method: PAYMENT_METHODS[between(0, PAYMENT_METHODS.length - 1)],
    amount: cat.suggestedAmounts[between(0, cat.suggestedAmounts.length - 1)],
    date: `2026-09-0${(i % 3) + 1}`,
  };
});

export const MONTHLY_PAYMENTS = [
  { month: 'Apr', amount: 412000 },
  { month: 'May', amount: 538000 },
  { month: 'Jun', amount: 691000 },
  { month: 'Jul', amount: 624000 },
  { month: 'Aug', amount: 783000 },
  { month: 'Sep', amount: 452000 },
];
