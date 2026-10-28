import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { IScannerControls } from '@zxing/browser';
import {
  Camera,
  CheckCircle2,
  QrCode,
  MapPin,
  Clock,
  ArrowLeft,
  UserCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { MemberProfile, AttendanceRecord } from '../types';
import { QRCodeDisplay } from './QRCodeDisplay';
import { EVENT_QR_PREFIX, MemberAttendance, recordMemberCheckIn } from '../api';
import { useTranslation } from '../data/i18n';

interface ScanViewProps {
  member: MemberProfile;
  onRecordAttendance: (record: AttendanceRecord) => void;
  onBackToHome: () => void;
  onViewHistory: () => void;
}

export const ScanView: React.FC<ScanViewProps> = ({
  member,
  onRecordAttendance,
  onBackToHome,
  onViewHistory,
}) => {
  const { t } = useTranslation();
  const [scanMode, setScanMode] = useState<'self_camera' | 'usher_show'>('self_camera');
  const [cameraActive, setCameraActive] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState('');

  const [successRecord, setSuccessRecord] = useState<AttendanceRecord | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const makeAttendanceRecord = (attendance: MemberAttendance): AttendanceRecord => {
    const checkedInAt = new Date(attendance.checkedInAt);
    return {
      id: attendance.attendanceId,
      date: checkedInAt.toISOString().slice(0, 10),
      time: checkedInAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      serviceName: attendance.eventName,
      branch: `${attendance.branch} · ${attendance.location}`,
      method: attendance.method,
      verificationCode: `ATT-${attendance.attendanceId.slice(0, 8).toUpperCase()}`,
    };
  };

  const handleScannedCode = useCallback(async (value: string) => {
    setScanError('');
    if (!value.startsWith(EVENT_QR_PREFIX)) {
      setScanError(t('scan.invalidCode'));
      return;
    }

    const eventId = value.slice(EVENT_QR_PREFIX.length).trim();
    try {
      setIsScanning(true);
      const attendance = await recordMemberCheckIn(eventId);
      const record = makeAttendanceRecord(attendance);
      setSuccessRecord(record);
      onRecordAttendance(record);
      confetti({
        particleCount: 75,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3F76C5', '#D13138', '#10B981', '#F59E0B'],
      });
    } catch (error) {
      setScanError(error instanceof Error ? error.message : t('common.errorGeneric'));
    } finally {
      setIsScanning(false);
    }
  }, [onRecordAttendance]);

  useEffect(() => {
    if (!cameraActive || scanMode !== 'self_camera' || member.isPending) return;
    let active = true;
    let detected = false;
    let controls: IScannerControls | null = null;

    const startScanner = async () => {
      try {
        const { BrowserQRCodeReader } = await import('@zxing/browser');
        if (!active || !videoRef.current) return;
        const reader = new BrowserQRCodeReader();
        controls = await reader.decodeFromVideoDevice(undefined, videoRef.current, (result, _error, scanControls) => {
          if (!active || detected || !result) return;
          detected = true;
          scanControls.stop();
          setCameraActive(false);
          void handleScannedCode(result.getText().trim());
        });
        if (!active || detected) controls.stop();
      } catch (error) {
        if (!active) return;
        setCameraActive(false);
        setScanError(error instanceof Error && error.name === 'NotAllowedError'
          ? t('scan.cameraBlocked')
          : t('scan.cameraStartFailed'));
      }
    };

    void startScanner();
    return () => {
      active = false;
      controls?.stop();
    };
  }, [cameraActive, handleScannedCode, member.isPending, scanMode]);

  useEffect(() => {
    if (scanMode !== 'self_camera') setCameraActive(false);
  }, [scanMode]);

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col pb-20 max-w-md mx-auto">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
        <button
          onClick={onBackToHome}
          className="flex items-center gap-1 text-[#6B7280] hover:text-[#1A1A1A] text-sm font-semibold p-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('tabs.home')}</span>
        </button>

        <h2 className="text-base font-bold text-[#1A1A1A]">{t('scan.title')}</h2>

        <button
          onClick={onViewHistory}
          className="text-xs font-bold text-[#3F76C5] hover:underline"
        >
          {t('scan.history')}
        </button>
      </div>

      {/* Mode Selector Pill: Self-Service vs Usher Scanning */}
      <div className="p-4 bg-[#F8F9FA] border-b border-gray-100">
        <div className="flex rounded-xl bg-[#F3F4F6] p-1">
          <button
            id="scan-mode-self"
            onClick={() => setScanMode('self_camera')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              scanMode === 'self_camera'
                ? 'bg-[#3F76C5] text-white shadow-xs'
                : 'text-[#6B7280] hover:text-[#1A1A1A]'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>{t('scan.scanEvent')}</span>
          </button>

          <button
            id="scan-mode-usher"
            onClick={() => setScanMode('usher_show')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              scanMode === 'usher_show'
                ? 'bg-[#D13138] text-white shadow-xs'
                : 'text-[#6B7280] hover:text-[#1A1A1A]'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>{t('scan.showQrUsher')}</span>
          </button>
        </div>
      </div>

      {/* Mode 1: Self Camera Scanner View (Inspired by Reference Image 2) */}
      {scanMode === 'self_camera' && !successRecord && (
        <div className="flex-1 flex flex-col items-center justify-between p-4">
          <div className="w-full text-center my-2">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              {t('scan.selfServiceTitle')}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {t('scan.instruction')}
            </p>
          </div>

          {/* Camera Frame Viewport */}
          <div className="relative w-full max-w-[320px] aspect-square rounded-3xl overflow-hidden bg-slate-950 shadow-2xl border-4 border-slate-200/60 flex items-center justify-center">
            {cameraActive ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="relative w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-400 p-6 text-center">
                <Camera className="w-10 h-10 text-slate-400 mb-3" />
                <p className="text-xs font-medium text-slate-300">{t('scan.cameraStopped')}</p>
                <p className="text-[11px] text-slate-500 mt-1">{t('scan.cameraHint')}</p>
              </div>
            )}

            {/* Viewfinder Target Reticle Overlay (Reference Image 2 style) */}
            <div className="absolute inset-8 pointer-events-none border border-white/20 rounded-2xl flex flex-col justify-between p-2">
              {/* Four bright reticle corners */}
              <div className="flex justify-between">
                <div className="w-8 h-8 border-t-4 border-l-4 border-[#3F76C5] rounded-tl-xl shadow-sm" />
                <div className="w-8 h-8 border-t-4 border-r-4 border-[#3F76C5] rounded-tr-xl shadow-sm" />
              </div>

              {/* Animated Laser Scanning Beam */}
              <div className="relative w-full h-0.5 bg-gradient-to-r from-transparent via-[#D13138] to-transparent animate-scan shadow-[0_0_12px_#D13138]" />

              <div className="flex justify-between">
                <div className="w-8 h-8 border-b-4 border-l-4 border-[#3F76C5] rounded-bl-xl shadow-sm" />
                <div className="w-8 h-8 border-b-4 border-r-4 border-[#3F76C5] rounded-br-xl shadow-sm" />
              </div>
            </div>

            {isScanning && (
              <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center text-white">
                <div className="w-12 h-12 rounded-full border-4 border-white/20 border-t-[#D13138] animate-spin mb-3" />
                <p className="text-xs font-semibold tracking-wide uppercase text-blue-200">{t('scan.validating')}</p>
              </div>
            )}
          </div>

          <div className="w-full mt-4 space-y-2.5">
            {scanError && (
              <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
                {scanError}
              </p>
            )}
            {member.isPending ? (
              <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-900">
                {t('scan.pendingApproval')}
              </p>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setScanError('');
                  setCameraActive((active) => !active);
                }}
                disabled={isScanning}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#3F76C5] px-4 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#3465a8] disabled:opacity-50"
              >
                <Camera className="h-4 w-4" />
                {cameraActive ? t('scan.stopCamera') : t('scan.startCamera')}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Mode 2: Show Member QR to Usher View */}
      {scanMode === 'usher_show' && !successRecord && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-full max-w-xs bg-white rounded-3xl p-6 shadow-xl border border-slate-200/80">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D13138]/10 text-[#D13138] text-xs font-bold mb-3">
              <QrCode className="w-3.5 h-3.5" />
              <span>{t('scan.usherScanBadge')}</span>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              {t('scan.usherHoldSteady')}
            </p>

            <div className="p-4 bg-slate-50 rounded-2xl border-2 border-slate-200 mx-auto w-fit shadow-inner">
              <QRCodeDisplay value={member.qrToken} size={200} />
            </div>

            <div className="mt-4">
              <h4 className="font-extrabold text-slate-900 text-base">
                {member.title} {member.name}
              </h4>
              <p className="text-xs font-mono font-bold text-slate-500 mt-0.5">
                {member.membershipNumber}
              </p>
              <p className="text-[11px] text-[#3F76C5] font-semibold mt-1">
                {member.section}
              </p>
            </div>

            <p className="mt-5 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
              {t('scan.usherNote')}
            </p>
          </div>
        </div>
      )}

      {/* UNMISTAKABLE CONFIRMATION STATE (Per PRD Section 3.2 & Design Principle 3) */}
      {successRecord && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-200">
          <div className="w-full max-w-sm bg-white rounded-3xl p-7 shadow-2xl border-2 border-emerald-500/30">
            {/* Big Unmistakable Success Icon */}
            <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto mb-3 stroke-[2.2]" />

            <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
              {t('scan.success')}
            </h3>
            <p className="text-sm font-semibold text-emerald-700 mt-1">
              {successRecord.serviceName}
            </p>

            {/* Attendance Confirmation Details Box */}
            <div className="mt-5 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2.5 text-xs text-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{t('scan.timeRecorded')}</span>
                </span>
                <span className="font-bold text-slate-900">{successRecord.time}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{t('calendar.location')}</span>
                </span>
                <span className="font-bold text-slate-900 truncate max-w-[170px] text-right">
                  {successRecord.branch}
                </span>
              </div>

              {successRecord.seatNumber && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">{t('scan.seatGate')}</span>
                  <span className="font-semibold text-[#3F76C5]">{successRecord.seatNumber}</span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-mono text-[11px]">
                <span className="text-slate-400">{t('attendance.verificationCode')}</span>
                <span className="font-bold text-slate-600">{successRecord.verificationCode}</span>
              </div>
            </div>

            {/* Primary Action: Done or Back to Home */}
            <div className="mt-6 space-y-2.5">
              <button
                id="btn-done-checkin"
                onClick={onBackToHome}
                className="w-full py-3 rounded-2xl bg-[#3F76C5] text-white font-bold text-sm hover:bg-[#3262a4] transition active:scale-98 shadow-md shadow-blue-500/20"
              >
                {t('scan.doneReturnHome')}
              </button>

              <button
                onClick={onViewHistory}
                className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200 transition"
              >
                {t('scan.history')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
