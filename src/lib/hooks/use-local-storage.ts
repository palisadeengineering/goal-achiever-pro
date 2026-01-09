'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// Custom event name for same-tab localStorage sync
const LOCAL_STORAGE_SYNC_EVENT = 'local-storage-sync';

interface LocalStorageSyncEvent extends CustomEvent {
  detail: {
    key: string;
    value: string;
  };
}

export function useLocalStorage<T>(key: string, initialValue: T) {
  // Always start with initial value for SSR
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isHydrated, setIsHydrated] = useState(false);
  const valueRef = useRef<T>(initialValue);

  // Hydrate from localStorage after mount
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        const parsed = JSON.parse(item);
        setStoredValue(parsed);
        valueRef.current = parsed;
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
    }
    setIsHydrated(true);
  }, [key]);

  // Update localStorage when value changes
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(valueRef.current) : value;
      setStoredValue(valueToStore);
      valueRef.current = valueToStore;
      if (typeof window !== 'undefined') {
        const stringValue = JSON.stringify(valueToStore);
        window.localStorage.setItem(key, stringValue);

        // Dispatch custom event for same-tab sync
        // This allows other hook instances to stay in sync
        window.dispatchEvent(new CustomEvent(LOCAL_STORAGE_SYNC_EVENT, {
          detail: { key, value: stringValue }
        }));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key]);

  // Sync with other tabs (via storage event) and same tab (via custom event)
  useEffect(() => {
    if (!isHydrated) return;

    // Handle cross-tab storage events
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try {
          const newValue = JSON.parse(e.newValue);
          setStoredValue(newValue);
          valueRef.current = newValue;
        } catch {
          // Ignore parse errors
        }
      }
    };

    // Handle same-tab sync events from other hook instances
    const handleSameTabSync = (e: Event) => {
      const customEvent = e as LocalStorageSyncEvent;
      if (customEvent.detail.key === key) {
        try {
          const newValue = JSON.parse(customEvent.detail.value);
          // Only update if the value is actually different (prevents infinite loops)
          if (JSON.stringify(valueRef.current) !== customEvent.detail.value) {
            setStoredValue(newValue);
            valueRef.current = newValue;
          }
        } catch {
          // Ignore parse errors
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener(LOCAL_STORAGE_SYNC_EVENT, handleSameTabSync);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener(LOCAL_STORAGE_SYNC_EVENT, handleSameTabSync);
    };
  }, [key, isHydrated]);

  return [storedValue, setValue] as const;
}
