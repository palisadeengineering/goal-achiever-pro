'use client';

import { useState, useRef, useCallback, useEffect, useId, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Tag } from '@/lib/hooks/use-tags';

interface TagInputProps {
  /** Currently selected tags */
  value: Tag[];
  /** Called when tags change */
  onChange: (tags: Tag[]) => void;
  /** Create a new tag by name (idempotent - returns existing if found) */
  onCreateTag: (name: string) => Promise<Tag | null>;
  /** Search tags for autocomplete */
  onSearch: (query: string) => Promise<Tag[]>;
  /** All available tags (for initial display / fallback) */
  availableTags?: Tag[];
  placeholder?: string;
  /** Allow creating new tags inline */
  allowCreate?: boolean;
  /** Maximum number of tags allowed */
  maxTags?: number;
  disabled?: boolean;
  /** Compact mode for bulk cards */
  compact?: boolean;
  /** AI-suggested tags to display */
  suggestedTags?: { tag: Tag; confidence: number }[];
  /** Called when AI suggestion is accepted */
  onAcceptSuggestion?: (tag: Tag) => void;
  /** Called when AI suggestion is dismissed */
  onDismissSuggestion?: (tag: Tag) => void;
}

export function TagInput({
  value,
  onChange,
  onCreateTag,
  onSearch,
  availableTags = [],
  placeholder = 'Add tags...',
  allowCreate = true,
  maxTags,
  disabled = false,
  compact = false,
  suggestedTags,
  onAcceptSuggestion,
  onDismissSuggestion,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Tag[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isCreating, setIsCreating] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const instanceId = useId();
  const listboxId = `tag-listbox-${instanceId}`;
  const optionId = (index: number) => `tag-option-${instanceId}-${index}`;

  const selectedIds = new Set(value.map(t => t.id));

  // Filter available tags, excluding already-selected ones
  const getFilteredTags = useCallback(
    (query: string): Tag[] => {
      const q = query.toLowerCase().trim();
      const source = availableTags.filter(t => !selectedIds.has(t.id));
      if (!q) return source.slice(0, 15);
      return source
        .filter(t => t.name.toLowerCase().includes(q))
        .slice(0, 15);
    },
    [availableTags, selectedIds]
  );

  // Debounced search
  useEffect(() => {
    if (!isOpen) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    const query = inputValue.trim();

    // Immediately show local results
    setSuggestions(getFilteredTags(query));

    // Debounced remote search
    if (query.length >= 1) {
      debounceRef.current = setTimeout(async () => {
        try {
          const remote = await onSearch(query);
          const filtered = remote.filter(t => !selectedIds.has(t.id));
          setSuggestions(filtered.slice(0, 15));
        } catch {
          // Fallback to local filter
        }
      }, 200);
    }

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [inputValue, isOpen, getFilteredTags, onSearch, selectedIds]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Check if input matches an existing tag exactly (case-insensitive)
  const findExactMatch = (text: string): Tag | undefined => {
    const lower = text.toLowerCase().trim();
    return suggestions.find(t => t.name.toLowerCase() === lower)
      ?? availableTags.find(t => t.name.toLowerCase() === lower && !selectedIds.has(t.id));
  };

  const addTag = (tag: Tag) => {
    if (selectedIds.has(tag.id)) return;
    if (maxTags && value.length >= maxTags) return;
    onChange([...value, tag]);
    setInputValue('');
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  const removeTag = (tagId: string) => {
    onChange(value.filter(t => t.id !== tagId));
    inputRef.current?.focus();
  };

  const createAndAddTag = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || isCreating) return;

    // Check for duplicate (case-insensitive)
    const duplicate = value.find(t => t.name.toLowerCase() === trimmed.toLowerCase());
    if (duplicate) {
      setInputValue('');
      return;
    }

    setIsCreating(true);
    try {
      const tag = await onCreateTag(trimmed);
      if (tag) {
        addTag(tag);
      }
    } finally {
      setIsCreating(false);
    }
  };

  // Handle paste: "tag1, tag2, tag3" -> 3 chips
  // Accumulates all tags then calls onChange once to avoid stale closure issues
  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text');
    if (text.includes(',')) {
      e.preventDefault();
      const names = text.split(',').map(s => s.trim()).filter(Boolean);
      (async () => {
        const accumulated: Tag[] = [...value];
        const accumulatedIds = new Set(value.map(t => t.id));
        const accumulatedNames = new Set(value.map(t => t.name.toLowerCase()));

        for (const name of names) {
          if (accumulatedNames.has(name.toLowerCase())) continue;
          if (maxTags && accumulated.length >= maxTags) break;

          const existing = findExactMatch(name);
          if (existing && !accumulatedIds.has(existing.id)) {
            accumulated.push(existing);
            accumulatedIds.add(existing.id);
            accumulatedNames.add(existing.name.toLowerCase());
          } else if (allowCreate && !existing) {
            const tag = await onCreateTag(name);
            if (tag && !accumulatedIds.has(tag.id)) {
              accumulated.push(tag);
              accumulatedIds.add(tag.id);
              accumulatedNames.add(tag.name.toLowerCase());
            }
          }
        }

        if (accumulated.length > value.length) {
          onChange(accumulated);
          setInputValue('');
          inputRef.current?.focus();
        }
      })();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const hasExactMatch = findExactMatch(inputValue);

    // Show "Create" option at top if no exact match
    const showCreate = allowCreate && inputValue.trim() && !hasExactMatch;
    const totalItems = suggestions.length + (showCreate ? 1 : 0);

    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) {
          // If "Create" row is highlighted
          if (showCreate && highlightedIndex === 0) {
            createAndAddTag(inputValue);
          } else {
            const idx = showCreate ? highlightedIndex - 1 : highlightedIndex;
            if (suggestions[idx]) {
              addTag(suggestions[idx]);
            }
          }
        } else if (inputValue.trim()) {
          // No highlighted item - if exact match exists, add it; otherwise create
          if (hasExactMatch) {
            addTag(hasExactMatch);
          } else if (allowCreate) {
            createAndAddTag(inputValue);
          }
        }
        break;

      case 'Tab':
        if (isOpen && suggestions.length > 0 && inputValue.trim()) {
          e.preventDefault();
          addTag(suggestions[0]);
        }
        break;

      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;

      case 'Backspace':
        if (!inputValue && value.length > 0) {
          removeTag(value[value.length - 1].id);
        }
        break;

      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        }
        setHighlightedIndex(prev =>
          prev < totalItems - 1 ? prev + 1 : 0
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        }
        setHighlightedIndex(prev =>
          prev > 0 ? prev - 1 : totalItems - 1
        );
        break;
    }
  };

  // Compute display items
  const hasExactMatch = findExactMatch(inputValue);
  const showCreate = allowCreate && inputValue.trim() && !hasExactMatch;

  return (
    <div ref={containerRef} className="relative w-full">
      {/* AI Suggested Tags */}
      {suggestedTags && suggestedTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1.5">
          {suggestedTags
            .filter(s => !selectedIds.has(s.tag.id))
            .map(({ tag, confidence }) => (
              <button
                key={tag.id}
                type="button"
                disabled={disabled}
                onClick={() => {
                  addTag(tag);
                  onAcceptSuggestion?.(tag);
                }}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full border border-dashed px-2 py-0.5 text-xs transition-colors',
                  'hover:bg-primary/10 hover:border-primary',
                  confidence >= 0.85 && 'border-primary/50 bg-primary/5',
                  confidence >= 0.6 && confidence < 0.85 && 'border-muted-foreground/30',
                  confidence < 0.6 && 'border-muted-foreground/20 opacity-70'
                )}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
                {tag.name}
                <span className="text-muted-foreground">
                  {Math.round(confidence * 100)}%
                </span>
                {onDismissSuggestion && (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDismissSuggestion(tag);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.stopPropagation();
                        onDismissSuggestion(tag);
                      }
                    }}
                    className="ml-0.5 hover:text-destructive"
                  >
                    <X className="h-2.5 w-2.5" />
                  </span>
                )}
              </button>
            ))}
        </div>
      )}

      {/* Chip container + input */}
      <div
        className={cn(
          'flex flex-wrap items-center gap-1 rounded-md border border-input bg-background ring-offset-background',
          'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
          compact ? 'px-2 py-1 min-h-[32px]' : 'px-3 py-1.5 min-h-[38px]',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {/* Selected tag chips */}
        {value.map(tag => (
          <span
            key={tag.id}
            className={cn(
              'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium',
              'animate-in fade-in-0 zoom-in-95'
            )}
            style={{
              backgroundColor: `${tag.color}20`,
              borderColor: `${tag.color}60`,
              color: tag.color,
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full shrink-0"
              style={{ backgroundColor: tag.color }}
            />
            {tag.name}
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(tag.id);
                }}
                className="ml-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </span>
        ))}

        {/* Inline input */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            if (!isOpen) setIsOpen(true);
            setHighlightedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeholder : ''}
          disabled={disabled || (maxTags !== undefined && value.length >= maxTags)}
          className={cn(
            'flex-1 min-w-[80px] bg-transparent outline-none text-sm placeholder:text-muted-foreground',
            compact && 'text-xs min-w-[60px]'
          )}
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-activedescendant={
            highlightedIndex >= 0 ? optionId(highlightedIndex) : undefined
          }
          autoComplete="off"
        />
      </div>

      {/* Dropdown */}
      {isOpen && (suggestions.length > 0 || showCreate) && (
        <ul
          id={listboxId}
          ref={listRef}
          role="listbox"
          className={cn(
            'absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md',
            'max-h-[200px] overflow-y-auto py-1',
            'animate-in fade-in-0 slide-in-from-top-2'
          )}
        >
          {/* Create option */}
          {showCreate && (
            <li
              id={optionId(0)}
              role="option"
              aria-selected={highlightedIndex === 0}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer',
                highlightedIndex === 0 && 'bg-accent text-accent-foreground'
              )}
              onMouseEnter={() => setHighlightedIndex(0)}
              onMouseDown={(e) => {
                e.preventDefault();
                createAndAddTag(inputValue);
              }}
            >
              <span className="text-muted-foreground">Create</span>
              <span className="font-medium">&quot;{inputValue.trim()}&quot;</span>
            </li>
          )}

          {/* Existing tag suggestions */}
          {suggestions.map((tag, idx) => {
            const itemIndex = showCreate ? idx + 1 : idx;
            return (
              <li
                key={tag.id}
                id={optionId(itemIndex)}
                role="option"
                aria-selected={highlightedIndex === itemIndex}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer',
                  highlightedIndex === itemIndex && 'bg-accent text-accent-foreground'
                )}
                onMouseEnter={() => setHighlightedIndex(itemIndex)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  addTag(tag);
                }}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: tag.color }}
                />
                <span className="flex-1 truncate">{tag.name}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
