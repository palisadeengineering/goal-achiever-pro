'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
  Share2,
  ChevronDown,
  UserPlus,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { TAB_TO_ROUTE, TAB_DISPLAY_INFO } from '@/types/sharing';
import type { SharedContent, TabName } from '@/types/sharing';

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  tier?: 'pro' | 'elite';
}

const mainNavItems: NavItem[] = [
  { title: 'Dashboard', href: ROUTES.dashboard, icon: Home },
  { title: 'Today', href: ROUTES.today, icon: CalendarCheck },
  { title: 'Progress', href: ROUTES.progress, icon: TrendingUp, badge: 'New' },
];

const visionPlanningItems: NavItem[] = [
  { title: 'Vision Planner', href: ROUTES.planner, icon: Sparkles, badge: 'New' },
  { title: 'Vision', href: ROUTES.vision, icon: Eye },
  { title: 'Key Results', href: ROUTES.okrs, icon: TrendingUp },
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
  { title: 'Beta Access', href: ROUTES.adminBetaAccess, icon: UserPlus },
  { title: 'Feedback', href: ROUTES.adminFeedback, icon: MessageSquare },
];

interface SidebarProps {
  userTier?: 'free' | 'pro' | 'elite' | 'founding_member';
  isAdmin?: boolean;
}

// Shared navigation content component
function SidebarContent({
  userTier = 'free',
  isAdmin = false,
  onNavigate
}: {
  userTier: 'free' | 'pro' | 'elite' | 'founding_member';
  isAdmin?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const tierHierarchy = { free: 0, pro: 1, elite: 2, founding_member: 2 };
  const [sharedContent, setSharedContent] = useState<SharedContent[]>([]);
  const [expandedOwners, setExpandedOwners] = useState<Set<string>>(new Set());

  // Fetch shared content
  useEffect(() => {
    const fetchSharedContent = async () => {
      try {
        const response = await fetch('/api/sharing/shared-with-me');
        if (response.ok) {
          const data = await response.json();
          setSharedContent(data.sharedContent || []);
        }
      } catch (error) {
        console.error('Error fetching shared content:', error);
      }
    };

    fetchSharedContent();
  }, []);

  const toggleOwner = (ownerId: string) => {
    const newExpanded = new Set(expandedOwners);
    if (newExpanded.has(ownerId)) {
      newExpanded.delete(ownerId);
    } else {
      newExpanded.add(ownerId);
    }
    setExpandedOwners(newExpanded);
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

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

        {/* Shared with me Section */}
        {sharedContent.length > 0 && (
          <div className="pt-4 border-t mt-4">
            <h3 className="mb-2 px-3 text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1">
              <Share2 className="h-3 w-3" />
              Shared with me
            </h3>
            <div className="space-y-1">
              {sharedContent.map((shared) => (
                <Collapsible
                  key={shared.owner.id}
                  open={expandedOwners.has(shared.owner.id)}
                  onOpenChange={() => toggleOwner(shared.owner.id)}
                >
                  <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                        {getInitials(shared.owner.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="flex-1 text-left truncate">
                      {shared.owner.fullName || shared.owner.email}
                    </span>
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 transition-transform',
                        expandedOwners.has(shared.owner.id) && 'rotate-180'
                      )}
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-4 space-y-1">
                    {shared.tabs.map((tab) => {
                      const tabInfo = TAB_DISPLAY_INFO[tab.tabName];
                      const route = TAB_TO_ROUTE[tab.tabName];
                      // Add owner context to the route
                      const sharedRoute = `${route}?shared=${shared.owner.id}`;
                      const isActive = pathname.startsWith(route);

                      return (
                        <Link
                          key={tab.id}
                          href={sharedRoute}
                          onClick={onNavigate}
                          className={cn(
                            'flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs transition-colors',
                            isActive
                              ? 'bg-primary/10 text-primary'
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                          )}
                        >
                          <span className="flex-1">{tabInfo?.displayName || tab.tabName}</span>
                          {tab.permissionLevel === 'edit' ? (
                            <span className="text-[10px] text-muted-foreground">edit</span>
                          ) : (
                            <Eye className="h-3 w-3 text-muted-foreground" />
                          )}
                        </Link>
                      );
                    })}
                    {shared.itemCount > 0 && (
                      <div className="px-3 py-1.5 text-xs text-muted-foreground">
                        + {shared.itemCount} shared items
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>
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
