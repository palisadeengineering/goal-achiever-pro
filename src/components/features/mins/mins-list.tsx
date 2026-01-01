'use client';

import { MinItem, MinItemProps } from './min-item';

interface MinsListProps {
  mins: Omit<MinItemProps, 'onToggleComplete' | 'onEdit' | 'onDelete' | 'onStartPomodoro'>[];
  onToggleComplete: (id: string, completed: boolean) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onStartPomodoro?: (id: string) => void;
  emptyMessage?: string;
  showDraggable?: boolean;
}

export function MinsList({
  mins,
  onToggleComplete,
  onEdit,
  onDelete,
  onStartPomodoro,
  emptyMessage = 'No MINS scheduled. Add your most important next steps!',
  showDraggable = false,
}: MinsListProps) {
  if (mins.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
          <svg
            className="h-6 w-6 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
            />
          </svg>
        </div>
        <p className="text-muted-foreground max-w-sm">{emptyMessage}</p>
      </div>
    );
  }

  // Sort by priority, then by scheduled time
  const sortedMins = [...mins].sort((a, b) => {
    // Completed items go to the bottom
    if (a.status === 'completed' && b.status !== 'completed') return 1;
    if (a.status !== 'completed' && b.status === 'completed') return -1;

    // In progress items go to top
    if (a.status === 'in_progress' && b.status !== 'in_progress') return -1;
    if (a.status !== 'in_progress' && b.status === 'in_progress') return 1;

    // Then by priority
    if (a.priority !== b.priority) return a.priority - b.priority;

    // Then by scheduled time
    if (a.scheduledTime && b.scheduledTime) {
      return a.scheduledTime.localeCompare(b.scheduledTime);
    }
    if (a.scheduledTime) return -1;
    if (b.scheduledTime) return 1;

    return 0;
  });

  return (
    <div className="space-y-2">
      {sortedMins.map((min) => (
        <MinItem
          key={min.id}
          {...min}
          onToggleComplete={onToggleComplete}
          onEdit={onEdit}
          onDelete={onDelete}
          onStartPomodoro={onStartPomodoro}
          isDraggable={showDraggable}
        />
      ))}
    </div>
  );
}
