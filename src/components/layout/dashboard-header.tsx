'use client';

import { useRouter } from 'next/navigation';
import { Header } from './header';
import { createClient } from '@/lib/supabase/client';

interface DashboardHeaderProps {
  user: {
    email: string;
    fullName?: string;
    avatarUrl?: string;
  };
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <Header
      user={user}
      onSignOut={handleSignOut}
    />
  );
}
