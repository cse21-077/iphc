import React from 'react';
import { Home, Calendar, Scan, Briefcase, User } from 'lucide-react';
import { ActiveTab } from '../types';
import { useTranslation } from '../data/i18n';

interface BottomNavProps {
  activeTab: ActiveTab;
  onChangeTab?: (tab: ActiveTab) => void;
  onSelectTab?: (tab: ActiveTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  onSelectTab,
}) => {
  const { t } = useTranslation();
  const handleTabChange = (tab: ActiveTab) => {
    if (typeof onChangeTab === 'function') {
      onChangeTab(tab);
    } else if (typeof onSelectTab === 'function') {
      onSelectTab(tab);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none pb-[env(safe-area-inset-bottom,12px)] px-4 mb-2">
      <nav
        aria-label={t('tabs.navAria')}
        className="pointer-events-auto w-full max-w-md mx-auto bg-white/95 backdrop-blur-xl border border-slate-100 shadow-[0_12px_40px_rgba(0,0,0,0.08)] rounded-full px-3 py-1.5"
      >
        <div className="h-14 flex items-center justify-around">
          {/* Tab 1: Home */}
          <button
            id="nav-tab-home"
            type="button"
            onClick={() => handleTabChange('home')}
            className={`flex-1 flex flex-col items-center justify-center py-1 rounded-full cursor-pointer transition-all duration-150 active:scale-95 touch-manipulation ${
              activeTab === 'home'
                ? 'text-[#3F76C5] bg-[#3F76C5]/10'
                : 'text-slate-400 hover:text-[#3F76C5]'
            }`}
            aria-label={t('tabs.homeAria')}
          >
            <Home
              className={`w-5 h-5 transition-transform ${
                activeTab === 'home' ? 'stroke-[2.5] scale-110 text-[#3F76C5]' : 'stroke-[1.8]'
              }`}
            />
            {activeTab === 'home' ? (
              <span className="w-1 h-1 rounded-full bg-[#3F76C5] mt-1" />
            ) : (
              <span className="text-[10px] tracking-wider mt-0.5 font-semibold">
                {t('tabs.home')}
              </span>
            )}
          </button>

          {/* Tab 2: Calendar / Silo */}
          <button
            id="nav-tab-calendar"
            type="button"
            onClick={() => handleTabChange('calendar')}
            className={`flex-1 flex flex-col items-center justify-center py-1 rounded-full cursor-pointer transition-all duration-150 active:scale-95 touch-manipulation ${
              activeTab === 'calendar'
                ? 'text-[#3F76C5] bg-[#3F76C5]/10'
                : 'text-slate-400 hover:text-[#3F76C5]'
            }`}
            aria-label={t('tabs.siloAria')}
          >
            <Calendar
              className={`w-5 h-5 transition-transform ${
                activeTab === 'calendar' ? 'stroke-[2.5] scale-110 text-[#3F76C5]' : 'stroke-[1.8]'
              }`}
            />
            {activeTab === 'calendar' ? (
              <span className="w-1 h-1 rounded-full bg-[#3F76C5] mt-1" />
            ) : (
              <span className="text-[10px] tracking-wider mt-0.5 font-semibold">
                {t('tabs.silo')}
              </span>
            )}
          </button>

          {/* Elevated Center SCAN Button (Dark charcoal circular button matching reference image) */}
          <div className="flex-1 flex items-center justify-center -translate-y-2.5">
            <button
              id="nav-tab-scan"
              type="button"
              onClick={() => handleTabChange('scan')}
              className="w-12 h-12 bg-gradient-to-br from-[#3F76C5] to-[#0A2A52] hover:from-[#3566ac] hover:to-[#0d3560] rounded-full flex items-center justify-center shadow-[0_8px_22px_rgba(63,118,197,0.5)] border-2 border-white cursor-pointer transition-transform duration-150 active:scale-95 touch-manipulation focus:outline-hidden"
              aria-label={t('tabs.scanAria')}
            >
              <Scan className="w-5 h-5 text-white stroke-[2.2]" />
            </button>
          </div>

          {/* Tab 4: FLG */}
          <button
            id="nav-tab-flg"
            type="button"
            onClick={() => handleTabChange('flg')}
            className={`flex-1 flex flex-col items-center justify-center py-1 rounded-full cursor-pointer transition-all duration-150 active:scale-95 touch-manipulation ${
              activeTab === 'flg'
                ? 'text-[#3F76C5] bg-[#3F76C5]/10'
                : 'text-slate-400 hover:text-[#3F76C5]'
            }`}
            aria-label={t('tabs.directoryAria')}
          >
            <Briefcase
              className={`w-5 h-5 transition-transform ${
                activeTab === 'flg' ? 'stroke-[2.5] scale-110 text-[#3F76C5]' : 'stroke-[1.8]'
              }`}
            />
            {activeTab === 'flg' ? (
              <span className="w-1 h-1 rounded-full bg-[#3F76C5] mt-1" />
            ) : (
              <span className="text-[10px] tracking-wider mt-0.5 font-semibold">
                {t('tabs.directory')}
              </span>
            )}
          </button>

          {/* Tab 5: Profile */}
          <button
            id="nav-tab-profile"
            type="button"
            onClick={() => handleTabChange('profile')}
            className={`flex-1 flex flex-col items-center justify-center py-1 rounded-full cursor-pointer transition-all duration-150 active:scale-95 touch-manipulation ${
              activeTab === 'profile'
                ? 'text-[#3F76C5] bg-[#3F76C5]/10'
                : 'text-slate-400 hover:text-[#3F76C5]'
            }`}
            aria-label={t('tabs.profileAria')}
          >
            <User
              className={`w-5 h-5 transition-transform ${
                activeTab === 'profile' ? 'stroke-[2.5] scale-110 text-[#3F76C5]' : 'stroke-[1.8]'
              }`}
            />
            {activeTab === 'profile' ? (
              <span className="w-1 h-1 rounded-full bg-[#3F76C5] mt-1" />
            ) : (
              <span className="text-[10px] tracking-wider mt-0.5 font-semibold">
                {t('tabs.profile')}
              </span>
            )}
          </button>
        </div>
      </nav>
    </div>
  );
};
