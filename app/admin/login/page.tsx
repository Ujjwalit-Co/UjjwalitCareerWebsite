'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { Lock, Mail, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    const supabase = createClient();

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      toast.success('Successfully logged in!');
      // Force refresh/redirect to the admin dashboard
      router.refresh();
      router.push('/admin/dashboard');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-4 relative bg-gradient-to-b from-slate-950 to-brand-deep">
      {/* Decorative Radial Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(26,139,166,0.08),transparent_60%)] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <span className="inline-flex h-12 w-12 bg-brand-orange rounded-xl items-center justify-center text-white font-bold font-display text-lg glow-orange mb-2">
            UT
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-white tracking-tight">
            Admin Console
          </h1>
          <p className="text-slate-400 text-xs tracking-wider uppercase font-semibold">
            Ujjwalit Technologies
          </p>
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
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
              />
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
      </div>
    </div>
  );
}

