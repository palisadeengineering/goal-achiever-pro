import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

/**
 * Key mappings for navigation
 */
export type NavigationKey = 'ArrowUp' | 'ArrowDown' | 'j' | 'k' | ' ' | 'Enter' | 'Escape';

export interface KeyboardShortcut {
  key: string;
  handler: () => void;
  /** Prevent default browser behavior */
  preventDefault?: boolean;
  /** Only trigger when modifier is NOT pressed (for cases like 'a' but not 'Ctrl+A') */
  noModifier?: boolean;
  /** Description for UI display */
  description?: string;
}

export interface UseKeyboardNavigationOptions<T> {
  /** Array of items to navigate through */
  items: T[];
  /** Function to extract unique ID from an item */
  getItemId: (item: T) => string;
  /** Callback when an item is selected (e.g., Enter or Space) */
  onSelect?: (item: T) => void;
  /** Callback when toggle action is requested (Space key by default) */
  onToggle?: (item: T) => void;
  /** Callback when escape is pressed to clear focus */
  onEscape?: () => void;
  /** Whether keyboard navigation is enabled */
  enabled?: boolean;
  /** Additional custom keyboard shortcuts */
  customShortcuts?: KeyboardShortcut[];
  /** Whether to loop around when reaching the end/beginning of the list */
  loop?: boolean;
}

export interface UseKeyboardNavigationReturn<T> {
  /** Currently focused index (-1 if nothing focused) */
  focusedIndex: number;
  /** Currently focused item (null if nothing focused) */
  focusedItem: T | null;
  /** Focused item ID (null if nothing focused) */
  focusedId: string | null;
  /** Set focused index directly */
  setFocusedIndex: (index: number) => void;
  /** Set focused item by ID */
  setFocusedId: (id: string | null) => void;
  /** Move focus to next item */
  focusNext: () => void;
  /** Move focus to previous item */
  focusPrevious: () => void;
  /** Clear focus */
  clearFocus: () => void;
  /** Ref map for scrolling items into view */
  itemRefs: React.MutableRefObject<Map<string, HTMLElement>>;
  /** Check if a specific item is focused */
  isFocused: (id: string) => boolean;
}

/**
 * A reusable keyboard navigation hook for list-based interfaces.
 *
 * Supports:
 * - Arrow key navigation (up/down)
 * - Vim-style navigation (j/k)
 * - Space/Enter for selection/toggle
 * - Escape to clear focus
 * - Custom keyboard shortcuts
 * - Automatic scroll-into-view
 * - Loop-around navigation
 *
 * @example
 * ```tsx
 * const { focusedId, setFocusedId, itemRefs, isFocused } = useKeyboardNavigation({
 *   items: actions,
 *   getItemId: (action) => action.id,
 *   onToggle: (action) => toggleComplete(action.id),
 *   onEscape: () => console.log('Focus cleared'),
 * });
 *
 * // In render:
 * {actions.map(action => (
 *   <div
 *     key={action.id}
 *     ref={(el) => { if (el) itemRefs.current.set(action.id, el); }}
 *     onClick={() => setFocusedId(action.id)}
 *     className={isFocused(action.id) ? 'ring-2 ring-primary' : ''}
 *   >
 *     {action.title}
 *   </div>
 * ))}
 * ```
 */
export function useKeyboardNavigation<T>(
  options: UseKeyboardNavigationOptions<T>
): UseKeyboardNavigationReturn<T> {
  const {
    items,
    getItemId,
    onSelect,
    onToggle,
    onEscape,
    enabled = true,
    customShortcuts = [],
    loop = true,
  } = options;

  const [rawFocusedIndex, setFocusedIndex] = useState(-1);
  const itemRefs = useRef<Map<string, HTMLElement>>(new Map());

  // Clamp the focused index to valid range when items change
  const focusedIndex = useMemo(() => {
    if (rawFocusedIndex === -1) return -1;
    if (items.length === 0) return -1;
    if (rawFocusedIndex >= items.length) {
      return items.length - 1;
    }
    return rawFocusedIndex;
  }, [rawFocusedIndex, items.length]);

  // Compute focused item and ID from clamped index
  const focusedItem = useMemo(() => {
    if (focusedIndex >= 0 && focusedIndex < items.length) {
      return items[focusedIndex];
    }
    return null;
  }, [focusedIndex, items]);

  const focusedId = useMemo(() => {
    if (focusedItem) {
      return getItemId(focusedItem);
    }
    return null;
  }, [focusedItem, getItemId]);

  // Set focus by ID
  const setFocusedId = useCallback((id: string | null) => {
    if (id === null) {
      setFocusedIndex(-1);
      return;
    }
    const index = items.findIndex((item) => getItemId(item) === id);
    setFocusedIndex(index);
  }, [items, getItemId]);

  // Navigate to next item
  const focusNext = useCallback(() => {
    if (items.length === 0) return;

    setFocusedIndex((current) => {
      let nextIndex: number;
      if (current < items.length - 1) {
        nextIndex = current + 1;
      } else {
        nextIndex = loop ? 0 : current;
      }
      // Scroll into view
      const nextItem = items[nextIndex];
      if (nextItem) {
        const id = getItemId(nextItem);
        itemRefs.current.get(id)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      return nextIndex;
    });
  }, [items, getItemId, loop]);

  // Navigate to previous item
  const focusPrevious = useCallback(() => {
    if (items.length === 0) return;

    setFocusedIndex((current) => {
      let prevIndex: number;
      if (current > 0) {
        prevIndex = current - 1;
      } else if (current === -1) {
        // If nothing focused, start from the last item
        prevIndex = items.length - 1;
      } else {
        prevIndex = loop ? items.length - 1 : current;
      }
      // Scroll into view
      const prevItem = items[prevIndex];
      if (prevItem) {
        const id = getItemId(prevItem);
        itemRefs.current.get(id)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      return prevIndex;
    });
  }, [items, getItemId, loop]);

  // Clear focus
  const clearFocus = useCallback(() => {
    setFocusedIndex(-1);
    onEscape?.();
  }, [onEscape]);

  // Check if an item is focused
  const isFocused = useCallback((id: string) => {
    return focusedId === id;
  }, [focusedId]);

  // Keyboard event handler
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      // Handle custom shortcuts first
      for (const shortcut of customShortcuts) {
        if (e.key === shortcut.key) {
          // Check noModifier flag
          if (shortcut.noModifier && (e.metaKey || e.ctrlKey || e.altKey)) {
            continue;
          }
          if (shortcut.preventDefault !== false) {
            e.preventDefault();
          }
          shortcut.handler();
          return;
        }
      }

      // Built-in navigation
      switch (e.key) {
        case 'ArrowDown':
        case 'j':
          e.preventDefault();
          focusNext();
          break;

        case 'ArrowUp':
        case 'k':
          e.preventDefault();
          focusPrevious();
          break;

        case ' ':
          e.preventDefault();
          if (focusedItem && onToggle) {
            onToggle(focusedItem);
          }
          break;

        case 'Enter':
          e.preventDefault();
          if (focusedItem && onSelect) {
            onSelect(focusedItem);
          }
          break;

        case 'Escape':
          clearFocus();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    enabled,
    focusedItem,
    focusNext,
    focusPrevious,
    clearFocus,
    onSelect,
    onToggle,
    customShortcuts,
  ]);

  return {
    focusedIndex,
    focusedItem,
    focusedId,
    setFocusedIndex,
    setFocusedId,
    focusNext,
    focusPrevious,
    clearFocus,
    itemRefs,
    isFocused,
  };
}

/**
 * Utility function to create a keyboard shortcut descriptor
 */
export function createShortcut(
  key: string,
  handler: () => void,
  options: Partial<Omit<KeyboardShortcut, 'key' | 'handler'>> = {}
): KeyboardShortcut {
  return {
    key,
    handler,
    preventDefault: options.preventDefault ?? true,
    noModifier: options.noModifier ?? false,
    description: options.description,
  };
}

/**
 * Pre-built shortcut patterns for common use cases
 */
export const commonShortcuts = {
  /**
   * Create a shortcut that only triggers without modifier keys
   */
  withoutModifier: (key: string, handler: () => void, description?: string): KeyboardShortcut => ({
    key,
    handler,
    preventDefault: true,
    noModifier: true,
    description,
  }),

  /**
   * Create a simple shortcut
   */
  simple: (key: string, handler: () => void, description?: string): KeyboardShortcut => ({
    key,
    handler,
    preventDefault: true,
    noModifier: false,
    description,
  }),
};
