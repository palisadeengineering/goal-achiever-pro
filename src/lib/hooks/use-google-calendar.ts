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
  // Recurring event info
  recurringEventId?: string;
  isRecurringInstance?: boolean;
}

interface GoogleEventsCache {
  events: GoogleCalendarEvent[];
  cachedAt: string;
  dateRange: { start: string; end: string };
}

interface UseGoogleCalendarReturn {
  events: GoogleCalendarEvent[];
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
  isCheckingConnection: boolean;
  fetchEvents: (startDate: Date, endDate: Date) => Promise<void>;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  checkConnection: () => Promise<void>;
  clearCache: () => void;
}

const GOOGLE_EVENTS_CACHE_KEY = 'google-calendar-events-cache';
const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes

export function useGoogleCalendar(): UseGoogleCalendarReturn {
  const [events, setEvents] = useState<GoogleCalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);

  // Restore events from cache on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem(GOOGLE_EVENTS_CACHE_KEY);
      if (cached) {
        const { events: cachedEvents, cachedAt } = JSON.parse(cached) as GoogleEventsCache;
        const cacheAge = Date.now() - new Date(cachedAt).getTime();
        const isFresh = cacheAge < CACHE_DURATION_MS;

        if (isFresh && cachedEvents && cachedEvents.length > 0) {
          setEvents(cachedEvents);
        }
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
      setIsConnected(data.connected === true);
    } catch (err) {
      console.error('Failed to check Google Calendar connection:', err);
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
      localStorage.removeItem(GOOGLE_EVENTS_CACHE_KEY);
      setEvents([]);
    } catch (err) {
      console.error('Failed to clear cache:', err);
    }
  }, []);

  const fetchEvents = useCallback(async (startDate: Date, endDate: Date) => {
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
        setError('Google Calendar session expired. Please reconnect.');
        return;
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch calendar events');
      }

      const data = await response.json();
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
    fetchEvents,
    connect,
    disconnect,
    checkConnection,
    clearCache,
  };
}
