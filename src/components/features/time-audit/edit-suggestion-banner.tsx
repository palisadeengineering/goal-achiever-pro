'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, X, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EditPattern } from '@/lib/hooks/use-edit-patterns';
import { DRIP_QUADRANTS } from '@/constants/drip';

interface EditSuggestionBannerProps {
  pattern: EditPattern;
  onApply: () => Promise<void>;
  onDismiss: () => void;
}

const ENERGY_LABELS: Record<string, string> = {
  green: 'Energizing',
  yellow: 'Neutral',
  red: 'Draining',
};

export function EditSuggestionBanner({
  pattern,
  onApply,
  onDismiss,
}: EditSuggestionBannerProps) {
  const [isApplying, setIsApplying] = useState(false);

  const handleApply = async () => {
    setIsApplying(true);
    try {
      await onApply();
    } finally {
      setIsApplying(false);
    }
  };

  // Build the change description
  const changes: string[] = [];
  if (pattern.suggestedDrip) {
    changes.push(`DRIP: ${DRIP_QUADRANTS[pattern.suggestedDrip].name}`);
  }
  if (pattern.suggestedEnergy) {
    changes.push(`Energy: ${ENERGY_LABELS[pattern.suggestedEnergy]}`);
  }

  return (
    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">
            Pattern Detected
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            You&apos;ve changed <span className="font-medium text-foreground">&quot;{pattern.activityName}&quot;</span> to{' '}
            <span className="font-medium text-foreground">{changes.join(', ')}</span>{' '}
            {pattern.editCount} times. Apply to all{' '}
            <Badge variant="secondary" className="mx-1">
              {pattern.matchingBlockIds.length}
            </Badge>{' '}
            similar blocks?
          </p>

          <div className="flex items-center gap-2 mt-3">
            <Button
              size="sm"
              onClick={handleApply}
              disabled={isApplying}
              className="gap-1.5"
            >
              {isApplying ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Applying...
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Apply to All ({pattern.matchingBlockIds.length})
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onDismiss}
              disabled={isApplying}
              className="text-muted-foreground"
            >
              Dismiss
            </Button>
          </div>
        </div>

        <Button
          size="icon"
          variant="ghost"
          onClick={onDismiss}
          disabled={isApplying}
          className="h-6 w-6 flex-shrink-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
