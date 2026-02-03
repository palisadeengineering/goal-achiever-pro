'use client';

import { useState } from 'react';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Tag } from '@/lib/hooks/use-tags';

interface TagManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tags: Tag[];
  onCreateTag: (name: string, color: string, description?: string) => Promise<Tag | null>;
  onUpdateTag: (id: string, updates: Partial<Pick<Tag, 'name' | 'color' | 'description'>>) => Promise<Tag | null>;
  onDeleteTag: (id: string) => Promise<boolean>;
}

const PRESET_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#d946ef', // fuchsia
  '#ec4899', // pink
  '#64748b', // slate
  '#78716c', // stone
];

// Quick setup presets for business context tagging
const QUICK_SETUP_PRESETS = [
  { name: 'Personal', color: '#22c55e', description: 'Personal activities and time' },
  { name: 'Main Business', color: '#6366f1', description: 'Primary business activities' },
  { name: 'Side Business', color: '#f59e0b', description: 'Secondary business or side projects' },
  { name: 'Client Work', color: '#8b5cf6', description: 'Client-facing work and projects' },
];

export function TagManager({
  open,
  onOpenChange,
  tags,
  onCreateTag,
  onUpdateTag,
  onDeleteTag,
}: TagManagerProps) {
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Tag | null>(null);

  const [name, setName] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingPresets, setIsCreatingPresets] = useState(false);

  const resetForm = () => {
    setName('');
    setColor('#6366f1');
    setDescription('');
    setEditingTag(null);
    setIsCreating(false);
  };

  const handleStartCreate = () => {
    resetForm();
    setIsCreating(true);
  };

  const handleStartEdit = (tag: Tag) => {
    setName(tag.name);
    setColor(tag.color);
    setDescription(tag.description || '');
    setEditingTag(tag);
    setIsCreating(false);
  };

  const handleSave = async () => {
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      if (editingTag) {
        await onUpdateTag(editingTag.id, {
          name: name.trim(),
          color,
          description: description.trim() || undefined,
        });
      } else {
        await onCreateTag(name.trim(), color, description.trim() || undefined);
      }
      resetForm();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    setIsSaving(true);
    try {
      await onDeleteTag(deleteConfirm.id);
      setDeleteConfirm(null);
      if (editingTag?.id === deleteConfirm.id) {
        resetForm();
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  // Create all quick setup presets that don't already exist
  const handleQuickSetup = async () => {
    setIsCreatingPresets(true);
    try {
      const existingNames = new Set(tags.map(t => t.name.toLowerCase()));
      for (const preset of QUICK_SETUP_PRESETS) {
        if (!existingNames.has(preset.name.toLowerCase())) {
          await onCreateTag(preset.name, preset.color, preset.description);
        }
      }
    } finally {
      setIsCreatingPresets(false);
    }
  };

  // Check which presets are missing
  const missingPresets = QUICK_SETUP_PRESETS.filter(
    preset => !tags.some(t => t.name.toLowerCase() === preset.name.toLowerCase())
  );

  const showForm = isCreating || editingTag;

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Manage Tags</DialogTitle>
            <DialogDescription>
              Create and organize tags to categorize your time blocks.
            </DialogDescription>
          </DialogHeader>

          {!showForm ? (
            // Tag List View
            <div className="space-y-4">
              {/* Quick Setup Section */}
              {missingPresets.length > 0 && (
                <div className="rounded-lg border border-dashed p-3 space-y-2">
                  <div className="text-sm font-medium">Quick Setup</div>
                  <p className="text-xs text-muted-foreground">
                    Add common business context tags to categorize your time
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {missingPresets.map(preset => (
                      <div
                        key={preset.name}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs"
                        style={{ backgroundColor: preset.color + '20', color: preset.color }}
                      >
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: preset.color }}
                        />
                        {preset.name}
                      </div>
                    ))}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full mt-2"
                    onClick={handleQuickSetup}
                    disabled={isCreatingPresets}
                  >
                    {isCreatingPresets ? 'Creating...' : `Add ${missingPresets.length} Business Tags`}
                  </Button>
                </div>
              )}

              {tags.length === 0 && missingPresets.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No tags yet. Create your first tag to get started.
                </div>
              ) : tags.length === 0 ? (
                <div className="py-4 text-center text-sm text-muted-foreground">
                  Use Quick Setup above or create a custom tag below.
                </div>
              ) : (
                <div className="max-h-[300px] space-y-2 overflow-y-auto pr-2">
                  {tags.map(tag => (
                    <div
                      key={tag.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="h-4 w-4 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                        <div>
                          <div className="font-medium">{tag.name}</div>
                          {tag.description && (
                            <div className="text-xs text-muted-foreground">
                              {tag.description}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleStartEdit(tag)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteConfirm(tag)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Button onClick={handleStartCreate} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Create New Tag
              </Button>
            </div>
          ) : (
            // Create/Edit Form View
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tagName">Name</Label>
                <Input
                  id="tagName"
                  placeholder="e.g., Marketing, Sales, Admin..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map(presetColor => (
                    <button
                      key={presetColor}
                      type="button"
                      onClick={() => setColor(presetColor)}
                      className={`h-7 w-7 rounded-full transition-transform hover:scale-110 ${
                        color === presetColor ? 'ring-2 ring-primary ring-offset-2' : ''
                      }`}
                      style={{ backgroundColor: presetColor }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Label htmlFor="customColor" className="text-xs text-muted-foreground">
                    Custom:
                  </Label>
                  <Input
                    id="customColor"
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="h-7 w-14 cursor-pointer p-0.5"
                  />
                  <Input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="h-7 w-20 text-xs"
                    placeholder="#000000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tagDescription">Description (Optional)</Label>
                <Input
                  id="tagDescription"
                  placeholder="Brief description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={!name.trim() || isSaving}>
                  {isSaving ? 'Saving...' : editingTag ? 'Save Changes' : 'Create Tag'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tag</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the tag &quot;{deleteConfirm?.name}&quot;?
              This will remove it from all time blocks.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
