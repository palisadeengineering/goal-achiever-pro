import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

// Testing phase: Grant full access to these emails
const TESTING_FULL_ACCESS_EMAILS = [
  'joel@pe-se.com',
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Demo mode: skip auth in development or when DEMO_MODE is enabled
  const isDemoMode = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  // If Supabase is not configured, use demo mode with mock user
  let userProfile = {
    email: 'demo@example.com',
    fullName: 'Demo User',
    avatarUrl: undefined as string | undefined,
  };
  let isAdmin = false;

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

      // Check if user is admin
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

  // Check if user has testing phase full access
  const hasTestingAccess = TESTING_FULL_ACCESS_EMAILS.includes(userProfile.email.toLowerCase());
  const subscriptionTier = hasTestingAccess ? 'premium' as const : 'free' as const;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar userTier={subscriptionTier} isAdmin={isAdmin} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          user={userProfile}
          subscriptionTier={subscriptionTier}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
