'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
import { Bug, Lightbulb, MessageSquare, Loader2, CheckCircle2, Sparkles, AlertTriangle, Camera, X } from 'lucide-react';

type FeedbackType = 'bug' | 'feature' | 'improvement' | 'general';

interface FeedbackFormData {
  feedbackType: FeedbackType;
  title: string;
  description: string;
  priority: string;
}

interface CapturedError {
  type: 'console' | 'exception' | 'unhandled-rejection' | 'network';
  message: string;
  timestamp: Date;
  source?: string;
  line?: number;
  statusCode?: number;
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

const MAX_ERRORS = 50;

export function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const errorsRef = useRef<CapturedError[]>([]);
  const [, forceUpdate] = useState(0);
  const [mounted, setMounted] = useState(false);

  // Track client-side mounting for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if screen capture is supported
  const isScreenCaptureSupported = typeof navigator !== 'undefined' &&
    navigator.mediaDevices &&
    'getDisplayMedia' in navigator.mediaDevices;

  const [formData, setFormData] = useState<FeedbackFormData>({
    feedbackType: 'bug',
    title: '',
    description: '',
    priority: 'medium',
  });

  // Set up error tracking
  useEffect(() => {
    const addError = (err: Omit<CapturedError, 'timestamp'>) => {
      const newError: CapturedError = { ...err, timestamp: new Date() };
      errorsRef.current = [newError, ...errorsRef.current].slice(0, MAX_ERRORS);
    };

    // Capture console.error
    const originalConsoleError = console.error;
    console.error = (...args: unknown[]) => {
      const message = args
        .map((arg) => {
          if (arg instanceof Error) return `${arg.name}: ${arg.message}`;
          if (typeof arg === 'object') {
            try { return JSON.stringify(arg); } catch { return String(arg); }
          }
          return String(arg);
        })
        .join(' ');

      // Filter out noise
      if (!message.includes('Hydration') && !message.includes('Warning:')) {
        addError({ type: 'console', message });
      }
      originalConsoleError.apply(console, args);
    };

    // Capture uncaught exceptions
    const handleError = (event: ErrorEvent) => {
      addError({
        type: 'exception',
        message: event.message,
        source: event.filename,
        line: event.lineno,
      });
    };

    // Capture unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      addError({
        type: 'unhandled-rejection',
        message: reason instanceof Error ? reason.message : String(reason),
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Intercept fetch to capture network errors
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        if (!response.ok && response.status >= 400) {
          const url = typeof args[0] === 'string' ? args[0] : args[0] instanceof Request ? args[0].url : String(args[0]);
          addError({
            type: 'network',
            message: `${response.status} ${response.statusText}: ${url}`,
            statusCode: response.status,
          });
        }
        return response;
      } catch (err) {
        const url = typeof args[0] === 'string' ? args[0] : args[0] instanceof Request ? args[0].url : String(args[0]);
        addError({
          type: 'network',
          message: `Network error: ${url} - ${err instanceof Error ? err.message : String(err)}`,
        });
        throw err;
      }
    };

    return () => {
      console.error = originalConsoleError;
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.fetch = originalFetch;
    };
  }, []);

  // Force update when dialog opens to show latest errors
  useEffect(() => {
    if (open) {
      forceUpdate(n => n + 1);
    }
  }, [open]);

  // Capture screenshot using browser's native screen capture
  const captureScreenshot = async () => {
    if (!isScreenCaptureSupported) {
      setError('Screen capture is not supported on this device. Please take a manual screenshot.');
      return;
    }

    setIsCapturing(true);
    setError(null);

    try {
      // Request screen capture permission
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'browser',
        } as MediaTrackConstraints,
        audio: false,
      });

      // Create video element to capture frame
      const video = document.createElement('video');
      video.srcObject = stream;
      await video.play();

      // Wait a moment for the video to be ready
      await new Promise(resolve => setTimeout(resolve, 100));

      // Create canvas and capture frame
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/png', 0.8);
        setScreenshot(dataUrl);
      }

      // Stop all tracks to release the screen capture
      stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      // User cancelled or permission denied - this is fine
      if (err instanceof Error && err.name !== 'NotAllowedError') {
        console.warn('Screenshot capture failed:', err);
      }
    } finally {
      setIsCapturing(false);
    }
  };

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => {
        setFormData({
          feedbackType: 'bug',
          title: '',
          description: '',
          priority: 'medium',
        });
        setIsSuccess(false);
        setError(null);
        setScreenshot(null);
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

  const getErrorsSummary = () => {
    if (errorsRef.current.length === 0) return 'No errors captured';
    return errorsRef.current
      .map((err) => {
        const time = err.timestamp.toLocaleTimeString();
        const location = err.source ? ` at ${err.source}:${err.line}` : '';
        const status = err.statusCode ? ` (${err.statusCode})` : '';
        return `[${time}] [${err.type}]${status} ${err.message}${location}`;
      })
      .join('\n');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedbackType: formData.feedbackType,
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
          currentUrl: window.location.href,
          userAgent: navigator.userAgent,
          screenResolution: `${window.screen.width}x${window.screen.height}`,
          screenshot,
          capturedErrors: getErrorsSummary(),
          errorsCount: errorsRef.current.length,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit feedback');
      }

      setIsSuccess(true);
      errorsRef.current = []; // Clear captured errors

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

  // Handle feedback button click - stop propagation to prevent dialog overlay from intercepting
  const handleFeedbackButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setOpen(true);
  };

  // Render button through portal to ensure it's at DOM root level
  // Wrapped in a div with isolation to create a new stacking context above all dialogs
  // The data-feedback-button attribute tells dialogs not to close when clicking here
  const feedbackButton = mounted ? createPortal(
    <div
      data-feedback-button="true"
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 2147483647, // Maximum 32-bit signed integer - highest possible z-index
        isolation: 'isolate', // Create new stacking context
        pointerEvents: 'auto',
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <Button
        onClick={handleFeedbackButtonClick}
        className="h-12 px-4 rounded-full shadow-lg hover:shadow-xl transition-shadow"
        title="Send Feedback"
      >
        <MessageSquare className="h-5 w-5 mr-2" />
        <span className="hidden sm:inline">Feedback</span>
      </Button>
    </div>,
    document.body
  ) : null;

  return (
    <>
      {feedbackButton}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent draggable className="max-w-lg max-h-[90vh] overflow-y-auto" style={{ zIndex: 99999 }}>
          <DialogHeader draggable>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Beta Feedback
            </DialogTitle>
            <DialogDescription>
              Drag to move • Help us improve! Report bugs, request features, or share your thoughts.
            </DialogDescription>
          </DialogHeader>

          {isSuccess ? (
            <div className="py-8 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-cyan-500 mb-4" />
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
                    ? 'Steps to reproduce (optional)'
                    : 'Description (optional)'}
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
                  rows={3}
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

              {/* Screenshot */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Screenshot (optional)
                </Label>
                {screenshot ? (
                  <div className="relative border rounded-lg overflow-hidden">
                    <img
                      src={screenshot}
                      alt="Screenshot"
                      className="w-full h-auto max-h-40 object-contain bg-gray-100 dark:bg-gray-900"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6"
                      onClick={() => setScreenshot(null)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="border border-dashed rounded-lg p-4 text-center">
                    {isScreenCaptureSupported ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={captureScreenshot}
                        disabled={isCapturing}
                        className="w-full"
                      >
                        {isCapturing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Select screen to capture...
                          </>
                        ) : (
                          <>
                            <Camera className="mr-2 h-4 w-4" />
                            Take Screenshot
                          </>
                        )}
                      </Button>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Screen capture not supported on this device.
                        <br />
                        Use <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Win+Shift+S</kbd> to take a screenshot manually.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Captured Errors */}
              {errorsRef.current.length > 0 && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Captured Errors ({errorsRef.current.length})
                  </Label>
                  <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-2 max-h-24 overflow-y-auto">
                    <pre className="text-xs text-red-700 dark:text-red-300 whitespace-pre-wrap font-mono">
                      {getErrorsSummary()}
                    </pre>
                  </div>
                </div>
              )}

              {/* Context info notice */}
              <p className="text-xs text-muted-foreground">
                We automatically capture your current page URL, browser info, and any errors to help debug issues faster. Screenshots are optional.
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
                  disabled={isLoading || !formData.title}
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
