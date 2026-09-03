import React from 'react';
import { AnnouncementNotification } from '../types';
import { Bell, X, CheckCheck, Megaphone, Calendar, ShieldAlert } from 'lucide-react';

interface NotificationsModalProps {
  notifications: AnnouncementNotification[];
  isOpen: boolean;
  onClose: () => void;
  onMarkAllRead: () => void;
  onNotificationClick?: (notif: AnnouncementNotification) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  notifications,
  isOpen,
  onClose,
  onMarkAllRead,
  onNotificationClick,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-red-50 text-[#D13138]">
              <Bell className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Announcements</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onMarkAllRead}
              className="text-[11px] font-bold text-[#3F76C5] hover:underline flex items-center gap-1"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all read</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications Feed */}
        <div className="mt-3 space-y-3 overflow-y-auto flex-1 pr-1">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => onNotificationClick && onNotificationClick(n)}
              className={`p-4 rounded-2xl border transition ${
                n.isRead
                  ? 'bg-slate-50/60 border-slate-200/60'
                  : 'bg-white border-[#3F76C5]/30 shadow-xs ring-1 ring-[#3F76C5]/10'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${
                      n.scope === 'Church-wide'
                        ? 'bg-[#3F76C5]/10 text-[#3F76C5]'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {n.scope}
                  </span>
                  {!n.isRead && (
                    <span className="w-2 h-2 rounded-full bg-[#D13138]" />
                  )}
                </div>
                <span className="text-[10px] font-semibold text-slate-400">
                  {n.date}
                </span>
              </div>

              <h4 className="text-xs font-bold text-slate-900 mt-1.5 leading-snug">
                {n.title}
              </h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {n.body}
              </p>
            </div>
          ))}
        </div>

        {/* Close */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition"
          >
            Close Feed
          </button>
        </div>
      </div>
    </div>
  );
};
