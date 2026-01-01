'use client';

import { useState, useCallback, useEffect } from 'react';

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string; timeZone?: string };
  end: { dateTime?: string; date?: string; timeZone?: string };
  colorId?: string;
  htmlLink?: string;
}

interface UseGoogleCalendarReturn {
  events: GoogleCalendarEvent[];
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
  fetchEvents: (startDate: Date, endDate: Date) => Promise<void>;
  connect: () => void;
  disconnect: () => Promise<void>;
  checkConnection: () => void;
}

export function useGoogleCalendar(): UseGoogleCalendarReturn {
  const [events, setEvents] = useState<GoogleCalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Check connection status on mount
  const checkConnection = useCallback(() => {
    const connected = localStorage.getItem('google_calendar_connected') === 'true';
    setIsConnected(connected);
  }, []);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

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
        setIsConnected(false);
        localStorage.removeItem('google_calendar_connected');
        setError('Google Calendar session expired. Please reconnect.');
        return;
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch calendar events');
      }

      const data = await response.json();
      setEvents(data.items || []);
      setIsConnected(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch events';
      setError(message);
      console.error('Google Calendar fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const connect = useCallback(() => {
    // Redirect to OAuth flow
    window.location.href = '/api/calendar/google';
  }, []);

  const disconnect = useCallback(async () => {
    try {
      await fetch('/api/calendar/google', { method: 'DELETE' });
      localStorage.removeItem('google_calendar_connected');
      setIsConnected(false);
      setEvents([]);
      setError(null);
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
    fetchEvents,
    connect,
    disconnect,
    checkConnection,
  };
}
