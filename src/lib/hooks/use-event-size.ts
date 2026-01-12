'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Size buckets for event cards based on rendered pixel height
 *
 * These match the requirements:
 * - xs: <18px - ultra-compact, single-line title only
 * - sm: 18-28px - single-line title with minimal padding
 * - md: 28-44px - title up to 2 lines
 * - lg: >=44px - full content
 */
export type EventSizeBucket = 'xs' | 'sm' | 'md' | 'lg';

/**
 * CSS class names applied to events for each bucket.
 * These can be inspected in DevTools to verify correct bucket assignment.
 */
export const SIZE_BUCKET_CLASSES: Record<EventSizeBucket, string> = {
  xs: 'timeAuditEvent--xs',
  sm: 'timeAuditEvent--sm',
  md: 'timeAuditEvent--md',
  lg: 'timeAuditEvent--lg',
};

interface UseEventSizeResult {
  ref: React.RefCallback<HTMLDivElement>;
  sizeBucket: EventSizeBucket;
  height: number;
  /** CSS class name for the current bucket - use this in className for DOM verification */
  bucketClass: string;
}

// Size bucket thresholds in pixels (from requirements)
// xs: <18px   → ultra-compact, single-line title only
// sm: 18–28px → single-line title, minimal padding
// md: 28–44px → title up to 2 lines
// lg: ≥44px   → full content
const SIZE_THRESHOLDS = {
  xs: 18,   // < 18px
  sm: 28,   // 18-28px
  md: 44,   // 28-44px
  // lg: >= 44px
} as const;

/**
 * Determines the size bucket based on measured height
 */
function getSizeBucket(height: number): EventSizeBucket {
  if (height < SIZE_THRESHOLDS.xs) return 'xs';
  if (height < SIZE_THRESHOLDS.sm) return 'sm';
  if (height < SIZE_THRESHOLDS.md) return 'md';
  return 'lg';
}

/**
 * Hook that measures the actual rendered height of an event card
 * and returns a size bucket for adaptive rendering.
 *
 * Uses ResizeObserver for accurate measurement that responds to
 * container resizing, zoom changes, etc.
 *
 * @param fallbackHeight - Optional fallback height when element isn't mounted yet
 * @returns Object with ref callback, current size bucket, and measured height
 */
export function useEventSize(fallbackHeight?: number): UseEventSizeResult {
  const [height, setHeight] = useState(fallbackHeight ?? 0);
  const elementRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
  }, []);

  // Ref callback that handles both setting the ref and observing
  const ref = useCallback((node: HTMLDivElement | null) => {
    // Cleanup previous observer
    cleanup();

    elementRef.current = node;

    if (!node) return;

    // Set initial height from the element
    setHeight(node.offsetHeight);

    // Create ResizeObserver to track size changes
    observerRef.current = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // Use borderBoxSize if available, otherwise contentRect
        const newHeight = entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height;
        setHeight(newHeight);
      }
    });

    observerRef.current.observe(node);
  }, [cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const sizeBucket = getSizeBucket(height);
  const bucketClass = SIZE_BUCKET_CLASSES[sizeBucket];

  return { ref, sizeBucket, height, bucketClass };
}

/**
 * Returns adaptive styles configuration based on size bucket.
 *
 * Requirements-driven design:
 * - Every event MUST always display at least ONE readable label
 * - Fail-safe: overflow hidden, text-overflow ellipsis, no multi-line below threshold
 * - Matches Google Calendar compact event styling
 */
export function getAdaptiveEventStyles(sizeBucket: EventSizeBucket) {
  switch (sizeBucket) {
    case 'xs':
      // <18px - ultra-compact, single-line title only
      // FAIL-SAFE: Only render title, everything else hidden
      return {
        containerClass: 'px-0.5 py-0',
        titleClass: 'text-[10px] leading-none font-medium',
        titleStyle: {} as React.CSSProperties,
        metaClass: 'hidden',
        metaStyle: { display: 'none' } as React.CSSProperties,
        showTime: false,       // Hide time for ultra-compact
        showDuration: false,
        showRecurringIcon: false,
        lineClamp: 1,
        truncateToFirstWord: true,  // Only first word for xs
      };
    case 'sm':
      // 18-28px - single-line title + time (Google Calendar style: "Title, 9am")
      return {
        containerClass: 'px-1 py-0',
        titleClass: 'text-[11px] leading-tight font-semibold',
        titleStyle: {} as React.CSSProperties,
        metaClass: 'text-[10px] leading-tight',
        metaStyle: {} as React.CSSProperties,
        showTime: true,         // Show time inline with title
        showDuration: false,
        showRecurringIcon: false,
        lineClamp: 1,
        truncateToFirstWord: false,
      };
    case 'md':
      // 28-44px - title up to 2 lines + time on separate line
      return {
        containerClass: 'px-1.5 py-0.5',
        titleClass: 'text-xs leading-tight font-semibold',
        titleStyle: {} as React.CSSProperties,
        metaClass: 'text-[10px] leading-tight',
        metaStyle: {} as React.CSSProperties,
        showTime: true,
        showDuration: false,
        showRecurringIcon: true,
        lineClamp: 2,
        truncateToFirstWord: false,
      };
    case 'lg':
    default:
      // >=44px - full content with title + time + duration
      return {
        containerClass: 'px-2 py-1',
        titleClass: 'text-[13px] leading-snug font-semibold',
        titleStyle: {} as React.CSSProperties,
        metaClass: 'text-[11px] leading-tight',
        metaStyle: {} as React.CSSProperties,
        showTime: true,
        showDuration: true,
        showRecurringIcon: true,
        lineClamp: 3,
        truncateToFirstWord: false,
      };
  }
}
