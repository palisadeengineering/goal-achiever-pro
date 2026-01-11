/**
 * Recurring Event Expansion Utility
 * Parses RRULE strings and generates occurrences within a date range
 */

import { addDays, addWeeks, addMonths, format, parseISO, isAfter, isBefore, isEqual, getDay, startOfWeek, differenceInWeeks } from 'date-fns';

// Base fields required for recurring event expansion
export interface RecurringEventBase {
  id: string;
  date: string; // Original start date (YYYY-MM-DD)
  startTime: string;
  endTime: string;
  isRecurring?: boolean;
  recurrenceRule?: string;
  recurrenceEndDate?: string;
  parentBlockId?: string;
}

// For internal use - allows additional properties
export type RecurringEvent = RecurringEventBase & Record<string, unknown>;

// Extended event with recurrence instance metadata
export interface ExpandedEventMeta {
  isRecurrenceInstance: boolean;
  originalDate: string; // The original event's date
  instanceDate: string; // This instance's date
}

/**
 * Parse an RRULE string into components
 */
function parseRRule(rrule: string): {
  freq: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  interval: number;
  byDay?: number[]; // 0=Sunday, 1=Monday, ..., 6=Saturday
  until?: Date;
  count?: number;
} {
  const parts = rrule.split(';');
  const result: ReturnType<typeof parseRRule> = {
    freq: 'WEEKLY',
    interval: 1,
  };

  for (const part of parts) {
    const [key, value] = part.split('=');

    switch (key) {
      case 'FREQ':
        result.freq = value as typeof result.freq;
        break;
      case 'INTERVAL':
        result.interval = parseInt(value, 10);
        break;
      case 'BYDAY': {
        // Convert day abbreviations to numbers (0=SU, 1=MO, etc.)
        const dayMap: Record<string, number> = {
          'SU': 0, 'MO': 1, 'TU': 2, 'WE': 3, 'TH': 4, 'FR': 5, 'SA': 6
        };
        result.byDay = value.split(',').map(d => dayMap[d]).filter(d => d !== undefined);
        break;
      }
      case 'UNTIL':
        // Parse UNTIL date (format: YYYYMMDD or YYYYMMDDTHHMMSSZ)
        if (value.length >= 8) {
          const year = value.substring(0, 4);
          const month = value.substring(4, 6);
          const day = value.substring(6, 8);
          result.until = new Date(`${year}-${month}-${day}`);
        }
        break;
      case 'COUNT':
        result.count = parseInt(value, 10);
        break;
    }
  }

  return result;
}

/**
 * Check if a date matches the BYDAY constraint
 */
function matchesByDay(date: Date, byDay: number[]): boolean {
  return byDay.includes(getDay(date));
}

/**
 * Generate all occurrences of a recurring event within a date range
 */
export function expandRecurringEvent<T extends RecurringEventBase>(
  event: T,
  rangeStart: Date,
  rangeEnd: Date,
  maxOccurrences: number = 100
): (T & ExpandedEventMeta)[] {
  // If not recurring, return as-is with instance metadata
  if (!event.isRecurring || !event.recurrenceRule) {
    const eventDate = parseISO(event.date);
    if (isBefore(eventDate, rangeStart) || isAfter(eventDate, rangeEnd)) {
      return [];
    }
    return [{
      ...event,
      isRecurrenceInstance: false,
      originalDate: event.date,
      instanceDate: event.date,
    }];
  }

  const rule = parseRRule(event.recurrenceRule);
  const occurrences: (T & ExpandedEventMeta)[] = [];
  const startDate = parseISO(event.date);

  // Determine the end date for recurrence
  let recurrenceEnd = rangeEnd;
  if (event.recurrenceEndDate) {
    const userEnd = parseISO(event.recurrenceEndDate);
    if (isBefore(userEnd, recurrenceEnd)) {
      recurrenceEnd = userEnd;
    }
  }
  if (rule.until && isBefore(rule.until, recurrenceEnd)) {
    recurrenceEnd = rule.until;
  }

  let currentDate = startDate;
  let count = 0;

  // For bi-weekly/multi-week with BYDAY, track the start week to determine which weeks to include
  const eventStartWeek = startOfWeek(startDate, { weekStartsOn: 0 }); // Sunday start

  while (
    (isBefore(currentDate, recurrenceEnd) || isEqual(currentDate, recurrenceEnd)) &&
    count < maxOccurrences &&
    (!rule.count || occurrences.length < rule.count)
  ) {
    // Check if this date is within our visible range
    const isInRange = (isAfter(currentDate, rangeStart) || isEqual(currentDate, rangeStart)) &&
                      (isBefore(currentDate, rangeEnd) || isEqual(currentDate, rangeEnd));

    // Check BYDAY constraint for weekly frequency
    let matchesDay = true;
    if (rule.freq === 'WEEKLY' && rule.byDay) {
      matchesDay = matchesByDay(currentDate, rule.byDay);

      // For bi-weekly or multi-week intervals, check if we're in the correct week
      if (matchesDay && rule.interval > 1) {
        const currentWeek = startOfWeek(currentDate, { weekStartsOn: 0 });
        const weeksDiff = differenceInWeeks(currentWeek, eventStartWeek);
        matchesDay = weeksDiff >= 0 && weeksDiff % rule.interval === 0;
      }
    }

    if (isInRange && matchesDay) {
      const instanceDateStr = format(currentDate, 'yyyy-MM-dd');
      occurrences.push({
        ...event,
        // Generate a unique ID for the instance
        id: `${event.id}_${instanceDateStr}`,
        date: instanceDateStr,
        isRecurrenceInstance: true,
        originalDate: event.date,
        instanceDate: instanceDateStr,
        parentBlockId: event.id,
      } as T & ExpandedEventMeta);
    }

    // Move to next occurrence based on frequency
    switch (rule.freq) {
      case 'DAILY':
        currentDate = addDays(currentDate, rule.interval);
        break;
      case 'WEEKLY':
        if (rule.byDay && rule.byDay.length > 0) {
          // For BYDAY rules, advance one day at a time
          // The interval check above ensures we only include correct weeks
          currentDate = addDays(currentDate, 1);
        } else {
          currentDate = addWeeks(currentDate, rule.interval);
        }
        break;
      case 'MONTHLY':
        currentDate = addMonths(currentDate, rule.interval);
        break;
      case 'YEARLY':
        currentDate = addMonths(currentDate, 12 * rule.interval);
        break;
    }

    count++;
  }

  return occurrences;
}

/**
 * Expand all recurring events in a list within a date range
 */
export function expandRecurringEvents<T extends RecurringEventBase>(
  events: T[],
  rangeStart: Date,
  rangeEnd: Date
): (T & ExpandedEventMeta)[] {
  const expanded: (T & ExpandedEventMeta)[] = [];

  for (const event of events) {
    const instances = expandRecurringEvent(event, rangeStart, rangeEnd);
    expanded.push(...instances);
  }

  // Sort by date and time
  return expanded.sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return a.startTime.localeCompare(b.startTime);
  });
}

/**
 * Get a human-readable description of a recurrence rule
 */
export function describeRecurrence(rrule: string): string {
  const rule = parseRRule(rrule);

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  switch (rule.freq) {
    case 'DAILY':
      return rule.interval === 1 ? 'Daily' : `Every ${rule.interval} days`;
    case 'WEEKLY':
      if (rule.byDay && rule.byDay.length > 0) {
        // Check for weekdays pattern
        const isWeekdays = rule.byDay.length === 5 &&
            rule.byDay.includes(1) && rule.byDay.includes(2) &&
            rule.byDay.includes(3) && rule.byDay.includes(4) && rule.byDay.includes(5);

        if (isWeekdays) {
          if (rule.interval === 1) return 'Weekdays';
          if (rule.interval === 2) return 'Bi-weekly (Weekdays)';
          return `Every ${rule.interval} weeks (Weekdays)`;
        }

        const days = rule.byDay.map(d => dayNames[d]).join(', ');
        if (rule.interval === 1) return `Weekly on ${days}`;
        if (rule.interval === 2) return `Bi-weekly on ${days}`;
        return `Every ${rule.interval} weeks on ${days}`;
      }
      if (rule.interval === 1) return 'Weekly';
      if (rule.interval === 2) return 'Bi-weekly';
      return `Every ${rule.interval} weeks`;
    case 'MONTHLY':
      return rule.interval === 1 ? 'Monthly' : `Every ${rule.interval} months`;
    case 'YEARLY':
      return rule.interval === 1 ? 'Yearly' : `Every ${rule.interval} years`;
    default:
      return 'Repeating';
  }
}
