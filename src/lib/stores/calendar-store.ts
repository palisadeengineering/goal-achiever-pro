'use client';

import { create } from 'zustand';

export interface CalendarEvent {
  id: string;
  googleEventId?: string;
  date: string;
  startTime: string;
  endTime: string;
  activityName: string;
  description?: string;
  source: 'google_calendar' | 'manual' | 'ai_suggested';
  start?: {
    dateTime?: string;
    date?: string;
  };
  end?: {
    dateTime?: string;
    date?: string;
  };
  // Sync status for optimistic updates
  syncStatus?: 'synced' | 'pending' | 'error';
  pendingAction?: 'create' | 'update' | 'delete';
}

interface CalendarStore {
  // State
  events: CalendarEvent[];
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
  lastSyncedAt: Date | null;

  // Actions
  setEvents: (events: CalendarEvent[]) => void;
  addEvent: (event: CalendarEvent) => void;
  updateEvent: (eventId: string, updates: Partial<CalendarEvent>) => void;
  removeEvent: (eventId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setConnected: (connected: boolean) => void;
  setLastSyncedAt: (date: Date | null) => void;

  // Async actions for API calls
  fetchEvents: (timeMin: string, timeMax: string) => Promise<void>;
  createEvent: (event: Omit<CalendarEvent, 'id' | 'syncStatus'>) => Promise<CalendarEvent | null>;
  updateEventOnServer: (eventId: string, updates: Partial<CalendarEvent>) => Promise<boolean>;
  deleteEvent: (eventId: string) => Promise<boolean>;

  // Drag and drop helpers
  moveEvent: (eventId: string, newDate: string, newStartTime: string, newEndTime: string) => Promise<boolean>;
}

export const useCalendarStore = create<CalendarStore>((set, get) => ({
  // Initial state
  events: [],
  isLoading: false,
  error: null,
  isConnected: false,
  lastSyncedAt: null,

  // Synchronous state setters
  setEvents: (events) => set({ events }),
  addEvent: (event) => set((state) => ({ events: [...state.events, event] })),
  updateEvent: (eventId, updates) =>
    set((state) => ({
      events: state.events.map((e) =>
        e.id === eventId ? { ...e, ...updates } : e
      ),
    })),
  removeEvent: (eventId) =>
    set((state) => ({
      events: state.events.filter((e) => e.id !== eventId),
    })),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setConnected: (connected) => set({ isConnected: connected }),
  setLastSyncedAt: (date) => set({ lastSyncedAt: date }),

  // Fetch events from Google Calendar
  fetchEvents: async (timeMin: string, timeMax: string) => {
    const { setLoading, setError, setEvents, setLastSyncedAt, setConnected } = get();

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ timeMin, timeMax });
      const response = await fetch(`/api/calendar/google/events?${params}`);

      if (!response.ok) {
        if (response.status === 401) {
          setConnected(false);
          throw new Error('Not connected to Google Calendar');
        }
        throw new Error('Failed to fetch events');
      }

      const data = await response.json();
      const events: CalendarEvent[] = data.events.map((e: CalendarEvent) => ({
        ...e,
        syncStatus: 'synced' as const,
      }));

      setEvents(events);
      setConnected(true);
      setLastSyncedAt(new Date());
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  },

  // Create a new event
  createEvent: async (eventData) => {
    const { addEvent, updateEvent, removeEvent, setError } = get();

    // Create optimistic event with pending status
    const tempId = `temp_${Date.now()}`;
    const optimisticEvent: CalendarEvent = {
      ...eventData,
      id: tempId,
      syncStatus: 'pending',
      pendingAction: 'create',
    };

    addEvent(optimisticEvent);

    try {
      // Build ISO datetime strings
      const startDateTime = `${eventData.date}T${eventData.startTime}:00`;
      const endDateTime = `${eventData.date}T${eventData.endTime}:00`;

      const response = await fetch('/api/calendar/google/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: eventData.activityName,
          description: eventData.description,
          start: startDateTime,
          end: endDateTime,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create event');
      }

      const data = await response.json();

      // Update the optimistic event with real data
      const createdEvent: CalendarEvent = {
        ...optimisticEvent,
        id: data.event.id,
        googleEventId: data.event.googleEventId,
        syncStatus: 'synced',
        pendingAction: undefined,
      };

      // Remove temp event and add real one
      removeEvent(tempId);
      addEvent(createdEvent);

      return createdEvent;
    } catch (error) {
      // Mark optimistic event as error
      updateEvent(tempId, { syncStatus: 'error' });
      setError(error instanceof Error ? error.message : 'Failed to create event');
      return null;
    }
  },

  // Update an existing event
  updateEventOnServer: async (eventId, updates) => {
    const { updateEvent, setError, events } = get();
    const originalEvent = events.find((e) => e.id === eventId);

    if (!originalEvent) return false;

    // Optimistic update
    updateEvent(eventId, { ...updates, syncStatus: 'pending', pendingAction: 'update' });

    try {
      const payload: Record<string, unknown> = {
        eventId: originalEvent.googleEventId || eventId,
      };

      if (updates.activityName) payload.summary = updates.activityName;
      if (updates.description !== undefined) payload.description = updates.description;

      // Handle time updates
      if (updates.date || updates.startTime) {
        const date = updates.date || originalEvent.date;
        const startTime = updates.startTime || originalEvent.startTime;
        payload.start = `${date}T${startTime}:00`;
      }

      if (updates.date || updates.endTime) {
        const date = updates.date || originalEvent.date;
        const endTime = updates.endTime || originalEvent.endTime;
        payload.end = `${date}T${endTime}:00`;
      }

      const response = await fetch('/api/calendar/google/events', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to update event');
      }

      // Mark as synced
      updateEvent(eventId, { syncStatus: 'synced', pendingAction: undefined });
      return true;
    } catch (error) {
      // Revert optimistic update
      updateEvent(eventId, { ...originalEvent, syncStatus: 'error' });
      setError(error instanceof Error ? error.message : 'Failed to update event');
      return false;
    }
  },

  // Delete an event
  deleteEvent: async (eventId) => {
    const { updateEvent, removeEvent, setError, events } = get();
    const originalEvent = events.find((e) => e.id === eventId);

    if (!originalEvent) return false;

    // Optimistic delete (mark as pending)
    updateEvent(eventId, { syncStatus: 'pending', pendingAction: 'delete' });

    try {
      const response = await fetch(
        `/api/calendar/google/events?eventId=${encodeURIComponent(eventId)}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        throw new Error('Failed to delete event');
      }

      // Actually remove from store
      removeEvent(eventId);
      return true;
    } catch (error) {
      // Revert - restore the event
      updateEvent(eventId, { syncStatus: 'error', pendingAction: undefined });
      setError(error instanceof Error ? error.message : 'Failed to delete event');
      return false;
    }
  },

  // Move event (drag and drop)
  moveEvent: async (eventId, newDate, newStartTime, newEndTime) => {
    const { updateEventOnServer } = get();

    return updateEventOnServer(eventId, {
      date: newDate,
      startTime: newStartTime,
      endTime: newEndTime,
    });
  },
}));
