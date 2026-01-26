'use client';

/**
 * Progress Filters Component
 *
 * Filter controls for the Progress page allowing users to filter
 * by vision, status, and date range.
 */

import { Filter } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface ProgressFiltersState {
  visionId: string | null;
  status: 'all' | 'on-track' | 'at-risk' | 'behind';
  dateRange: 'all' | 'this-quarter' | 'this-month' | 'this-week';
}

interface Vision {
  id: string;
  title: string;
  color: string;
}

interface ProgressFiltersProps {
  filters: ProgressFiltersState;
  onFiltersChange: (filters: ProgressFiltersState) => void;
  visions: Vision[];
  className?: string;
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'on-track', label: 'On Track' },
  { value: 'at-risk', label: 'At Risk' },
  { value: 'behind', label: 'Behind' },
] as const;

const DATE_RANGE_OPTIONS = [
  { value: 'all', label: 'All Time' },
  { value: 'this-quarter', label: 'This Quarter' },
  { value: 'this-month', label: 'This Month' },
  { value: 'this-week', label: 'This Week' },
] as const;

export function ProgressFilters({
  filters,
  onFiltersChange,
  visions,
  className,
}: ProgressFiltersProps) {
  const hasActiveFilters =
    filters.visionId !== null ||
    filters.status !== 'all' ||
    filters.dateRange !== 'all';

  const handleVisionChange = (value: string) => {
    onFiltersChange({
      ...filters,
      visionId: value === 'all' ? null : value,
    });
  };

  const handleStatusChange = (value: string) => {
    onFiltersChange({
      ...filters,
      status: value as ProgressFiltersState['status'],
    });
  };

  const handleDateRangeChange = (value: string) => {
    onFiltersChange({
      ...filters,
      dateRange: value as ProgressFiltersState['dateRange'],
    });
  };

  const handleReset = () => {
    onFiltersChange({
      visionId: null,
      status: 'all',
      dateRange: 'all',
    });
  };

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <Filter className="h-4 w-4 text-muted-foreground" />

      {/* Vision Filter */}
      <Select
        value={filters.visionId || 'all'}
        onValueChange={handleVisionChange}
      >
        <SelectTrigger className="w-[160px] h-8 text-sm">
          <SelectValue placeholder="All Visions" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Visions</SelectItem>
          {visions.map(vision => (
            <SelectItem key={vision.id} value={vision.id}>
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: vision.color }}
                />
                <span className="truncate">{vision.title}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Status Filter */}
      <Select
        value={filters.status}
        onValueChange={handleStatusChange}
      >
        <SelectTrigger className="w-[120px] h-8 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Date Range Filter */}
      <Select
        value={filters.dateRange}
        onValueChange={handleDateRangeChange}
      >
        <SelectTrigger className="w-[130px] h-8 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {DATE_RANGE_OPTIONS.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Reset Button */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="h-8 px-2 text-xs"
        >
          Reset
        </Button>
      )}

      {/* Active Filters Count */}
      {hasActiveFilters && (
        <Badge variant="secondary" className="text-xs">
          {[
            filters.visionId !== null,
            filters.status !== 'all',
            filters.dateRange !== 'all',
          ].filter(Boolean).length} active
        </Badge>
      )}
    </div>
  );
}
