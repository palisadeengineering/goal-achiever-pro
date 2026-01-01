'use client';

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { PageHeader } from '@/components/layout/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, CalendarDays, CalendarRange, Lock } from 'lucide-react';
import Link from 'next/link';
import { WeeklyCalendarView } from '@/components/features/time-audit/weekly-calendar-view';
import { BiweeklyCalendarView } from '@/components/features/time-audit/biweekly-calendar-view';
import { MonthlyCalendarView } from '@/components/features/time-audit/monthly-calendar-view';
import { DripPieChart } from '@/components/features/time-audit/drip-pie-chart';
import { EnergyPieChart } from '@/components/features/time-audit/energy-pie-chart';
import { TimeSummaryStats } from '@/components/features/time-audit/time-summary-stats';
import { TimeBlockForm, TimeBlock } from '@/components/features/time-audit/time-block-form';
import { useLocalStorage } from '@/lib/hooks/use-local-storage';
import { ROUTES } from '@/constants/routes';
import type { DripQuadrant, EnergyRating } from '@/types/database';

type SubscriptionTier = 'free' | 'pro' | 'premium';

// Interface matching WeeklyCalendarView's expected TimeBlock
interface CalendarTimeBlock {
  id: string;
  startTime: string;
  endTime: string;
  activityName: string;
  dripQuadrant: DripQuadrant;
  energyRating: EnergyRating;
}

function checkProAccess(tier: SubscriptionTier): boolean {
  return tier === 'pro' || tier === 'premium';
}

function checkPremiumAccess(tier: SubscriptionTier): boolean {
  return tier === 'premium';
}

// Calculate duration in minutes between two time strings
function calculateDuration(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  return (endHour * 60 + endMin) - (startHour * 60 + startMin);
}

export default function TimeAuditPage() {
  // In real app, check user subscription tier from database
  const userTier: SubscriptionTier = 'free';
  const hasProAccess = checkProAccess(userTier);
  const hasPremiumAccess = checkPremiumAccess(userTier);

  // State for time blocks (persisted to localStorage)
  const [timeBlocks, setTimeBlocks] = useLocalStorage<TimeBlock[]>('time-blocks', []);

  // State for the form modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<TimeBlock | undefined>();
  const [initialDate, setInitialDate] = useState<string>();
  const [initialTime, setInitialTime] = useState<string>();

  // Transform time blocks for WeeklyCalendarView (grouped by date)
  const calendarTimeBlocks = useMemo(() => {
    const grouped: Record<string, CalendarTimeBlock[]> = {};
    timeBlocks.forEach((block) => {
      if (!grouped[block.date]) {
        grouped[block.date] = [];
      }
      grouped[block.date].push({
        id: block.id,
        startTime: block.startTime,
        endTime: block.endTime,
        activityName: block.activityName,
        dripQuadrant: block.dripQuadrant,
        energyRating: block.energyRating,
      });
    });
    return grouped;
  }, [timeBlocks]);

  // Calculate stats from time blocks
  const stats = useMemo(() => {
    let totalMinutes = 0;
    let productionMinutes = 0;
    let delegationCount = 0;
    let energizingMinutes = 0;
    let drainingMinutes = 0;

    timeBlocks.forEach((block) => {
      const duration = calculateDuration(block.startTime, block.endTime);
      totalMinutes += duration;

      if (block.dripQuadrant === 'production') {
        productionMinutes += duration;
      }
      if (block.dripQuadrant === 'delegation') {
        delegationCount++;
      }
      if (block.energyRating === 'green') {
        energizingMinutes += duration;
      }
      if (block.energyRating === 'red') {
        drainingMinutes += duration;
      }
    });

    const productionPercent = totalMinutes > 0 ? Math.round((productionMinutes / totalMinutes) * 100) : 0;
    const energyBalance = totalMinutes > 0
      ? Math.round(((energizingMinutes - drainingMinutes) / totalMinutes) * 100)
      : 0;

    return {
      totalMinutes,
      productionPercent,
      delegationCandidates: delegationCount,
      energyBalance,
    };
  }, [timeBlocks]);

  // Calculate DRIP distribution
  const dripData = useMemo(() => {
    const data = { delegation: 0, replacement: 0, investment: 0, production: 0 };
    timeBlocks.forEach((block) => {
      const duration = calculateDuration(block.startTime, block.endTime);
      data[block.dripQuadrant] += duration;
    });
    return data;
  }, [timeBlocks]);

  // Calculate energy distribution
  const energyData = useMemo(() => {
    const data = { green: 0, yellow: 0, red: 0 };
    timeBlocks.forEach((block) => {
      const duration = calculateDuration(block.startTime, block.endTime);
      data[block.energyRating] += duration;
    });
    return data;
  }, [timeBlocks]);

  // Handle saving a new or edited time block
  const handleSaveBlock = (blockData: Omit<TimeBlock, 'id' | 'createdAt'>) => {
    if (editingBlock) {
      // Update existing block
      setTimeBlocks(blocks =>
        blocks.map(b =>
          b.id === editingBlock.id
            ? { ...b, ...blockData }
            : b
        )
      );
    } else {
      // Create new block
      const newBlock: TimeBlock = {
        ...blockData,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      setTimeBlocks(blocks => [...blocks, newBlock]);
    }
    setEditingBlock(undefined);
    setInitialDate(undefined);
    setInitialTime(undefined);
  };

  // Handle clicking on the calendar to add a block (receives Date object from WeeklyCalendarView)
  const handleAddBlock = (date: Date, time: string) => {
    setInitialDate(format(date, 'yyyy-MM-dd'));
    setInitialTime(time);
    setEditingBlock(undefined);
    setIsFormOpen(true);
  };

  // Handle clicking on an existing block (receives block object from WeeklyCalendarView)
  const handleBlockClick = (block: CalendarTimeBlock) => {
    const fullBlock = timeBlocks.find(b => b.id === block.id);
    if (fullBlock) {
      setEditingBlock(fullBlock);
      setIsFormOpen(true);
    }
  };

  // Open form for new block
  const handleLogTimeBlock = () => {
    setEditingBlock(undefined);
    setInitialDate(undefined);
    setInitialTime(undefined);
    setIsFormOpen(true);
  };

  // Check if we have data (for showing different states)
  const hasData = timeBlocks.length > 0;
  const totalHours = stats.totalMinutes > 0 ? stats.totalMinutes : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Time & Energy Audit"
        description="Track how you spend your time and energy across DRIP quadrants"
        actions={
          <Button onClick={handleLogTimeBlock}>
            <Plus className="h-4 w-4 mr-2" />
            Log Time Block
          </Button>
        }
      />

      {/* Time Block Form Modal */}
      <TimeBlockForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSave={handleSaveBlock}
        initialDate={initialDate}
        initialTime={initialTime}
        editBlock={editingBlock}
      />

      {/* Summary Stats */}
      <TimeSummaryStats
        totalMinutes={stats.totalMinutes}
        productionPercent={stats.productionPercent}
        delegationCandidates={stats.delegationCandidates}
        energyBalance={stats.energyBalance}
      />

      {/* Main Content - Tabs + Charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar Views - Takes 2 columns */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="weekly" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="weekly" className="gap-2">
                <Calendar className="h-4 w-4" />
                Weekly
              </TabsTrigger>
              <TabsTrigger value="biweekly" className="gap-2" disabled={!hasProAccess}>
                <CalendarDays className="h-4 w-4" />
                Bi-weekly
                {!hasProAccess && <Lock className="h-3 w-3" />}
              </TabsTrigger>
              <TabsTrigger value="monthly" className="gap-2" disabled={!hasPremiumAccess}>
                <CalendarRange className="h-4 w-4" />
                Monthly
                {!hasPremiumAccess && <Lock className="h-3 w-3" />}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="weekly">
              <WeeklyCalendarView
                timeBlocks={calendarTimeBlocks}
                onAddBlock={handleAddBlock}
                onBlockClick={handleBlockClick}
              />
            </TabsContent>

            <TabsContent value="biweekly">
              {hasProAccess ? (
                <BiweeklyCalendarView />
              ) : (
                <Card className="py-12">
                  <CardContent className="flex flex-col items-center justify-center text-center">
                    <Lock className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Bi-weekly View</h3>
                    <p className="text-muted-foreground mb-4 max-w-md">
                      Compare two weeks side-by-side to identify patterns and trends in your time usage.
                    </p>
                    <Button asChild>
                      <Link href={ROUTES.settingsSubscription}>
                        Upgrade to Pro
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="monthly">
              {hasPremiumAccess ? (
                <MonthlyCalendarView />
              ) : (
                <Card className="py-12">
                  <CardContent className="flex flex-col items-center justify-center text-center">
                    <Lock className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Monthly View</h3>
                    <p className="text-muted-foreground mb-4 max-w-md">
                      Get a bird&apos;s eye view of your entire month with detailed DRIP breakdowns for each day.
                    </p>
                    <Button asChild>
                      <Link href={ROUTES.settingsSubscription}>
                        Upgrade to Premium
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Pie Charts - Takes 1 column */}
        <div className="space-y-6">
          {/* DRIP Distribution */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">DRIP Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {hasData ? (
                <>
                  <DripPieChart data={dripData} size="md" />
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Production (Sweet Spot)</span>
                      <span className="font-medium text-green-600">
                        {totalHours > 0 ? Math.round((dripData.production / totalHours) * 100) : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Investment (Growth)</span>
                      <span className="font-medium text-blue-600">
                        {totalHours > 0 ? Math.round((dripData.investment / totalHours) * 100) : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Replacement (Automate)</span>
                      <span className="font-medium text-orange-600">
                        {totalHours > 0 ? Math.round((dripData.replacement / totalHours) * 100) : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Delegation (Delegate)</span>
                      <span className="font-medium text-purple-600">
                        {totalHours > 0 ? Math.round((dripData.delegation / totalHours) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No time blocks logged yet.</p>
                  <p className="text-sm">Click &quot;Log Time Block&quot; to get started!</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Energy Distribution */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Energy Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {hasData ? (
                <>
                  <EnergyPieChart data={energyData} size="md" />
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-green-500" />
                        Energizing
                      </span>
                      <span className="font-medium text-green-600">
                        {totalHours > 0 ? Math.round((energyData.green / totalHours) * 100) : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-yellow-500" />
                        Neutral
                      </span>
                      <span className="font-medium text-yellow-600">
                        {totalHours > 0 ? Math.round((energyData.yellow / totalHours) * 100) : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-red-500" />
                        Draining
                      </span>
                      <span className="font-medium text-red-600">
                        {totalHours > 0 ? Math.round((energyData.red / totalHours) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Track your energy levels</p>
                  <p className="text-sm">to see distribution here.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={ROUTES.drip}>
                  View DRIP Matrix
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Export Report
                {!hasProAccess && (
                  <Badge variant="secondary" className="ml-auto">Pro</Badge>
                )}
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Set Time Goals
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
