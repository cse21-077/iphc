import React from 'react';
import { Bell, Smartphone, Monitor } from 'lucide-react';
import { useTranslation } from '../data/i18n';

interface HeaderProps {
  unreadCount: number;
  onOpenNotifications: () => void;
  onOpenProfile?: () => void;
  isFrameMode?: boolean;
  onToggleFrameMode?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  unreadCount,
  onOpenNotifications,
  onOpenProfile,
  isFrameMode = false,
  onToggleFrameMode,
}) => {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-100 transition-colors">
      <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-2.5">
          <div className="relative w-8 h-8 rounded-xl overflow-hidden border border-[#3F76C5]/25 bg-white flex items-center justify-center shadow-xs">
            <img
              src="/pwa-192x192.png"
              alt={t('common.iphcEmblem')}
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-tight text-[#0A2A52] leading-none">
                MMUSO
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold tracking-wider uppercase bg-[#0A2A52] text-white">
                IPHC
              </span>
            </div>
            <p className="text-[10px] font-medium text-[#6B7280] leading-tight mt-0.5 uppercase tracking-wider">
              Silo Zuurbekom
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-1.5">

          {/* Desktop Preview Frame Switcher (useful when testing in browser) */}
          <button
            onClick={onToggleFrameMode}
            className="hidden sm:flex p-2 rounded-xl text-[#6B7280] hover:text-[#1A1A1A] hover:bg-[#F3F4F6] transition"
            title={isFrameMode ? t('common.switchFullScreen') : t('common.switchPhoneFrame')}
            aria-label={t('common.togglePhoneFrame')}
          >
            {isFrameMode ? (
              <Monitor className="w-4 h-4 text-[#4A4A4A]" />
            ) : (
              <Smartphone className="w-4 h-4 text-[#3F76C5]" />
            )}
          </button>

          {/* Notifications Bell */}
          <button
            id="header-notifications-btn"
            onClick={onOpenNotifications}
            className="relative p-2 rounded-xl text-[#0A2A52] hover:bg-[#3F76C5]/10 hover:text-[#3F76C5] active:scale-95 transition"
            aria-label={t('notifications.title')}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#D13138] text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
