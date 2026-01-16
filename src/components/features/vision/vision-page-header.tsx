'use client';

import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { LayoutGrid, Columns3, Plus } from 'lucide-react';
import { ShareButton } from '@/components/features/sharing';

interface VisionPageHeaderProps {
  viewMode: 'grid' | 'kanban';
  onViewModeChange: (mode: 'grid' | 'kanban') => void;
  onCreateNew: () => void;
}

export function VisionPageHeader({
  viewMode,
  onViewModeChange,
  onCreateNew,
}: VisionPageHeaderProps) {
  return (
    <div className="flex items-start justify-between">
      <PageHeader
        title="Vision"
        description="Define your north star - the big picture goals that guide everything"
      />
      <div className="flex items-center gap-3">
        {/* View Toggle */}
        <ToggleGroup
          type="single"
          value={viewMode}
          onValueChange={(value: string) => {
            if (value) onViewModeChange(value as 'grid' | 'kanban');
          }}
          className="border rounded-lg p-1"
        >
          <ToggleGroupItem
            value="grid"
            aria-label="Grid view"
            className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            <LayoutGrid className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem
            value="kanban"
            aria-label="Kanban view"
            className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            <Columns3 className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>

        <ShareButton tabName="vision" />

        <Button onClick={onCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          Create Vision
        </Button>
      </div>
    </div>
  );
}
