'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  CheckCircle2, 
  GitBranch, 
  Radio, 
  Server, 
  ShieldCheck,
  Atom,
  Boxes,
  Cloud,
  Code2,
  Container,
  Database,
  Globe,
  Layers,
  Palette,
  Terminal,
  TerminalSquare,
  Workflow 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Opportunity } from '@/lib/opportunities.shared';
import { Marquee } from '@/components/ui/marquee';
import { SkillCard } from '@/components/ui/skill-card';

const rowOne = [
  { name: "React", category: "Frontend", icon: Atom },
  { name: "TypeScript", category: "Language", icon: Code2 },
  { name: "Next.js", category: "Framework", icon: Globe },
  { name: "Node.js", category: "Runtime", icon: Server },
  { name: "PostgreSQL", category: "Database", icon: Database },
  { name: "Tailwind", category: "Styling", icon: Palette },
  { name: "Docker", category: "Containers", icon: Container },
  { name: "REST APIs", category: "Backend", icon: Workflow },
]

const rowTwo = [
  { name: "Git", category: "Version Control", icon: GitBranch },
  { name: "Vercel", category: "Deployment", icon: Boxes },
  { name: "AWS", category: "Cloud", icon: Cloud },
  { name: "Prisma", category: "ORM", icon: Layers },
  { name: "CI / CD", category: "Pipelines", icon: TerminalSquare },
  { name: "Linux", category: "Systems", icon: Terminal },
]

const metrics = [
  ['Verified', 'production-style projects'],
  ['Mentor-led', 'guided implementation'],
  ['QR', 'verifiable credential certificate'],
];


export const HeroSection = ({ opportunities }: { opportunities: Opportunity[] }) => {
  const openCount = opportunities.filter((item) => item.status === 'open').length;

  return (
    <section className="relative flex min-h-[90vh] w-full items-center overflow-hidden border-b border-brand-border bg-brand-bg px-4 pt-24 pb-8 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#242424_1px,transparent_1px),linear-gradient(to_bottom,#242424_1px,transparent_1px)] bg-[size:44px_44px] opacity-35" />
      <div className="absolute inset-x-0 top-0 h-px bg-brand-blue/60" />

      <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="flex min-h-[70vh] flex-col justify-between gap-8 py-4 text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="mx-auto inline-flex w-fit items-center gap-2 rounded-lg border border-brand-border bg-brand-secondary px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-[#A1A1AA] lg:mx-0"
          >
            <span className="h-2 w-2 rounded-full bg-brand-success" />
            UDP 2026 Intake Open
          </motion.div>

          <div className="space-y-6">
            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08 }}
              className="text-4xl font-extrabold leading-[0.98] tracking-tight text-[#F5F5F5] sm:text-5xl md:text-6xl"
            >
              Build Real Software.
              <span className="block text-[#A1A1AA]">Not Tutorial Projects.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.45, delay: 0.18 }}
              className="mx-auto max-w-2xl text-base font-medium leading-7 text-[#A1A1AA] sm:text-lg lg:mx-0"
            >
              Join Ujjwalit Developers Program and build production-ready applications, work with modern tools, and learn through guided implementation.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, delay: 0.24 }}
              className="flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start"
            >
              <Link href="#programs">
                <Button size="lg" className="w-full gap-2 sm:w-auto">
                  Apply Now <ArrowRight size={18} />
                </Button>
              </Link>
              <Link href="#programs">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  View Program
                </Button>
              </Link>
            </motion.div>
          </div>

          <div className="grid md:grid-cols-3 divide-x divide-brand-border border-y border-brand-border bg-brand-secondary/70 text-left">
            {metrics.map(([value, label]) => (
              <div key={label} className="p-3 sm:p-4">
                <p className="font-mono text-lg font-bold text-[#F5F5F5] sm:text-xl">{value}</p>
                <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.12em] text-[#A1A1AA]">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.16 }}
          className="relative hidden flex-col gap-4 overflow-hidden lg:flex"
        >
          {/* edge fades */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 z-20 w-12 bg-gradient-to-r from-brand-bg to-transparent sm:w-24"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 z-20 w-12 bg-gradient-to-l from-brand-bg to-transparent sm:w-24"
          />

          <p className="mb-2 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-[#A1A1AA] lg:text-left z-100">
            The production stack you will master
          </p>

          <Marquee duration={45} gap="0.75rem">
            {rowOne.map((skill) => (
              <SkillCard key={skill.name} {...skill} />
            ))}
          </Marquee>

          <Marquee reverse duration={50} gap="0.75rem">
            {rowTwo.map((skill) => (
              <SkillCard key={skill.name} {...skill} />
            ))}
          </Marquee>
          
          <div className="mt-4 rounded-lg border border-brand-border bg-brand-secondary/50 p-4 font-mono text-[10px] text-[#A1A1AA] z-100">
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2"><Radio size={12} className="text-brand-blue" /> stack.status</span>
              <span className="text-brand-success">verified_production_ready</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

