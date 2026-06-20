'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Github, Globe, Instagram, Linkedin, Mail } from 'lucide-react';

export const Footer = () => {
  const currentYear = new Date().getFullYear();
  const links = [
    { href: 'https://ujjwalit.co.in', label: 'Company', external: true },
    { href: '/careers#programs', label: 'Programs' },
    { href: '/verify', label: 'Verification' },
    { href: 'mailto:ujjwalit.p@gmail.com', label: 'Contact' },
  ];

  const socials = [
    { href: 'https://ujjwalit.co.in', label: 'Website', icon: <Globe size={16} /> },
    { href: 'https://www.linkedin.com/company/ujjwalit/', label: 'LinkedIn', icon: <Linkedin size={16} /> },
    { href: 'https://www.instagram.com/ujjwalit.global/', label: 'Instagram', icon: <Instagram size={16} /> },
    { href: 'https://github.com/Ujjwalit-Co', label: 'GitHub', icon: <Github size={16} /> },
  ];

  return (
    <footer className="border-t border-brand-border bg-brand-bg px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <Link href="/careers" className="flex items-center gap-3">
          <span className="relative h-9 w-9">
            <Image src="/ujjwalitlogo.png" alt="Ujjwalit Logo" fill className="object-contain" sizes="36px" />
          </span>
          <span>
            <span className="block text-sm font-extrabold text-[#F5F5F5]">Ujjwalit</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#A1A1AA]">Developers Program</span>
          </span>
        </Link>

        <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-[#A1A1AA]">
          {links.map((link) => (
            <Link key={link.label} href={link.href} target={link.external ? '_blank' : undefined} className="hover:text-[#F5F5F5]">
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {socials.map((item) => (
            <a
              key={item.label}
              href={item.href}
              target="_blank"
              rel="noreferrer"
              aria-label={item.label}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-brand-border text-[#A1A1AA] transition-colors hover:border-brand-blue hover:text-[#F5F5F5]"
            >
              {item.icon}
            </a>
          ))}
          <a href="mailto:ujjwalit.p@gmail.com" aria-label="Email" className="flex h-9 w-9 items-center justify-center rounded-lg border border-brand-border text-[#A1A1AA] transition-colors hover:border-brand-blue hover:text-[#F5F5F5]">
            <Mail size={16} />
          </a>
        </div>
      </div>
      <div className="mx-auto mt-6 max-w-7xl border-t border-brand-border pt-5 font-mono text-[11px] text-[#71717A]">
        Copyright {currentYear} Ujjwalit Technologies. Registry verification active.
      </div>
    </footer>
  );
};



