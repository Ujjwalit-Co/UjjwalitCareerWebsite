export type Opportunity = {
  id: string;
  slug: string;
  type: 'internship' | 'event' | 'project';
  title: string;
  short_title: string | null;
  tagline: string;
  description: string;
  details_markdown: string | null;
  status: 'draft' | 'open' | 'closed' | 'archived';
  visibility: 'public' | 'private';
  price_inr: number;
  stipend_label: string;
  duration_label: string;
  location_label: string;
  cohort_label: string | null;
  starts_on: string | null;
  ends_on: string | null;
  apply_by: string | null;
  capacity: number | null;
  display_order: number;
  accent: 'teal' | 'orange' | 'blue' | 'amber';
  cover_image_url: string | null;
  features: string[];
  outcomes: string[];
  eligibility: string[];
  project_links: Array<{ label: string; url: string }>;
};

export function formatFee(price: number) {
  return price > 0 ? `₹${price.toLocaleString('en-IN')}` : 'Free';
}
