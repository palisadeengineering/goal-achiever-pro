/**
 * Sanitize error messages before returning them in HTTP responses.
 * Logs the full error server-side, returns a generic message to the client.
 * This prevents leaking DB schema, file paths, or SDK internals.
 */
export function sanitizeErrorForClient(
  error: unknown,
  context: string
): string {
  // Log the full error server-side for debugging
  console.error(`[${context}]`, error);

  // Return a generic message — never expose internals
  return `Failed to ${context}`;
}
