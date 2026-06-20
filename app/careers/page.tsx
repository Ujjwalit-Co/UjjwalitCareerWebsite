import React from 'react';
import { HeroSection } from '@/components/careers/HeroSection';
import { WhyJoinSection } from '@/components/careers/WhyJoinSection';
import { ProgramsSection } from '@/components/careers/ProgramsSection';
import { EventsSection } from '@/components/careers/EventsSection';
import { TransparencySection } from '@/components/careers/TransparencySection';
import { getOpenOpportunities } from '@/lib/opportunities';

export const dynamic = 'force-dynamic';

export default async function CareersLandingPage() {
  const opportunities = await getOpenOpportunities();
  const internships = opportunities.filter((item) => item.type === 'internship' || item.type === 'project');
  const events = opportunities.filter((item) => item.type === 'event');

  return (
    <div className="w-full flex flex-col bg-brand-bg text-[#F5F5F5]">
      <HeroSection opportunities={opportunities} />
      <ProgramsSection opportunities={internships} />
      <WhyJoinSection />
      <EventsSection events={events} />
      <TransparencySection />
    </div>
  );
}
