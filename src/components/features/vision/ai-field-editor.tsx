'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Sparkles, Loader2, Check, X, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

type FieldType = 'vision' | 'smart' | 'affirmation' | 'non-negotiable' | 'kpi';

interface AIFieldEditorProps {
  fieldType: FieldType;
  currentValue: string;
  context?: Record<string, unknown>;
  onAccept: (newValue: string) => void;
  placeholder?: string;
  label?: string;
  isMultiline?: boolean;
  triggerClassName?: string;
  disabled?: boolean;
}

const ENDPOINT_MAP: Record<FieldType, string> = {
  vision: '/api/ai/suggest-vision',
  smart: '/api/ai/generate-smart',
  affirmation: '/api/ai/generate-affirmation',
  'non-negotiable': '/api/ai/suggest-non-negotiables',
  kpi: '/api/ai/edit-kpi',
};

export function AIFieldEditor({
  fieldType,
  currentValue,
  context,
  onAccept,
  placeholder = 'Click to generate with AI...',
  label,
  isMultiline = false,
  triggerClassName,
  disabled = false,
}: AIFieldEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedValue, setGeneratedValue] = useState<string>('');
  const [editedValue, setEditedValue] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [additionalContext, setAdditionalContext] = useState('');

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGeneratedValue('');
    setIsEditing(false);

    try {
      const response = await fetch(ENDPOINT_MAP[fieldType], {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentValue,
          context: additionalContext || undefined,
          ...context,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate');
      }

      const result = await response.json();

      // Handle different response formats
      let generated = '';
      if (fieldType === 'vision') {
        generated = result.description || result.vision || '';
      } else if (fieldType === 'affirmation') {
        generated = result.affirmation || '';
      } else if (fieldType === 'kpi') {
        generated = result.suggestion || result.kpi || '';
      } else if (fieldType === 'non-negotiable') {
        generated = result.suggestion || '';
      } else {
        generated = result.suggestion || result.result || JSON.stringify(result);
      }

      setGeneratedValue(generated);
      setEditedValue(generated);
    } catch (error) {
      console.error('Error generating with AI:', error);
      toast.error('Failed to generate. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAccept = () => {
    const valueToAccept = isEditing ? editedValue : generatedValue;
    onAccept(valueToAccept);
    setIsOpen(false);
    setGeneratedValue('');
    setEditedValue('');
    setAdditionalContext('');
    toast.success('Applied AI suggestion');
  };

  const handleReject = () => {
    setGeneratedValue('');
    setEditedValue('');
    setIsEditing(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    setGeneratedValue('');
    setEditedValue('');
    setIsEditing(false);
    setAdditionalContext('');
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={triggerClassName}
          disabled={disabled}
          type="button"
        >
          <Sparkles className="h-4 w-4 text-purple-500" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96" align="start">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-sm mb-1">
              {label || `Generate ${fieldType.charAt(0).toUpperCase() + fieldType.slice(1)} with AI`}
            </h4>
            <p className="text-xs text-muted-foreground">
              Let AI help you craft the perfect {fieldType}
            </p>
          </div>

          {/* Current Value */}
          {currentValue && (
            <div className="p-2 bg-muted rounded text-sm">
              <span className="text-xs text-muted-foreground block mb-1">Current:</span>
              <span className="line-clamp-2">{currentValue}</span>
            </div>
          )}

          {/* Additional Context */}
          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              Additional context (optional)
            </label>
            <Input
              placeholder="Add any specific guidance..."
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
              className="text-sm"
            />
          </div>

          {/* Generate Button */}
          {!generatedValue && (
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full"
              size="sm"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate
                </>
              )}
            </Button>
          )}

          {/* Generated Result */}
          {generatedValue && (
            <div className="space-y-3">
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded border border-purple-200 dark:border-purple-800">
                <span className="text-xs text-purple-600 dark:text-purple-400 block mb-1 font-medium">
                  AI Suggestion:
                </span>
                {isEditing ? (
                  isMultiline ? (
                    <Textarea
                      value={editedValue}
                      onChange={(e) => setEditedValue(e.target.value)}
                      className="min-h-[100px] text-sm"
                    />
                  ) : (
                    <Input
                      value={editedValue}
                      onChange={(e) => setEditedValue(e.target.value)}
                      className="text-sm"
                    />
                  )
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{generatedValue}</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={handleAccept}
                  size="sm"
                  className="flex-1"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Accept
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReject}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Regenerate */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Regenerate
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Inline version for simple use cases
export function AIFieldEditorInline({
  fieldType,
  currentValue,
  context,
  onAccept,
  label,
  disabled = false,
}: Omit<AIFieldEditorProps, 'triggerClassName' | 'isMultiline' | 'placeholder'>) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);

    try {
      const response = await fetch(ENDPOINT_MAP[fieldType], {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentValue,
          ...context,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate');
      }

      const result = await response.json();

      // Handle different response formats
      let generated = '';
      if (fieldType === 'vision') {
        generated = result.description || result.vision || '';
      } else if (fieldType === 'affirmation') {
        generated = result.affirmation || '';
      } else if (fieldType === 'kpi') {
        generated = result.suggestion || result.kpi || '';
      } else {
        generated = result.suggestion || result.result || '';
      }

      if (generated) {
        onAccept(generated);
        toast.success('AI suggestion applied');
      }
    } catch (error) {
      console.error('Error generating with AI:', error);
      toast.error('Failed to generate. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleGenerate}
      disabled={isGenerating || disabled}
      type="button"
    >
      {isGenerating ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Sparkles className="h-4 w-4 mr-2" />
      )}
      {label || `Generate ${fieldType}`}
    </Button>
  );
}
