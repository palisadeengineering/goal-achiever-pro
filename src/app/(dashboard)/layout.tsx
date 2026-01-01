import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // If Supabase is not configured, use demo mode with mock user
  let userProfile = {
    email: 'demo@example.com',
    fullName: 'Demo User',
    avatarUrl: undefined as string | undefined,
  };

  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      redirect('/login');
    }

    // Use actual user data
    userProfile = {
      email: user.email || '',
      fullName: user.user_metadata?.full_name || user.email?.split('@')[0],
      avatarUrl: user.user_metadata?.avatar_url,
    };
  }

  const subscriptionTier = 'free' as const; // Will be fetched from profile

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar userTier={subscriptionTier} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          user={userProfile}
          subscriptionTier={subscriptionTier}
        />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
