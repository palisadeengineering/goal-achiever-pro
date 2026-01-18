'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  MoreVertical,
  Edit,
  Trash2,
  Target,
  Calendar,
  Star,
  ChevronRight
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { ROUTES } from '@/constants/routes';

export interface GoalCardProps {
  id: string;
  title: string;
  description?: string;
  targetDate?: string;
  quarter?: number;
  category?: string;
  progressPercentage: number;
  status: 'active' | 'completed' | 'paused' | 'archived';
  isFocused?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onSetFocus?: (id: string) => void;
}

const statusColors = {
  active: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-200',
  completed: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
  paused: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200',
  archived: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200',
};

const categoryColors: Record<string, string> = {
  health: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200',
  wealth: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-200',
  relationships: 'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-200',
  career: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
  personal: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200',
  business: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200',
};

export function GoalCard({
  id,
  title,
  description,
  targetDate,
  quarter,
  category,
  progressPercentage,
  status,
  isFocused,
  onEdit,
  onDelete,
  onSetFocus,
}: GoalCardProps) {
  const formattedDate = targetDate
    ? new Date(targetDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <Card className={`transition-all hover:shadow-md ${isFocused ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {isFocused && (
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            )}
            <CardTitle className="text-base font-semibold line-clamp-1">
              {title}
            </CardTitle>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onSetFocus && !isFocused && (
                <DropdownMenuItem onClick={() => onSetFocus(id)}>
                  <Star className="h-4 w-4 mr-2" />
                  Set as Focus
                </DropdownMenuItem>
              )}
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(id)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(id)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className={statusColors[status]}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
          {category && (
            <Badge
              variant="outline"
              className={categoryColors[category] || 'bg-gray-100 text-gray-800'}
            >
              {category}
            </Badge>
          )}
          {quarter && (
            <Badge variant="secondary">Q{quarter}</Badge>
          )}
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {formattedDate && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Target: {formattedDate}</span>
          </div>
        )}

        <Link href={ROUTES.goalDetail(id)}>
          <Button variant="ghost" className="w-full justify-between" size="sm">
            View Details
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
