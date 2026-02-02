import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/api-auth';

// GET: Check if Google Calendar is connected
export async function GET() {
  console.log('[Calendar Status] Checking connection...');

  const auth = await getAuthenticatedUser();
  console.log('[Calendar Status] Auth:', {
    ok: auth.isAuthenticated,
    userId: auth.isAuthenticated ? auth.userId.slice(0, 8) + '...' : null,
    error: !auth.isAuthenticated ? (auth as { error?: string }).error : null,
  });

  if (!auth.isAuthenticated) {
    // Return connected: false instead of error so UI can show proper state
    return NextResponse.json({ connected: false, reason: 'not_authenticated' });
  }
  const userId = auth.userId;
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
  }

  try {
    const { data: integration, error } = await supabase
      .from('user_integrations')
      .select('access_token, refresh_token, token_expiry, provider_email, is_active')
      .eq('user_id', userId)
      .eq('provider', 'google_calendar')
      .single();

    console.log('[Calendar Status] Integration:', {
      found: !!integration,
      error: error?.message || null,
      active: integration?.is_active ?? false,
      hasTokens: !!(integration?.access_token && integration?.refresh_token),
    });

    if (error || !integration) {
      return NextResponse.json({ connected: false, reason: 'no_integration' });
    }

    // Check if we have required tokens and integration is active
    if (integration.access_token && integration.refresh_token && integration.is_active) {
      return NextResponse.json({
        connected: true,
        email: integration.provider_email,
        expiresAt: integration.token_expiry,
      });
    }

    return NextResponse.json({ connected: false, reason: 'inactive_or_missing_tokens' });
  } catch (err) {
    console.error('[Calendar Status] Error:', err);
    return NextResponse.json({ connected: false, reason: 'error' });
  }
}
