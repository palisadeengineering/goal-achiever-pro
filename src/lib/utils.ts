import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format an hour (0-23) to display string based on time format preference
 * @param hour - Hour in 24-hour format (0-23)
 * @param format - '12h' for 12-hour with AM/PM, '24h' for 24-hour
 * @returns Formatted hour string (e.g., "2:00 PM" or "14:00")
 */
export function formatHour(hour: number, format: '12h' | '24h'): string {
  if (format === '24h') {
    return `${hour.toString().padStart(2, '0')}:00`;
  }

  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:00 ${period}`;
}

/**
 * Format a time (hour and minute) to display string based on time format preference
 * @param hour - Hour in 24-hour format (0-23)
 * @param minute - Minute (0-59)
 * @param format - '12h' for 12-hour with AM/PM, '24h' for 24-hour
 * @returns Formatted time string (e.g., "2:30 PM" or "14:30")
 */
export function formatTime(hour: number, minute: number, format: '12h' | '24h'): string {
  if (format === '24h') {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  }

  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
}

/**
 * Format a time string (HH:MM) to display string based on time format preference
 * @param timeStr - Time string in HH:MM format (e.g., "14:30")
 * @param format - '12h' for 12-hour with AM/PM, '24h' for 24-hour
 * @returns Formatted time string (e.g., "2:30 PM" or "14:30")
 */
export function formatTimeString(timeStr: string, format: '12h' | '24h'): string {
  const [hourStr, minuteStr] = timeStr.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  return formatTime(hour, minute, format);
}
