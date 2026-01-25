'use client';

import { useState, useRef, useEffect } from 'react';
import { useMetricsChat, type MetricAnswer } from './metrics-chat-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import {
  Send,
  Loader2,
  Check,
  ChevronRight,
  Sparkles,
  Target,
  RotateCcw,
} from 'lucide-react';

export function MetricsChatPanel() {
  const {
    state,
    setVision,
    submitVision,
    submitAnswer,
    submitAllAnswers,
    approveSection,
    set300Percent,
    reset,
  } = useMetricsChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState('');

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages]);

  // Get current question if in asking_questions state
  const currentQuestion = state.flowState === 'asking_questions'
    ? state.questions[state.currentQuestionIndex]
    : null;

  const allQuestionsAnswered = state.answers.length >= state.questions.length;

  // Handle vision submission
  const handleVisionSubmit = () => {
    if (inputValue.trim()) {
      setVision(inputValue.trim());
      submitVision();
      setInputValue('');
    }
  };

  // Handle answer submission
  const handleAnswerSubmit = () => {
    if (!currentQuestion || !inputValue.trim()) return;

    const answer: MetricAnswer = {
      questionId: currentQuestion.id,
      question: currentQuestion.question,
      answer: currentQuestion.type === 'number' || currentQuestion.type === 'currency' || currentQuestion.type === 'percentage'
        ? parseFloat(inputValue) || 0
        : inputValue,
      type: currentQuestion.type,
      category: currentQuestion.category,
      unit: currentQuestion.unit,
    };

    submitAnswer(answer);
    setInputValue('');

    // Move to next question or generate plan
    if (state.currentQuestionIndex < state.questions.length - 1) {
      // There's a next question - the context will handle moving to it
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (state.flowState === 'vision_input') {
        handleVisionSubmit();
      } else if (state.flowState === 'asking_questions' && currentQuestion) {
        handleAnswerSubmit();
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Goal Planner</h2>
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

        {/* Question card if asking questions */}
        {state.flowState === 'asking_questions' && currentQuestion && !state.isLoading && (
          <Card className="border-primary/20">
            <CardContent className="pt-4">
              <div className="flex items-start gap-2 mb-2">
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                  Question {state.currentQuestionIndex + 1} of {state.questions.length}
                </span>
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded',
                  currentQuestion.category === 'outcome'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                )}>
                  {currentQuestion.category === 'outcome' ? 'Outcome' : 'Activity'}
                </span>
              </div>
              <p className="font-medium mb-1">{currentQuestion.question}</p>
              <p className="text-sm text-muted-foreground mb-3">{currentQuestion.context}</p>
              <div className="flex gap-2">
                <Input
                  type={currentQuestion.type === 'currency' || currentQuestion.type === 'number' || currentQuestion.type === 'percentage' ? 'number' : 'text'}
                  placeholder={currentQuestion.placeholder}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                />
                {currentQuestion.unit && (
                  <span className="flex items-center text-sm text-muted-foreground">
                    {currentQuestion.unit}
                  </span>
                )}
                <Button onClick={handleAnswerSubmit} disabled={!inputValue.trim()}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Generate plan button when all questions answered */}
        {state.flowState === 'asking_questions' && allQuestionsAnswered && !state.isLoading && (
          <div className="flex justify-center">
            <Button onClick={submitAllAnswers} size="lg" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Generate My Plan
            </Button>
          </div>
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

        {/* 300% Rule section */}
        {state.flowState === 'affirmation_300' && !state.isLoading && (
          <Card className="border-primary/20">
            <CardContent className="pt-4 space-y-6">
              <div>
                <h4 className="font-medium mb-3">300% Rule - Rate Your Confidence</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  How confident are you in achieving this vision? Rate each on a scale of 0-100.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium">Clarity</label>
                    <span className="text-sm text-muted-foreground">{state.threeHundredPercent.clarity}%</span>
                  </div>
                  <Slider
                    value={[state.threeHundredPercent.clarity]}
                    onValueChange={([value]) => set300Percent({ clarity: value })}
                    max={100}
                    step={1}
                  />
                  <p className="text-xs text-muted-foreground mt-1">How clear is this vision to you?</p>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium">Belief</label>
                    <span className="text-sm text-muted-foreground">{state.threeHundredPercent.belief}%</span>
                  </div>
                  <Slider
                    value={[state.threeHundredPercent.belief]}
                    onValueChange={([value]) => set300Percent({ belief: value })}
                    max={100}
                    step={1}
                  />
                  <p className="text-xs text-muted-foreground mt-1">How strongly do you believe you can achieve it?</p>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium">Consistency</label>
                    <span className="text-sm text-muted-foreground">{state.threeHundredPercent.consistency}%</span>
                  </div>
                  <Slider
                    value={[state.threeHundredPercent.consistency]}
                    onValueChange={([value]) => set300Percent({ consistency: value })}
                    max={100}
                    step={1}
                  />
                  <p className="text-xs text-muted-foreground mt-1">How consistently will you work toward it?</p>
                </div>
              </div>

              <div className="pt-2">
                <div className="text-center mb-4">
                  <span className="text-2xl font-bold text-primary">
                    {state.threeHundredPercent.clarity + state.threeHundredPercent.belief + state.threeHundredPercent.consistency}%
                  </span>
                  <span className="text-sm text-muted-foreground"> / 300%</span>
                </div>
                <Button onClick={() => approveSection('complete')} size="lg" className="w-full gap-2">
                  <Check className="h-4 w-4" />
                  Complete & Save Plan
                </Button>
              </div>
            </CardContent>
          </Card>
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
