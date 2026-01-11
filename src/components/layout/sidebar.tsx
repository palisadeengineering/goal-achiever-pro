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
  CalendarCheck,
  Shield,
  Cpu,
  UsersRound,
  TrendingUp,
} from 'lucide-react';
import { ROUTES } from '@/constants/routes';

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  tier?: 'pro' | 'elite';
}

const mainNavItems: NavItem[] = [
  { title: 'Dashboard', href: ROUTES.dashboard, icon: Home },
  { title: 'Today', href: ROUTES.today, icon: CalendarCheck, badge: 'New' },
];

const visionPlanningItems: NavItem[] = [
  { title: 'Vision', href: ROUTES.vision, icon: Eye },
  { title: 'Key Results', href: ROUTES.okrs, icon: TrendingUp, badge: 'New' },
  { title: 'Milestones', href: ROUTES.goals, icon: Trophy },
  { title: 'Daily & Weekly MINS', href: ROUTES.mins, icon: ListTodo },
];

const executionItems: NavItem[] = [
  { title: 'Team', href: ROUTES.team, icon: UsersRound, badge: 'New' },
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

const adminNavItems: NavItem[] = [
  { title: 'AI Usage', href: ROUTES.adminAIUsage, icon: Cpu },
];

interface SidebarProps {
  userTier?: 'free' | 'pro' | 'elite';
  isAdmin?: boolean;
}

// Shared navigation content component
function SidebarContent({
  userTier = 'free',
  isAdmin = false,
  onNavigate
}: {
  userTier: 'free' | 'pro' | 'elite';
  isAdmin?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const tierHierarchy = { free: 0, pro: 1, elite: 2 };

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
        {item.badge && (
          <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-medium">
            {item.badge}
          </span>
        )}
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

        {/* Vision & Planning Section */}
        <div className="pt-4">
          <h3 className="mb-2 px-3 text-xs font-semibold uppercase text-muted-foreground">
            Vision & Planning
          </h3>
          <div className="space-y-1">
            {visionPlanningItems.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </div>
        </div>

        {/* Execution Section */}
        <div className="pt-4">
          <h3 className="mb-2 px-3 text-xs font-semibold uppercase text-muted-foreground">
            Execution
          </h3>
          <div className="space-y-1">
            {executionItems.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </div>
        </div>

        {/* Daily Systems Section */}
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

        {/* Admin Section - Only show for admins */}
        {isAdmin && (
          <div className="pt-4">
            <h3 className="mb-2 px-3 text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Admin
            </h3>
            <div className="space-y-1">
              {adminNavItems.map((item) => (
                <NavLink key={item.href} item={item} />
              ))}
            </div>
          </div>
        )}
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
export function Sidebar({ userTier = 'free', isAdmin = false }: SidebarProps) {
  return (
    <aside className="hidden md:flex h-screen w-64 flex-col border-r bg-background">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href={ROUTES.home} className="flex items-center gap-2 font-semibold">
          <Target className="h-6 w-6 text-primary" />
          <span>Goal Achiever Pro</span>
        </Link>
      </div>

      <SidebarContent userTier={userTier} isAdmin={isAdmin} />
    </aside>
  );
}

// Mobile Sidebar with Sheet
export function MobileSidebar({ userTier = 'free', isAdmin = false }: SidebarProps) {
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

          <SidebarContent userTier={userTier} isAdmin={isAdmin} onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
