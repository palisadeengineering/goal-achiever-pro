'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Target, DollarSign, Package, Megaphone, ArrowRight } from 'lucide-react';
import { StrategicDiscoveryWizard } from '../strategic-discovery';
import type { VisionWizardData } from '../vision-wizard';
import type { StrategicDiscoveryData } from '@/types/strategic-discovery';

interface StrategicDiscoveryStepProps {
  data: VisionWizardData;
  updateData: (updates: Partial<VisionWizardData>) => void;
}

export function StrategicDiscoveryStep({ data, updateData }: StrategicDiscoveryStepProps) {
  const [showFullWizard, setShowFullWizard] = useState(false);
  const [discoveryData, setDiscoveryData] = useState<Partial<StrategicDiscoveryData> | null>(
    (data as VisionWizardData & { strategicDiscovery?: StrategicDiscoveryData }).strategicDiscovery || null
  );

  const handleDiscoveryComplete = useCallback((discovery: StrategicDiscoveryData) => {
    setDiscoveryData(discovery);
    // Store in wizard data for later use
    updateData({ strategicDiscovery: discovery } as Partial<VisionWizardData>);
    setShowFullWizard(false);
  }, [updateData]);

  const handleSkip = useCallback(() => {
    setShowFullWizard(false);
  }, []);

  // Check if we have meaningful discovery data
  const hasDiscoveryData = discoveryData && discoveryData.completionScore && discoveryData.completionScore > 0;

  // Quick stats for the summary card
  const getQuickStats = () => {
    if (!discoveryData) return null;

    const stats = [];

    if (discoveryData.revenueMath?.revenueTarget) {
      const target = discoveryData.revenueMath.revenueTarget;
      const type = discoveryData.revenueMath.revenueType?.toUpperCase() || 'ARR';
      stats.push({
        icon: <DollarSign className="h-4 w-4" />,
        label: 'Revenue Target',
        value: `$${target.toLocaleString()} ${type}`,
      });
    }

    if (discoveryData.revenueMath?.targetCustomerCount) {
      stats.push({
        icon: <Target className="h-4 w-4" />,
        label: 'Customers Needed',
        value: discoveryData.revenueMath.targetCustomerCount.toLocaleString(),
      });
    }

    if (discoveryData.positioning?.targetCustomer) {
      stats.push({
        icon: <Target className="h-4 w-4" />,
        label: 'Target Customer',
        value: discoveryData.positioning.targetCustomer.slice(0, 50) + '...',
      });
    }

    if (discoveryData.acquisition?.primaryChannels?.length) {
      stats.push({
        icon: <Megaphone className="h-4 w-4" />,
        label: 'Primary Channels',
        value: discoveryData.acquisition.primaryChannels.length + ' selected',
      });
    }

    return stats;
  };

  const quickStats = getQuickStats();

  if (showFullWizard) {
    return (
      <StrategicDiscoveryWizard
        visionTitle={data.title}
        visionDescription={data.description}
        smartGoals={{
          specific: data.specific,
          measurable: data.measurable,
          attainable: data.attainable,
          realistic: data.realistic,
          timeBound: data.timeBound,
        }}
        initialData={discoveryData || undefined}
        onComplete={handleDiscoveryComplete}
        onSkip={handleSkip}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Introduction Card */}
      <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 border-purple-200 dark:border-purple-800">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1">Strategic Discovery</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Answer strategic questions about revenue, positioning, product, and acquisition to create a mathematically-grounded plan for your vision.
              </p>

              {!hasDiscoveryData ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <DollarSign className="h-4 w-4 text-cyan-500" />
                      Revenue Math
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Target className="h-4 w-4 text-blue-500" />
                      Positioning
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Package className="h-4 w-4 text-orange-500" />
                      Product
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Megaphone className="h-4 w-4 text-pink-500" />
                      Acquisition
                    </div>
                  </div>
                  <Button onClick={() => setShowFullWizard(true)} className="w-full sm:w-auto">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Start Strategic Discovery
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Completion Badge */}
                  <div className="flex items-center gap-2">
                    <Badge className="bg-cyan-100 text-cyan-700">
                      {discoveryData.completionScore}% Complete
                    </Badge>
                    {discoveryData.sectionsCompleted?.map((section) => (
                      <Badge key={section} variant="outline">
                        {section}
                      </Badge>
                    ))}
                  </div>

                  {/* Quick Stats */}
                  {quickStats && quickStats.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {quickStats.map((stat, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 p-3 bg-white dark:bg-gray-900 rounded-lg"
                        >
                          <div className="text-primary">{stat.icon}</div>
                          <div>
                            <p className="text-xs text-muted-foreground">{stat.label}</p>
                            <p className="text-sm font-medium">{stat.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <Button
                    variant="outline"
                    onClick={() => setShowFullWizard(true)}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Continue Discovery
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Why This Matters */}
      <Card>
        <CardContent className="pt-6">
          <button
            className="flex items-center justify-between w-full text-left"
            onClick={() => {}}
          >
            <h4 className="font-medium">Why Strategic Discovery?</h4>
          </button>
          <div className="mt-4 space-y-3 text-sm text-muted-foreground">
            <p>
              Most people set vague goals like &ldquo;grow revenue&rdquo; or &ldquo;get more customers.&rdquo;
              Strategic Discovery forces you to do the math:
            </p>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start gap-2">
                <DollarSign className="h-4 w-4 text-cyan-500 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Revenue Math:</strong> $500K ARR = $41.7K MRR = 1,440 customers at $29/mo
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Target className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Positioning:</strong> Who exactly are you selling to and why should they care?
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Package className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Product:</strong> What features matter and how will you price them?
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Megaphone className="h-4 w-4 text-pink-500 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Acquisition:</strong> How will you get those customers and what will it cost?
                </span>
              </li>
            </ul>
            <p className="font-medium text-foreground">
              This data will be used to generate more precise Power Goals aligned with your actual numbers.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Skip Option */}
      {!hasDiscoveryData && (
        <p className="text-xs text-center text-muted-foreground">
          You can skip this step and come back later, but your Power Goals will be less specific.
        </p>
      )}
    </div>
  );
}
