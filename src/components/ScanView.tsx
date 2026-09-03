import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Flashlight,
  FlashlightOff,
  QrCode,
  MapPin,
  Clock,
  ArrowLeft,
  UserCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { MemberProfile, AttendanceRecord } from '../types';
import { QRCodeDisplay } from './QRCodeDisplay';

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
  const [scanMode, setScanMode] = useState<'self_camera' | 'usher_show'>('self_camera');
  const [cameraActive, setCameraActive] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  // Success Confirmation state
  const [successRecord, setSuccessRecord] = useState<AttendanceRecord | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize camera when in self_camera mode
  useEffect(() => {
    let active = true;

    async function setupCamera() {
      if (scanMode !== 'self_camera') {
        stopCamera();
        return;
      }

      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setHasCameraPermission(false);
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });

        if (active) {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play();
          }
          setCameraActive(true);
          setHasCameraPermission(true);
        }
      } catch (err) {
        console.warn('Camera access not granted or unavailable:', err);
        if (active) {
          setHasCameraPermission(false);
          setCameraActive(false);
        }
      }
    }

    setupCamera();

    return () => {
      active = false;
      stopCamera();
    };
  }, [scanMode]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const toggleTorch = () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track && 'applyConstraints' in track) {
      const newTorch = !torchOn;
      (track as any)
        .applyConstraints({
          advanced: [{ torch: newTorch }],
        })
        .then(() => setTorchOn(newTorch))
        .catch(() => setTorchOn(newTorch));
    } else {
      setTorchOn(!torchOn);
    }
  };

  // Perform a simulated or verified QR check-in
  const handleTriggerScan = (presetVenue = 'Entrance Gate A — Zuurbekom Silo', seatNumber = 'Block C, Row 12') => {
    setIsScanning(true);
    setScanProgress(0);

    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          finishScan(presetVenue, seatNumber);
          return 100;
        }
        return prev + 25;
      });
    }, 120);
  };

  const finishScan = (venue: string, seat: string) => {
    setIsScanning(false);
    setScanProgress(100);

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toISOString().split('T')[0];

    const newRecord: AttendanceRecord = {
      id: `att_${Date.now()}`,
      date: dateStr,
      time: timeStr,
      serviceName: 'Sabbath Morning Service',
      branch: venue,
      method: scanMode === 'self_camera' ? 'self_qr' : 'usher_scan',
      seatNumber: seat,
      verificationCode: `ATT-ZB-${Math.floor(10000 + Math.random() * 90000)}`,
    };

    setSuccessRecord(newRecord);
    onRecordAttendance(newRecord);

    // Fire celebratory confetti for unmistakable confirmation
    try {
      confetti({
        particleCount: 75,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3F76C5', '#D13138', '#10B981', '#F59E0B'],
      });
    } catch {
      // Ignore if canvas-confetti unsupported
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col pb-20 max-w-md mx-auto">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
        <button
          onClick={onBackToHome}
          className="flex items-center gap-1 text-[#6B7280] hover:text-[#1A1A1A] text-sm font-semibold p-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Home</span>
        </button>

        <h2 className="text-base font-bold text-[#1A1A1A]">Church Check-In</h2>

        <button
          onClick={onViewHistory}
          className="text-xs font-bold text-[#3F76C5] hover:underline"
        >
          My History
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
            <span>Scan Seat / Venue QR</span>
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
            <span>Show QR to Usher</span>
          </button>
        </div>
      </div>

      {/* Mode 1: Self Camera Scanner View (Inspired by Reference Image 2) */}
      {scanMode === 'self_camera' && !successRecord && (
        <div className="flex-1 flex flex-col items-center justify-between p-4">
          <div className="w-full text-center my-2">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              Self-Service Check-In
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Point your camera at the QR code posted at your entrance gate or seat.
            </p>
          </div>

          {/* Camera Frame Viewport */}
          <div className="relative w-full max-w-[320px] aspect-square rounded-3xl overflow-hidden bg-slate-950 shadow-2xl border-4 border-slate-200/60 flex items-center justify-center">
            {/* Real video feed or simulated camera background */}
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
                <p className="text-xs font-medium text-slate-300">
                  {hasCameraPermission === false
                    ? 'Camera permission not granted'
                    : 'Opening camera sensor...'}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Use the quick test buttons below to simulate instant check-in.
                </p>
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

            {/* Torch Toggle inside camera view */}
            <button
              onClick={toggleTorch}
              className={`absolute top-4 right-4 p-2.5 rounded-full backdrop-blur-md transition ${
                torchOn
                  ? 'bg-amber-400 text-slate-900 shadow-md'
                  : 'bg-black/40 text-white hover:bg-black/60'
              }`}
              title="Toggle Flashlight"
            >
              {torchOn ? <Flashlight className="w-4 h-4" /> : <FlashlightOff className="w-4 h-4" />}
            </button>

            {/* Scanning Progress Overlay if active */}
            {isScanning && (
              <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center text-white">
                <div className="relative w-16 h-16 mb-2 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full border-4 border-white/20 border-t-[#D13138] animate-spin" />
                  <span className="absolute text-xs font-bold">{scanProgress}%</span>
                </div>
                <p className="text-xs font-semibold tracking-wide uppercase text-blue-200">
                  Verifying Church Token...
                </p>
              </div>
            )}
          </div>

          {/* Quick Simulation Actions (Guarantees smooth demo on any device) */}
          <div className="w-full mt-4 space-y-2.5">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center">
              Available Test QR Codes:
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                id="btn-scan-entrance-test"
                onClick={() => handleTriggerScan('Entrance Gate 1 (Banna Section)', 'Gate 1 Fast Pass')}
                disabled={isScanning}
                className="flex items-center justify-center gap-1.5 py-3 px-3 rounded-2xl bg-[#3F76C5] text-white text-xs font-bold hover:bg-[#3465a8] transition shadow-md shadow-blue-500/20 active:scale-98"
              >
                <QrCode className="w-4 h-4" />
                <span>Scan Entrance QR</span>
              </button>

              <button
                id="btn-scan-seat-test"
                onClick={() => handleTriggerScan('Zuurbekom Silo Tabernacle', 'Seat Row 14, Block C')}
                disabled={isScanning}
                className="flex items-center justify-center gap-1.5 py-3 px-3 rounded-2xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition shadow-md active:scale-98"
              >
                <QrCode className="w-4 h-4 text-[#D13138]" />
                <span>Scan Seat QR</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mode 2: Show Member QR to Usher View */}
      {scanMode === 'usher_show' && !successRecord && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-full max-w-xs bg-white rounded-3xl p-6 shadow-xl border border-slate-200/80">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D13138]/10 text-[#D13138] text-xs font-bold mb-3">
              <QrCode className="w-3.5 h-3.5" />
              <span>Usher Attendance Scan</span>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Hold this QR code steady in front of the usher scanner console at the entrance.
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

            {/* Simulate Usher Scanning Member */}
            <button
              onClick={() => handleTriggerScan('Usher Gate Scanner — Silo', 'Verified Member Entry')}
              disabled={isScanning}
              className="mt-5 w-full py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition shadow-md active:scale-98"
            >
              Simulate Usher Scanning Pass ✓
            </button>
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
              Checked in ✓
            </h3>
            <p className="text-sm font-semibold text-emerald-700 mt-1">
              {successRecord.serviceName}
            </p>

            {/* Attendance Confirmation Details Box */}
            <div className="mt-5 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2.5 text-xs text-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Time Recorded</span>
                </span>
                <span className="font-bold text-slate-900">{successRecord.time}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>Location</span>
                </span>
                <span className="font-bold text-slate-900 truncate max-w-[170px] text-right">
                  {successRecord.branch}
                </span>
              </div>

              {successRecord.seatNumber && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Seat / Gate</span>
                  <span className="font-semibold text-[#3F76C5]">{successRecord.seatNumber}</span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-mono text-[11px]">
                <span className="text-slate-400">Ref Code</span>
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
                Done — Return to Home
              </button>

              <button
                onClick={onViewHistory}
                className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200 transition"
              >
                View Attendance Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
