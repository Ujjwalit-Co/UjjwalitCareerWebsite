'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Award, Search, ShieldCheck, User } from 'lucide-react';
import toast from 'react-hot-toast';

export default function VerifySearchPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'certificate' | 'student'>('certificate');
  const [certId, setCertId] = useState('');
  const [studentRef, setStudentRef] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'certificate') {
      const cleanId = certId.trim();
      if (!cleanId) {
        toast.error('Please enter a Certificate ID');
        return;
      }
      setIsLoading(true);
      router.push(`/verify/${encodeURIComponent(cleanId)}`);
    } else {
      const cleanRef = studentRef.trim();
      if (!cleanRef) {
        toast.error('Please enter a student code, profile slug, or email');
        return;
      }
      setIsLoading(true);
      router.push(`/verify/student/${encodeURIComponent(cleanRef)}`);
    }
  };

  return (
    <div className="w-full max-w-md">
      <Card className="p-5 sm:p-6" hoverEffect={false}>
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg border border-brand-border bg-brand-surface text-brand-blue">
            <ShieldCheck size={24} />
          </div>
          <h1 className="mt-5 text-2xl font-extrabold tracking-tight">Ujjwalit Registry</h1>
          <p className="mt-2 text-sm leading-6 text-[#A1A1AA]">
            Verify a certificate or view a student&apos;s credentials and earned certificates.
          </p>
        </div>

        {/* Tab toggle */}
        <div className="mb-5 grid grid-cols-2 gap-1 rounded-lg border border-brand-border bg-brand-surface p-1">
          <button
            type="button"
            onClick={() => setActiveTab('certificate')}
            className={`flex items-center justify-center gap-2 rounded-md px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'certificate'
                ? 'bg-brand-blue text-white'
                : 'text-[#A1A1AA] hover:text-[#F5F5F5]'
            }`}
          >
            <Award size={14} /> Verify Certificate
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('student')}
            className={`flex items-center justify-center gap-2 rounded-md px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'student'
                ? 'bg-brand-blue text-white'
                : 'text-[#A1A1AA] hover:text-[#F5F5F5]'
            }`}
          >
            <User size={14} /> Student Profile
          </button>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          {activeTab === 'certificate' ? (
            <Input
              label="Certificate ID"
              placeholder="UJ-WD-2026-001"
              value={certId}
              onChange={(e) => setCertId(e.target.value)}
              className="font-mono text-center tracking-wider"
            />
          ) : (
            <>
              <Input
                label="Student code, profile slug, or email"
                placeholder="STU-2026-001"
                value={studentRef}
                onChange={(e) => setStudentRef(e.target.value)}
                className="font-mono text-center tracking-wider"
              />
              <p className="text-[11px] leading-5 text-[#71717A]">
                Find the student code printed on any certificate issued to you, or use your registered email address.
              </p>
            </>
          )}
          <Button type="submit" variant="teal" isLoading={isLoading} className="w-full gap-2">
            <Search size={17} /> {activeTab === 'certificate' ? 'Verify' : 'View Profile'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
