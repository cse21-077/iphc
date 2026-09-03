import React, { useState, useEffect } from 'react';
import {
  MemberProfile,
  Ceremony,
  BusinessListing,
  AttendanceRecord,
  PaymentRecord,
  AnnouncementNotification,
} from './types';
import {
  initialMemberProfile,
  initialCeremonies,
  initialBusinesses,
  initialAttendanceRecords,
  initialPaymentRecords,
  initialNotifications,
  initialMediaItems,
} from './data/initialData';
import { BottomNav } from './components/BottomNav';
import { HomeView } from './components/HomeView';
import { ScanView } from './components/ScanView';
import { AttendanceView } from './components/AttendanceView';
import { CalendarView } from './components/CalendarView';
import { MediaView } from './components/MediaView';
import { FLGEmpireView } from './components/FLGEmpireView';
import { PaymentsView } from './components/PaymentsView';
import { ProfileView } from './components/ProfileView';
import { NotificationsModal } from './components/NotificationsModal';
import { MembershipCard } from './components/MembershipCard';
import { RegistrationAuthModal } from './components/RegistrationAuthModal';
import PWAInstallOverlay from './components/PWAInstallOverlay';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'home' | 'calendar' | 'scan' | 'flg' | 'profile'>('home');

  // Sub-screens state
  const [isPaymentsOpen, setIsPaymentsOpen] = useState(false);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [isMediaOpen, setIsMediaOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMembershipPassOpen, setIsMembershipPassOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [paymentsInitialCategory, setPaymentsInitialCategory] = useState<string | null>(null);

  // Splash screen: show the IPHC emblem on launch, then fade out smoothly
  const [splashFading, setSplashFading] = useState(false);
  const [splashGone, setSplashGone] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setSplashFading(true), 1100);
    const removeTimer = setTimeout(() => setSplashGone(true), 1750);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  // Persistent Domain States with LocalStorage backup
  const [member, setMember] = useState<MemberProfile>(() => {
    const saved = localStorage.getItem('iphc_mmuso_member');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Ensure photo points to public asset /tumelolekolwane.jpg for Tumelo
      if (parsed.id === 'mem_001' || parsed.name.includes('Tumelo')) {
        parsed.photo = '/tumelolekolwane.jpg';
      }
      return parsed;
    }
    return initialMemberProfile;
  });

  const [registeredMembersList, setRegisteredMembersList] = useState<MemberProfile[]>(() => {
    const saved = localStorage.getItem('iphc_mmuso_all_members');
    return saved ? JSON.parse(saved) : [initialMemberProfile];
  });

  const [ceremonies, setCeremonies] = useState<Ceremony[]>(() => {
    const saved = localStorage.getItem('iphc_mmuso_ceremonies');
    return saved ? JSON.parse(saved) : initialCeremonies;
  });

  const [businesses, setBusinesses] = useState<BusinessListing[]>(() => {
    const saved = localStorage.getItem('iphc_mmuso_businesses');
    return saved ? JSON.parse(saved) : initialBusinesses;
  });

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem('iphc_mmuso_attendance');
    return saved ? JSON.parse(saved) : initialAttendanceRecords;
  });

  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>(() => {
    const saved = localStorage.getItem('iphc_mmuso_payments');
    return saved ? JSON.parse(saved) : initialPaymentRecords;
  });

  const [notifications, setNotifications] = useState<AnnouncementNotification[]>(() => {
    const saved = localStorage.getItem('iphc_mmuso_notifications');
    return saved ? JSON.parse(saved) : initialNotifications;
  });

  // Save to local storage on changes
  useEffect(() => {
    localStorage.setItem('iphc_mmuso_member', JSON.stringify(member));
  }, [member]);

  useEffect(() => {
    localStorage.setItem('iphc_mmuso_all_members', JSON.stringify(registeredMembersList));
  }, [registeredMembersList]);

  useEffect(() => {
    localStorage.setItem('iphc_mmuso_ceremonies', JSON.stringify(ceremonies));
  }, [ceremonies]);

  useEffect(() => {
    localStorage.setItem('iphc_mmuso_businesses', JSON.stringify(businesses));
  }, [businesses]);

  useEffect(() => {
    localStorage.setItem('iphc_mmuso_attendance', JSON.stringify(attendanceRecords));
  }, [attendanceRecords]);

  useEffect(() => {
    localStorage.setItem('iphc_mmuso_payments', JSON.stringify(paymentRecords));
  }, [paymentRecords]);

  useEffect(() => {
    localStorage.setItem('iphc_mmuso_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Auth Handlers
  const handleLoginWithPhone = (inputPhone: string): boolean => {
    const cleaned = inputPhone.replace(/\s+/g, '');
    const found = registeredMembersList.find((m) => m.phone.replace(/\s+/g, '') === cleaned);
    if (found) {
      setMember(found);
      setActiveTab('home');
      return true;
    }
    // Fallback search initial profile
    if (initialMemberProfile.phone.replace(/\s+/g, '') === cleaned) {
      setMember(initialMemberProfile);
      setActiveTab('home');
      return true;
    }
    return false;
  };

  const handleRegisterNewMember = (newMember: MemberProfile) => {
    setRegisteredMembersList((prev) => [newMember, ...prev]);
    setMember(newMember);
    setActiveTab('home');
  };

  const handleSignOut = () => {
    setIsAuthModalOpen(true);
  };

  // Handlers
  const handleRecordAttendance = (newRecord: AttendanceRecord) => {
    setAttendanceRecords((prev) => [newRecord, ...prev]);
  };

  const handleRecordPayment = (newRecord: PaymentRecord) => {
    setPaymentRecords((prev) => [newRecord, ...prev]);
  };

  const handlePreRegisterCeremony = (ceremonyId: string, familyMembers: string[]) => {
    setCeremonies((prev) =>
      prev.map((c) =>
        c.id === ceremonyId
          ? {
              ...c,
              isRegistered: true,
              registeredFamilyMembers: familyMembers,
            }
          : c
      )
    );
  };

  const handleAddOrUpdateBusiness = (listing: BusinessListing) => {
    setBusinesses((prev) => {
      const idx = prev.findIndex((b) => b.id === listing.id || b.isOwner);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = listing;
        return next;
      }
      return [listing, ...prev];
    });
  };

  const handleMarkAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const navigateToTab = (tab: 'home' | 'calendar' | 'scan' | 'flg' | 'profile') => {
    setIsPaymentsOpen(false);
    setIsAttendanceOpen(false);
    setIsMediaOpen(false);
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openPaymentsFlow = (category = 'karolo') => {
    setPaymentsInitialCategory(category);
    setIsPaymentsOpen(true);
    setIsAttendanceOpen(false);
    setIsMediaOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex justify-center text-[#1A1A1A] selection:bg-[#3F76C5] selection:text-white">
      {/* Launch splash: IPHC emblem on navy, fades out after mount */}
      {!splashGone && (
        <div
          className={`fixed inset-0 z-[100] bg-[#0A2A52] flex flex-col items-center justify-center transition-opacity duration-600 ${
            splashFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          <img
            src="/pwa-192x192.png"
            alt="IPHC Emblem"
            className="w-26 h-26 rounded-[26px] shadow-[0_20px_50px_rgba(0,0,0,0.45)] animate-pulse"
          />
          <div className="text-white font-black text-2xl tracking-[0.3em] mt-5">MMUSO</div>
          <div className="text-[#8FA8C8] font-bold text-[10px] tracking-[0.3em] mt-2">
            IPHC • SILO ZUURBEKOM
          </div>
        </div>
      )}
      {/* Mobile container constraint: standard responsive app frame */}
      <div className="w-full max-w-md bg-white min-h-screen flex flex-col shadow-[0_24px_48px_rgba(0,0,0,0.08)] relative border-x border-gray-100">
        {/* Content View Router */}
        <main className="flex-1 overflow-y-auto bg-white">
          {/* Sub-view: Payments */}
          {isPaymentsOpen ? (
            <PaymentsView
              member={member}
              paymentRecords={paymentRecords}
              onRecordPayment={handleRecordPayment}
              onBack={() => setIsPaymentsOpen(false)}
              initialSelectedCategory={paymentsInitialCategory}
            />
          ) : isAttendanceOpen ? (
            /* Sub-view: Attendance */
            <AttendanceView
              records={attendanceRecords}
              onBack={() => setIsAttendanceOpen(false)}
              onScanNow={() => {
                setIsAttendanceOpen(false);
                setActiveTab('scan');
              }}
            />
          ) : isMediaOpen ? (
            /* Sub-view: Media Sermons */
            <MediaView
              mediaItems={initialMediaItems}
              onBack={() => setIsMediaOpen(false)}
            />
          ) : (
            /* Main 5 Navigation Tabs */
            <>
              {activeTab === 'home' && (
                <HomeView
                  member={member}
                  upcomingCeremony={
                    ceremonies.find((c) => c.startDate >= '2026-09-03') ?? ceremonies[ceremonies.length - 1]
                  }
                  announcements={notifications}
                  attendanceCount={attendanceRecords.length}
                  onNavigateTab={navigateToTab}
                  onOpenPayments={openPaymentsFlow}
                  onOpenMedia={() => setIsMediaOpen(true)}
                  onOpenNotifications={() => setIsNotificationsOpen(true)}
                  onOpenCeremonyRegistration={() => navigateToTab('calendar')}
                  onOpenMembershipPass={() => setIsMembershipPassOpen(true)}
                />
              )}

              {activeTab === 'calendar' && (
                <CalendarView
                  ceremonies={ceremonies}
                  member={member}
                  onPreRegister={handlePreRegisterCeremony}
                  onOpenCard={() => setIsMembershipPassOpen(true)}
                />
              )}

              {activeTab === 'scan' && (
                <ScanView
                  member={member}
                  onRecordAttendance={handleRecordAttendance}
                  onBackToHome={() => navigateToTab('home')}
                  onViewHistory={() => setIsAttendanceOpen(true)}
                />
              )}

              {activeTab === 'flg' && (
                <FLGEmpireView
                  businesses={businesses}
                  member={member}
                  onAddOrUpdateBusiness={handleAddOrUpdateBusiness}
                />
              )}

              {activeTab === 'profile' && (
                <ProfileView
                  member={member}
                  onUpdateMember={setMember}
                  onNavigateToPayments={() => openPaymentsFlow('karolo')}
                  onNavigateToAttendance={() => setIsAttendanceOpen(true)}
                  onOpenNotifications={() => setIsNotificationsOpen(true)}
                  onOpenCard={() => setIsMembershipPassOpen(true)}
                  onOpenAuthModal={() => setIsAuthModalOpen(true)}
                  onSignOut={handleSignOut}
                />
              )}
            </>
          )}
        </main>

        {/* Global Rounded Modern Bottom Navigation */}
        <BottomNav
          activeTab={activeTab}
          onChangeTab={navigateToTab}
          onSelectTab={navigateToTab}
        />

        {/* Full Screen Digital Pass Modal — Mounted ONLY when open */}
        {isMembershipPassOpen && (
          <MembershipCard
            member={member}
            isExpanded={true}
            onToggleExpand={() => setIsMembershipPassOpen(false)}
          />
        )}

        {/* Announcements Modal */}
        <NotificationsModal
          notifications={notifications}
          isOpen={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
          onMarkAllRead={handleMarkAllNotificationsRead}
        />

        {/* 5-Screen Registration & Auth Modal */}
        <RegistrationAuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onLogin={handleLoginWithPhone}
          onRegisterComplete={handleRegisterNewMember}
          currentMember={member}
        />
        {/* PWA Install Overlay: blocks web view until app is installed */}
        <PWAInstallOverlay />
      </div>
    </div>
  );
}
