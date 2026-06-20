import { createClient } from '@/lib/supabase/server';
import { fallbackOpportunities, normalizeOpportunity, type Opportunity } from '@/lib/opportunities.shared';

export type { Opportunity } from '@/lib/opportunities.shared';
export { fallbackOpportunities, formatFee } from '@/lib/opportunities.shared';

function hasSupabaseConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export async function getOpenOpportunities(): Promise<Opportunity[]> {
  if (!hasSupabaseConfig()) return fallbackOpportunities;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('opportunities')
      .select('*')
      .eq('status', 'open')
      .eq('visibility', 'public')
      .order('display_order', { ascending: true });

    if (error) throw error;
    return (data || []).map(normalizeOpportunity);
  } catch (error) {
    console.error('Failed to load opportunities; using fallback data.', error);
    return fallbackOpportunities;
  }
}

export async function getOpportunityBySlug(slug: string): Promise<Opportunity | null> {
  if (!hasSupabaseConfig()) {
    return fallbackOpportunities.find((item) => item.slug === slug && item.status === 'open' && item.visibility === 'public') || null;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('opportunities')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'open')
      .eq('visibility', 'public')
      .maybeSingle();

    if (error) throw error;
    return data ? normalizeOpportunity(data) : null;
  } catch (error) {
    console.error('Failed to load opportunity by slug.', error);
    return null;
  }
}
