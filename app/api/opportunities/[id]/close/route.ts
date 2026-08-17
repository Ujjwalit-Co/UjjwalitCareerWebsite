import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/api-auth';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // 1. Authorize the admin
    await requireAdmin();

    const { id } = await context.params;
    const { action } = await request.json(); // 'reject_all' | 'keep_pending'

    const supabase = createAdminClient();

    // 2. Query pending applications count
    const { count, error: countError } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('opportunity_id', id)
      .in('application_status', ['pending', 'reviewing']);

    if (countError) {
      throw new Error(`Failed to check pending applications: ${countError.message}`);
    }

    // If there are pending applications and no action is specified, prompt the user
    if (count && count > 0 && !action) {
      return NextResponse.json({
        pendingCount: count,
        requiresAction: true,
      });
    }

    // 3. Close the opportunity
    const { error: closeError } = await supabase
      .from('opportunities')
      .update({ status: 'closed' })
      .eq('id', id);

    if (closeError) {
      throw new Error(`Failed to close opportunity: ${closeError.message}`);
    }

    // 4. Handle pending applications if chosen
    if (action === 'reject_all' && count && count > 0) {
      const { error: rejectError } = await supabase
        .from('applications')
        .update({
          application_status: 'rejected',
          archived_at: new Date().toISOString(),
          remarks: 'Auto-rejected: opportunity closed',
        })
        .eq('opportunity_id', id)
        .in('application_status', ['pending', 'reviewing']);

      if (rejectError) {
        throw new Error(`Failed to reject pending applications: ${rejectError.message}`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error closing opportunity:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: err.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}
