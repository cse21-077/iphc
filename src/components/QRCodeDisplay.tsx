import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  className?: string;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  value,
  size = 200,
  className = '',
}) => {
  return (
    <QRCodeSVG
      value={value}
      size={size}
      level="H"
      includeMargin
      bgColor="#ffffff"
      fgColor="#0F172A"
      className={`rounded-xl shadow-xs ${className}`}
      title="IPHC membership QR code"
    />
  );
};
