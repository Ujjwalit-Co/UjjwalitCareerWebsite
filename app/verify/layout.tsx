import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ToastProvider } from '@/components/ui/toast-provider';

export const dynamic = 'force-dynamic';

export default function VerifyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-brand-bg text-[#F5F5F5] font-sans">
      <header className="border-b border-brand-border bg-brand-bg">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/careers" className="flex items-center gap-3">
            <span className="relative h-9 w-9">
              <Image src="/ujjwalitlogo.png" alt="Ujjwalit" fill className="object-contain" sizes="36px" />
            </span>
            <span>
              <span className="block text-sm font-extrabold tracking-tight">UJJWALIT</span>
              <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-brand-orange">Registry</span>
            </span>
          </Link>
          <div className="hidden font-mono text-[11px] uppercase tracking-[0.16em] text-[#A1A1AA] sm:block">Secure Certificate Verification</div>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        {children}
      </main>

      <footer className="border-t border-brand-border py-5 text-center font-mono text-[11px] text-[#71717A]">
        Ujjwalit Technologies Registry Verification
      </footer>
      <ToastProvider />
    </div>
  );
}
