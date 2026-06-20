import React from 'react';
import { Navbar } from '@/components/careers/Navbar';
import { Footer } from '@/components/careers/Footer';
import { ToastProvider } from '@/components/ui/toast-provider';

export default function CareersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-brand-bg text-[#F5F5F5] font-sans">
      <Navbar />
      <main className="flex-1 flex flex-col">{children}</main>
      <Footer />
      <ToastProvider />
    </div>
  );
}
