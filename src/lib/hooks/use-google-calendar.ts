'use client';

import { useState, useCallback, useEffect } from 'react';

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string; timeZone?: string };
  end: { dateTime?: string; date?: string; timeZone?: string };
  date?: string;
  startTime?: string;
  endTime?: string;
  colorId?: string;
  htmlLink?: string;
  source?: string;
  // All-day event flag
  isAllDay?: boolean;
  // Recurring event info
  recurringEventId?: string;
  isRecurringInstance?: boolean;
}

interface GoogleEventsCache {
  events: GoogleCalendarEvent[];
  cachedAt: string;
  dateRange: { start: string; end: string };
}

interface DebugInfo {
  timestamp?: string;
  demoModeEnv?: boolean;
  userId?: string;
  isDemoUser?: boolean;
  integrationFound?: boolean;
  integrationError?: string | null;
  integrationActive?: boolean;
  tokenExpiry?: string | null;
  hasValidIntegration?: boolean;
  source?: string;
  dateRange?: { timeMin: string; timeMax: string };
  rawEventCount?: number;
  transformedEventCount?: number;
  tokenRefreshed?: boolean;
  error?: string;
  [key: string]: unknown;
}

interface UseGoogleCalendarReturn {
  events: GoogleCalendarEvent[];
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
  isCheckingConnection: boolean;
  debugInfo: DebugInfo | null;
  fetchEvents: (startDate: Date, endDate: Date) => Promise<void>;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  checkConnection: () => Promise<void>;
  clearCache: () => void;
  removeEvent: (eventId: string) => void;
}

// Note: fetchEvents replaces all events with the fetched range.
// The calendar should accumulate events or filter by current view.

const GOOGLE_EVENTS_CACHE_KEY = 'google-calendar-events-cache';
const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes

export function useGoogleCalendar(): UseGoogleCalendarReturn {
  const [events, setEvents] = useState<GoogleCalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);

  // Restore events from cache on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem(GOOGLE_EVENTS_CACHE_KEY);
      if (cached) {
        const { events: cachedEvents, cachedAt, dateRange } = JSON.parse(cached) as GoogleEventsCache;
        const cacheAge = Date.now() - new Date(cachedAt).getTime();
        const isFresh = cacheAge < CACHE_DURATION_MS;

        if (isFresh && cachedEvents && cachedEvents.length > 0) {
          console.log(`[useGoogleCalendar] Restoring ${cachedEvents.length} events from cache (range: ${dateRange?.start?.slice(0, 10)} to ${dateRange?.end?.slice(0, 10)}, age: ${Math.round(cacheAge / 1000)}s)`);
          setEvents(cachedEvents);
        } else {
          console.log(`[useGoogleCalendar] Cache expired or empty (age: ${Math.round(cacheAge / 1000)}s, events: ${cachedEvents?.length || 0})`);
        }
      } else {
        console.log('[useGoogleCalendar] No cached events found');
      }
    } catch (err) {
      console.error('Failed to restore events from cache:', err);
    }
  }, []);

  // Check connection status via API
  const checkConnection = useCallback(async () => {
    setIsCheckingConnection(true);
    try {
      const response = await fetch('/api/calendar/google/status');
      const data = await response.json();

      if (data.error) {
        console.warn('[useGoogleCalendar] Connection check failed:', data.error);
        setIsConnected(false);
        return;
      }

      setIsConnected(data.connected === true);

      if (!data.connected && data.reason) {
        console.log('[useGoogleCalendar] Not connected:', data.reason);
      }
    } catch (err) {
      console.error('[useGoogleCalendar] Failed to check Google Calendar connection:', err);
      setIsConnected(false);
    } finally {
      setIsCheckingConnection(false);
    }
  }, []);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  // Clear cache helper
  const clearCache = useCallback(() => {
    try {
      console.log('[useGoogleCalendar] Clearing cache and events');
      localStorage.removeItem(GOOGLE_EVENTS_CACHE_KEY);
      setEvents([]);
    } catch (err) {
      console.error('Failed to clear cache:', err);
    }
  }, []);

  // Remove a single event from state and cache (used after deletion)
  const removeEvent = useCallback((eventId: string) => {
    setEvents(prevEvents => {
      const filtered = prevEvents.filter(e => e.id !== eventId && e.id !== `gcal_${eventId}` && `gcal_${e.id}` !== eventId);

      // Update cache with filtered events
      try {
        const cached = localStorage.getItem(GOOGLE_EVENTS_CACHE_KEY);
        if (cached) {
          const cacheData = JSON.parse(cached) as GoogleEventsCache;
          cacheData.events = filtered;
          localStorage.setItem(GOOGLE_EVENTS_CACHE_KEY, JSON.stringify(cacheData));
        }
      } catch (err) {
        console.error('Failed to update cache after event removal:', err);
      }

      return filtered;
    });
  }, []);

  const fetchEvents = useCallback(async (startDate: Date, endDate: Date): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
      });

      const response = await fetch(`/api/calendar/google/events?${params}`);

      if (response.status === 401) {
        // Don't set isConnected to false - keep buttons visible so user can reconnect
        const data = await response.json();
        setDebugInfo(data.debug || null);
        setError('Google Calendar session expired. Please reconnect.');
        return;
      }

      if (!response.ok) {
        const data = await response.json();
        setDebugInfo(data.debug || null);
        throw new Error(data.error || 'Failed to fetch calendar events');
      }

      const data = await response.json();
      // Capture debug info from the API response
      setDebugInfo(data.debug || null);
      // Transform the response to match our GoogleCalendarEvent interface
      const rawEvents = data.events || [];
      const transformedEvents: GoogleCalendarEvent[] = rawEvents
        .filter((event: Record<string, unknown>) => event && event.id) // Filter out invalid events
        .map((event: GoogleCalendarEvent & { activityName?: string }) => ({
          id: event.id,
          summary: event.activityName || event.summary || 'Untitled Event',
          description: event.description || '',
          start: event.start || { dateTime: event.startTime },
          end: event.end || { dateTime: event.endTime },
          date: event.date || '',
          startTime: event.startTime || '',
          endTime: event.endTime || '',
          source: event.source || 'google_calendar',
          // Recurring event info
          recurringEventId: event.recurringEventId,
          isRecurringInstance: event.isRecurringInstance,
        }));

      // Log details about what we're setting
      const eventDates = transformedEvents.map(e => {
        const startDt = e.start?.dateTime || e.startTime;
        if (!startDt) return 'unknown';
        const date = new Date(startDt);
        return isNaN(date.getTime()) ? 'invalid' : date.toISOString().slice(0, 10);
      });
      const uniqueDates = [...new Set(eventDates)].sort();
      console.log(`[useGoogleCalendar] Fetched ${transformedEvents.length} events for ${startDate.toISOString().slice(0, 10)} to ${endDate.toISOString().slice(0, 10)}`);
      console.log(`[useGoogleCalendar] Event dates in response: ${uniqueDates.join(', ')}`);

      setEvents(transformedEvents);
      setIsConnected(true);

      // Cache events in localStorage for persistence
      try {
        const cache: GoogleEventsCache = {
          events: transformedEvents,
          cachedAt: new Date().toISOString(),
          dateRange: {
            start: startDate.toISOString(),
            end: endDate.toISOString(),
          },
        };
        localStorage.setItem(GOOGLE_EVENTS_CACHE_KEY, JSON.stringify(cache));
      } catch (err) {
        console.error('Failed to cache events:', err);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch events';
      setError(message);
      console.error('Google Calendar fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const connect = useCallback(async () => {
    try {
      // Get the OAuth URL from the API
      const response = await fetch('/api/calendar/google');
      const data = await response.json();

      if (data.authUrl) {
        // Redirect to Google OAuth
        window.location.href = data.authUrl;
      } else if (data.error) {
        setError(data.error);
      }
    } catch (err) {
      console.error('Failed to initiate Google Calendar connection:', err);
      setError('Failed to connect to Google Calendar');
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      await fetch('/api/calendar/google', { method: 'DELETE' });
      setIsConnected(false);
      setEvents([]);
      setError(null);
      // Clear cache on disconnect
      localStorage.removeItem(GOOGLE_EVENTS_CACHE_KEY);
    } catch (err) {
      console.error('Failed to disconnect Google Calendar:', err);
      setError('Failed to disconnect Google Calendar');
    }
  }, []);

  return {
    events,
    isLoading,
    error,
    isConnected,
    isCheckingConnection,
    debugInfo,
    fetchEvents,
    connect,
    disconnect,
    checkConnection,
    clearCache,
    removeEvent,
  };
}
