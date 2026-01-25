'use client';

import { useState, useRef, useEffect } from 'react';
import { useMetricsChat, type MetricAnswer } from './metrics-chat-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  Send,
  Loader2,
  Check,
  Sparkles,
  Target,
  RotateCcw,
} from 'lucide-react';

export function MetricsChatPanel() {
  const {
    state,
    submitVision,
    submitAllAnswers,
    approveSection,
    reset,
    dispatch,
  } = useMetricsChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState('');
  const [formAnswers, setFormAnswers] = useState<Record<string, string>>({});

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages]);

  // Initialize form answers when questions load
  useEffect(() => {
    if (state.questions.length > 0 && Object.keys(formAnswers).length === 0) {
      const initialAnswers: Record<string, string> = {};
      state.questions.forEach(q => {
        initialAnswers[q.id] = '';
      });
      setFormAnswers(initialAnswers);
    }
  }, [state.questions, formAnswers]);

  const allQuestionsAnswered = state.questions.length > 0 &&
    state.questions.every(q => formAnswers[q.id]?.trim());

  // Handle vision submission
  const handleVisionSubmit = () => {
    if (inputValue.trim()) {
      submitVision(inputValue.trim());
      setInputValue('');
    }
  };

  // Handle form submission - submit all answers at once
  const handleFormSubmit = () => {
    if (!allQuestionsAnswered) return;

    // Convert form answers to MetricAnswer array
    const answers: MetricAnswer[] = state.questions.map(question => ({
      questionId: question.id,
      question: question.question,
      answer: formAnswers[question.id].trim(),
      type: question.type,
      category: question.category,
      unit: question.unit,
    }));

    // Add answers to state
    answers.forEach(answer => {
      dispatch({ type: 'ADD_ANSWER', payload: answer });
    });

    // Add a summary message to chat
    dispatch({
      type: 'ADD_MESSAGE',
      payload: {
        id: crypto.randomUUID(),
        role: 'user',
        content: state.questions.map(q =>
          `${q.question}\n→ ${formAnswers[q.id]}`
        ).join('\n\n'),
        timestamp: new Date(),
        metadata: { type: 'answer' },
      },
    });

    // Generate the plan - pass answers directly to avoid race condition
    submitAllAnswers(answers);
  };

  // Handle key press for vision input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (state.flowState === 'vision_input') {
        handleVisionSubmit();
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Vision Planner</h2>
        </div>
        {state.visionText && (
          <Button
            variant="ghost"
            size="sm"
            onClick={reset}
            className="text-muted-foreground"
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Start Over
          </Button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Welcome message if no messages */}
        {state.messages.length === 0 && (
          <div className="text-center py-8">
            <Target className="h-12 w-12 mx-auto text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2">What do you want to achieve?</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Describe your vision or goal. Be as specific as possible - include what success looks like to you.
            </p>
          </div>
        )}

        {/* Chat messages */}
        {state.messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'flex',
              message.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            <div
              className={cn(
                'max-w-[85%] rounded-lg px-4 py-2',
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : message.role === 'system'
                    ? 'bg-muted/50 text-muted-foreground italic text-sm'
                    : 'bg-muted'
              )}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {state.isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg px-4 py-2 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Thinking...</span>
            </div>
          </div>
        )}

        {/* All questions form - show all at once */}
        {state.flowState === 'asking_questions' && state.questions.length > 0 && !state.isLoading && state.answers.length === 0 && (
          <Card className="border-primary/20">
            <CardContent className="pt-4 space-y-6">
              <div className="text-sm text-muted-foreground mb-4">
                Answer these {state.questions.length} questions to help create your plan:
              </div>

              {state.questions.map((question, index) => (
                <div key={question.id} className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded font-medium">
                      {index + 1}
                    </span>
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded',
                      question.category === 'outcome'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    )}>
                      {question.category === 'outcome' ? 'Outcome' : 'Activity'}
                    </span>
                  </div>
                  <p className="font-medium text-sm">{question.question}</p>
                  <p className="text-xs text-muted-foreground">{question.context}</p>
                  <Input
                    type="text"
                    placeholder={question.placeholder || 'Type your answer...'}
                    value={formAnswers[question.id] || ''}
                    onChange={(e) => setFormAnswers(prev => ({
                      ...prev,
                      [question.id]: e.target.value
                    }))}
                    className="mt-1"
                  />
                </div>
              ))}

              <div className="pt-4 border-t">
                <Button
                  onClick={handleFormSubmit}
                  disabled={!allQuestionsAnswered}
                  size="lg"
                  className="w-full gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Generate My Plan
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Approval buttons based on flow state */}
        {state.flowState === 'showing_metrics' && !state.isLoading && (
          <div className="flex justify-center">
            <Button onClick={() => approveSection('metrics')} size="lg" className="gap-2">
              <Check className="h-4 w-4" />
              Approve Metrics & Continue
            </Button>
          </div>
        )}

        {state.flowState === 'quarterly_approval' && !state.isLoading && (
          <div className="flex justify-center">
            <Button onClick={() => approveSection('quarterly')} size="lg" className="gap-2">
              <Check className="h-4 w-4" />
              Approve Quarterly Targets
            </Button>
          </div>
        )}

        {state.flowState === 'breakdown_approval' && !state.isLoading && (
          <div className="flex justify-center">
            <Button onClick={() => approveSection('breakdown')} size="lg" className="gap-2">
              <Check className="h-4 w-4" />
              Approve Full Plan
            </Button>
          </div>
        )}

        {/* Completion message */}
        {state.flowState === 'complete' && (
          <div className="text-center py-4">
            <Button variant="outline" onClick={reset}>
              Create Another Plan
            </Button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - only show for vision input */}
      {state.flowState === 'vision_input' && (
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Textarea
              placeholder="Describe your vision or goal..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              className="min-h-[80px] resize-none"
              disabled={state.isLoading}
            />
          </div>
          <div className="flex justify-end mt-2">
            <Button
              onClick={handleVisionSubmit}
              disabled={!inputValue.trim() || state.isLoading}
              className="gap-2"
            >
              {state.isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Start Planning
            </Button>
          </div>
        </div>
      )}

      {/* Error display */}
      {state.error && (
        <div className="px-4 pb-4">
          <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-lg text-sm">
            {state.error}
          </div>
        </div>
      )}
    </div>
  );
}
