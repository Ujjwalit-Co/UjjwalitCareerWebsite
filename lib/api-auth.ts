import { createClient } from '@/lib/supabase/server';

/**
 * Checks if the current requester is an authenticated administrator.
 * Throws an error or returns the user object.
 */
export async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error('Unauthorized');
  }
  return user;
}
