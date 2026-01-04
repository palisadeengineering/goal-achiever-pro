'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Plus, Sparkles } from 'lucide-react';
import { VisionKanbanColumn } from './vision-kanban-column';

interface Vision {
  id: string;
  title: string;
  description: string | null;
  specific: string | null;
  measurable: string | null;
  attainable: string | null;
  realistic: string | null;
  time_bound: string | null;
  clarity_score: number;
  belief_score: number;
  consistency_score: number;
  is_active: boolean;
  color: string | null;
  affirmation_text: string | null;
}

interface BacktrackPlan {
  id: string;
  vision_id: string;
  status: string;
}

interface VisionKanbanViewProps {
  visions: Vision[];
  backtrackPlans: BacktrackPlan[];
  onEditVision: (visionId: string) => void;
  onViewDetails: (visionId: string) => void;
  onCreateNew: () => void;
}

export function VisionKanbanView({
  visions,
  backtrackPlans,
  onEditVision,
  onViewDetails,
  onCreateNew,
}: VisionKanbanViewProps) {
  const getVisionBacktrackPlan = (visionId: string) => {
    return backtrackPlans.find(
      (p) => p.vision_id === visionId && p.status === 'active'
    );
  };

  if (visions.length === 0) {
    // Empty state
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="p-4 bg-primary/10 rounded-full mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Create Your First Vision</h3>
          <p className="text-muted-foreground text-center max-w-md mb-6">
            Define a clear, inspiring vision for your future. Our wizard will guide you
            through setting SMART goals, daily non-negotiables, and more.
          </p>
          <Button onClick={onCreateNew} size="lg">
            <Plus className="h-5 w-5 mr-2" />
            Start Vision Wizard
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="relative">
      <ScrollArea className="w-full pb-4">
        <div className="flex gap-4 min-h-[600px]">
          {/* Vision Columns */}
          {visions.map((vision) => (
            <VisionKanbanColumn
              key={vision.id}
              vision={vision}
              backtrackPlan={getVisionBacktrackPlan(vision.id)}
              onEdit={() => onEditVision(vision.id)}
              onViewDetails={() => onViewDetails(vision.id)}
            />
          ))}

          {/* Add New Vision Column */}
          <div className="flex-shrink-0 w-[320px]">
            <Card
              className="h-full min-h-[400px] border-2 border-dashed hover:border-primary/50 transition-colors cursor-pointer flex items-center justify-center"
              onClick={onCreateNew}
            >
              <CardContent className="flex flex-col items-center gap-3 text-muted-foreground">
                <div className="p-3 bg-muted rounded-full">
                  <Plus className="h-6 w-6" />
                </div>
                <span className="font-medium">Add Another Vision</span>
                <p className="text-xs text-center max-w-[200px]">
                  Create a new vision to track another major goal
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
