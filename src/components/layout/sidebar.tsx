'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Target,
  ListTodo,
  Calendar,
  Grid3X3,
  Timer,
  BookOpen,
  Users,
  Zap,
  BarChart3,
  Settings,
  Home,
  Eye,
  Trophy,
  Menu,
  HelpCircle,
} from 'lucide-react';
import { ROUTES } from '@/constants/routes';

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  tier?: 'pro' | 'premium';
}

const mainNavItems: NavItem[] = [
  { title: 'Dashboard', href: ROUTES.dashboard, icon: Home },
  { title: 'Vision', href: ROUTES.vision, icon: Eye },
  { title: 'Power Goals', href: ROUTES.goals, icon: Trophy },
  { title: 'MINS', href: ROUTES.mins, icon: ListTodo },
];

const systemNavItems: NavItem[] = [
  { title: 'Time Audit', href: ROUTES.timeAudit, icon: Calendar },
  { title: 'DRIP Matrix', href: ROUTES.drip, icon: Grid3X3 },
  { title: 'Routines', href: ROUTES.routines, icon: Target },
  { title: 'Pomodoro', href: ROUTES.pomodoro, icon: Timer },
  { title: 'Reviews', href: ROUTES.reviews, icon: BookOpen },
];

const advancedNavItems: NavItem[] = [
  { title: 'Leverage', href: ROUTES.leverage, icon: Zap, tier: 'pro' },
  { title: 'Network', href: ROUTES.network, icon: Users, tier: 'pro' },
  { title: 'Analytics', href: ROUTES.analytics, icon: BarChart3 },
];

const bottomNavItems: NavItem[] = [
  { title: 'Guide', href: ROUTES.guide, icon: HelpCircle },
  { title: 'Settings', href: ROUTES.settings, icon: Settings },
];

interface SidebarProps {
  userTier?: 'free' | 'pro' | 'premium';
}

// Shared navigation content component
function SidebarContent({
  userTier = 'free',
  onNavigate
}: {
  userTier: 'free' | 'pro' | 'premium';
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const tierHierarchy = { free: 0, pro: 1, premium: 2 };

  const hasAccess = (tier?: 'pro' | 'premium') => {
    if (!tier) return true;
    return tierHierarchy[userTier] >= tierHierarchy[tier];
  };

  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
    const accessible = hasAccess(item.tier);

    return (
      <Link
        href={accessible ? item.href : ROUTES.settingsSubscription}
        onClick={onNavigate}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
          isActive
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          !accessible && 'opacity-50'
        )}
      >
        <item.icon className="h-4 w-4" />
        <span className="flex-1">{item.title}</span>
        {item.tier && !accessible && (
          <span className="text-xs uppercase bg-muted px-1.5 py-0.5 rounded">
            {item.tier}
          </span>
        )}
      </Link>
    );
  };

  return (
    <>
      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {/* Main Section */}
        <div className="space-y-1">
          {mainNavItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </div>

        {/* Systems Section */}
        <div className="pt-4">
          <h3 className="mb-2 px-3 text-xs font-semibold uppercase text-muted-foreground">
            Daily Systems
          </h3>
          <div className="space-y-1">
            {systemNavItems.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </div>
        </div>

        {/* Advanced Section */}
        <div className="pt-4">
          <h3 className="mb-2 px-3 text-xs font-semibold uppercase text-muted-foreground">
            Advanced
          </h3>
          <div className="space-y-1">
            {advancedNavItems.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </div>
        </div>
      </nav>

      {/* Bottom Section */}
      <div className="border-t p-4">
        {bottomNavItems.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </div>
    </>
  );
}

// Desktop Sidebar
export function Sidebar({ userTier = 'free' }: SidebarProps) {
  return (
    <aside className="hidden md:flex h-screen w-64 flex-col border-r bg-background">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href={ROUTES.home} className="flex items-center gap-2 font-semibold">
          <Target className="h-6 w-6 text-primary" />
          <span>Goal Achiever Pro</span>
        </Link>
      </div>

      <SidebarContent userTier={userTier} />
    </aside>
  );
}

// Mobile Sidebar with Sheet
export function MobileSidebar({ userTier = 'free' }: SidebarProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center border-b px-6">
            <Link
              href={ROUTES.home}
              className="flex items-center gap-2 font-semibold"
              onClick={() => setOpen(false)}
            >
              <Target className="h-6 w-6 text-primary" />
              <span>Goal Achiever Pro</span>
            </Link>
          </div>

          <SidebarContent userTier={userTier} onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
