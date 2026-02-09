// Ensures a profile row exists for the authenticated user.
// Called during auth callback to guarantee profiles table is populated
// before the user reaches the dashboard.

import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Create a profile row if one doesn't already exist.
 * Uses upsert with ignoreDuplicates so it's safe to call multiple times.
 * Never throws — logs errors and returns false on failure.
 */
export async function ensureProfile(
  userId: string,
  email?: string | null,
  fullName?: string | null
): Promise<boolean> {
  try {
    const adminClient = createAdminClient();
    if (!adminClient) {
      console.error('ensureProfile: Admin client not available');
      return false;
    }

    const { error } = await adminClient
      .from('profiles')
      .upsert(
        {
          id: userId,
          email: email || '',
          full_name: fullName || null,
          subscription_tier: 'free',
          subscription_status: 'active',
          onboarding_completed: true,
        },
        { onConflict: 'id', ignoreDuplicates: true }
      );

    if (error) {
      console.error('ensureProfile: Failed to create profile:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error('ensureProfile: Unexpected error:', err);
    return false;
  }
}
