# Phase 6: Tree UI - Research

**Researched:** 2026-01-24
**Domain:** React Tree View Components, Accessibility, Hierarchical Navigation UI
**Confidence:** HIGH

## Summary

This phase involves building a full collapsible tree UI for navigating the goal hierarchy (Vision > Quarterly > Monthly > Weekly > Daily KPIs). The existing codebase has a minimal flat-list proof-of-concept (`KpiTreeWidget`) that flattens the tree for simple rendering. Phase 6 requires a proper nested tree with expand/collapse, progress bars, status indicators, breadcrumbs, progressive disclosure (2-3 levels visible), and full keyboard navigation.

The research found that **building a custom accessible tree using Radix Collapsible + custom keyboard handling is the best approach** for this project. The existing shadcn/ui Collapsible component is already installed (`@radix-ui/react-collapsible@1.1.12`), and the project already has all needed UI primitives (Progress, Badge). Third-party tree libraries like react-arborist are overkill for this use case since we don't need virtualization (goal trees are typically small), drag-and-drop, or file-system-like operations.

**Primary recommendation:** Build a custom `<GoalTreeView>` component using nested Radix Collapsible components with roving tabindex for keyboard navigation, leveraging existing shadcn/ui Progress and Badge components for progress bars and status indicators.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @radix-ui/react-collapsible | 1.1.12 | Expand/collapse tree nodes | Already installed, WAI-ARIA Disclosure pattern compliant |
| @radix-ui/react-progress | 1.1.8 | Progress bars on each node | Already installed, semantic progress element |
| shadcn/ui Breadcrumb | latest | Path navigation from Vision to current item | Official shadcn component, ARIA compliant |
| lucide-react | 0.562.0 | Icons (ChevronRight, Check, AlertCircle, etc.) | Already in project |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| class-variance-authority | 0.7.1 | Status indicator variants | Already used for Badge variants |
| tailwind-merge | 3.4.0 | Conditional class merging | Already in project via `cn()` utility |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom tree | react-arborist | Overkill - adds virtualization, drag-drop we don't need; 15KB+ bundle |
| Custom tree | MrLightful's shadcn-tree-view | External registry dependency; designed for file trees not goal hierarchies |
| Custom tree | react-accessible-treeview | Good accessibility but less control over styling; requires learning new API |
| Custom tree | @react-aria/tree | Adobe's React Aria - comprehensive but heavy; better for complex apps |

**Installation:**
```bash
# Breadcrumb component (not currently installed)
npx shadcn@latest add breadcrumb
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   ├── features/
│   │   └── kpi/
│   │       ├── goal-tree-view.tsx      # Main tree component
│   │       ├── goal-tree-node.tsx      # Individual node with expand/collapse
│   │       ├── goal-tree-breadcrumb.tsx # Breadcrumb navigation
│   │       ├── goal-tree-context.tsx   # Context for expanded state, selection
│   │       ├── status-indicator.tsx    # On-track/at-risk/behind indicator
│   │       └── kpi-tree-widget.tsx     # Existing (will be replaced/enhanced)
│   └── ui/
│       └── breadcrumb.tsx              # shadcn component (to be added)
```

### Pattern 1: Recursive Tree Node Component
**What:** Each `GoalTreeNode` renders itself recursively for children
**When to use:** For nested hierarchical data where depth is variable
**Example:**
```typescript
// Source: Custom pattern based on WAI-ARIA Tree View Pattern
interface GoalTreeNodeProps {
  node: KpiTreeNode;
  level: number;  // For aria-level
  onSelect?: (node: KpiTreeNode) => void;
}

function GoalTreeNode({ node, level, onSelect }: GoalTreeNodeProps) {
  const [isOpen, setIsOpen] = useState(level <= 2); // Progressive disclosure: first 2-3 levels open
  const hasChildren = node.children && node.children.length > 0;

  return (
    <li role="treeitem" aria-level={level} aria-expanded={hasChildren ? isOpen : undefined}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center gap-2">
          {hasChildren && (
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                <ChevronRight className={cn("h-4 w-4 transition-transform", isOpen && "rotate-90")} />
              </Button>
            </CollapsibleTrigger>
          )}
          <div className="flex-1">
            <span>{node.title}</span>
            <Progress value={node.progress} className="h-1.5" />
            <StatusIndicator status={node.status} />
          </div>
        </div>
        {hasChildren && (
          <CollapsibleContent>
            <ul role="group">
              {node.children.map((child, index) => (
                <GoalTreeNode
                  key={child.id}
                  node={child}
                  level={level + 1}
                  onSelect={onSelect}
                />
              ))}
            </ul>
          </CollapsibleContent>
        )}
      </Collapsible>
    </li>
  );
}
```

### Pattern 2: Roving Tabindex for Keyboard Navigation
**What:** Only one tree item has tabindex="0" at a time; arrow keys move focus
**When to use:** Required for WAI-ARIA tree view accessibility
**Example:**
```typescript
// Source: GitHub Engineering Blog, W3C ARIA APG
function useRovingTabindex(treeRef: RefObject<HTMLElement>) {
  const [focusedId, setFocusedId] = useState<string | null>(null);

  useEffect(() => {
    const tree = treeRef.current;
    if (!tree) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const items = tree.querySelectorAll('[role="treeitem"]');
      const currentIndex = Array.from(items).findIndex(
        item => item.getAttribute('data-id') === focusedId
      );

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          // Move to next visible treeitem
          const next = getNextVisibleItem(items, currentIndex);
          if (next) setFocusedId(next.getAttribute('data-id'));
          break;
        case 'ArrowUp':
          e.preventDefault();
          // Move to previous visible treeitem
          const prev = getPrevVisibleItem(items, currentIndex);
          if (prev) setFocusedId(prev.getAttribute('data-id'));
          break;
        case 'ArrowRight':
          e.preventDefault();
          // If closed, expand; if open, move to first child
          handleExpandOrMoveToChild(focusedId);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          // If open, collapse; if closed/leaf, move to parent
          handleCollapseOrMoveToParent(focusedId);
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          // Toggle expand/collapse
          toggleExpanded(focusedId);
          break;
        case 'Home':
          e.preventDefault();
          setFocusedId(items[0]?.getAttribute('data-id') ?? null);
          break;
        case 'End':
          e.preventDefault();
          setFocusedId(items[items.length - 1]?.getAttribute('data-id') ?? null);
          break;
      }
    };

    tree.addEventListener('keydown', handleKeyDown);
    return () => tree.removeEventListener('keydown', handleKeyDown);
  }, [focusedId]);

  return { focusedId, setFocusedId };
}
```

### Pattern 3: Context-Based State Management
**What:** Use React Context to share expanded state across tree
**When to use:** When multiple components need access to tree expansion/selection state
**Example:**
```typescript
// Source: Standard React pattern
interface GoalTreeContextValue {
  expandedIds: Set<string>;
  toggleExpanded: (id: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  focusedId: string | null;
  setFocusedId: (id: string | null) => void;
}

const GoalTreeContext = createContext<GoalTreeContextValue | null>(null);

function GoalTreeProvider({ children, defaultExpanded }: Props) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(defaultExpanded ?? [])
  );

  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // ... rest of implementation
}
```

### Pattern 4: Breadcrumb Path Derivation
**What:** Derive breadcrumb path from selected node by traversing parentKpiId chain
**When to use:** For TREE-04 breadcrumb navigation requirement
**Example:**
```typescript
// Source: Custom utility based on existing KpiTreeNode structure
function deriveBreadcrumbPath(
  selectedId: string | null,
  tree: KpiTreeNode[],
  visionTitle: string
): BreadcrumbItem[] {
  if (!selectedId) return [{ id: 'vision', label: visionTitle }];

  const path: BreadcrumbItem[] = [{ id: 'vision', label: visionTitle }];

  function findPath(nodes: KpiTreeNode[], targetId: string): KpiTreeNode[] | null {
    for (const node of nodes) {
      if (node.id === targetId) return [node];
      if (node.children?.length) {
        const childPath = findPath(node.children, targetId);
        if (childPath) return [node, ...childPath];
      }
    }
    return null;
  }

  const nodePath = findPath(tree, selectedId);
  if (nodePath) {
    path.push(...nodePath.map(n => ({ id: n.id, label: n.title, level: n.level })));
  }

  return path;
}
```

### Anti-Patterns to Avoid
- **Flattening the tree for rendering:** The current `KpiTreeWidget` flattens the tree. This loses semantic hierarchy and makes keyboard navigation harder. Use recursive rendering instead.
- **Using `div` instead of `ul`/`li`:** Screen readers rely on list semantics. Always use semantic HTML.
- **Putting tabindex on every item:** Use roving tabindex (only one item has tabindex="0"). This matches user expectations from desktop file explorers.
- **Color-only status indicators:** WCAG 1.4.1 requires information not to be conveyed by color alone. Always pair colors with icons or text.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Collapsible animation | CSS transitions manually | Radix Collapsible + CSS variables | Handles height animation, accessibility states, proper aria-expanded |
| Progress bar | Custom div-based | shadcn/ui Progress (Radix) | Semantic `<progress>` element, proper ARIA |
| Breadcrumb navigation | Custom link chain | shadcn/ui Breadcrumb | Proper `<nav>`, `<ol>`, ARIA landmark, separator handling |
| Status colors | Inline color logic | Badge variants (already defined) | Consistent theming, dark mode support |
| Keyboard focus management | Manual focus() calls | Roving tabindex hook | Handles complex cases like collapsing focused children |

**Key insight:** The goal tree UI has well-established accessibility patterns (WAI-ARIA Tree View Pattern). The complexity is in keyboard navigation and ARIA attributes, not in the visual components themselves. Using Radix primitives handles the hard accessibility work.

## Common Pitfalls

### Pitfall 1: Missing ARIA Attributes
**What goes wrong:** Screen readers cannot navigate or understand tree structure
**Why it happens:** Developers focus on visual functionality, forget assistive tech
**How to avoid:** Explicitly add: `role="tree"` on root, `role="treeitem"` on items, `role="group"` on nested lists, `aria-expanded` on expandable items, `aria-level` for depth
**Warning signs:** Testing with VoiceOver/NVDA produces confusing announcements

### Pitfall 2: Color-Only Status Indicators
**What goes wrong:** Colorblind users (8% of males) cannot distinguish on-track vs at-risk vs behind
**Why it happens:** Red/yellow/green is intuitive visual shorthand
**How to avoid:** Pair colors with icons (check for on-track, warning triangle for at-risk, X for behind) and text labels
**Warning signs:** Checking design in grayscale mode, colors become indistinguishable

### Pitfall 3: Breaking Progressive Disclosure
**What goes wrong:** User opens level 3 node, all 50 children appear at once, overwhelming UI
**Why it happens:** Not implementing "show more" pattern for deeply nested items
**How to avoid:** Cap visible children at 5-10 per level; add "Show N more" button to load rest
**Warning signs:** Trees with many children render slowly, scrolling becomes tedious

### Pitfall 4: Focus Trap on Collapse
**What goes wrong:** User has focus on child node, collapses parent, focus is lost
**Why it happens:** Not handling focus management during collapse
**How to avoid:** When collapsing a node, move focus to that node (parent), not leave it on hidden child
**Warning signs:** After collapse, pressing Tab jumps to unexpected element

### Pitfall 5: Not Handling Empty States
**What goes wrong:** Tree shows blank area when no KPIs exist or all are filtered out
**Why it happens:** Only happy-path testing
**How to avoid:** Show clear empty state message with action to create KPIs
**Warning signs:** Users confused by blank widget

### Pitfall 6: Performance with Large Trees
**What goes wrong:** Re-renders entire tree on any state change
**Why it happens:** Not memoizing node components
**How to avoid:** Use `React.memo` on `GoalTreeNode`, ensure stable references with `useCallback`
**Warning signs:** Profiler shows full tree re-renders on single node expansion

## Code Examples

### Status Indicator with Accessible Colors + Icons
```typescript
// Source: Custom implementation following WCAG 1.4.1
import { Check, AlertTriangle, XCircle, Circle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type KpiStatus = 'not_started' | 'in_progress' | 'at_risk' | 'on_track' | 'completed';

const statusConfig: Record<KpiStatus, {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive';
  ariaLabel: string;
}> = {
  not_started: {
    icon: Circle,
    label: 'Not Started',
    variant: 'secondary',
    ariaLabel: 'Status: Not started'
  },
  in_progress: {
    icon: Circle,
    label: 'In Progress',
    variant: 'default',
    ariaLabel: 'Status: In progress'
  },
  on_track: {
    icon: Check,
    label: 'On Track',
    variant: 'success',
    ariaLabel: 'Status: On track'
  },
  at_risk: {
    icon: AlertTriangle,
    label: 'At Risk',
    variant: 'warning',
    ariaLabel: 'Status: At risk'
  },
  completed: {
    icon: Check,
    label: 'Complete',
    variant: 'success',
    ariaLabel: 'Status: Completed'
  },
};

// Map 'behind' to 'at_risk' styling since backend uses different terminology
const normalizeStatus = (status: string): KpiStatus => {
  if (status === 'behind') return 'at_risk';
  return (status as KpiStatus) || 'not_started';
};

interface StatusIndicatorProps {
  status: string;
  showLabel?: boolean;
  className?: string;
}

export function StatusIndicator({ status, showLabel = false, className }: StatusIndicatorProps) {
  const normalizedStatus = normalizeStatus(status);
  const config = statusConfig[normalizedStatus];
  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      className={cn('gap-1', className)}
      aria-label={config.ariaLabel}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {showLabel && <span>{config.label}</span>}
    </Badge>
  );
}
```

### Breadcrumb from Goal Path
```typescript
// Source: shadcn/ui Breadcrumb pattern
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { KpiTreeNode } from '@/lib/progress';
import { Fragment } from 'react';

interface GoalTreeBreadcrumbProps {
  path: Array<{ id: string; label: string; level?: string }>;
  onNavigate: (id: string) => void;
}

export function GoalTreeBreadcrumb({ path, onNavigate }: GoalTreeBreadcrumbProps) {
  if (path.length === 0) return null;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {path.map((item, index) => {
          const isLast = index === path.length - 1;

          return (
            <Fragment key={item.id}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate(item.id);
                    }}
                  >
                    {item.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
```

### Progress Bar with Color-Coded Status
```typescript
// Source: Existing Progress component enhanced
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface StatusProgressProps {
  progress: number;
  status: string;
  className?: string;
}

export function StatusProgress({ progress, status, className }: StatusProgressProps) {
  // Color-code the progress bar based on status
  const indicatorColor = {
    on_track: 'bg-cyan-500 dark:bg-cyan-400',
    at_risk: 'bg-amber-500 dark:bg-amber-400',
    behind: 'bg-red-500 dark:bg-red-400',
    completed: 'bg-cyan-500 dark:bg-cyan-400',
    in_progress: 'bg-primary',
    not_started: 'bg-muted-foreground',
  }[status] || 'bg-primary';

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Progress
        value={progress}
        className="h-1.5 flex-1 [&>[data-slot=progress-indicator]]:bg-current"
        style={{ color: 'var(--progress-color)' }}
      />
      <span className="text-xs text-muted-foreground w-10 text-right">
        {Math.round(progress)}%
      </span>
    </div>
  );
}
```

### Complete TreeItem with Keyboard Support
```typescript
// Source: WAI-ARIA Tree View Pattern implementation
'use client';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { KpiTreeNode } from '@/lib/progress';
import { StatusIndicator } from './status-indicator';
import { StatusProgress } from './status-progress';
import { useGoalTreeContext } from './goal-tree-context';

interface GoalTreeNodeProps {
  node: KpiTreeNode;
  level: number;
  posInSet: number;
  setSize: number;
}

export function GoalTreeNode({ node, level, posInSet, setSize }: GoalTreeNodeProps) {
  const {
    expandedIds,
    toggleExpanded,
    focusedId,
    setFocusedId,
    selectedId,
    setSelectedId
  } = useGoalTreeContext();

  const isExpanded = expandedIds.has(node.id);
  const isFocused = focusedId === node.id;
  const isSelected = selectedId === node.id;
  const hasChildren = node.children && node.children.length > 0;

  // Progressive disclosure: limit initial visible levels
  const showChildren = isExpanded && level < 5;

  return (
    <li
      role="treeitem"
      aria-level={level}
      aria-setsize={setSize}
      aria-posinset={posInSet}
      aria-expanded={hasChildren ? isExpanded : undefined}
      aria-selected={isSelected}
      data-id={node.id}
      tabIndex={isFocused ? 0 : -1}
      onFocus={() => setFocusedId(node.id)}
      onClick={() => setSelectedId(node.id)}
      className={cn(
        'outline-none',
        isFocused && 'ring-2 ring-ring ring-offset-2',
        isSelected && 'bg-accent'
      )}
    >
      <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(node.id)}>
        <div
          className="flex items-center gap-2 py-2 px-2 rounded-md hover:bg-accent/50 cursor-pointer"
          style={{ paddingLeft: `${(level - 1) * 16 + 8}px` }}
        >
          {/* Expand/Collapse trigger */}
          {hasChildren ? (
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                aria-label={isExpanded ? 'Collapse' : 'Expand'}
              >
                <ChevronRight
                  className={cn(
                    'h-4 w-4 transition-transform duration-200',
                    isExpanded && 'rotate-90'
                  )}
                />
              </Button>
            </CollapsibleTrigger>
          ) : (
            <span className="w-6" /> // Spacer for alignment
          )}

          {/* Node content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm truncate">{node.title}</span>
              <StatusIndicator status={node.status} />
            </div>
            <StatusProgress progress={node.progress} status={node.status} className="mt-1" />
          </div>
        </div>

        {/* Children */}
        {hasChildren && showChildren && (
          <CollapsibleContent>
            <ul role="group" className="border-l border-border ml-4">
              {node.children.map((child, index) => (
                <GoalTreeNode
                  key={child.id}
                  node={child}
                  level={level + 1}
                  posInSet={index + 1}
                  setSize={node.children.length}
                />
              ))}
            </ul>
          </CollapsibleContent>
        )}

        {/* Show more for deep nesting */}
        {hasChildren && level >= 5 && !isExpanded && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-8 text-xs"
            onClick={() => toggleExpanded(node.id)}
          >
            Show {node.children.length} nested items...
          </Button>
        )}
      </Collapsible>
    </li>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| aria-activedescendant for focus | Roving tabindex | 2024 (GitHub's findings) | Better VoiceOver support on macOS/iOS |
| Semantic HTML ignored | ul/li with ARIA roles | WAI-ARIA 1.2 (2023) | Screen readers automatically calculate aria-setsize, aria-posinset |
| Color-only status | Color + icon + text | WCAG 2.1 (2018) | Required for 1.4.1 compliance, 8% male colorblindness |
| Manual expand animation | Radix CSS variables | Radix 1.x (2023) | --radix-collapsible-content-height enables smooth animation |

**Deprecated/outdated:**
- **react-treebeard**: Unmaintained since 2020, doesn't support React 18/19
- **rc-tree**: Works but heavy, designed for Ant Design ecosystem
- **aria-activedescendant for trees**: GitHub found it doesn't work well with VoiceOver

## Open Questions

1. **Whether to show progress formula on hover/click**
   - What we know: KpiTreeNode has `formula?: ProgressFormula` field
   - What's unclear: Should this be a tooltip, popover, or separate detail view?
   - Recommendation: Start with tooltip on progress bar showing formula string

2. **Checkbox behavior for leaf nodes**
   - What we know: Current widget has checkbox for marking KPIs complete
   - What's unclear: Should checkboxes appear on all nodes or just leaves?
   - Recommendation: Only show on leaf nodes (daily actions) since parent progress is calculated

3. **Animation timing for expand/collapse**
   - What we know: Radix supports CSS animation via --radix-collapsible-content-height
   - What's unclear: Optimal duration for tree expand/collapse
   - Recommendation: Use 200ms - fast enough not to feel sluggish, slow enough to track visually

## Sources

### Primary (HIGH confidence)
- [W3C WAI-ARIA Tree View Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/) - Complete keyboard navigation spec
- [Radix Collapsible Documentation](https://www.radix-ui.com/primitives/docs/components/collapsible) - Component API
- [shadcn/ui Breadcrumb](https://ui.shadcn.com/docs/components/breadcrumb) - Breadcrumb component
- [GitHub Engineering: Accessible Tree View](https://github.blog/engineering/user-experience/considerations-for-making-a-tree-view-component-accessible/) - Roving tabindex implementation

### Secondary (MEDIUM confidence)
- [WCAG 2.1 Success Criterion 1.4.1: Use of Color](https://www.w3.org/WAI/WCAG21/Understanding/use-of-color.html) - Color accessibility
- [react-arborist GitHub](https://github.com/brimdata/react-arborist) - Reference for features (not recommended for use)
- [MrLightful shadcn-tree-view](https://github.com/MrLightful/shadcn-tree-view) - Alternative approach

### Tertiary (LOW confidence)
- WebSearch results for "react tree view 2026 best practices" - Community patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All components already installed except Breadcrumb; well-documented
- Architecture: HIGH - WAI-ARIA patterns are well-specified, GitHub's implementation guide is authoritative
- Pitfalls: HIGH - Accessibility issues are well-documented in WCAG and WAI-ARIA resources
- Code examples: MEDIUM - Custom implementations based on patterns, not copy-pasted from working code

**Research date:** 2026-01-24
**Valid until:** 2026-02-24 (30 days - patterns are stable)
