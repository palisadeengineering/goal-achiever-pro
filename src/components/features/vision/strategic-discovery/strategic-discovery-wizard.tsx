'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { DollarSign, Target, Package, Megaphone, Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { RevenueCalculator } from './revenue-calculator';
import { AIFollowUpPanel } from './ai-follow-up-panel';
import { DiscoverySummaryCard } from './discovery-summary-card';
import { RevenueMathSection } from './category-sections/revenue-math-section';
import { PositioningSection } from './category-sections/positioning-section';
import { ProductSection } from './category-sections/product-section';
import { AcquisitionSection } from './category-sections/acquisition-section';
import type {
  StrategicDiscoveryData,
  DiscoveryCategory,
  ConversationMessage,
  AIInsights,
} from '@/types/strategic-discovery';

interface StrategicDiscoveryWizardProps {
  visionTitle: string;
  visionDescription?: string;
  smartGoals?: {
    specific?: string;
    measurable?: string;
    attainable?: string;
    realistic?: string;
    timeBound?: string;
  };
  initialData?: Partial<StrategicDiscoveryData>;
  onComplete: (data: StrategicDiscoveryData) => void;
  onSkip?: () => void;
}

const CATEGORIES: { id: DiscoveryCategory; label: string; icon: React.ReactNode; description: string }[] = [
  {
    id: 'revenue',
    label: 'Revenue Math',
    icon: <DollarSign className="h-4 w-4" />,
    description: 'Pricing models, customer counts, and MRR targets',
  },
  {
    id: 'positioning',
    label: 'Positioning',
    icon: <Target className="h-4 w-4" />,
    description: 'Target customer, problem solved, and differentiation',
  },
  {
    id: 'product',
    label: 'Product',
    icon: <Package className="h-4 w-4" />,
    description: 'Core features, pricing tiers, and retention strategy',
  },
  {
    id: 'acquisition',
    label: 'Acquisition',
    icon: <Megaphone className="h-4 w-4" />,
    description: 'Channels, CAC, and timeline milestones',
  },
];

export function StrategicDiscoveryWizard({
  visionTitle,
  visionDescription,
  smartGoals,
  initialData,
  onComplete,
  onSkip,
}: StrategicDiscoveryWizardProps) {
  const [activeCategory, setActiveCategory] = useState<DiscoveryCategory>('revenue');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  const [data, setData] = useState<Partial<StrategicDiscoveryData>>({
    ...initialData,
    visionId: initialData?.visionId || '',
    userId: initialData?.userId || '',
    revenueMath: initialData?.revenueMath || {
      revenueTarget: 0,
      revenueType: 'arr',
      targetTimeframe: '',
      pricingModel: 'prosumer',
      basePrice: 29,
      targetCustomerCount: 0,
      arpu: 29,
      calculatedOptions: [],
    },
    positioning: initialData?.positioning || {
      targetCustomer: '',
      problemSolved: '',
      competitors: '',
      differentiator: '',
      marketSize: 'medium',
    },
    product: initialData?.product || {
      coreFeatures: [],
      pricingTiers: [],
      retentionStrategy: '',
      upgradePath: '',
    },
    acquisition: initialData?.acquisition || {
      primaryChannels: [],
      estimatedCAC: 0,
      milestones: [],
      launchDate: '',
      criticalPath: [],
    },
    aiConversation: initialData?.aiConversation || [],
    completionScore: initialData?.completionScore || 0,
    sectionsCompleted: initialData?.sectionsCompleted || [],
  });

  const [aiInsights, setAiInsights] = useState<AIInsights | undefined>(initialData?.aiInsights);

  const updateData = useCallback((updates: Partial<StrategicDiscoveryData>) => {
    setData(prev => ({ ...prev, ...updates }));
  }, []);

  const updateRevenueMath = useCallback((updates: Partial<StrategicDiscoveryData['revenueMath']>) => {
    setData(prev => ({
      ...prev,
      revenueMath: { ...prev.revenueMath!, ...updates },
    }));
  }, []);

  const updatePositioning = useCallback((updates: Partial<StrategicDiscoveryData['positioning']>) => {
    setData(prev => ({
      ...prev,
      positioning: { ...prev.positioning!, ...updates },
    }));
  }, []);

  const updateProduct = useCallback((updates: Partial<StrategicDiscoveryData['product']>) => {
    setData(prev => ({
      ...prev,
      product: { ...prev.product!, ...updates },
    }));
  }, []);

  const updateAcquisition = useCallback((updates: Partial<StrategicDiscoveryData['acquisition']>) => {
    setData(prev => ({
      ...prev,
      acquisition: { ...prev.acquisition!, ...updates },
    }));
  }, []);

  const addConversationMessage = useCallback((message: ConversationMessage) => {
    setData(prev => ({
      ...prev,
      aiConversation: [...(prev.aiConversation || []), message],
    }));
  }, []);

  // Calculate completion score
  const calculateCompletionScore = useCallback(() => {
    let score = 0;
    const sections: DiscoveryCategory[] = [];

    // Revenue (25 points)
    if (data.revenueMath?.revenueTarget && data.revenueMath.revenueTarget > 0) {
      score += 10;
      if (data.revenueMath.pricingModel) score += 5;
      if (data.revenueMath.targetCustomerCount > 0) score += 10;
      if (score >= 20) sections.push('revenue');
    }

    // Positioning (25 points)
    const posScore = [
      data.positioning?.targetCustomer,
      data.positioning?.problemSolved,
      data.positioning?.differentiator,
    ].filter(Boolean).length * 8;
    score += Math.min(25, posScore);
    if (posScore >= 16) sections.push('positioning');

    // Product (25 points)
    const prodScore = [
      (data.product?.coreFeatures?.length || 0) > 0,
      data.product?.retentionStrategy,
    ].filter(Boolean).length * 12;
    score += Math.min(25, prodScore);
    if (prodScore >= 12) sections.push('product');

    // Acquisition (25 points)
    const acqScore = [
      (data.acquisition?.primaryChannels?.length || 0) > 0,
      data.acquisition?.launchDate,
      (data.acquisition?.milestones?.length || 0) > 0,
    ].filter(Boolean).length * 8;
    score += Math.min(25, acqScore);
    if (acqScore >= 16) sections.push('acquisition');

    return { score: Math.min(100, score), sections };
  }, [data]);

  const { score: completionScore, sections: completedSections } = calculateCompletionScore();

  // Run initial AI analysis
  const runAnalysis = useCallback(async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/ai/strategic-discovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze',
          visionTitle,
          visionDescription,
          smartGoals,
        }),
      });

      if (response.ok) {
        const result = await response.json();

        // If revenue options were generated, update them
        if (result.revenueOptions?.length) {
          updateRevenueMath({
            calculatedOptions: result.revenueOptions,
          });
        }

        // Add AI message to conversation
        if (result.insights?.length || result.followUpQuestions?.length) {
          const message: ConversationMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: [
              ...(result.insights || []),
              ...(result.followUpQuestions?.map((q: string) => `Question: ${q}`) || []),
            ].join('\n\n'),
            category: 'revenue',
            timestamp: new Date().toISOString(),
          };
          addConversationMessage(message);
        }

        toast.success('Initial analysis complete');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to analyze vision');
    } finally {
      setIsAnalyzing(false);
    }
  }, [visionTitle, visionDescription, smartGoals, updateRevenueMath, addConversationMessage]);

  // Generate final insights
  const generateInsights = useCallback(async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/ai/strategic-discovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-insights',
          visionTitle,
          visionDescription,
          smartGoals,
          currentData: data,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.aiInsights) {
          setAiInsights(result.aiInsights);
          updateData({ aiInsights: result.aiInsights });
        }
        setShowSummary(true);
        toast.success('Insights generated');
      }
    } catch (error) {
      console.error('Insights error:', error);
      toast.error('Failed to generate insights');
    } finally {
      setIsAnalyzing(false);
    }
  }, [visionTitle, visionDescription, smartGoals, data, updateData]);

  const handleComplete = useCallback(() => {
    const finalData: StrategicDiscoveryData = {
      ...data as StrategicDiscoveryData,
      completionScore,
      sectionsCompleted: completedSections,
      aiInsights,
      updatedAt: new Date().toISOString(),
    };
    onComplete(finalData);
  }, [data, completionScore, completedSections, aiInsights, onComplete]);

  const isCategoryComplete = (category: DiscoveryCategory) =>
    completedSections.includes(category);

  return (
    <div className="space-y-6">
      {/* Header with Progress */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Strategic Discovery</h3>
          <p className="text-sm text-muted-foreground">
            Answer these questions to create a mathematically-grounded plan
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium">{completionScore}% Complete</p>
            <p className="text-xs text-muted-foreground">
              {completedSections.length} of 4 sections
            </p>
          </div>
          <Progress value={completionScore} className="w-24 h-2" />
        </div>
      </div>

      {/* AI Analysis Button */}
      {data.aiConversation?.length === 0 && (
        <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 border-purple-200 dark:border-purple-800">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="font-medium">Start with AI Analysis</p>
                  <p className="text-sm text-muted-foreground">
                    Let AI analyze your vision and suggest initial questions
                  </p>
                </div>
              </div>
              <Button
                onClick={runAnalysis}
                disabled={isAnalyzing}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Analyze Vision
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Tabs */}
      <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as DiscoveryCategory)}>
        <TabsList className="grid w-full grid-cols-4">
          {CATEGORIES.map((cat) => (
            <TabsTrigger
              key={cat.id}
              value={cat.id}
              className="flex items-center gap-2"
            >
              {isCategoryComplete(cat.id) ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                cat.icon
              )}
              <span className="hidden sm:inline">{cat.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="revenue" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Revenue Math
              </CardTitle>
              <CardDescription>
                Break down your revenue target into specific numbers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <RevenueCalculator
                data={data.revenueMath!}
                onUpdate={updateRevenueMath}
              />
              <RevenueMathSection
                data={data.revenueMath!}
                onUpdate={updateRevenueMath}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="positioning" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Positioning & Market
              </CardTitle>
              <CardDescription>
                Define your target customer and competitive advantage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PositioningSection
                data={data.positioning!}
                onUpdate={updatePositioning}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="product" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Product & Monetization
              </CardTitle>
              <CardDescription>
                Core features, pricing tiers, and retention strategy
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProductSection
                data={data.product!}
                onUpdate={updateProduct}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="acquisition" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="h-5 w-5" />
                Acquisition & Timeline
              </CardTitle>
              <CardDescription>
                Channels, CAC estimates, and milestone roadmap
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AcquisitionSection
                data={data.acquisition!}
                onUpdate={updateAcquisition}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* AI Follow-up Panel */}
      {showAIPanel && (
        <AIFollowUpPanel
          visionTitle={visionTitle}
          currentData={data}
          currentCategory={activeCategory}
          conversation={data.aiConversation || []}
          onAddMessage={addConversationMessage}
          onClose={() => setShowAIPanel(false)}
        />
      )}

      {/* Summary Card */}
      {showSummary && aiInsights && (
        <DiscoverySummaryCard
          insights={aiInsights}
          data={data as StrategicDiscoveryData}
          onClose={() => setShowSummary(false)}
        />
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowAIPanel(!showAIPanel)}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {showAIPanel ? 'Hide' : 'Show'} AI Assistant
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {onSkip && (
            <Button variant="ghost" onClick={onSkip}>
              Skip for now
            </Button>
          )}
          <Button
            variant="outline"
            onClick={generateInsights}
            disabled={isAnalyzing || completionScore < 25}
          >
            {isAnalyzing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Generate Insights
          </Button>
          <Button
            onClick={handleComplete}
            disabled={completionScore < 25}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Complete Discovery
          </Button>
        </div>
      </div>
    </div>
  );
}
