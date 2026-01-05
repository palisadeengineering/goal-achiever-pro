'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, Loader2, ChevronDown, ChevronUp, HelpCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Question {
  id: string;
  question: string;
  placeholder: string;
  helperText: string;
}

interface MetricWithQuestions {
  metric: string;
  type: string;
  questions: Question[];
}

interface SmartQuestionsProps {
  vision: string;
  description: string;
  onAnswersChange: (answers: Record<string, string>) => void;
  className?: string;
}

export function SmartQuestions({ vision, description, onAnswersChange, className }: SmartQuestionsProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [metrics, setMetrics] = useState<MetricWithQuestions[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [lastAnalyzedText, setLastAnalyzedText] = useState('');

  // Debounced analysis - only analyze when text changes significantly
  const analyzeText = useCallback(async () => {
    const combinedText = `${vision} ${description}`.trim();

    // Don't analyze if text is too short or hasn't changed
    if (combinedText.length < 20 || combinedText === lastAnalyzedText) {
      return;
    }

    // Check for potential metrics with regex before calling API
    const hasNumbers = /\d+[kKmM]?\s*(mrr|arr|revenue|users|customers|subscribers|sales|\$|dollars|per\s*(month|year|day)|daily|weekly|monthly)/i.test(combinedText);
    const hasTargets = /(want|goal|achieve|reach|build|grow|make|earn|hit)\s+.*\d/i.test(combinedText);

    if (!hasNumbers && !hasTargets) {
      setMetrics([]);
      setHasAnalyzed(true);
      setLastAnalyzedText(combinedText);
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/ai/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vision, description }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze');
      }

      const result = await response.json();

      if (result.hasMetrics && result.metricsFound?.length > 0) {
        setMetrics(result.metricsFound);
        setIsExpanded(true);
      } else {
        setMetrics([]);
      }

      setHasAnalyzed(true);
      setLastAnalyzedText(combinedText);
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [vision, description, lastAnalyzedText]);

  // Auto-analyze when description changes (with debounce)
  useEffect(() => {
    const combinedText = `${vision} ${description}`.trim();
    if (combinedText.length < 20) return;

    const timer = setTimeout(() => {
      analyzeText();
    }, 1500); // Debounce 1.5 seconds

    return () => clearTimeout(timer);
  }, [vision, description, analyzeText]);

  const handleAnswerChange = (questionId: string, value: string) => {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);
    onAnswersChange(newAnswers);
  };

  const answeredCount = Object.values(answers).filter(v => v.trim()).length;
  const totalQuestions = metrics.reduce((sum, m) => sum + m.questions.length, 0);

  // Don't render if no metrics found and has analyzed
  if (hasAnalyzed && metrics.length === 0 && !isAnalyzing) {
    return null;
  }

  // Don't render if text is too short
  if (`${vision} ${description}`.trim().length < 20 && !isAnalyzing) {
    return null;
  }

  return (
    <div className={cn('rounded-lg border bg-amber-50 dark:bg-amber-950/20', className)}>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          {isAnalyzing ? (
            <Loader2 className="h-5 w-5 text-amber-600 animate-spin" />
          ) : (
            <HelpCircle className="h-5 w-5 text-amber-600" />
          )}
          <div>
            <span className="font-medium text-sm">
              {isAnalyzing ? 'Analyzing your goals...' : 'Smart Questions'}
            </span>
            {metrics.length > 0 && !isAnalyzing && (
              <span className="text-xs text-muted-foreground ml-2">
                {answeredCount}/{totalQuestions} answered
              </span>
            )}
          </div>
        </div>
        {metrics.length > 0 && (
          <div className="flex items-center gap-2">
            {answeredCount === totalQuestions && totalQuestions > 0 && (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            )}
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        )}
      </button>

      {isExpanded && metrics.length > 0 && (
        <div className="px-4 pb-4 space-y-4">
          <p className="text-xs text-muted-foreground">
            Answer these questions to help us create more realistic KPIs with real math behind them.
          </p>

          {metrics.map((metric) => (
            <div key={metric.metric} className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium">{metric.metric}</span>
                <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded">
                  {metric.type}
                </span>
              </div>

              <div className="space-y-3 pl-6">
                {metric.questions.map((q) => (
                  <div key={q.id} className="space-y-1">
                    <Label htmlFor={q.id} className="text-sm">
                      {q.question}
                    </Label>
                    <Input
                      id={q.id}
                      placeholder={q.placeholder}
                      value={answers[q.id] || ''}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      className="bg-white dark:bg-background"
                    />
                    <p className="text-xs text-muted-foreground">{q.helperText}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
