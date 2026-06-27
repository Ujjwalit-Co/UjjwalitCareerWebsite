'use client';

import React, { useCallback, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowRight, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const scrollToPrograms = useCallback(() => {
    const el = document.getElementById('programs');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      router.push('/careers#programs');
    }
  }, [router]);

  const links = [
    { href: '#programs', label: 'Programs' },
    { href: '#events', label: 'Events' },
    { href: '#verification', label: 'Verification' },
    { href: '#about', label: 'About' },
  ];

  const getHref = (href: string) => {
    if (pathname === '/careers' || pathname === '/careers/') return href;
    return `/careers${href}`;
  };

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-brand-border bg-brand-bg/88 backdrop-blur-md">
      <nav className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/careers" className="flex items-center gap-3" aria-label="Ujjwalit Developers Program home">
          <span className="relative h-9 w-9 flex-shrink-0">
            <Image src="/ujjwalitlogo.png" alt="Ujjwalit" fill className="object-contain" sizes="36px" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-sm font-extrabold tracking-tight text-[#F5F5F5]">UJJWALIT</span>
            <span className="mt-1 font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-brand-orange">Developers Program</span>
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <Link key={link.label} href={getHref(link.href)} className="text-sm font-semibold text-[#A1A1AA] transition-colors hover:text-[#F5F5F5]">
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:block">
          <Button size="sm" className="gap-2" onClick={scrollToPrograms}>
            Apply Now <ArrowRight size={15} />
          </Button>
        </div>

        <button
          onClick={() => setIsOpen((value) => !value)}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-brand-border text-[#F5F5F5] md:hidden"
          aria-label="Toggle navigation menu"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {isOpen && (
        <div className="border-t border-brand-border bg-brand-bg px-4 py-4 md:hidden">
          <div className="flex flex-col gap-2">
            {links.map((link) => (
              <Link
                key={link.label}
                href={getHref(link.href)}
                onClick={() => setIsOpen(false)}
                className="rounded-lg px-3 py-3 text-sm font-semibold text-[#F5F5F5] hover:bg-brand-surface"
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2">
              <Button className="w-full gap-2" onClick={() => { setIsOpen(false); scrollToPrograms(); }}>
                Apply Now <ArrowRight size={15} />
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
