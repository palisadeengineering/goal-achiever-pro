'use client';

/**
 * Status Indicator Component
 *
 * Accessible status badge that uses both color AND icons (WCAG 1.4.1 compliance).
 * Information is not conveyed by color alone - each status has a distinct icon.
 */

import * as React from 'react';
import { Check, AlertTriangle, XCircle, Circle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { VariantProps } from 'class-variance-authority';

// Badge variant type extracted from existing badge component
type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' | 'purple' | 'primary-soft';

/**
 * KPI status values from the progress cache
 */
export type KpiStatus =
  | 'not_started'
  | 'in_progress'
  | 'on_track'
  | 'at_risk'
  | 'behind'
  | 'completed';

/**
 * Configuration for each status type
 * Exported for reuse in other components that need status information
 */
export const statusConfig: Record<
  KpiStatus,
  {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    variant: BadgeVariant;
    ariaLabel: string;
  }
> = {
  not_started: {
    icon: Circle,
    label: 'Not Started',
    variant: 'secondary',
    ariaLabel: 'Status: Not Started',
  },
  in_progress: {
    icon: Circle,
    label: 'In Progress',
    variant: 'info',
    ariaLabel: 'Status: In Progress',
  },
  on_track: {
    icon: Check,
    label: 'On Track',
    variant: 'success',
    ariaLabel: 'Status: On Track',
  },
  at_risk: {
    icon: AlertTriangle,
    label: 'At Risk',
    variant: 'warning',
    ariaLabel: 'Status: At Risk',
  },
  behind: {
    icon: XCircle,
    label: 'Behind',
    variant: 'destructive',
    ariaLabel: 'Status: Behind',
  },
  completed: {
    icon: Check,
    label: 'Complete',
    variant: 'success',
    ariaLabel: 'Status: Complete',
  },
};

/**
 * Normalize status string to a valid KpiStatus
 * Handles unknown values and edge cases
 */
function normalizeStatus(status: string): KpiStatus {
  const normalized = status.toLowerCase().trim();

  // Direct mapping for valid statuses
  if (normalized in statusConfig) {
    return normalized as KpiStatus;
  }

  // Handle common variations
  switch (normalized) {
    case 'complete':
      return 'completed';
    case 'started':
    case 'active':
      return 'in_progress';
    case 'delayed':
    case 'late':
      return 'behind';
    case 'warning':
      return 'at_risk';
    default:
      return 'not_started';
  }
}

export interface StatusIndicatorProps {
  /** Raw status string from KPI (will be normalized) */
  status: string;
  /** Show text label alongside icon (default: false for compact view) */
  showLabel?: boolean;
  /** Badge size variant */
  size?: 'sm' | 'default' | 'lg';
  /** Additional CSS classes */
  className?: string;
}

/**
 * Accessible status indicator component
 *
 * Uses both color and icons for WCAG 1.4.1 compliance (color is not the only
 * visual means of conveying information).
 *
 * @example
 * ```tsx
 * // Compact icon-only view
 * <StatusIndicator status="on_track" />
 *
 * // With label
 * <StatusIndicator status="at_risk" showLabel />
 *
 * // Small size
 * <StatusIndicator status="completed" size="sm" />
 * ```
 */
export function StatusIndicator({
  status,
  showLabel = false,
  size = 'default',
  className,
}: StatusIndicatorProps) {
  const normalizedStatus = normalizeStatus(status);
  const config = statusConfig[normalizedStatus];
  const Icon = config.icon;

  // For in_progress, use a filled circle by adding styling
  const iconClassName = cn(
    'shrink-0',
    normalizedStatus === 'in_progress' && 'fill-current'
  );

  return (
    <Badge
      variant={config.variant}
      size={size}
      aria-label={config.ariaLabel}
      className={cn(
        // Ensure proper sizing for icon-only badges
        !showLabel && 'px-1.5',
        className
      )}
    >
      <Icon className={iconClassName} aria-hidden="true" />
      {showLabel && <span>{config.label}</span>}
    </Badge>
  );
}
