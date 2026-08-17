'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  Users,
  Award,
  BookOpen,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';

export function EfferdDashboard2() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold font-display text-white flex items-center gap-2">
            <Sparkles className="text-brand-orange" size={20} /> Efferd Dashboard Engine
          </h2>
          <p className="text-xs text-slate-500">Telemetry engine with premium aesthetic overlays.</p>
        </div>
        <Badge variant="success">Engine Active</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card variant="glass" className="p-5 border border-slate-900 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Model State</span>
            <Layers size={14} className="text-blue-400" />
          </div>
          <p className="text-2xl font-bold font-display text-slate-150">Active Batch</p>
        </Card>

        <Card variant="glass" className="p-5 border border-slate-900 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Active Pipeline</span>
            <Users size={14} className="text-green-400" />
          </div>
          <p className="text-2xl font-bold font-display text-slate-150">Active Interns</p>
        </Card>

        <Card variant="glass" className="p-5 border border-slate-900 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Telemetry Out</span>
            <Award size={14} className="text-brand-orange" />
          </div>
          <p className="text-2xl font-bold font-display text-slate-150">Certificates</p>
        </Card>
      </div>
    </div>
  );
}

export default EfferdDashboard2;
