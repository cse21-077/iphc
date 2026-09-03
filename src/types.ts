export interface MemberProfile {
  id: string;
  name: string;
  title: string; // e.g. "Ntate"
  membershipNumber: string;
  branch: string;
  section: string;
  baptismNumber: string;
  photo: string;
  phone: string;
  email: string;
  address: string;
  postalAddress?: string;
  age?: number;
  biography?: string;
  qualifications?: string;
  nextOfKin: {
    name: string;
    relation: string;
    phone: string;
  };
  marriageStatus: string;
  familyMembers: Array<{
    id: string;
    name: string;
    relation: string;
  }>;
  joinYear: number;
  qrToken: string;
  isPending?: boolean;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  time: string;
  serviceName: string;
  branch: string;
  method: 'self_qr' | 'usher_scan';
  seatNumber?: string;
  verificationCode: string;
}

export interface Ceremony {
  id: string;
  title: string;
  sepediSubtitle?: string;
  dateRange: string;
  startDate: string;
  endDate: string;
  location: string;
  month?: number; // 1 = January … 12 = December (Silo annual program)
  category: 'Monthend' | 'Paseka' | 'Sethephu' | 'Annual' | 'Youth' | 'Dikgaboi' | 'Regional' | 'Special';
  description: string;
  importantNotice: string;
  isPreRegistrationOpen: boolean;
  isRegistered?: boolean;
  registeredFamilyMembers?: string[];
  registeredAt?: string;
  imageUrl?: string;
}

export interface MediaItem {
  id: string;
  title: string;
  category: 'Sermons' | 'Announcements' | 'Events' | 'Archive';
  type: 'video' | 'audio' | 'photo';
  duration: string;
  speaker: string;
  date: string;
  description: string;
  scriptureReference?: string;
  thumbnail: string;
  mediaUrl?: string;
  isMemberOnly: boolean;
}

export interface BusinessListing {
  id: string;
  businessName: string;
  ownerName: string;
  ownerBranch: string;
  category: 'Construction' | 'Catering' | 'Transport' | 'Legal & Accounting' | 'Retail' | 'Health & Beauty' | 'Agriculture' | 'Technology' | 'Services';
  description: string;
  phone: string;
  whatsapp: string;
  email?: string;
  location: string;
  logoUrl?: string;
  verifiedChurchMember: boolean;
  isOwner?: boolean;
  createdAt: string;
}

export interface PaymentCategory {
  id: 'karolo' | 'polokano' | 'monthends' | 'sethephu' | 'building' | 'special';
  name: string;
  sesothoName: string;
  description: string;
  suggestedAmounts: number[];
  color: string;
  iconName: string;
}

export interface PaymentRecord {
  id: string;
  receiptNumber: string;
  date: string;
  category: string;
  categoryLabel: string;
  amount: number;
  status: 'Completed' | 'Pending';
  paymentMethod: 'Instant EFT' | 'Card' | 'Ozow / PayFast' | 'Branch Cash Reference';
  memberName: string;
  memberNumber: string;
  referenceNote?: string;
}

export interface AnnouncementNotification {
  id: string;
  title: string;
  body: string;
  date: string;
  isRead: boolean;
  scope: 'Church-wide' | 'Branch' | 'Ceremony';
  priority: 'urgent' | 'normal';
}

export type ActiveTab = 'home' | 'calendar' | 'scan' | 'flg' | 'profile';
