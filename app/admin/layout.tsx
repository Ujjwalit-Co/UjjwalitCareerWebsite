'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  LayoutDashboard,
  FileSpreadsheet,
  Users,
  CreditCard,
  FileText,
  Award,
  BriefcaseBusiness,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ToastProvider } from '@/components/ui/toast-provider';

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ReactNode;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user && !pathname.endsWith('/login')) {
        router.push('/admin/login');
      } else {
        setIsAdmin(true);
      }
    };
    checkAuth();
  }, [pathname, router]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success('Signed out successfully');
    router.refresh();
    router.push('/admin/login');
  };

  const navigation: SidebarItem[] = [
    { name: 'Overview', href: '/admin/dashboard', icon: <LayoutDashboard size={18} /> },
    { name: 'Applications', href: '/admin/dashboard/applications', icon: <FileSpreadsheet size={18} /> },
    { name: 'Opportunities', href: '/admin/dashboard/opportunities', icon: <BriefcaseBusiness size={18} /> },
    { name: 'Students', href: '/admin/dashboard/students', icon: <Users size={18} /> },
    { name: 'Payments', href: '/admin/dashboard/payments', icon: <CreditCard size={18} /> },
    { name: 'Documents', href: '/admin/dashboard/documents', icon: <FileText size={18} /> },
    { name: 'Certificates', href: '/admin/dashboard/certificates', icon: <Award size={18} /> },
  ];

  // If we are on the login page, don't show the sidebar or admin wrapper
  if (pathname.endsWith('/login')) {
    return <>{children}</>;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-brand-blue border-r-2"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 font-sans">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-950 border-r border-slate-900 shrink-0">
        <div className="h-16 flex items-center gap-2.5 px-6 border-b border-slate-900 bg-slate-950/40">
          <span className="relative h-8 w-8 overflow-hidden rounded bg-white shadow-sm">
            <Image src="/ujjwalitlogo.png" alt="Ujjwalit" fill className="object-contain p-0.5" sizes="32px" />
          </span>
          <div className="flex flex-col">
            <span className="font-display font-bold text-sm leading-tight tracking-wide text-slate-100">
              UJJWALIT
            </span>
            <span className="text-[9px] text-brand-orange font-semibold tracking-widest leading-none uppercase">
              ADMIN PANEL
            </span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-brand-orange/15 text-brand-orange border border-brand-orange/10 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                }`}
              >
                {item.icon}
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-900">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/5 border border-transparent hover:border-red-500/10 transition-all cursor-pointer"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />
          {/* Sidebar drawer */}
          <div className="relative flex flex-col w-64 bg-slate-950 border-r border-slate-900 h-full p-4 space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-900">
              <div className="flex items-center gap-2">
                <span className="relative h-8 w-8 overflow-hidden rounded bg-white shadow-sm">
                  <Image src="/ujjwalitlogo.png" alt="Ujjwalit" fill className="object-contain p-0.5" sizes="32px" />
                </span>
                <span className="font-display font-bold text-sm text-slate-100 uppercase tracking-wider">
                  Ujjwalit Admin
                </span>
              </div>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-brand-orange/15 text-brand-orange border border-brand-orange/10 font-bold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                    }`}
                  >
                    {item.icon}
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/5 border border-transparent hover:border-red-500/10 transition-all cursor-pointer"
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Mobile Header */}
        <header className="h-16 flex md:hidden items-center justify-between px-6 border-b border-slate-900 bg-slate-950">
          <div className="flex items-center gap-2.5">
            <span className="relative h-8 w-8 overflow-hidden rounded bg-white shadow-sm">
              <Image src="/ujjwalitlogo.png" alt="Ujjwalit" fill className="object-contain p-0.5" sizes="32px" />
            </span>
            <span className="font-display font-bold text-sm tracking-wide">Ujjwalit</span>
          </div>
          <button
            onClick={() => setIsMobileOpen(true)}
            className="text-slate-400 hover:text-white p-2 cursor-pointer"
          >
            <Menu size={24} />
          </button>
        </header>

        {/* Content Wrapper */}
        <main className="flex-1 p-6 md:p-8 lg:p-10 max-w-7xl w-full mx-auto space-y-8">
          {children}
        </main>
        <ToastProvider />
      </div>
    </div>
  );
}





