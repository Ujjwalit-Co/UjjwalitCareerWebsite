'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function VerifySearchPage() {
  const router = useRouter();
  const [certId, setCertId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = certId.trim();

    if (!cleanId) {
      toast.error('Please enter a Certificate ID');
      return;
    }

    setIsLoading(true);
    router.push(`/verify/${encodeURIComponent(cleanId)}`);
  };

  return (
    <div className="w-full max-w-md">
      <Card className="p-5 sm:p-6" hoverEffect={false}>
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg border border-brand-border bg-brand-surface text-brand-blue">
            <ShieldCheck size={24} />
          </div>
          <h1 className="mt-5 text-2xl font-extrabold tracking-tight">Verify Certificate</h1>
          <p className="mt-2 text-sm leading-6 text-[#A1A1AA]">Enter the Certificate ID exactly as shown on the credential.</p>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          <Input label="Certificate ID" placeholder="UJ-WD-2026-001" value={certId} onChange={(e) => setCertId(e.target.value)} className="font-mono text-center tracking-wider" />
          <Button type="submit" variant="teal" isLoading={isLoading} className="w-full gap-2">
            <Search size={17} /> Verify
          </Button>
        </form>
      </Card>
    </div>
  );
}
