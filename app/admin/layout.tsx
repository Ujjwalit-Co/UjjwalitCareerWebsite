'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  LayoutDashboard,
  FolderKanban,
  BriefcaseBusiness,
  Users,
  BarChart3,
  LogOut,
  Menu,
  X,
  LayoutTemplate,
  TextQuote,
  Mail,
  PanelLeftClose,
  PanelLeftOpen,
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
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem('admin_sidebar_collapsed');
    if (saved === '1') setCollapsed(true);
  }, []);

  const toggleCollapsed = () => {
    setCollapsed(prev => {
      const next = !prev;
      window.localStorage.setItem('admin_sidebar_collapsed', next ? '1' : '0');
      return next;
    });
  };

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
    { name: 'Dashboard', href: '/admin/dashboard', icon: <LayoutDashboard size={18} /> },
    { name: 'Programmes', href: '/admin/dashboard/programmes', icon: <FolderKanban size={18} /> },
    { name: 'Opportunities', href: '/admin/dashboard/opportunities', icon: <BriefcaseBusiness size={18} /> },
    { name: 'Students', href: '/admin/dashboard/students', icon: <Users size={18} /> },
    { name: 'Analytics', href: '/admin/dashboard/analytics', icon: <BarChart3 size={18} /> },
  ];

  const configNav: SidebarItem[] = [
    { name: 'Templates', href: '/admin/dashboard/templates', icon: <LayoutTemplate size={14} /> },
    { name: 'Statements', href: '/admin/dashboard/statements', icon: <TextQuote size={14} /> },
    { name: 'Emails', href: '/admin/dashboard/emails', icon: <Mail size={14} /> },
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

  const isItemActive = (item: SidebarItem) =>
    pathname === item.href
    || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href) && !item.href.includes('templates') && !item.href.includes('statements') && !item.href.includes('emails'))
    || (item.href === '/admin/dashboard/programmes' && pathname.startsWith('/admin/dashboard/programme/'));

  const renderNavLink = (item: SidebarItem, mobile: boolean = false) => {
    const isActive = isItemActive(item);
    const linkClass = `flex items-center gap-3 rounded-lg text-sm font-medium transition-all ${
      collapsed && !mobile ? 'justify-center px-0 w-full' : 'px-4'
    } ${
      isActive
        ? 'bg-brand-orange/15 text-brand-orange border border-brand-orange/10 font-bold'
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
    } ${collapsed && !mobile ? 'py-3' : 'py-3'}`;

    return (
      <Link
        key={item.name}
        href={item.href}
        onClick={() => mobile && setIsMobileOpen(false)}
        className={`${linkClass} relative group`}
        title={collapsed && !mobile ? item.name : undefined}
      >
        <span className="shrink-0">{item.icon}</span>
        {(!collapsed || mobile) && <span className="truncate">{item.name}</span>}

        {/* Hover flyout when collapsed */}
        {collapsed && !mobile && (
          <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50 rounded-md border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs font-semibold text-slate-200 opacity-0 whitespace-nowrap shadow-2xl group-hover:opacity-100 transition-opacity">
            {item.name}
          </span>
        )}
      </Link>
    );
  };

  const renderConfigLink = (item: SidebarItem, mobile: boolean = false) => {
    const isActive = pathname.startsWith(item.href);
    const linkClass = `flex items-center gap-3 rounded-lg text-xs font-medium transition-all ${
      collapsed && !mobile ? 'justify-center px-0 w-full' : 'px-4'
    } ${
      isActive
        ? 'bg-slate-900 text-slate-100 border border-slate-800'
        : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/30'
    } ${collapsed && !mobile ? 'py-2.5' : 'py-2'}`;

    return (
      <Link
        key={item.name}
        href={item.href}
        onClick={() => mobile && setIsMobileOpen(false)}
        className={`${linkClass} relative group`}
        title={collapsed && !mobile ? item.name : undefined}
      >
        <span className="shrink-0">{item.icon}</span>
        {(!collapsed || mobile) && <span className="truncate">{item.name}</span>}

        {collapsed && !mobile && (
          <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50 rounded-md border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs font-semibold text-slate-200 opacity-0 whitespace-nowrap shadow-2xl group-hover:opacity-100 transition-opacity">
            {item.name}
          </span>
        )}
      </Link>
    );
  };

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 font-sans">
      {/* Sidebar for Desktop */}
      <aside className={`hidden md:flex flex-col ${collapsed ? 'w-16' : 'w-64'} bg-slate-950 border-r border-slate-900 shrink-0 transition-all duration-300`}>
        <div className={`h-16 flex items-center border-b border-slate-900 bg-slate-950/40 ${collapsed ? 'justify-center' : 'gap-2.5 px-6'}`}>
          {collapsed ? (
            <span className="relative h-8 w-8 overflow-hidden rounded bg-white shadow-sm">
              <Image src="/ujjwalitlogo.png" alt="Ujjwalit" fill className="object-contain p-0.5" sizes="32px" />
            </span>
          ) : (
            <>
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
            </>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={toggleCollapsed}
          className={`flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer border-b border-slate-900 ${collapsed ? 'justify-center py-3' : 'px-6 py-3'}`}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <><PanelLeftClose size={14} /> Collapse</>}
        </button>

        <div className="flex-1 flex flex-col justify-between overflow-y-auto">
          <div className={`py-6 space-y-6 ${collapsed ? 'px-3' : 'px-4'}`}>
            <div className="space-y-1">
              {navigation.map((item) => renderNavLink(item))}
            </div>

            <div className="space-y-2">
              {!collapsed && (
                <span className="px-4 text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Settings
                </span>
              )}
              <div className="space-y-1">
                {configNav.map((item) => renderConfigLink(item))}
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-slate-900">
            <button
              onClick={handleSignOut}
              className={`flex items-center gap-3 w-full rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/5 border border-transparent hover:border-red-500/10 transition-all cursor-pointer ${collapsed ? 'justify-center px-0 py-3' : 'px-4 py-3'}`}
              title={collapsed ? 'Sign Out' : undefined}
            >
              <LogOut size={18} />
              {!collapsed && <span>Sign Out</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />
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

            <nav className="flex-1 space-y-4">
              <div className="space-y-1">
                {navigation.map((item) => renderNavLink(item, true))}
              </div>

              <div className="space-y-1 pt-2">
                <span className="px-4 text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Settings
                </span>
                {configNav.map((item) => renderConfigLink(item, true))}
              </div>
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