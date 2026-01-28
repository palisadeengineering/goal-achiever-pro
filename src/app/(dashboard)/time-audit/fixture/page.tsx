'use client';

/**
 * Time Audit Calendar Fixture - Dev Only
 *
 * This page provides a deterministic test fixture for the Time Audit calendar
 * using the SAME WeeklyCalendarView component used in production.
 *
 * Test scenarios covered:
 * - 5, 10, 15, 30, 60, 120 minute events
 * - Overlapping events at various times
 * - Multi-day events (not applicable for time blocks, but long events)
 * - Short and long titles
 * - All Value categories and energy levels
 */

import { useState, useMemo, useEffect } from 'react';
import { format, startOfWeek, addDays, endOfWeek } from 'date-fns';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { WeeklyCalendarView } from '@/components/features/time-audit/weekly-calendar-view';
import type { ValueQuadrant, EnergyRating } from '@/types/database';

// Fixture event type matching WeeklyCalendarView's TimeBlock interface
interface FixtureTimeBlock {
  id: string;
  startTime: string;
  endTime: string;
  activityName: string;
  valueQuadrant: ValueQuadrant;
  energyRating: EnergyRating;
  date?: string;
  isRecurring?: boolean;
  recurrenceRule?: string;
}

// Generate a time string from hour and minutes
function makeTime(hour: number, minute: number): string {
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

// Generate fixture data for a specific week
function generateFixtureData(weekStart: Date): Record<string, FixtureTimeBlock[]> {
  const data: Record<string, FixtureTimeBlock[]> = {};

  // Day 0 (Sunday/Monday depending on week start): Duration tests
  const day0 = format(weekStart, 'yyyy-MM-dd');
  data[day0] = [
    // 5 minute event - xs bucket test
    {
      id: 'fixture-5min',
      startTime: '06:00',
      endTime: '06:05',
      activityName: '5 min event',
      valueQuadrant: 'production',
      energyRating: 'green',
    },
    // 10 minute event - xs/sm bucket test
    {
      id: 'fixture-10min',
      startTime: '06:30',
      endTime: '06:40',
      activityName: '10 minute event test',
      valueQuadrant: 'investment',
      energyRating: 'yellow',
    },
    // 15 minute event - sm bucket test
    {
      id: 'fixture-15min',
      startTime: '07:00',
      endTime: '07:15',
      activityName: '15 min quick sync',
      valueQuadrant: 'replacement',
      energyRating: 'red',
    },
    // 30 minute event - md bucket test
    {
      id: 'fixture-30min',
      startTime: '08:00',
      endTime: '08:30',
      activityName: '30 minute standup meeting',
      valueQuadrant: 'delegation',
      energyRating: 'green',
    },
    // 60 minute event - lg bucket test
    {
      id: 'fixture-60min',
      startTime: '09:00',
      endTime: '10:00',
      activityName: 'One hour deep work session on the project',
      valueQuadrant: 'production',
      energyRating: 'green',
    },
    // 120 minute event - lg bucket test (long)
    {
      id: 'fixture-120min',
      startTime: '10:30',
      endTime: '12:30',
      activityName: 'Two hour workshop: Advanced TypeScript patterns and best practices for enterprise applications',
      valueQuadrant: 'investment',
      energyRating: 'yellow',
    },
  ];

  // Day 1: Overlapping events test
  const day1 = format(addDays(weekStart, 1), 'yyyy-MM-dd');
  data[day1] = [
    // Two overlapping 30-min events
    {
      id: 'fixture-overlap-1',
      startTime: '09:00',
      endTime: '09:30',
      activityName: 'Meeting A',
      valueQuadrant: 'production',
      energyRating: 'green',
    },
    {
      id: 'fixture-overlap-2',
      startTime: '09:15',
      endTime: '09:45',
      activityName: 'Meeting B (overlaps)',
      valueQuadrant: 'replacement',
      energyRating: 'yellow',
    },
    // Three overlapping events
    {
      id: 'fixture-overlap-3a',
      startTime: '10:00',
      endTime: '11:00',
      activityName: 'Long meeting spans all',
      valueQuadrant: 'delegation',
      energyRating: 'red',
    },
    {
      id: 'fixture-overlap-3b',
      startTime: '10:15',
      endTime: '10:45',
      activityName: 'Short middle overlap',
      valueQuadrant: 'investment',
      energyRating: 'green',
    },
    {
      id: 'fixture-overlap-3c',
      startTime: '10:30',
      endTime: '11:30',
      activityName: 'Late start overlap',
      valueQuadrant: 'production',
      energyRating: 'yellow',
    },
    // Dense overlapping - 4 events at same time (stress test)
    {
      id: 'fixture-dense-1',
      startTime: '14:00',
      endTime: '14:30',
      activityName: 'Dense Event 1',
      valueQuadrant: 'production',
      energyRating: 'green',
    },
    {
      id: 'fixture-dense-2',
      startTime: '14:00',
      endTime: '14:30',
      activityName: 'Dense Event 2',
      valueQuadrant: 'investment',
      energyRating: 'yellow',
    },
    {
      id: 'fixture-dense-3',
      startTime: '14:00',
      endTime: '14:30',
      activityName: 'Dense Event 3',
      valueQuadrant: 'replacement',
      energyRating: 'red',
    },
    {
      id: 'fixture-dense-4',
      startTime: '14:00',
      endTime: '14:30',
      activityName: 'Dense Event 4',
      valueQuadrant: 'delegation',
      energyRating: 'green',
    },
  ];

  // Day 2: Title length tests
  const day2 = format(addDays(weekStart, 2), 'yyyy-MM-dd');
  data[day2] = [
    // Very short title
    {
      id: 'fixture-title-short',
      startTime: '08:00',
      endTime: '08:15',
      activityName: 'A',
      valueQuadrant: 'na',
      energyRating: 'yellow',
    },
    // Medium title
    {
      id: 'fixture-title-medium',
      startTime: '09:00',
      endTime: '09:15',
      activityName: 'Team sync',
      valueQuadrant: 'production',
      energyRating: 'green',
    },
    // Long title on short event
    {
      id: 'fixture-title-long-short',
      startTime: '10:00',
      endTime: '10:15',
      activityName: 'Very long title that should be truncated on small events to prevent overflow',
      valueQuadrant: 'investment',
      energyRating: 'yellow',
    },
    // Long title on medium event
    {
      id: 'fixture-title-long-med',
      startTime: '11:00',
      endTime: '11:30',
      activityName: 'This is a moderately long title for a medium duration event to test text handling',
      valueQuadrant: 'replacement',
      energyRating: 'red',
    },
    // Long title on long event
    {
      id: 'fixture-title-long-long',
      startTime: '12:00',
      endTime: '13:00',
      activityName: 'This is an extremely long title for a long duration event that should display fully with multiple lines if needed',
      valueQuadrant: 'delegation',
      energyRating: 'green',
    },
  ];

  // Day 3: Back to back events (edge case for snap-to)
  const day3 = format(addDays(weekStart, 3), 'yyyy-MM-dd');
  data[day3] = [
    {
      id: 'fixture-b2b-1',
      startTime: '08:00',
      endTime: '08:30',
      activityName: 'Back to back 1',
      valueQuadrant: 'production',
      energyRating: 'green',
    },
    {
      id: 'fixture-b2b-2',
      startTime: '08:30',
      endTime: '09:00',
      activityName: 'Back to back 2',
      valueQuadrant: 'investment',
      energyRating: 'yellow',
    },
    {
      id: 'fixture-b2b-3',
      startTime: '09:00',
      endTime: '09:30',
      activityName: 'Back to back 3',
      valueQuadrant: 'replacement',
      energyRating: 'red',
    },
    // Gap then more events
    {
      id: 'fixture-gap-after',
      startTime: '10:00',
      endTime: '10:30',
      activityName: 'After gap event',
      valueQuadrant: 'delegation',
      energyRating: 'green',
    },
  ];

  // Day 4: Value category showcase (all categories)
  const day4 = format(addDays(weekStart, 4), 'yyyy-MM-dd');
  data[day4] = [
    {
      id: 'fixture-value-production',
      startTime: '08:00',
      endTime: '09:00',
      activityName: 'Production: Client work',
      valueQuadrant: 'production',
      energyRating: 'green',
    },
    {
      id: 'fixture-value-investment',
      startTime: '09:30',
      endTime: '10:30',
      activityName: 'Investment: Learning React patterns',
      valueQuadrant: 'investment',
      energyRating: 'yellow',
    },
    {
      id: 'fixture-value-replacement',
      startTime: '11:00',
      endTime: '12:00',
      activityName: 'Replacement: Admin tasks',
      valueQuadrant: 'replacement',
      energyRating: 'red',
    },
    {
      id: 'fixture-value-delegation',
      startTime: '13:00',
      endTime: '14:00',
      activityName: 'Delegation: Team handoff',
      valueQuadrant: 'delegation',
      energyRating: 'green',
    },
    {
      id: 'fixture-value-na',
      startTime: '14:30',
      endTime: '15:30',
      activityName: 'N/A: Personal time',
      valueQuadrant: 'na',
      energyRating: 'yellow',
    },
  ];

  // Day 5: Energy rating showcase
  const day5 = format(addDays(weekStart, 5), 'yyyy-MM-dd');
  data[day5] = [
    {
      id: 'fixture-energy-green',
      startTime: '08:00',
      endTime: '09:00',
      activityName: 'Energizing: Creative work',
      valueQuadrant: 'production',
      energyRating: 'green',
    },
    {
      id: 'fixture-energy-yellow',
      startTime: '10:00',
      endTime: '11:00',
      activityName: 'Neutral: Regular meeting',
      valueQuadrant: 'investment',
      energyRating: 'yellow',
    },
    {
      id: 'fixture-energy-red',
      startTime: '12:00',
      endTime: '13:00',
      activityName: 'Draining: Difficult conversation',
      valueQuadrant: 'delegation',
      energyRating: 'red',
    },
  ];

  // Day 6: Recurring event simulation
  const day6 = format(addDays(weekStart, 6), 'yyyy-MM-dd');
  data[day6] = [
    {
      id: 'fixture-recurring-1',
      startTime: '09:00',
      endTime: '09:30',
      activityName: 'Daily standup',
      valueQuadrant: 'production',
      energyRating: 'green',
      isRecurring: true,
      recurrenceRule: 'FREQ=DAILY',
    },
    {
      id: 'fixture-recurring-2',
      startTime: '14:00',
      endTime: '15:00',
      activityName: 'Weekly team sync',
      valueQuadrant: 'investment',
      energyRating: 'yellow',
      isRecurring: true,
      recurrenceRule: 'FREQ=WEEKLY',
    },
  ];

  return data;
}

// Generate mock Google Calendar events for testing ignore functionality
function generateMockGoogleEvents(weekStart: Date) {
  const events = [
    // Team Meeting (recurring pattern - 3 instances)
    {
      id: 'gcal_team_meeting_1',
      summary: 'Team Meeting',
      start: { dateTime: `${format(addDays(weekStart, 1), 'yyyy-MM-dd')}T10:00:00` },
      end: { dateTime: `${format(addDays(weekStart, 1), 'yyyy-MM-dd')}T11:00:00` },
      startTime: `${format(addDays(weekStart, 1), 'yyyy-MM-dd')}T10:00:00`,
      endTime: `${format(addDays(weekStart, 1), 'yyyy-MM-dd')}T11:00:00`,
    },
    {
      id: 'gcal_team_meeting_2',
      summary: 'Team Meeting',
      start: { dateTime: `${format(addDays(weekStart, 2), 'yyyy-MM-dd')}T10:00:00` },
      end: { dateTime: `${format(addDays(weekStart, 2), 'yyyy-MM-dd')}T11:00:00` },
      startTime: `${format(addDays(weekStart, 2), 'yyyy-MM-dd')}T10:00:00`,
      endTime: `${format(addDays(weekStart, 2), 'yyyy-MM-dd')}T11:00:00`,
    },
    {
      id: 'gcal_team_meeting_3',
      summary: 'Team Meeting',
      start: { dateTime: `${format(addDays(weekStart, 3), 'yyyy-MM-dd')}T10:00:00` },
      end: { dateTime: `${format(addDays(weekStart, 3), 'yyyy-MM-dd')}T11:00:00` },
      startTime: `${format(addDays(weekStart, 3), 'yyyy-MM-dd')}T10:00:00`,
      endTime: `${format(addDays(weekStart, 3), 'yyyy-MM-dd')}T11:00:00`,
    },

    // Client Call (recurring pattern - 2 instances)
    {
      id: 'gcal_client_call_1',
      summary: 'Client Call - Project Alpha',
      start: { dateTime: `${format(addDays(weekStart, 1), 'yyyy-MM-dd')}T14:00:00` },
      end: { dateTime: `${format(addDays(weekStart, 1), 'yyyy-MM-dd')}T15:00:00` },
      startTime: `${format(addDays(weekStart, 1), 'yyyy-MM-dd')}T14:00:00`,
      endTime: `${format(addDays(weekStart, 1), 'yyyy-MM-dd')}T15:00:00`,
    },
    {
      id: 'gcal_client_call_2',
      summary: 'Client Call - Project Alpha',
      start: { dateTime: `${format(addDays(weekStart, 4), 'yyyy-MM-dd')}T14:00:00` },
      end: { dateTime: `${format(addDays(weekStart, 4), 'yyyy-MM-dd')}T15:00:00` },
      startTime: `${format(addDays(weekStart, 4), 'yyyy-MM-dd')}T14:00:00`,
      endTime: `${format(addDays(weekStart, 4), 'yyyy-MM-dd')}T15:00:00`,
    },

    // Weekly Standup (recurring pattern - 5 instances)
    {
      id: 'gcal_standup_1',
      summary: 'Weekly Standup',
      start: { dateTime: `${format(addDays(weekStart, 1), 'yyyy-MM-dd')}T09:00:00` },
      end: { dateTime: `${format(addDays(weekStart, 1), 'yyyy-MM-dd')}T09:15:00` },
      startTime: `${format(addDays(weekStart, 1), 'yyyy-MM-dd')}T09:00:00`,
      endTime: `${format(addDays(weekStart, 1), 'yyyy-MM-dd')}T09:15:00`,
    },
    {
      id: 'gcal_standup_2',
      summary: 'Weekly Standup',
      start: { dateTime: `${format(addDays(weekStart, 2), 'yyyy-MM-dd')}T09:00:00` },
      end: { dateTime: `${format(addDays(weekStart, 2), 'yyyy-MM-dd')}T09:15:00` },
      startTime: `${format(addDays(weekStart, 2), 'yyyy-MM-dd')}T09:00:00`,
      endTime: `${format(addDays(weekStart, 2), 'yyyy-MM-dd')}T09:15:00`,
    },
    {
      id: 'gcal_standup_3',
      summary: 'Weekly Standup',
      start: { dateTime: `${format(addDays(weekStart, 3), 'yyyy-MM-dd')}T09:00:00` },
      end: { dateTime: `${format(addDays(weekStart, 3), 'yyyy-MM-dd')}T09:15:00` },
      startTime: `${format(addDays(weekStart, 3), 'yyyy-MM-dd')}T09:00:00`,
      endTime: `${format(addDays(weekStart, 3), 'yyyy-MM-dd')}T09:15:00`,
    },
    {
      id: 'gcal_standup_4',
      summary: 'Weekly Standup',
      start: { dateTime: `${format(addDays(weekStart, 4), 'yyyy-MM-dd')}T09:00:00` },
      end: { dateTime: `${format(addDays(weekStart, 4), 'yyyy-MM-dd')}T09:15:00` },
      startTime: `${format(addDays(weekStart, 4), 'yyyy-MM-dd')}T09:00:00`,
      endTime: `${format(addDays(weekStart, 4), 'yyyy-MM-dd')}T09:15:00`,
    },
    {
      id: 'gcal_standup_5',
      summary: 'Weekly Standup',
      start: { dateTime: `${format(addDays(weekStart, 5), 'yyyy-MM-dd')}T09:00:00` },
      end: { dateTime: `${format(addDays(weekStart, 5), 'yyyy-MM-dd')}T09:15:00` },
      startTime: `${format(addDays(weekStart, 5), 'yyyy-MM-dd')}T09:00:00`,
      endTime: `${format(addDays(weekStart, 5), 'yyyy-MM-dd')}T09:15:00`,
    },

    // Unique events (single instances)
    {
      id: 'gcal_lunch_break',
      summary: 'Lunch Break',
      start: { dateTime: `${format(addDays(weekStart, 2), 'yyyy-MM-dd')}T12:00:00` },
      end: { dateTime: `${format(addDays(weekStart, 2), 'yyyy-MM-dd')}T13:00:00` },
      startTime: `${format(addDays(weekStart, 2), 'yyyy-MM-dd')}T12:00:00`,
      endTime: `${format(addDays(weekStart, 2), 'yyyy-MM-dd')}T13:00:00`,
    },
    {
      id: 'gcal_brainstorm',
      summary: 'Product Brainstorming Session',
      start: { dateTime: `${format(addDays(weekStart, 3), 'yyyy-MM-dd')}T15:00:00` },
      end: { dateTime: `${format(addDays(weekStart, 3), 'yyyy-MM-dd')}T16:30:00` },
      startTime: `${format(addDays(weekStart, 3), 'yyyy-MM-dd')}T15:00:00`,
      endTime: `${format(addDays(weekStart, 3), 'yyyy-MM-dd')}T16:30:00`,
    },
    {
      id: 'gcal_dentist',
      summary: 'Dentist Appointment',
      start: { dateTime: `${format(addDays(weekStart, 4), 'yyyy-MM-dd')}T11:00:00` },
      end: { dateTime: `${format(addDays(weekStart, 4), 'yyyy-MM-dd')}T12:00:00` },
      startTime: `${format(addDays(weekStart, 4), 'yyyy-MM-dd')}T11:00:00`,
      endTime: `${format(addDays(weekStart, 4), 'yyyy-MM-dd')}T12:00:00`,
    },

    // Social events (multiple instances)
    {
      id: 'gcal_coffee_1',
      summary: 'Coffee Chat',
      start: { dateTime: `${format(addDays(weekStart, 2), 'yyyy-MM-dd')}T15:30:00` },
      end: { dateTime: `${format(addDays(weekStart, 2), 'yyyy-MM-dd')}T16:00:00` },
      startTime: `${format(addDays(weekStart, 2), 'yyyy-MM-dd')}T15:30:00`,
      endTime: `${format(addDays(weekStart, 2), 'yyyy-MM-dd')}T16:00:00`,
    },
    {
      id: 'gcal_coffee_2',
      summary: 'Coffee Chat',
      start: { dateTime: `${format(addDays(weekStart, 5), 'yyyy-MM-dd')}T15:30:00` },
      end: { dateTime: `${format(addDays(weekStart, 5), 'yyyy-MM-dd')}T16:00:00` },
      startTime: `${format(addDays(weekStart, 5), 'yyyy-MM-dd')}T15:30:00`,
      endTime: `${format(addDays(weekStart, 5), 'yyyy-MM-dd')}T16:00:00`,
    },
  ];

  return events;
}

export default function TimeAuditFixturePage() {
  const [colorMode, setColorMode] = useState<'value' | 'energy'>('value');
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }) // Monday start for consistency
  );
  const [fixtureLoaded, setFixtureLoaded] = useState(false);

  const fixtureData = useMemo(() => generateFixtureData(weekStart), [weekStart]);

  // Load mock Google Calendar events for testing ignore functionality
  const loadGoogleCalendarFixture = () => {
    const mockEvents = generateMockGoogleEvents(weekStart);
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    const cacheKey = `google-calendar-events-${format(weekStart, 'yyyy-MM-dd')}-${format(weekEnd, 'yyyy-MM-dd')}`;

    // Store events in localStorage
    localStorage.setItem(cacheKey, JSON.stringify(mockEvents));

    // Clear categorizations and ignored events to start fresh
    localStorage.removeItem('event-categorizations');
    localStorage.removeItem('ignored-events');
    localStorage.removeItem('google-calendar-patterns');

    setFixtureLoaded(true);
    console.log(`[Fixture] Loaded ${mockEvents.length} mock Google Calendar events`);
  };

  // Clear all Google Calendar fixture data
  const clearGoogleCalendarFixture = () => {
    // Remove all Google Calendar cache keys
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('google-calendar-events-')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));

    // Clear categorizations and ignored events
    localStorage.removeItem('event-categorizations');
    localStorage.removeItem('ignored-events');
    localStorage.removeItem('google-calendar-patterns');

    setFixtureLoaded(false);
    console.log('[Fixture] Cleared all Google Calendar fixture data');
  };

  // Mock handlers (no-op for fixture)
  const handleAddBlock = (date: Date, startTime: string, endTime?: string) => {
    console.log('[Fixture] Add block:', { date: format(date, 'yyyy-MM-dd'), startTime, endTime });
  };

  const handleBlockClick = (block: FixtureTimeBlock) => {
    console.log('[Fixture] Block clicked:', block);
  };

  const handleBlockMove = async (blockId: string, newDate: string, newStartTime: string, newEndTime: string) => {
    console.log('[Fixture] Block moved:', { blockId, newDate, newStartTime, newEndTime });
    return true;
  };

  const handleWeekChange = (start: Date, end: Date) => {
    setWeekStart(start);
  };

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Time Audit Calendar Fixture"
        description="Dev-only test page for calendar event rendering scenarios"
      />

      {/* Google Calendar Fixture Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Google Calendar Event Fixtures (for Ignore Testing)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button
              onClick={loadGoogleCalendarFixture}
              variant={fixtureLoaded ? 'outline' : 'default'}
            >
              Load Mock Google Events
            </Button>
            <Button
              onClick={clearGoogleCalendarFixture}
              variant="outline"
            >
              Clear Mock Events
            </Button>
          </div>
          {fixtureLoaded && (
            <div className="p-3 bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded">
              <p className="text-sm text-cyan-800 dark:text-cyan-200">
                ✓ Mock events loaded! Navigate to the main Time Audit page to test categorization and ignore features.
              </p>
            </div>
          )}
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong>Mock Event Groups:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>Team Meeting (3 instances) - Test group ignore</li>
              <li>Weekly Standup (5 instances) - Test large group ignore</li>
              <li>Client Call (2 instances) - Test small group ignore</li>
              <li>Coffee Chat (2 instances) - Test casual event grouping</li>
              <li>3 Unique events - Test individual ignore</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Test Scenario Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Calendar Fixture Test Scenarios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <Badge variant="outline" className="mb-2">Day 1</Badge>
              <p className="text-muted-foreground">Duration tests: 5, 10, 15, 30, 60, 120 min</p>
            </div>
            <div>
              <Badge variant="outline" className="mb-2">Day 2</Badge>
              <p className="text-muted-foreground">Overlap tests: 2, 3, and 4 concurrent events</p>
            </div>
            <div>
              <Badge variant="outline" className="mb-2">Day 3</Badge>
              <p className="text-muted-foreground">Title length: short, medium, long titles</p>
            </div>
            <div>
              <Badge variant="outline" className="mb-2">Day 4</Badge>
              <p className="text-muted-foreground">Back-to-back: sequential event handling</p>
            </div>
            <div>
              <Badge variant="outline" className="mb-2">Day 5</Badge>
              <p className="text-muted-foreground">Value categories: all 5 quadrants</p>
            </div>
            <div>
              <Badge variant="outline" className="mb-2">Day 6</Badge>
              <p className="text-muted-foreground">Energy levels: green, yellow, red</p>
            </div>
            <div>
              <Badge variant="outline" className="mb-2">Day 7</Badge>
              <p className="text-muted-foreground">Recurring events: daily, weekly</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <div className="flex gap-4">
        <Button
          variant={colorMode === 'value' ? 'default' : 'outline'}
          onClick={() => setColorMode('value')}
        >
          Value Mode
        </Button>
        <Button
          variant={colorMode === 'energy' ? 'default' : 'outline'}
          onClick={() => setColorMode('energy')}
        >
          Energy Mode
        </Button>
      </div>

      {/* Calendar with fixture data */}
      <WeeklyCalendarView
        timeBlocks={fixtureData}
        onAddBlock={handleAddBlock}
        onBlockClick={handleBlockClick}
        onBlockMove={handleBlockMove}
        colorMode={colorMode}
        onColorModeChange={setColorMode}
        onWeekChange={handleWeekChange}
      />

      {/* Debug info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Debug Info</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-muted p-4 rounded overflow-auto max-h-48">
            {JSON.stringify({ weekStart: format(weekStart, 'yyyy-MM-dd'), eventCount: Object.values(fixtureData).flat().length }, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
