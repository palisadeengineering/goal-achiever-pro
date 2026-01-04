/**
 * Utility for handling save operations with error tracking and retry logic
 */

export interface SaveResult<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
  resourceName?: string;
}

export interface SaveOptions {
  maxRetries?: number;
  retryDelay?: number;
}

/**
 * Execute a save operation with error handling and optional retry
 */
export async function saveWithErrorHandling<T>(
  operation: () => Promise<Response>,
  resourceName: string,
  options: SaveOptions = {}
): Promise<SaveResult<T>> {
  const { maxRetries = 0, retryDelay = 1000 } = options;
  let lastError: string | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await operation();

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        lastError = `${resourceName}: ${response.status} - ${errorText}`;

        // Don't retry on 4xx errors (client errors)
        if (response.status >= 400 && response.status < 500) {
          break;
        }

        // Retry on 5xx errors
        if (attempt < maxRetries) {
          await sleep(retryDelay * (attempt + 1)); // Exponential backoff
          continue;
        }

        return { success: false, error: lastError, resourceName };
      }

      // Try to parse JSON response
      let data: T | undefined;
      try {
        data = await response.json() as T;
      } catch {
        // Response might be empty (e.g., 204 No Content)
      }

      return { success: true, data, resourceName };
    } catch (error) {
      lastError = `${resourceName}: ${error instanceof Error ? error.message : 'Network error'}`;

      if (attempt < maxRetries) {
        await sleep(retryDelay * (attempt + 1));
        continue;
      }
    }
  }

  return { success: false, error: lastError, resourceName };
}

/**
 * Execute multiple save operations in parallel and collect results
 */
export async function saveAllWithErrorHandling<T>(
  operations: Array<{
    operation: () => Promise<Response>;
    resourceName: string;
    options?: SaveOptions;
  }>
): Promise<{
  results: SaveResult<T>[];
  successes: SaveResult<T>[];
  failures: SaveResult<T>[];
  allSuccessful: boolean;
}> {
  const results = await Promise.all(
    operations.map(({ operation, resourceName, options }) =>
      saveWithErrorHandling<T>(operation, resourceName, options)
    )
  );

  const successes = results.filter((r) => r.success);
  const failures = results.filter((r) => !r.success);

  return {
    results,
    successes,
    failures,
    allSuccessful: failures.length === 0,
  };
}

/**
 * Helper to format failure messages for display
 */
export function formatSaveFailures(failures: SaveResult[]): string {
  if (failures.length === 0) return '';

  if (failures.length === 1) {
    return failures[0].error || 'Unknown error';
  }

  return `${failures.length} items failed:\n${failures
    .map((f) => `• ${f.error}`)
    .join('\n')}`;
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
