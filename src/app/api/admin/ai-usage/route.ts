import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Demo user ID for development
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

async function getUserIdAndCheckAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  if (!supabase) return { userId: DEMO_USER_ID, isAdmin: true }; // Dev mode

  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id || DEMO_USER_ID;

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .single();

  return { userId, isAdmin: profile?.is_admin || userId === DEMO_USER_ID };
}

// GET - Fetch AI usage statistics (admin only)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const { userId, isAdmin } = await getUserIdAndCheckAdmin(supabase);

    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const groupBy = searchParams.get('groupBy') || 'day'; // 'day', 'user', 'endpoint'

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch usage data
    const { data: usageData, error: usageError } = await supabase
      .from('ai_usage_logs')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });

    if (usageError) {
      console.error('Error fetching AI usage:', usageError);
      return NextResponse.json({ error: 'Failed to fetch usage data' }, { status: 500 });
    }

    // Calculate totals
    const totals = (usageData || []).reduce(
      (acc, log) => ({
        totalRequests: acc.totalRequests + 1,
        totalPromptTokens: acc.totalPromptTokens + (log.prompt_tokens || 0),
        totalCompletionTokens: acc.totalCompletionTokens + (log.completion_tokens || 0),
        totalTokens: acc.totalTokens + (log.total_tokens || 0),
        totalCostCents: acc.totalCostCents + parseFloat(log.estimated_cost_cents || '0'),
        successfulRequests: acc.successfulRequests + (log.success ? 1 : 0),
        failedRequests: acc.failedRequests + (log.success ? 0 : 1),
      }),
      {
        totalRequests: 0,
        totalPromptTokens: 0,
        totalCompletionTokens: 0,
        totalTokens: 0,
        totalCostCents: 0,
        successfulRequests: 0,
        failedRequests: 0,
      }
    );

    // Group by day for chart
    const byDay = new Map<string, {
      date: string;
      requests: number;
      tokens: number;
      costCents: number;
    }>();

    (usageData || []).forEach(log => {
      const date = new Date(log.created_at).toISOString().split('T')[0];
      const existing = byDay.get(date) || { date, requests: 0, tokens: 0, costCents: 0 };
      existing.requests += 1;
      existing.tokens += log.total_tokens || 0;
      existing.costCents += parseFloat(log.estimated_cost_cents || '0');
      byDay.set(date, existing);
    });

    // Group by endpoint
    const byEndpoint = new Map<string, {
      endpoint: string;
      requests: number;
      tokens: number;
      costCents: number;
    }>();

    (usageData || []).forEach(log => {
      const endpoint = log.endpoint || 'unknown';
      const existing = byEndpoint.get(endpoint) || { endpoint, requests: 0, tokens: 0, costCents: 0 };
      existing.requests += 1;
      existing.tokens += log.total_tokens || 0;
      existing.costCents += parseFloat(log.estimated_cost_cents || '0');
      byEndpoint.set(endpoint, existing);
    });

    // Group by user
    const byUser = new Map<string, {
      userId: string;
      requests: number;
      tokens: number;
      costCents: number;
    }>();

    (usageData || []).forEach(log => {
      const uid = log.user_id || 'unknown';
      const existing = byUser.get(uid) || { userId: uid, requests: 0, tokens: 0, costCents: 0 };
      existing.requests += 1;
      existing.tokens += log.total_tokens || 0;
      existing.costCents += parseFloat(log.estimated_cost_cents || '0');
      byUser.set(uid, existing);
    });

    // Fetch user emails for the user breakdown
    const userIds = Array.from(byUser.keys());
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email')
      .in('id', userIds);

    const userEmailMap = new Map((profiles || []).map(p => [p.id, p.email]));

    return NextResponse.json({
      dateRange: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
        days,
      },
      totals: {
        ...totals,
        totalCostDollars: (totals.totalCostCents / 100).toFixed(4),
      },
      byDay: Array.from(byDay.values()).sort((a, b) => a.date.localeCompare(b.date)),
      byEndpoint: Array.from(byEndpoint.values()).sort((a, b) => b.requests - a.requests),
      byUser: Array.from(byUser.values())
        .map(u => ({
          ...u,
          email: userEmailMap.get(u.userId) || 'Unknown',
        }))
        .sort((a, b) => b.requests - a.requests),
      recentLogs: (usageData || []).slice(0, 50).map(log => ({
        id: log.id,
        endpoint: log.endpoint,
        model: log.model,
        requestType: log.request_type,
        tokens: log.total_tokens,
        costCents: parseFloat(log.estimated_cost_cents || '0'),
        success: log.success,
        responseTimeMs: log.response_time_ms,
        createdAt: log.created_at,
      })),
    });
  } catch (error) {
    console.error('Error in admin AI usage API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
