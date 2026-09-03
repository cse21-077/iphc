import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Lock pinch-zoom on mobile (iOS Safari ignores the viewport meta's
// user-scalable=no, so block the gesture events themselves).
const preventZoomGesture = (e: Event) => e.preventDefault();
document.addEventListener('gesturestart', preventZoomGesture, { passive: false });
document.addEventListener('gesturechange', preventZoomGesture, { passive: false });
document.addEventListener('gestureend', preventZoomGesture, { passive: false });

// Block double-tap zoom fallback on the document root.
let lastTouchEnd = 0;
document.addEventListener(
  'touchend',
  (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      e.preventDefault();
    }
    lastTouchEnd = now;
  },
  { passive: false }
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
