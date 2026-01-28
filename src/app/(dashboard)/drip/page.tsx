import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ValueMatrix } from '@/components/features/drip/drip-matrix';
import { ValuePieChart } from '@/components/features/time-audit/drip-pie-chart';
import { Plus, Lightbulb } from 'lucide-react';
import type { ValueQuadrant } from '@/types/database';
import { ShareButton } from '@/components/features/sharing';

// Mock data - will be replaced with actual data fetching
const mockItems = [
  { id: '1', title: 'Email management', description: 'Daily inbox processing', quadrant: 'delegation' as ValueQuadrant, timeSpent: 300 },
  { id: '2', title: 'Meeting scheduling', description: 'Calendar coordination', quadrant: 'delegation' as ValueQuadrant, timeSpent: 120 },
  { id: '3', title: 'Social media posting', description: 'Content distribution', quadrant: 'replacement' as ValueQuadrant, timeSpent: 180 },
  { id: '4', title: 'Report generation', description: 'Weekly analytics', quadrant: 'replacement' as ValueQuadrant, timeSpent: 240 },
  { id: '5', title: 'Team mentoring', description: '1:1 development', quadrant: 'investment' as ValueQuadrant, timeSpent: 180 },
  { id: '6', title: 'Learning & courses', description: 'Skill development', quadrant: 'investment' as ValueQuadrant, timeSpent: 300 },
  { id: '7', title: 'Networking events', description: 'Building relationships', quadrant: 'investment' as ValueQuadrant, timeSpent: 120 },
  { id: '8', title: 'Client strategy calls', description: 'High-value consulting', quadrant: 'production' as ValueQuadrant, timeSpent: 480 },
  { id: '9', title: 'Product development', description: 'Core value creation', quadrant: 'production' as ValueQuadrant, timeSpent: 600 },
  { id: '10', title: 'Sales presentations', description: 'Revenue generation', quadrant: 'production' as ValueQuadrant, timeSpent: 360 },
];

const mockValueData = {
  delegation: 420,
  replacement: 420,
  investment: 600,
  production: 1440,
};

export default function ValueMatrixPage() {
  // Calculate insights
  const totalMinutes = Object.values(mockValueData).reduce((a, b) => a + b, 0);
  const productionPercent = Math.round((mockValueData.production / totalMinutes) * 100);
  const delegationPercent = Math.round((mockValueData.delegation / totalMinutes) * 100);
  const replacementPercent = Math.round((mockValueData.replacement / totalMinutes) * 100);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Value Matrix"
        description="Categorize your activities by money potential and energy to optimize your time"
        actions={
          <div className="flex items-center gap-2">
            <ShareButton tabName="drip" />
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Activity
            </Button>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-cyan-200 dark:border-cyan-700 bg-cyan-50 dark:bg-cyan-900/20">
          <CardContent className="pt-4">
            <p className="text-sm text-cyan-800 dark:text-cyan-200">Production Time</p>
            <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{productionPercent}%</p>
            <p className="text-xs text-cyan-700 dark:text-cyan-300">Your sweet spot activities</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20">
          <CardContent className="pt-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">Investment Time</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {Math.round((mockValueData.investment / totalMinutes) * 100)}%
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300">Long-term growth</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20">
          <CardContent className="pt-4">
            <p className="text-sm text-orange-800 dark:text-orange-200">To Automate</p>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{replacementPercent}%</p>
            <p className="text-xs text-orange-700 dark:text-orange-300">Systematize these tasks</p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20">
          <CardContent className="pt-4">
            <p className="text-sm text-purple-800 dark:text-purple-200">To Delegate</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{delegationPercent}%</p>
            <p className="text-xs text-purple-700 dark:text-purple-300">Hand off to others</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Value Matrix - Takes 2 columns */}
        <div className="lg:col-span-2">
          <ValueMatrix items={mockItems} />
        </div>

        {/* Side Panel */}
        <div className="space-y-6">
          {/* Distribution Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Time Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ValuePieChart data={mockValueData} size="lg" />
            </CardContent>
          </Card>

          {/* Insights */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {productionPercent >= 40 ? (
                <div className="p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg border border-cyan-200 dark:border-cyan-700">
                  <p className="text-sm text-cyan-800 dark:text-cyan-200">
                    <strong>Great job!</strong> You&apos;re spending {productionPercent}% of your time in Production - your sweet spot.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>Opportunity:</strong> Try to increase Production time from {productionPercent}% to at least 40%.
                  </p>
                </div>
              )}

              {delegationPercent > 15 && (
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                  <p className="text-sm text-purple-800 dark:text-purple-200">
                    <strong>Consider:</strong> {delegationPercent}% of your time could be delegated. Consider hiring help or using a VA.
                  </p>
                </div>
              )}

              {replacementPercent > 15 && (
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-700">
                  <p className="text-sm text-orange-800 dark:text-orange-200">
                    <strong>Automate:</strong> {replacementPercent}% of your time is in repetitive tasks. Look for automation tools.
                  </p>
                </div>
              )}

              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Goal:</strong> Aim for 50%+ Production, 25% Investment, and minimize Delegation/Replacement.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
