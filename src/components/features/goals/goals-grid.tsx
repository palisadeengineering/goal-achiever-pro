'use client';

import { GoalCard, GoalCardProps } from './goal-card';

interface GoalsGridProps {
  goals: Omit<GoalCardProps, 'onEdit' | 'onDelete' | 'onSetFocus'>[];
  focusedGoalId?: string;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onSetFocus?: (id: string) => void;
  emptyMessage?: string;
}

export function GoalsGrid({
  goals,
  focusedGoalId,
  onEdit,
  onDelete,
  onSetFocus,
  emptyMessage = 'No milestones found. Create your first milestone to get started!',
}: GoalsGridProps) {
  if (goals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <svg
            className="h-8 w-8 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </div>
        <p className="text-muted-foreground max-w-sm">{emptyMessage}</p>
      </div>
    );
  }

  // Sort goals: focused first, then by status (active > paused > completed), then by progress
  const sortedGoals = [...goals].sort((a, b) => {
    // Focused goal first
    if (a.id === focusedGoalId) return -1;
    if (b.id === focusedGoalId) return 1;

    // Status priority
    const statusPriority = { active: 0, paused: 1, completed: 2, archived: 3 };
    const statusDiff = statusPriority[a.status] - statusPriority[b.status];
    if (statusDiff !== 0) return statusDiff;

    // Progress (lower progress = needs attention)
    return a.progressPercentage - b.progressPercentage;
  });

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {sortedGoals.map((goal) => (
        <GoalCard
          key={goal.id}
          {...goal}
          isFocused={goal.id === focusedGoalId}
          onEdit={onEdit}
          onDelete={onDelete}
          onSetFocus={onSetFocus}
        />
      ))}
    </div>
  );
}
