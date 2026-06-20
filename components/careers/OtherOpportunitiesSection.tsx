"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { CategoryList, Category } from '@/components/ui/category-list';
import { ArrowRight } from 'lucide-react';
import { Opportunity } from '@/lib/opportunities.shared';

interface OtherOpportunitiesSectionProps {
  currentSlug: string;
  opportunities: Opportunity[];
}

export function OtherOpportunitiesSection({ currentSlug, opportunities }: OtherOpportunitiesSectionProps) {
  const router = useRouter();

  const otherOpportunities: Category[] = opportunities
    .filter(o => o.slug !== currentSlug)
    .map(o => ({
      id: o.id,
      title: o.title,
      subtitle: o.tagline,
      onClick: () => {
        router.push(`/careers/opportunities/${o.slug}`);
      },
      icon: <ArrowRight className="w-8 h-8" />
    }));

  if (otherOpportunities.length === 0) return null;

  return (
    <CategoryList
      title="Other Opportunities"
      subtitle="Explore more programs and events."
      categories={otherOpportunities}
      className="mt-8 bg-brand-bg text-[#F5F5F5]"
    />
  );
}
