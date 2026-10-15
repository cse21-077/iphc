import React from 'react';
import { ArrowLeft, CheckCircle, Calendar, Clock, MapPin, QrCode, UserCheck, RefreshCw } from 'lucide-react';
import { AttendanceRecord } from '../types';

interface AttendanceViewProps {
  records: AttendanceRecord[];
  error?: string;
  onRefresh: () => Promise<void>;
  onBack: () => void;
  onScanNow: () => void;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  records,
  error,
  onRefresh,
  onBack,
  onScanNow,
}) => {
  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col pb-20 max-w-md mx-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-100">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-slate-600 hover:text-slate-900 text-sm font-semibold p-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <h2 className="text-base font-bold text-slate-900">Attendance History</h2>

        <div className="w-12" />
      </div>

      {/* Summary Banner */}
      <div className="p-4 bg-slate-50 border-b border-slate-200/60 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-slate-500 font-medium">Services Attended</p>
          <p className="text-xl font-extrabold text-slate-900">{records.length} Services</p>
          <p className="mt-1 text-[10px] text-slate-500">Updates automatically while this page is open.</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => void onRefresh()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
            aria-label="Refresh attendance history"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        <button
          onClick={onScanNow}
          className="px-3.5 py-2 rounded-xl bg-[#D13138] text-white text-xs font-bold shadow-xs hover:bg-[#b8262d] transition active:scale-95"
        >
          + Check In Today
        </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="mx-4 mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
          Attendance history could not be verified: {error}
        </p>
      )}

      {/* Simple History List (Most recent first) */}
      <div className="p-4 space-y-3">
        {records.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-slate-500">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-slate-700">No attendance recorded yet</p>
            <p className="text-xs text-slate-500 mt-1">Tap the SCAN button to check in at service.</p>
          </div>
        ) : (
          records.map((rec) => (
            <div
              key={rec.id}
              className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 flex items-start gap-3.5 hover:border-slate-300 transition"
            >
              {/* Status icon badge */}
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <CheckCircle className="w-5 h-5 stroke-[2.4]" />
              </div>

              {/* Attendance Details */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-extrabold text-[#1A1A1A] truncate">
                    {rec.serviceName}
                  </h4>
                  <span className="text-[11px] font-bold text-[#6B7280]">
                    {rec.date}
                  </span>
                </div>

                <p className="text-xs text-[#4A4A4A] flex items-center gap-1 mt-1 truncate font-medium">
                  <MapPin className="w-3 h-3 text-[#6B7280] shrink-0" />
                  <span>{rec.branch}</span>
                </p>

                <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-[#6B7280]">
                  <span className="flex items-center gap-1 font-medium">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span>{rec.time}</span>
                  </span>

                  <span className="inline-flex items-center gap-1 font-bold text-[#1A1A1A]">
                    {rec.method === 'self_qr' ? (
                      <>
                        <QrCode className="w-3 h-3 text-[#3F76C5]" />
                        <span>Self QR</span>
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-3 h-3 text-[#D13138]" />
                        <span>Usher Scan</span>
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
