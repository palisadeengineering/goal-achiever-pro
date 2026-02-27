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
  LayoutDashboard,
  Clock,
  BarChart3,
  Zap,
  Users,
  UserPlus,
  Settings,
  Target,
  Menu,
  Shield,
  Cpu,
  MessageSquare,
  Share2,
  ChevronDown,
  Eye,
} from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { TAB_TO_ROUTE, TAB_DISPLAY_INFO } from '@/types/sharing';
import type { SharedContent } from '@/types/sharing';

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

const adminNavItems: NavItem[] = [
  { title: 'AI Usage', href: ROUTES.adminAIUsage, icon: Cpu },
  { title: 'Beta Access', href: ROUTES.adminBetaAccess, icon: UserPlus },
  { title: 'Feedback', href: ROUTES.adminFeedback, icon: MessageSquare },
];

interface SidebarProps {
  isAdmin?: boolean;
}

// Shared navigation content component
function SidebarContent({
  isAdmin = false,
  onNavigate
}: {
  isAdmin?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
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

  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

    return (
      <Link
        href={item.href}
        onClick={onNavigate}
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
    <>
      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
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

        {/* Admin Section - Only show for admins */}
        {isAdmin && (
          <div className="pt-4 border-t mt-4">
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
                  <CollapsibleTrigger
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label={`${expandedOwners.has(shared.owner.id) ? 'Collapse' : 'Expand'} shared content from ${shared.owner.fullName || shared.owner.email}`}
                    aria-expanded={expandedOwners.has(shared.owner.id)}
                  >
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
export function Sidebar({ isAdmin = false }: SidebarProps) {
  return (
    <aside className="hidden md:flex h-screen w-64 flex-col border-r bg-background">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href={ROUTES.home} className="flex items-center gap-2 font-semibold">
          <Target className="h-6 w-6 text-primary" />
          <span>Goal Achiever Pro</span>
        </Link>
      </div>

      <SidebarContent isAdmin={isAdmin} />
    </aside>
  );
}

// Mobile Sidebar with Sheet
export function MobileSidebar({ isAdmin = false }: SidebarProps) {
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

          <SidebarContent isAdmin={isAdmin} onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
