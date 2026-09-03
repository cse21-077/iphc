import React from 'react';
import { AnnouncementNotification } from '../types';
import { Bell, X, CheckCheck } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <Bell className="w-5 h-5 text-[#181D20] stroke-[2.2]" />
            <div>
              <h3 className="text-base font-black text-[#181D20] tracking-tight">Announcements</h3>
              <p className="text-[11px] text-slate-400 font-medium">Official church notices</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onMarkAllRead}
              className="text-[11px] font-bold text-slate-600 hover:text-black flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 transition active:scale-95"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark read</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 transition"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications Feed */}
        <div className="mt-4 space-y-3 overflow-y-auto flex-1 pr-1">
          {notifications.map((n) => {
            const isImportant = n.priority === 'urgent' || n.scope === 'Church-wide';
            return (
              <div
                key={n.id}
                onClick={() => onNotificationClick && onNotificationClick(n)}
                className={`p-4 rounded-[22px] transition cursor-pointer border ${
                  isImportant
                    ? 'bg-amber-400 border-amber-500 text-slate-950 shadow-md'
                    : n.isRead
                    ? 'bg-slate-50/70 border-slate-200/60'
                    : 'bg-white border-slate-900/20 shadow-xs ring-1 ring-slate-900/5'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    {!n.isRead && (
                      <span className={`w-2 h-2 rounded-full shrink-0 ${isImportant ? 'bg-slate-950' : 'bg-[#D13138]'}`} />
                    )}
                    <span className={`text-[10px] font-extrabold uppercase tracking-wider ${isImportant ? 'text-slate-900' : 'text-slate-400'}`}>
                      {n.scope} {isImportant && '• URGENT'}
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold ${isImportant ? 'text-slate-800' : 'text-slate-400'}`}>
                    {n.date}
                  </span>
                </div>

                <h4 className={`text-xs font-black leading-snug ${isImportant ? 'text-slate-950' : 'text-[#181D20]'}`}>
                  {n.title}
                </h4>
                <p className={`text-xs mt-1 leading-relaxed ${isImportant ? 'text-slate-900 font-semibold' : 'text-slate-600'}`}>
                  {n.body}
                </p>
              </div>
            );
          })}
        </div>

        {/* Footer Close */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-full bg-[#181D20] text-white font-bold text-xs hover:bg-black transition shadow-xs active:scale-98"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
