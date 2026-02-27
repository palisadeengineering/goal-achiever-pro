import { Sidebar } from '@/components/layout/sidebar';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { Providers } from '@/components/providers';
import { FeedbackButton } from '@/components/features/feedback/feedback-button';
import { createClient } from '@/lib/supabase/server';
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

  // Everything is free during MVP/PMF phase
  const subscriptionTier: 'free' | 'pro' | 'elite' | 'founding_member' = 'free';

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

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      isAdmin = profile?.is_admin || false;
    }
  }

  // Demo mode users are admins for testing
  if (isDemoMode && !isAdmin) {
    isAdmin = true;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isAdmin={isAdmin} />
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
