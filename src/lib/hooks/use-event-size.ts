'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Size buckets for event cards based on rendered pixel height
 * - xs: Super compact, first word only
 * - sm: Compact single line with ellipsis
 * - md: Title + optional time, 2-line clamp
 * - lg: Full content with title + time + duration
 */
export type EventSizeBucket = 'xs' | 'sm' | 'md' | 'lg';

interface UseEventSizeResult {
  ref: React.RefCallback<HTMLDivElement>;
  sizeBucket: EventSizeBucket;
  height: number;
}

// Size bucket thresholds in pixels
// Adjusted for better readability at small sizes:
// - 15-min event = ~13px → should be readable (sm bucket)
// - 30-min event = ~27px → title + time (md bucket)
// - 45-min event = ~41px → full content (lg bucket)
const SIZE_THRESHOLDS = {
  xs: 12,   // < 12px (only 5-10 min events)
  sm: 22,   // 12-22px (15-min events land here)
  md: 38,   // 22-38px (30-min events land here)
  // lg: >= 38px
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

  return { ref, sizeBucket, height };
}

/**
 * Returns adaptive styles configuration based on size bucket
 */
export function getAdaptiveEventStyles(sizeBucket: EventSizeBucket) {
  switch (sizeBucket) {
    case 'xs':
      // For truly tiny events (< 12px, like 5-10 min)
      // Show abbreviated title, no time
      return {
        containerClass: 'px-1 py-0',
        titleStyle: {
          fontSize: '10px',
          lineHeight: '1',
          fontWeight: 600,
        } as React.CSSProperties,
        metaStyle: null, // No meta for xs
        showTime: false,
        showDuration: false,
        showRecurringIcon: false,
        lineClamp: 1,
        truncateToFirstWord: true,
      };
    case 'sm':
      // For short events (12-22px, like 15-min)
      // Show full title on single line, readable font
      return {
        containerClass: 'px-1.5 py-0',
        titleStyle: {
          fontSize: '11px',
          lineHeight: '1.1',
          fontWeight: 600,
        } as React.CSSProperties,
        metaStyle: null, // No meta for sm
        showTime: false,
        showDuration: false,
        showRecurringIcon: true,
        lineClamp: 1,
        truncateToFirstWord: false,
      };
    case 'md':
      // For medium events (22-38px, like 30-min)
      // Show title + start time
      return {
        containerClass: 'px-1.5 py-0.5',
        titleStyle: {
          fontSize: '12px',
          lineHeight: '1.15',
          fontWeight: 600,
        } as React.CSSProperties,
        metaStyle: {
          fontSize: '10px',
          lineHeight: '1.1',
        } as React.CSSProperties,
        showTime: true,
        showDuration: false,
        showRecurringIcon: true,
        lineClamp: 2,
        truncateToFirstWord: false,
      };
    case 'lg':
    default:
      // For large events (>= 38px, like 45+ min)
      // Full content: title + time + duration
      return {
        containerClass: 'px-2 py-1',
        titleStyle: {
          fontSize: '13px',
          lineHeight: '1.2',
          fontWeight: 600,
        } as React.CSSProperties,
        metaStyle: {
          fontSize: '11px',
          lineHeight: '1.15',
        } as React.CSSProperties,
        showTime: true,
        showDuration: true,
        showRecurringIcon: true,
        lineClamp: 3,
        truncateToFirstWord: false,
      };
  }
}
