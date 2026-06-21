import type { Metadata } from 'next';
import './globals.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Ujjwalit Developers Program - Careers & Certificate Verification',
  description: 'Apply for Ujjwalit internship opportunities, register for student events, verify certificates, and manage credentials.',
  icons: {
    icon: [
      { url: '/ujjwalitlogo.png', type: 'image/png', sizes: 'any' },
    ],
    shortcut: [{ url: '/ujjwalitlogo.png', type: 'image/png' }],
    apple: [{ url: '/ujjwalitlogo.png', type: 'image/png', sizes: '180x180' }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-brand-bg text-[#F5F5F5] font-sans antialiased selection:bg-brand-blue selection:text-white">
        {children}
      </body>
    </html>
  );
}
