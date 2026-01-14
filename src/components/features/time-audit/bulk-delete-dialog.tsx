'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Trash2, AlertTriangle, CheckCircle2, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export interface CleanupCategory {
  name: string;
  description: string;
  reasoning: string;
  eventIds: string[];
  sampleEvents: string[];
  priority: 'high' | 'medium' | 'low';
}

export interface CleanupSuggestions {
  categories: CleanupCategory[];
  summary: string;
}

interface BulkDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestions: CleanupSuggestions | null;
  isLoading: boolean;
  onDelete: (eventIds: string[]) => Promise<void>;
  onRefresh: () => void;
}

const priorityColors = {
  high: 'bg-red-100 text-red-700 border-red-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  low: 'bg-blue-100 text-blue-700 border-blue-200',
};

// Collapsible category card component
function CategoryCard({
  category,
  isSelected,
  onToggle,
}: {
  category: CleanupCategory;
  isSelected: boolean;
  onToggle: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className={isSelected ? 'ring-2 ring-primary' : ''}>
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onToggle}
            className="mt-1"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium">{category.name}</span>
              <Badge
                variant="outline"
                className={`text-xs ${priorityColors[category.priority]}`}
              >
                {category.priority}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {category.eventIds.length} event{category.eventIds.length !== 1 ? 's' : ''}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{category.description}</p>

            {/* Expandable details */}
            {isExpanded && (
              <div className="mt-3 space-y-3 text-sm">
                <div className="bg-muted/50 rounded-md p-3">
                  <p className="font-medium text-xs uppercase tracking-wider mb-1">
                    Why delete these?
                  </p>
                  <p className="text-muted-foreground">{category.reasoning}</p>
                </div>
                <div>
                  <p className="font-medium text-xs uppercase tracking-wider mb-2">
                    Sample events:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    {category.sampleEvents.map((event, idx) => (
                      <li key={idx}>{event}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="mt-2 h-7 px-2 text-xs"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-3 w-3 mr-1" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3 mr-1" />
                  Show details
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function BulkDeleteDialog({
  open,
  onOpenChange,
  suggestions,
  isLoading,
  onDelete,
  onRefresh,
}: BulkDeleteDialogProps) {
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState(0);
  const [deleteComplete, setDeleteComplete] = useState(false);

  const handleCategoryToggle = (categoryName: string) => {
    const newSelected = new Set(selectedCategories);
    if (newSelected.has(categoryName)) {
      newSelected.delete(categoryName);
    } else {
      newSelected.add(categoryName);
    }
    setSelectedCategories(newSelected);
  };

  const handleSelectAll = () => {
    if (!suggestions) return;
    if (selectedCategories.size === suggestions.categories.length) {
      setSelectedCategories(new Set());
    } else {
      setSelectedCategories(new Set(suggestions.categories.map(c => c.name)));
    }
  };

  const getSelectedEventIds = (): string[] => {
    if (!suggestions) return [];
    return suggestions.categories
      .filter(c => selectedCategories.has(c.name))
      .flatMap(c => c.eventIds);
  };

  const totalSelectedEvents = getSelectedEventIds().length;

  const handleDelete = async () => {
    const eventIds = getSelectedEventIds();
    if (eventIds.length === 0) return;

    setIsDeleting(true);
    setDeleteProgress(0);

    try {
      // Delete in batches for progress indication
      const batchSize = 5;
      for (let i = 0; i < eventIds.length; i += batchSize) {
        const batch = eventIds.slice(i, i + batchSize);
        await onDelete(batch);
        setDeleteProgress(Math.round(((i + batch.length) / eventIds.length) * 100));
      }

      setDeleteComplete(true);
      setTimeout(() => {
        setDeleteComplete(false);
        setSelectedCategories(new Set());
        onOpenChange(false);
      }, 1500);
    } catch (error) {
      console.error('Error during bulk delete:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      setSelectedCategories(new Set());
      setDeleteComplete(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Cleanup Suggestions
          </DialogTitle>
          <DialogDescription>
            {suggestions?.summary || 'Review AI-suggested events to delete'}
          </DialogDescription>
        </DialogHeader>

        {/* Loading state */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Analyzing your events...</p>
          </div>
        )}

        {/* Delete complete state */}
        {deleteComplete && (
          <div className="flex flex-col items-center justify-center py-12">
            <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
            <p className="text-lg font-medium">Events deleted successfully!</p>
          </div>
        )}

        {/* Deleting progress state */}
        {isDeleting && !deleteComplete && (
          <div className="py-8 space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Deleting events... {deleteProgress}%
            </div>
            <Progress value={deleteProgress} className="h-2" />
          </div>
        )}

        {/* Suggestions list */}
        {!isLoading && !isDeleting && !deleteComplete && suggestions && (
          <>
            {suggestions.categories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Your calendar looks great!</h3>
                <p className="text-muted-foreground max-w-md">
                  No cleanup suggestions found. Your events appear to be well-organized.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Select all */}
                <div className="flex items-center justify-between py-2 border-b">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAll}
                    className="text-sm"
                  >
                    {selectedCategories.size === suggestions.categories.length
                      ? 'Deselect All'
                      : 'Select All'}
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {totalSelectedEvents} event{totalSelectedEvents !== 1 ? 's' : ''} selected
                  </span>
                </div>

                {/* Categories list */}
                <div className="space-y-3">
                  {suggestions.categories.map((category) => (
                    <CategoryCard
                      key={category.name}
                      category={category}
                      isSelected={selectedCategories.has(category.name)}
                      onToggle={() => handleCategoryToggle(category.name)}
                    />
                  ))}
                </div>

                {/* Warning */}
                {totalSelectedEvents > 0 && (
                  <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-md text-amber-800 dark:text-amber-200">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium">This action cannot be undone</p>
                      <p className="text-amber-700 dark:text-amber-300">
                        {totalSelectedEvents} event{totalSelectedEvents !== 1 ? 's' : ''} will be permanently deleted
                        from your calendar.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        <DialogFooter className="gap-2">
          {!isLoading && !deleteComplete && suggestions && suggestions.categories.length > 0 && (
            <>
              <Button variant="outline" onClick={onRefresh} disabled={isDeleting}>
                <Sparkles className="h-4 w-4 mr-2" />
                Refresh Suggestions
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={totalSelectedEvents === 0 || isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete {totalSelectedEvents} Event{totalSelectedEvents !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
