import React from 'react';

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  className?: string;
}

// Deterministic QR matrix visual generator based on value string
export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  value,
  size = 200,
  className = '',
}) => {
  // Generate a consistent 25x25 grid pattern representing a QR code
  const gridSize = 25;
  
  // Seeded pseudo-random from value string
  const getHash = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  };

  const seed = getHash(value);

  // Determine if a cell is dark
  const isCellDark = (r: number, c: number): boolean => {
    // Top-Left Position Detection Pattern (7x7)
    if (r < 7 && c < 7) {
      if (r === 0 || r === 6 || c === 0 || c === 6) return true;
      if (r >= 2 && r <= 4 && c >= 2 && c <= 4) return true;
      return false;
    }

    // Top-Right Position Detection Pattern (7x7)
    if (r < 7 && c >= gridSize - 7) {
      const col = c - (gridSize - 7);
      if (r === 0 || r === 6 || col === 0 || col === 6) return true;
      if (r >= 2 && r <= 4 && col >= 2 && col <= 4) return true;
      return false;
    }

    // Bottom-Left Position Detection Pattern (7x7)
    if (r >= gridSize - 7 && c < 7) {
      const row = r - (gridSize - 7);
      if (row === 0 || row === 6 || c === 0 || c === 6) return true;
      if (row >= 2 && row <= 4 && c >= 2 && c <= 4) return true;
      return false;
    }

    // Timing patterns
    if (r === 6 || c === 6) {
      return (r + c) % 2 === 0;
    }

    // Alignment pattern near bottom-right (center around 18, 18)
    if (Math.abs(r - 18) <= 2 && Math.abs(c - 18) <= 2) {
      if (Math.abs(r - 18) === 2 || Math.abs(c - 18) === 2) return true;
      if (r === 18 && c === 18) return true;
      return false;
    }

    // Data dots pseudo-randomized by hash and position
    const pseudo = (seed * 31 + r * 73 + c * 101) % 100;
    return pseudo > 46;
  };

  const cellSize = size / gridSize;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={`bg-white p-2 rounded-xl shadow-xs ${className}`}
    >
      <rect width={size} height={size} fill="#ffffff" />
      {Array.from({ length: gridSize }).map((_, r) =>
        Array.from({ length: gridSize }).map((_, c) => {
          if (!isCellDark(r, c)) return null;
          return (
            <rect
              key={`${r}-${c}`}
              x={c * cellSize}
              y={r * cellSize}
              width={cellSize + 0.2}
              height={cellSize + 0.2}
              fill="#0F172A"
              rx={cellSize * 0.15}
            />
          );
        })
      )}
      {/* Center IPHC Cross badge watermark */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={cellSize * 2.2}
        fill="#FFFFFF"
        stroke="#3F76C5"
        strokeWidth="1.5"
      />
      <rect
        x={size / 2 - cellSize * 0.4}
        y={size / 2 - cellSize * 1.4}
        width={cellSize * 0.8}
        height={cellSize * 2.8}
        fill="#D13138"
        rx="1"
      />
      <rect
        x={size / 2 - cellSize * 1.2}
        y={size / 2 - cellSize * 0.8}
        width={cellSize * 2.4}
        height={cellSize * 0.8}
        fill="#D13138"
        rx="1"
      />
    </svg>
  );
};
