'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Bug, Lightbulb, MessageSquare, Loader2, CheckCircle2, Sparkles } from 'lucide-react';

type FeedbackType = 'bug' | 'feature' | 'improvement' | 'general';

interface FeedbackFormData {
  feedbackType: FeedbackType;
  title: string;
  description: string;
  priority: string;
}

const feedbackTypes = [
  { value: 'bug', label: 'Bug Report', icon: Bug, color: 'text-red-500' },
  { value: 'feature', label: 'Feature Request', icon: Sparkles, color: 'text-purple-500' },
  { value: 'improvement', label: 'Improvement', icon: Lightbulb, color: 'text-yellow-500' },
  { value: 'general', label: 'General Feedback', icon: MessageSquare, color: 'text-blue-500' },
] as const;

const priorities = [
  { value: 'low', label: 'Low - Nice to have' },
  { value: 'medium', label: 'Medium - Important' },
  { value: 'high', label: 'High - Urgent' },
  { value: 'critical', label: 'Critical - Blocking my work' },
];

export function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<FeedbackFormData>({
    feedbackType: 'bug',
    title: '',
    description: '',
    priority: 'medium',
  });

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      // Reset after animation completes
      const timer = setTimeout(() => {
        setFormData({
          feedbackType: 'bug',
          title: '',
          description: '',
          priority: 'medium',
        });
        setIsSuccess(false);
        setError(null);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const updateField = <K extends keyof FeedbackFormData>(
    field: K,
    value: FeedbackFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feedbackType: formData.feedbackType,
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
          currentUrl: window.location.href,
          userAgent: navigator.userAgent,
          screenResolution: `${window.screen.width}x${window.screen.height}`,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit feedback');
      }

      setIsSuccess(true);

      // Close dialog after 2 seconds on success
      setTimeout(() => {
        setOpen(false);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedType = feedbackTypes.find((t) => t.value === formData.feedbackType);

  return (
    <>
      {/* Floating feedback button */}
      <Button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-shadow"
        size="icon"
        title="Send Feedback"
      >
        <MessageSquare className="h-5 w-5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Beta Feedback
            </DialogTitle>
            <DialogDescription>
              Help us improve! Report bugs, request features, or share your thoughts.
            </DialogDescription>
          </DialogHeader>

          {isSuccess ? (
            <div className="py-8 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Thank you!</h3>
              <p className="text-muted-foreground">
                Your feedback has been submitted successfully.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Feedback Type Selection */}
              <div className="space-y-2">
                <Label>What type of feedback is this?</Label>
                <div className="grid grid-cols-2 gap-2">
                  {feedbackTypes.map((type) => {
                    const Icon = type.icon;
                    const isSelected = formData.feedbackType === type.value;
                    return (
                      <Button
                        key={type.value}
                        type="button"
                        variant={isSelected ? 'default' : 'outline'}
                        className="justify-start h-auto py-3"
                        onClick={() => updateField('feedbackType', type.value as FeedbackType)}
                      >
                        <Icon className={`h-4 w-4 mr-2 ${isSelected ? '' : type.color}`} />
                        {type.label}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">
                  {formData.feedbackType === 'bug' ? 'What went wrong?' : 'Title'} *
                </Label>
                <Input
                  id="title"
                  placeholder={
                    formData.feedbackType === 'bug'
                      ? 'e.g., Button not working on goals page'
                      : formData.feedbackType === 'feature'
                      ? 'e.g., Add dark mode support'
                      : 'Brief summary of your feedback'
                  }
                  value={formData.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">
                  {formData.feedbackType === 'bug'
                    ? 'Steps to reproduce'
                    : 'Description'}{' '}
                  *
                </Label>
                <Textarea
                  id="description"
                  placeholder={
                    formData.feedbackType === 'bug'
                      ? '1. Go to...\n2. Click on...\n3. See error...'
                      : 'Please provide as much detail as possible...'
                  }
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  rows={4}
                  required
                />
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => updateField('priority', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Context info notice */}
              <p className="text-xs text-muted-foreground">
                We&apos;ll automatically capture your current page URL and browser info to help us
                debug issues faster.
              </p>

              {error && (
                <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950 p-3 rounded-md">
                  {error}
                </div>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || !formData.title || !formData.description}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      {selectedType && <selectedType.icon className="mr-2 h-4 w-4" />}
                      Submit Feedback
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
