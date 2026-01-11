'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Send, Loader2, X, User, Bot } from 'lucide-react';
import type {
  ConversationMessage,
  DiscoveryCategory,
  StrategicDiscoveryData,
} from '@/types/strategic-discovery';

interface AIFollowUpPanelProps {
  visionTitle: string;
  currentData: Partial<StrategicDiscoveryData>;
  currentCategory: DiscoveryCategory;
  conversation: ConversationMessage[];
  onAddMessage: (message: ConversationMessage) => void;
  onClose: () => void;
}

const CATEGORY_LABELS: Record<DiscoveryCategory, string> = {
  revenue: 'Revenue Math',
  positioning: 'Positioning',
  product: 'Product',
  acquisition: 'Acquisition',
};

export function AIFollowUpPanel({
  visionTitle,
  currentData,
  currentCategory,
  conversation,
  onAddMessage,
  onClose,
}: AIFollowUpPanelProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ConversationMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      category: currentCategory,
      timestamp: new Date().toISOString(),
    };

    onAddMessage(userMessage);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/strategic-discovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'follow-up',
          visionTitle,
          currentData,
          category: currentCategory,
          userMessage: input.trim(),
        }),
      });

      if (response.ok) {
        const result = await response.json();

        // Build AI response content
        const parts: string[] = [];

        if (result.acknowledgment) {
          parts.push(result.acknowledgment);
        }

        if (result.insights?.length) {
          parts.push('\n**Insights:**');
          result.insights.forEach((insight: string) => {
            parts.push(`- ${insight}`);
          });
        }

        if (result.followUpQuestions?.length) {
          parts.push('\n**Follow-up Questions:**');
          result.followUpQuestions.forEach((q: string, i: number) => {
            parts.push(`${i + 1}. ${q}`);
          });
        }

        const aiMessage: ConversationMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: parts.join('\n'),
          category: result.nextCategory || currentCategory,
          timestamp: new Date().toISOString(),
        };

        onAddMessage(aiMessage);
      }
    } catch (error) {
      console.error('AI follow-up error:', error);

      const errorMessage: ConversationMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your response. Please try again.',
        category: currentCategory,
        timestamp: new Date().toISOString(),
      };

      onAddMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Filter messages for current category or show all
  const displayMessages = conversation;

  return (
    <Card className="border-purple-200 dark:border-purple-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-purple-500" />
            AI Strategic Advisor
            <Badge variant="secondary" className="ml-2">
              {CATEGORY_LABELS[currentCategory]}
            </Badge>
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Conversation History */}
        <ScrollArea className="h-64 pr-4" ref={scrollRef}>
          <div className="space-y-4">
            {displayMessages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <Sparkles className="h-8 w-8 mx-auto mb-2 text-purple-300" />
                <p>Ask me anything about your strategic plan.</p>
                <p className="text-sm mt-1">
                  I can help you dig deeper into {CATEGORY_LABELS[currentCategory].toLowerCase()}.
                </p>
              </div>
            )}

            {displayMessages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                )}

                <div
                  className={`rounded-lg px-4 py-2 max-w-[80%] ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {CATEGORY_LABELS[message.category]}
                    </Badge>
                    <span className="text-xs opacity-60">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="bg-muted rounded-lg px-4 py-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="flex gap-2">
          <Textarea
            placeholder={`Ask about ${CATEGORY_LABELS[currentCategory].toLowerCase()}...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            className="resize-none"
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Press Enter to send, Shift+Enter for new line
        </p>
      </CardContent>
    </Card>
  );
}
