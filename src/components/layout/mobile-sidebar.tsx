'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
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
} from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { ScrollArea } from '@/components/ui/scroll-area';

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  tier?: 'pro' | 'elite';
}

const mainNavItems: NavItem[] = [
  { title: 'Dashboard', href: ROUTES.dashboard, icon: Home },
  { title: 'Vision', href: ROUTES.vision, icon: Eye },
  { title: 'Impact Projects', href: ROUTES.goals, icon: Trophy },
  { title: 'MINS', href: ROUTES.mins, icon: ListTodo },
];

const systemNavItems: NavItem[] = [
  { title: 'Time Audit', href: ROUTES.timeAudit, icon: Calendar },
  { title: 'Value Matrix', href: ROUTES.drip, icon: Grid3X3 },
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
  { title: 'Settings', href: ROUTES.settings, icon: Settings },
];

interface MobileSidebarProps {
  userTier?: 'free' | 'pro' | 'elite' | 'founding_member';
}

export function MobileSidebar({ userTier = 'free' }: MobileSidebarProps) {
  const pathname = usePathname();

  const tierHierarchy = { free: 0, pro: 1, elite: 2, founding_member: 2 };

  const hasAccess = (tier?: 'pro' | 'elite') => {
    if (!tier) return true;
    return tierHierarchy[userTier] >= tierHierarchy[tier];
  };

  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
    const accessible = hasAccess(item.tier);

    return (
      <Link
        href={accessible ? item.href : ROUTES.settingsSubscription}
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
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href={ROUTES.dashboard} className="flex items-center gap-2 font-semibold">
          <Target className="h-6 w-6 text-primary" />
          <span>Goal Achiever Pro</span>
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-4 py-4">
        <nav className="space-y-1">
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
      </ScrollArea>

      {/* Bottom Section */}
      <div className="border-t p-4">
        {bottomNavItems.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </div>
    </div>
  );
}
