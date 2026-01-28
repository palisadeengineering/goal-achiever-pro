'use client';

import { useState, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { VALUE_QUADRANTS } from '@/constants/drip';
import { Users, Cog, TrendingUp, Zap, GripVertical, MinusCircle } from 'lucide-react';
import type { ValueQuadrant } from '@/types/database';

interface ValueItem {
  id: string;
  title: string;
  description?: string;
  quadrant: ValueQuadrant;
  timeSpent?: number; // minutes
}

interface ValueMatrixProps {
  items: ValueItem[];
  onItemMove?: (itemId: string, newQuadrant: ValueQuadrant) => void;
  readonly?: boolean;
}

const QUADRANT_ICONS: Record<ValueQuadrant, typeof Users> = {
  delegation: Users,
  replacement: Cog,
  investment: TrendingUp,
  production: Zap,
  na: MinusCircle,
};

function SortableItem({ item, readonly }: { item: ValueItem; readonly?: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled: readonly });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'bg-background border rounded-lg p-3 shadow-sm',
        isDragging && 'opacity-50',
        !readonly && 'cursor-grab active:cursor-grabbing'
      )}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start gap-2">
        {!readonly && (
          <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{item.title}</p>
          {item.description && (
            <p className="text-xs text-muted-foreground truncate">{item.description}</p>
          )}
          {item.timeSpent && (
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round(item.timeSpent / 60)}h this week
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function ItemOverlay({ item }: { item: ValueItem }) {
  return (
    <div className="bg-background border rounded-lg p-3 shadow-lg cursor-grabbing">
      <div className="flex items-start gap-2">
        <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{item.title}</p>
          {item.description && (
            <p className="text-xs text-muted-foreground truncate">{item.description}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Static item component for SSR (no dnd-kit hooks)
function StaticItem({ item }: { item: ValueItem }) {
  return (
    <div className="bg-background border rounded-lg p-3 shadow-sm">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{item.title}</p>
          {item.description && (
            <p className="text-xs text-muted-foreground truncate">{item.description}</p>
          )}
          {item.timeSpent && (
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round(item.timeSpent / 60)}h this week
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function QuadrantBox({
  quadrant,
  items,
  readonly,
  staticMode,
}: {
  quadrant: ValueQuadrant;
  items: ValueItem[];
  readonly?: boolean;
  staticMode?: boolean;
}) {
  const config = VALUE_QUADRANTS[quadrant];
  const Icon = QUADRANT_ICONS[quadrant];

  return (
    <div
      className={cn(
        'rounded-xl border-2 p-4 min-h-[250px] flex flex-col',
        config.borderColor,
        config.bgColor
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        <div
          className="p-1.5 rounded-lg"
          style={{ backgroundColor: config.color + '20' }}
        >
          <Icon className="h-4 w-4" style={{ color: config.color }} />
        </div>
        <div>
          <h3 className="font-semibold text-sm">{config.name}</h3>
          <p className="text-xs text-muted-foreground">{config.action}</p>
        </div>
        <Badge
          variant="secondary"
          className="ml-auto"
          style={{ backgroundColor: config.color + '20', color: config.color }}
        >
          {items.length}
        </Badge>
      </div>

      {staticMode ? (
        /* Static render without dnd-kit to avoid hydration mismatch */
        <div className="flex-1 space-y-2 overflow-y-auto">
          {items.map((item) => (
            <StaticItem key={item.id} item={item} />
          ))}
          {items.length === 0 && (
            <div className="flex items-center justify-center h-20 text-xs text-muted-foreground border-2 border-dashed rounded-lg">
              No items
            </div>
          )}
        </div>
      ) : (
        <SortableContext
          items={items.map((i) => i.id)}
          strategy={rectSortingStrategy}
        >
          <div className="flex-1 space-y-2 overflow-y-auto">
            {items.map((item) => (
              <SortableItem key={item.id} item={item} readonly={readonly} />
            ))}
            {items.length === 0 && (
              <div className="flex items-center justify-center h-20 text-xs text-muted-foreground border-2 border-dashed rounded-lg">
                {readonly ? 'No items' : 'Drag items here'}
              </div>
            )}
          </div>
        </SortableContext>
      )}
    </div>
  );
}

export function ValueMatrix({ items, onItemMove, readonly = false }: ValueMatrixProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Prevent hydration mismatch with dnd-kit by only rendering DnD after mount
  useEffect(() => {
    setIsMounted(true); // eslint-disable-line react-hooks/set-state-in-effect
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const activeItem = activeId ? items.find((i) => i.id === activeId) : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    // Determine which quadrant the item was dropped into
    // This is simplified - in real implementation you'd detect the drop zone
    const draggedItem = items.find((i) => i.id === active.id);
    if (draggedItem && onItemMove) {
      // Logic to determine new quadrant based on drop position
      // For now, we'll handle this through the over element's data
    }
  };

  const getItemsByQuadrant = (quadrant: ValueQuadrant) =>
    items.filter((item) => item.quadrant === quadrant);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Value Matrix</span>
          <div className="flex items-center gap-4 text-sm font-normal text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="text-xs">←</span> Lights You Up <span className="text-xs">→</span>
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Y-axis label */}
        <div className="flex">
          <div className="flex flex-col items-center justify-center w-8 mr-2">
            <span className="text-xs text-muted-foreground rotate-180 [writing-mode:vertical-lr]">
              Makes You Money →
            </span>
          </div>

          {/* Matrix Grid */}
          <div className="flex-1">
            {isMounted ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <div className="grid grid-cols-2 gap-4">
                  {/* Top Row: High Money */}
                  <QuadrantBox
                    quadrant="replacement"
                    items={getItemsByQuadrant('replacement')}
                    readonly={readonly}
                  />
                  <QuadrantBox
                    quadrant="production"
                    items={getItemsByQuadrant('production')}
                    readonly={readonly}
                  />

                  {/* Bottom Row: Low Money */}
                  <QuadrantBox
                    quadrant="delegation"
                    items={getItemsByQuadrant('delegation')}
                    readonly={readonly}
                  />
                  <QuadrantBox
                    quadrant="investment"
                    items={getItemsByQuadrant('investment')}
                    readonly={readonly}
                  />
                </div>

                <DragOverlay>
                  {activeItem && <ItemOverlay item={activeItem} />}
                </DragOverlay>
              </DndContext>
            ) : (
              /* Static render for SSR - no DnD to avoid hydration mismatch */
              <div className="grid grid-cols-2 gap-4">
                <QuadrantBox
                  quadrant="replacement"
                  items={getItemsByQuadrant('replacement')}
                  staticMode={true}
                />
                <QuadrantBox
                  quadrant="production"
                  items={getItemsByQuadrant('production')}
                  staticMode={true}
                />
                <QuadrantBox
                  quadrant="delegation"
                  items={getItemsByQuadrant('delegation')}
                  staticMode={true}
                />
                <QuadrantBox
                  quadrant="investment"
                  items={getItemsByQuadrant('investment')}
                  staticMode={true}
                />
              </div>
            )}
          </div>
        </div>

        {/* X-axis labels */}
        <div className="flex mt-4 ml-10">
          <div className="flex-1 text-center text-xs text-muted-foreground">
            Low Energy
          </div>
          <div className="flex-1 text-center text-xs text-muted-foreground">
            High Energy
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 p-4 bg-muted/30 rounded-lg">
          <h4 className="text-sm font-medium mb-2">Value Matrix Action Guide</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="flex items-start gap-2">
              <div
                className="h-3 w-3 rounded mt-0.5"
                style={{ backgroundColor: VALUE_QUADRANTS.delegation.color }}
              />
              <div>
                <p className="font-medium">Delegation</p>
                <p className="text-muted-foreground">Delegate to others</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div
                className="h-3 w-3 rounded mt-0.5"
                style={{ backgroundColor: VALUE_QUADRANTS.replacement.color }}
              />
              <div>
                <p className="font-medium">Replacement</p>
                <p className="text-muted-foreground">Automate or systematize</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div
                className="h-3 w-3 rounded mt-0.5"
                style={{ backgroundColor: VALUE_QUADRANTS.investment.color }}
              />
              <div>
                <p className="font-medium">Investment</p>
                <p className="text-muted-foreground">Keep for growth</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div
                className="h-3 w-3 rounded mt-0.5"
                style={{ backgroundColor: VALUE_QUADRANTS.production.color }}
              />
              <div>
                <p className="font-medium">Production</p>
                <p className="text-muted-foreground">Your sweet spot!</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
