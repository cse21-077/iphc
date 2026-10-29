import React, { useState, useEffect, useCallback } from 'react';
import {
  MemberProfile,
  AttendanceRecord,
  PaymentRecord,
  AnnouncementNotification,
} from './types';
import {
  initialMemberProfile,
  initialPaymentRecords,
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
import { SecurityPortal } from './components/SecurityPortal';
import PWAInstallOverlay from './components/PWAInstallOverlay';
import { AdminDashboard } from './components/admin/AdminDashboard';
import {
  ChurchNotice,
  getCurrentUser,
  getMemberAttendance,
  getNotices,
  login,
  logout,
  MemberAttendance,
  register,
  RegistrationPayload,
  requestPasswordReset,
  resetPasswordWithToken,
  SecurityProfile,
} from './api';

const attendanceRecordFromApi = (record: MemberAttendance): AttendanceRecord => {
  const checkedInAt = new Date(record.checkedInAt);
  return {
    id: record.attendanceId,
    date: checkedInAt.toISOString().slice(0, 10),
    time: checkedInAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    serviceName: record.eventName,
    branch: `${record.branch} · ${record.location}`,
    method: record.method,
    verificationCode: `ATT-${record.attendanceId.slice(0, 8).toUpperCase()}`,
  };
};

const SEEN_NOTICES_KEY = 'iphc_mmuso_seen_notices';

export default function App() {
  // Admin route: /admin (path) or #/admin (hash) renders the leadership dashboard
  const isAdminLocation = () =>
    window.location.hash.startsWith('#/admin') ||
    window.location.pathname.replace(/\/+$/, '').endsWith('/admin');

  const [isAdminRoute, setIsAdminRoute] = useState(isAdminLocation);

  useEffect(() => {
    const onLocationChange = () => setIsAdminRoute(isAdminLocation());
    window.addEventListener('hashchange', onLocationChange);
    window.addEventListener('popstate', onLocationChange);
    return () => {
      window.removeEventListener('hashchange', onLocationChange);
      window.removeEventListener('popstate', onLocationChange);
    };
  }, []);

  // Navigation State
  const [activeTab, setActiveTab] = useState<'home' | 'calendar' | 'scan' | 'flg' | 'profile'>('home');

  // Sub-screens state
  const [isPaymentsOpen, setIsPaymentsOpen] = useState(false);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [isMediaOpen, setIsMediaOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMembershipPassOpen, setIsMembershipPassOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [securityProfile, setSecurityProfile] = useState<SecurityProfile | null>(null);
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
  const [member, setMember] = useState<MemberProfile>(initialMemberProfile);

  // Attendance history always comes from the member API — never from seeded
  // or cached data — so the screen reflects the real attendance records.
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [attendanceLoadError, setAttendanceLoadError] = useState('');

  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>(() => {
    const saved = localStorage.getItem('iphc_mmuso_payments');
    return saved ? JSON.parse(saved) : initialPaymentRecords;
  });

  // Real church notices from the server. Read state is tracked per device so
  // the home bell badge and modal stay honest without any server writes.
  const [notices, setNotices] = useState<ChurchNotice[]>([]);
  const [seenNotices, setSeenNotices] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(SEEN_NOTICES_KEY) ?? '[]');
    } catch {
      return [];
    }
  });

  const loadMemberAttendance = useCallback(async () => {
    try {
      const records = await getMemberAttendance();
      setAttendanceRecords(records.map(attendanceRecordFromApi));
      setAttendanceLoadError('');
    } catch (error) {
      setAttendanceLoadError(error instanceof Error ? error.message : 'Attendance history could not be loaded.');
    }
  }, []);

  useEffect(() => {
    if (!isAttendanceOpen || !hasSession || securityProfile) return;

    let active = true;
    let refreshing = false;
    const refreshAttendance = async () => {
      if (refreshing) return;
      refreshing = true;
      try {
        const records = await getMemberAttendance();
        if (active) {
          setAttendanceRecords(records.map(attendanceRecordFromApi));
          setAttendanceLoadError('');
        }
      } catch (error) {
        if (active) {
          setAttendanceLoadError(error instanceof Error ? error.message : 'Attendance history could not be loaded.');
        }
      } finally {
        refreshing = false;
      }
    };

    void refreshAttendance();
    const interval = window.setInterval(refreshAttendance, 10000);
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') void refreshAttendance();
    };
    window.addEventListener('focus', refreshWhenVisible);
    document.addEventListener('visibilitychange', refreshWhenVisible);

    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener('focus', refreshWhenVisible);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [hasSession, isAttendanceOpen, securityProfile]);

  // Save to local storage on changes
  useEffect(() => {
    localStorage.setItem('iphc_mmuso_member', JSON.stringify(member));
  }, [member]);

  useEffect(() => {
    let active = true;
    getCurrentUser()
      .then(({ member: currentMember, role, securityProfile: currentSecurityProfile }) => {
        if (active) {
          if (role === 'SECURITY' && currentSecurityProfile) {
            setSecurityProfile(currentSecurityProfile);
            setHasSession(true);
            setIsAuthModalOpen(false);
          } else if (currentMember) {
            setMember(currentMember);
            setSecurityProfile(null);
            setHasSession(true);
            setIsAuthModalOpen(false);
            void loadMemberAttendance();
          }
          setAuthReady(true);
        }
      })
      .catch(() => {
        if (active) setAuthReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('iphc_mmuso_payments', JSON.stringify(paymentRecords));
  }, [paymentRecords]);

  useEffect(() => {
    localStorage.setItem(SEEN_NOTICES_KEY, JSON.stringify(seenNotices));
  }, [seenNotices]);

  // Poll real notices while a member session is active so the home badge
  // and the modal reflect what branch administration has published.
  useEffect(() => {
    if (!hasSession || securityProfile) return;
    let active = true;
    const loadNotices = () =>
      getNotices()
        .then((items) => {
          if (active) setNotices(items);
        })
        .catch(() => undefined);
    loadNotices();
    const interval = window.setInterval(loadNotices, 60000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [hasSession, securityProfile]);

  // Auth Handlers
  const handleLoginWithEmail = async (inputEmail: string, password: string) => {
    const result = await login(inputEmail, password);
    if (result.role === 'SECURITY' && result.securityProfile) {
      setSecurityProfile(result.securityProfile);
      setHasSession(true);
    } else if (result.member) {
      setSecurityProfile(null);
      setMember(result.member);
      setHasSession(true);
      void loadMemberAttendance();
    }
    setIsAuthModalOpen(false);
    setActiveTab('home');
  };

  const handleRegisterNewMember = async (registration: RegistrationPayload) => {
    const result = await register(registration);
    if (result.member) {
      setSecurityProfile(null);
      setMember(result.member);
      setHasSession(true);
      void loadMemberAttendance();
    }
    setActiveTab('home');
  };

  const handleSignOut = async () => {
    try {
      await logout();
    } finally {
      setMember(initialMemberProfile);
      setSecurityProfile(null);
      setHasSession(false);
      setIsAuthModalOpen(true);
    }
  };

  // Password-reset links land as /<path>#reset_token=... . The auth modal
  // shows the set-new-password screen only when it is open, so a logged-in
  // member clicking the link would end up on the home screen with nowhere to
  // type their new password — sign them out and let the modal take over.
  useEffect(() => {
    const applyRecoveryHash = () => {
      const hash = window.location.hash.replace(/^#/, '');
      if (!hash.includes('reset_token')) return;
      if (new URLSearchParams(hash).get('reset_token') && hasSession) {
        void handleSignOut();
      }
    };
    applyRecoveryHash();
    window.addEventListener('hashchange', applyRecoveryHash);
    return () => window.removeEventListener('hashchange', applyRecoveryHash);
  }, [hasSession]);

  // Handlers
  const handleRecordAttendance = (newRecord: AttendanceRecord) => {
    setAttendanceRecords((prev) => [newRecord, ...prev]);
    setAttendanceLoadError('');
  };

  const handleRecordPayment = (newRecord: PaymentRecord) => {
    setPaymentRecords((prev) => [newRecord, ...prev]);
  };

  const notifications: AnnouncementNotification[] = notices.map((notice) => ({
    id: notice.id,
    title: notice.title,
    body: notice.body,
    date: new Date(notice.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
    isRead: seenNotices.includes(notice.id),
    scope: notice.scope === 'Branch' || notice.scope === 'Ceremony' ? notice.scope : 'Church-wide',
    priority: notice.priority === 'urgent' ? 'urgent' : 'normal',
  }));

  const handleMarkAllNotificationsRead = () => {
    setSeenNotices((prev) => Array.from(new Set([...prev, ...notices.map((notice) => notice.id)])));
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

  if (isAdminRoute) {
    return (
      <AdminDashboard
        liveMembers={hasSession && member.id ? [member] : []}
        onExit={() => {
          if (window.location.pathname.replace(/\/+$/, '').endsWith('/admin')) {
            window.location.pathname = '/';
          } else {
            window.location.hash = '';
          }
          window.scrollTo({ top: 0 });
        }}
      />
    );
  }

  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#0A2A52] flex items-center justify-center">
        <img src="/pwa-192x192.png" alt="IPHC" className="w-20 h-20 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div className="min-h-screen bg-[#F4F7FB] flex items-center justify-center p-4 pt-[calc(env(safe-area-inset-top)+1rem)] pb-[calc(env(safe-area-inset-bottom)+1rem)]">
        <RegistrationAuthModal
          isOpen
          onClose={() => undefined}
          onLogin={handleLoginWithEmail}
          onRegisterComplete={handleRegisterNewMember}
          onRequestPasswordReset={(email) => requestPasswordReset(email).then(() => undefined)}
          onResetPassword={(token, password) => resetPasswordWithToken(token, password).then(() => undefined)}
        />
      </div>
    );
  }

  if (securityProfile) {
    return <SecurityPortal profile={securityProfile} onSignOut={handleSignOut} />;
  }

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
      {/* Mobile container constraint: standard responsive app frame — top padding respects the device notch/status bar */}
      <div className="w-full max-w-md bg-white min-h-screen flex flex-col shadow-[0_24px_48px_rgba(0,0,0,0.08)] relative border-x border-gray-100 pt-[env(safe-area-inset-top)]">
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
              error={attendanceLoadError}
              onRefresh={loadMemberAttendance}
              onBack={() => setIsAttendanceOpen(false)}
              onScanNow={() => {
                setIsAttendanceOpen(false);
                setActiveTab('scan');
              }}
            />
          ) : isMediaOpen ? (
            /* Sub-view: Media Sermons */
            <MediaView
              mediaItems={[]}
              onBack={() => setIsMediaOpen(false)}
            />
          ) : (
            /* Main 5 Navigation Tabs */
            <>
              {activeTab === 'home' && (
                <HomeView
                  member={member}
                  hasUnseenNotices={notifications.some((n) => !n.isRead)}
                  onNavigateTab={navigateToTab}
                  onOpenEvents={() => navigateToTab('calendar')}
                  onOpenAttendance={() => setIsAttendanceOpen(true)}
                  onOpenMedia={() => setIsMediaOpen(true)}
                  onOpenNotifications={() => setIsNotificationsOpen(true)}
                  onOpenMembershipPass={() => setIsMembershipPassOpen(true)}
                />
              )}

              {activeTab === 'calendar' && (
                <CalendarView
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
                <FLGEmpireView />
              )}

              {activeTab === 'profile' && (
                <ProfileView
                  member={member}
                  onUpdateMember={setMember}
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
          onLogin={handleLoginWithEmail}
          onRegisterComplete={handleRegisterNewMember}
          onRequestPasswordReset={(email) => requestPasswordReset(email).then(() => undefined)}
          onResetPassword={(token, password) => resetPasswordWithToken(token, password).then(() => undefined)}
        />
        {/* PWA Install Overlay: blocks web view until app is installed */}
        <PWAInstallOverlay />
      </div>
    </div>
  );
}
