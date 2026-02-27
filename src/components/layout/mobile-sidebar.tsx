'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Target,
  LayoutDashboard,
  Clock,
  BarChart3,
  Zap,
  Users,
  UserPlus,
  Settings,
} from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { ScrollArea } from '@/components/ui/scroll-area';

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
}

const mainNavItems: NavItem[] = [
  { title: 'Dashboard', href: ROUTES.dashboard, icon: LayoutDashboard },
  { title: 'Time Audit', href: ROUTES.timeAudit, icon: Clock },
  { title: 'Analytics', href: ROUTES.analytics, icon: BarChart3 },
];

const toolNavItems: NavItem[] = [
  { title: 'Leverage', href: ROUTES.leverage, icon: Zap },
  { title: 'Network', href: ROUTES.network, icon: Users },
];

const teamNavItems: NavItem[] = [
  { title: 'Team', href: ROUTES.team, icon: UserPlus },
];

const bottomNavItems: NavItem[] = [
  { title: 'Settings', href: ROUTES.settings, icon: Settings },
];

export function MobileSidebar() {
  const pathname = usePathname();

  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

    return (
      <Link
        href={item.href}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
          isActive
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        )}
      >
        <item.icon className="h-4 w-4" />
        <span className="flex-1">{item.title}</span>
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

          {/* Tools Section */}
          <div className="pt-4 border-t mt-4">
            <div className="space-y-1">
              {toolNavItems.map((item) => (
                <NavLink key={item.href} item={item} />
              ))}
            </div>
          </div>

          {/* Team Section */}
          <div className="pt-4 border-t mt-4">
            <div className="space-y-1">
              {teamNavItems.map((item) => (
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
