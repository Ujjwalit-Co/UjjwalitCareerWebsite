'use client';

import { Toaster } from 'react-hot-toast';

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#0B1D3F',
          color: '#F1F5F9',
          border: '1px solid rgba(255,255,255,0.08)',
        },
      }}
    />
  );
}
