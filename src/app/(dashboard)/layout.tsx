import { Sidebar } from '@/components/layout/sidebar';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { Providers } from '@/components/providers';
import { FeedbackButton } from '@/components/features/feedback/feedback-button';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Demo mode: only enabled by server-side env var in non-production environments
  const isDemoMode = process.env.DEMO_MODE_ENABLED === 'true' && process.env.NODE_ENV !== 'production';

  // If Supabase is not configured, use demo mode with mock user
  let userProfile = {
    email: 'demo@example.com',
    fullName: 'Demo User',
    avatarUrl: undefined as string | undefined,
  };
  let isAdmin = false;

  let subscriptionTier: 'free' | 'pro' | 'elite' | 'founding_member' = 'free';

  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user && !isDemoMode) {
      redirect('/login');
    }

    if (user) {
      // Use actual user data
      userProfile = {
        email: user.email || '',
        fullName: user.user_metadata?.full_name || user.email?.split('@')[0],
        avatarUrl: user.user_metadata?.avatar_url,
      };

      // Get user profile with admin status and subscription tier
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin, subscription_tier')
        .eq('id', user.id)
        .single();

      isAdmin = profile?.is_admin || false;
      subscriptionTier = (profile?.subscription_tier as typeof subscriptionTier) || 'free';
    }
  }

  // Demo mode users are admins for testing
  if (isDemoMode && !isAdmin) {
    isAdmin = true;
  }

  // Check if user has beta access from database (grants elite if no higher tier)
  const serviceClient = createServiceRoleClient();
  if (serviceClient && userProfile.email && subscriptionTier === 'free') {
    const { data: betaInvite } = await serviceClient
      .from('beta_invitations')
      .select('id')
      .ilike('email', userProfile.email)
      .eq('status', 'accepted')
      .single();

    if (betaInvite) {
      subscriptionTier = 'elite';
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar userTier={subscriptionTier} isAdmin={isAdmin} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader
          user={userProfile}
          subscriptionTier={subscriptionTier}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Providers>
            {children}
          </Providers>
        </main>
      </div>
      {/* Beta feedback floating button */}
      <FeedbackButton />
    </div>
  );
}
