'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Repeat } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEventSize, getAdaptiveEventStyles } from '@/lib/hooks/use-event-size';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { DRIP_QUADRANTS } from '@/constants/drip';

// Test event durations in minutes
const TEST_DURATIONS = [
  { minutes: 5, label: '5 min', slots: 5 / 15 },
  { minutes: 10, label: '10 min', slots: 10 / 15 },
  { minutes: 15, label: '15 min', slots: 1 },
  { minutes: 30, label: '30 min', slots: 2 },
  { minutes: 45, label: '45 min', slots: 3 },
  { minutes: 60, label: '60 min', slots: 4 },
  { minutes: 90, label: '90 min', slots: 6 },
];

// Test activity names
const TEST_ACTIVITIES = [
  'Meeting',
  'Team Standup',
  'Product Strategy Review',
  'Dan Martell Book Reading Session',
  'Very Long Activity Name That Should Definitely Truncate in Small Events',
];

// Mock event card for testing
function MockEventCard({
  activityName,
  durationSlots,
  isRecurring = false,
  quadrant = 'production',
}: {
  activityName: string;
  durationSlots: number;
  isRecurring?: boolean;
  quadrant?: keyof typeof DRIP_QUADRANTS;
}) {
  const heightPx = durationSlots * 14;
  const { ref, sizeBucket } = useEventSize(heightPx);
  const adaptiveStyles = getAdaptiveEventStyles(sizeBucket);

  const getDisplayTitle = () => {
    if (adaptiveStyles.truncateToFirstWord && activityName.length > 15) {
      const firstWord = activityName.split(' ')[0];
      return firstWord.length > 12 ? firstWord.slice(0, 12) + '...' : firstWord;
    }
    return activityName;
  };

  // Use CSS classes for line clamping
  const lineClampClass = adaptiveStyles.lineClamp === 1
    ? 'truncate'
    : adaptiveStyles.lineClamp === 2
      ? 'line-clamp-2'
      : 'line-clamp-3';

  const bgColors: Record<string, string> = {
    production: 'bg-green-600',
    investment: 'bg-purple-600',
    replacement: 'bg-amber-500',
    delegation: 'bg-red-500',
    na: 'bg-blue-500',
  };

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            ref={ref}
            className={cn(
              'relative rounded-lg w-full overflow-hidden',
              'shadow-md ring-1 ring-white/15',
              bgColors[quadrant]
            )}
            style={{ height: `${Math.max(heightPx - 1, 8)}px` }}
          >
            <div className={cn('w-full h-full flex flex-col justify-center overflow-hidden', adaptiveStyles.containerClass)}>
              <div className="flex items-center gap-0.5 min-w-0 flex-1">
                {isRecurring && adaptiveStyles.showRecurringIcon && (
                  <Repeat
                    className="flex-shrink-0 opacity-90"
                    style={{ width: '10px', height: '10px' }}
                  />
                )}
                <div className={cn('flex-1 min-w-0 text-white', adaptiveStyles.titleClass, lineClampClass)}>
                  {getDisplayTitle()}
                </div>
              </div>
              {adaptiveStyles.showTime && (
                <div className={cn('opacity-90 truncate text-white/90 flex-shrink-0', adaptiveStyles.metaClass)}>
                  9:00am
                  {adaptiveStyles.showDuration && ` · ${Math.round(durationSlots * 15)} min`}
                </div>
              )}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs p-3">
          <div className="space-y-2">
            <p className="font-semibold text-sm">{activityName}</p>
            <p className="text-xs text-muted-foreground">9:00am - 9:{Math.round(durationSlots * 15).toString().padStart(2, '0')}am</p>
            <div className="flex gap-2 mt-2">
              <Badge
                className="text-[10px] capitalize text-white font-medium px-2 py-0.5"
                style={{
                  backgroundColor: DRIP_QUADRANTS[quadrant].color,
                }}
              >
                {quadrant}
              </Badge>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Size bucket indicator
function SizeBucketIndicator({ bucket, height }: { bucket: string; height: number }) {
  const colors: Record<string, string> = {
    xs: 'bg-red-100 text-red-800',
    sm: 'bg-orange-100 text-orange-800',
    md: 'bg-yellow-100 text-yellow-800',
    lg: 'bg-green-100 text-green-800',
  };

  return (
    <div className="flex items-center gap-2 mt-1">
      <Badge className={cn('text-[10px]', colors[bucket])}>
        {bucket.toUpperCase()}
      </Badge>
      <span className="text-xs text-muted-foreground">{height}px</span>
    </div>
  );
}

export default function EventCardTestPage() {
  const [selectedActivity, setSelectedActivity] = useState(TEST_ACTIVITIES[2]);

  return (
    <div className="container py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">EventCard Size Test Fixture</h1>
        <p className="text-muted-foreground mt-1">
          Visual test for adaptive event card sizing based on duration
        </p>
      </div>

      {/* Activity selector */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Test Activity Name</CardTitle>
          <CardDescription>Select an activity name to test different text lengths</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {TEST_ACTIVITIES.map((activity) => (
              <Button
                key={activity}
                variant={selectedActivity === activity ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedActivity(activity)}
                className="text-xs"
              >
                {activity.length > 25 ? activity.slice(0, 25) + '...' : activity}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Duration tests */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Duration Comparison</CardTitle>
          <CardDescription>
            Events at different durations showing adaptive text sizing. Hover for tooltip.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-4">
            {TEST_DURATIONS.map((duration) => {
              const heightPx = duration.slots * 14;
              return (
                <div key={duration.minutes} className="flex flex-col">
                  <div className="text-sm font-medium mb-2 text-center">{duration.label}</div>
                  <div
                    className="border rounded-lg p-1 bg-muted/30"
                    style={{ minHeight: `${Math.max(heightPx + 10, 30)}px` }}
                  >
                    <MockEventCard
                      activityName={selectedActivity}
                      durationSlots={duration.slots}
                      quadrant="production"
                    />
                  </div>
                  <SizeBucketInfo duration={duration.slots} />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Edge cases */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Edge Cases</CardTitle>
          <CardDescription>Testing specific scenarios</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-6">
            {/* Very long title */}
            <div>
              <h3 className="text-sm font-medium mb-2">Very Long Title (15 min)</h3>
              <div className="border rounded-lg p-1 bg-muted/30" style={{ height: '24px' }}>
                <MockEventCard
                  activityName="Extraordinarily Long Meeting Title That Goes On And On"
                  durationSlots={1}
                  quadrant="investment"
                />
              </div>
            </div>

            {/* Single word */}
            <div>
              <h3 className="text-sm font-medium mb-2">Single Word (15 min)</h3>
              <div className="border rounded-lg p-1 bg-muted/30" style={{ height: '24px' }}>
                <MockEventCard
                  activityName="Lunch"
                  durationSlots={1}
                  quadrant="delegation"
                />
              </div>
            </div>

            {/* Recurring event */}
            <div>
              <h3 className="text-sm font-medium mb-2">Recurring (30 min)</h3>
              <div className="border rounded-lg p-1 bg-muted/30" style={{ height: '38px' }}>
                <MockEventCard
                  activityName="Daily Standup"
                  durationSlots={2}
                  isRecurring
                  quadrant="production"
                />
              </div>
            </div>

            {/* Different quadrant colors */}
            <div>
              <h3 className="text-sm font-medium mb-2">All Quadrants (30 min)</h3>
              <div className="flex flex-col gap-1">
                {(['production', 'investment', 'replacement', 'delegation', 'na'] as const).map((q) => (
                  <div key={q} className="border rounded p-0.5 bg-muted/30" style={{ height: '28px' }}>
                    <MockEventCard
                      activityName={q.charAt(0).toUpperCase() + q.slice(1)}
                      durationSlots={2}
                      quadrant={q}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Size bucket reference */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Size Bucket Reference</CardTitle>
          <CardDescription>How events are classified by height</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950">
              <div className="font-semibold text-red-800 dark:text-red-200">XS (&lt;12px)</div>
              <ul className="text-sm text-red-700 dark:text-red-300 mt-2 space-y-1">
                <li>5-10 min events</li>
                <li>First word only for long titles</li>
                <li>No time/duration</li>
                <li>No recurring icon</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-950">
              <div className="font-semibold text-orange-800 dark:text-orange-200">SM (12-22px)</div>
              <ul className="text-sm text-orange-700 dark:text-orange-300 mt-2 space-y-1">
                <li>15-min events</li>
                <li>Single line, ellipsis</li>
                <li>No time/duration</li>
                <li>Recurring icon shown</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950">
              <div className="font-semibold text-yellow-800 dark:text-yellow-200">MD (22-38px)</div>
              <ul className="text-sm text-yellow-700 dark:text-yellow-300 mt-2 space-y-1">
                <li>30-min events</li>
                <li>2-line clamp for title</li>
                <li>Start time shown</li>
                <li>No duration</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950">
              <div className="font-semibold text-green-800 dark:text-green-200">LG (&ge;38px)</div>
              <ul className="text-sm text-green-700 dark:text-green-300 mt-2 space-y-1">
                <li>45+ min events</li>
                <li>3-line clamp for title</li>
                <li>Full time + duration</li>
                <li>All icons shown</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper component to show size bucket info
function SizeBucketInfo({ duration }: { duration: number }) {
  const heightPx = duration * 14;
  let bucket = 'lg';
  if (heightPx < 12) bucket = 'xs';
  else if (heightPx < 22) bucket = 'sm';
  else if (heightPx < 38) bucket = 'md';

  return <SizeBucketIndicator bucket={bucket} height={Math.round(heightPx)} />;
}
