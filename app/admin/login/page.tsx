'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { Lock, Mail, ShieldAlert, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      toast.error('Please enter both email and password credentials.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error('Please enter a valid email address structure (e.g. admin@ujjwalit.co.in).');
      return;
    }

    if (password.length < 6) {
      toast.error('Security password must be at least 6 characters in length.');
      return;
    }

    setIsLoading(true);
    const supabase = createClient();

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      toast.success('Access granted! Authenticating console...');
      router.refresh();
      router.push('/admin/dashboard');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Access Denied. Check your admin credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-4 relative bg-gradient-to-b from-slate-950 to-brand-deep overflow-hidden">
      {/* Decorative grid backdrop */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(to right,#60a5fa 1px,transparent 1px),linear-gradient(to bottom,#60a5fa 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
      {/* Radial glows */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(26,139,166,0.10),transparent_55%)] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-brand-orange/10 blur-3xl pointer-events-none" />
      <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-brand-blue/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <span className="relative inline-flex h-14 w-14 mx-auto overflow-hidden rounded-xl bg-white shadow-lg glow-orange ring-1 ring-white/10">
            <Image src="/ujjwalitlogo.png" alt="Ujjwalit" fill className="object-contain p-1" sizes="56px" />
          </span>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-white tracking-tight">
              Admin Console
            </h1>
            <p className="mt-1 text-xs tracking-wider uppercase font-semibold text-brand-orange">
              Ujjwalit Technologies
            </p>
          </div>
        </div>

        {/* Login Card */}
        <Card variant="glass" className="bg-slate-950/80 border-slate-800 p-8 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-[38px] text-slate-500" size={18} />
              <Input
                label="Admin Email"
                type="email"
                placeholder="admin@ujjwalit.co.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-[38px] text-slate-500" size={18} />
              <Input
                label="Security Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-[38px] text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <div className="pt-2">
              <Button type="submit" variant="primary" isLoading={isLoading} className="w-full font-bold py-3 shadow-orange/10">
                Access Dashboard
              </Button>
            </div>
          </form>
        </Card>

        {/* Security Alert Badge */}
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-slate-900 bg-slate-950/40 text-left text-xs text-slate-500 max-w-xs mx-auto">
          <ShieldAlert size={16} className="text-brand-orange flex-shrink-0" />
          <span>Restricted Area. Authorized administrative personnel access only.</span>
        </div>

        {/* Back to careers */}
        <div className="text-center">
          <a
            href="https://careers.ujjwalit.co.in"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            <ArrowLeft size={12} /> Back to careers site
          </a>
        </div>
      </div>
    </div>
  );
}