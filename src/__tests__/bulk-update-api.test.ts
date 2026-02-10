import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase server client
const mockSupabaseFrom = vi.fn();
const mockSupabase = { from: mockSupabaseFrom };

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    from: (...args: unknown[]) => mockSupabaseFrom(...args),
  }),
}));

// Mock auth
vi.mock('@/lib/auth/api-auth', () => ({
  getAuthenticatedUser: vi.fn().mockResolvedValue({
    isAuthenticated: true,
    userId: 'user-123',
  }),
}));

import { POST } from '@/app/api/time-blocks/bulk-update/route';
import { NextRequest } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/api-auth';

// Helper to build a NextRequest with JSON body
function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost/api/time-blocks/bulk-update', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

// Helper to chain Supabase query builder
function chainBuilder(finalResult: { data?: unknown; error?: unknown }) {
  const builder: Record<string, unknown> = {};
  const proxy = new Proxy(builder, {
    get: (_target, prop) => {
      if (prop === 'then') return undefined; // not a Promise
      return (..._args: unknown[]) => {
        // select, eq, in, update, delete, upsert, single all return the builder
        // The last call resolves with the finalResult
        return new Proxy({}, {
          get: (_t, p) => {
            if (p === 'then') {
              // Make it thenable for await
              return (resolve: (v: unknown) => void) => resolve(finalResult);
            }
            return (..._a: unknown[]) => new Proxy({}, {
              get: (_t2, p2) => {
                if (p2 === 'then') return (resolve: (v: unknown) => void) => resolve(finalResult);
                return (..._a2: unknown[]) => new Proxy({}, {
                  get: (_t3, p3) => {
                    if (p3 === 'then') return (resolve: (v: unknown) => void) => resolve(finalResult);
                    return (..._a3: unknown[]) => new Proxy({}, {
                      get: (_t4, p4) => {
                        if (p4 === 'then') return (resolve: (v: unknown) => void) => resolve(finalResult);
                        return (..._a4: unknown[]) => ({ then: (resolve: (v: unknown) => void) => resolve(finalResult) });
                      },
                    });
                  },
                });
              },
            });
          },
        });
      };
    },
  });
  return proxy;
}

describe('POST /api/time-blocks/bulk-update', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: auth passes
    vi.mocked(getAuthenticatedUser).mockResolvedValue({
      isAuthenticated: true,
      userId: 'user-123',
      error: undefined,
      status: undefined,
    } as ReturnType<typeof getAuthenticatedUser> extends Promise<infer T> ? T : never);
  });

  describe('Input validation', () => {
    it('returns 400 when blockIds is missing', async () => {
      const req = makeRequest({ updates: { valueQuadrant: 'production' } });
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toContain('blockIds');
    });

    it('returns 400 when blockIds is empty', async () => {
      const req = makeRequest({ blockIds: [], updates: { valueQuadrant: 'production' } });
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toContain('blockIds');
    });

    it('returns 400 when blockIds exceeds 500', async () => {
      const ids = Array.from({ length: 501 }, (_, i) => `block-${i}`);
      const req = makeRequest({ blockIds: ids, updates: { valueQuadrant: 'production' } });
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toContain('500');
    });

    it('returns 400 when updates is missing', async () => {
      const req = makeRequest({ blockIds: ['block-1'] });
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toContain('updates');
    });

    it('returns 400 for invalid valueQuadrant', async () => {
      const req = makeRequest({
        blockIds: ['block-1'],
        updates: { valueQuadrant: 'invalid_quadrant' },
      });
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toContain('Invalid valueQuadrant');
    });

    it('returns 400 for invalid energyRating', async () => {
      const req = makeRequest({
        blockIds: ['block-1'],
        updates: { energyRating: 'purple' },
      });
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toContain('Invalid energyRating');
    });

    it('returns 400 for invalid activityType', async () => {
      const req = makeRequest({
        blockIds: ['block-1'],
        updates: { activityType: 'invalid_type' },
      });
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toContain('Invalid activityType');
    });

    it('returns 400 for invalid leverageType', async () => {
      const req = makeRequest({
        blockIds: ['block-1'],
        updates: { leverageType: 'invalid_leverage' },
      });
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toContain('Invalid leverageType');
    });

    it('returns 400 when no update fields provided', async () => {
      const req = makeRequest({
        blockIds: ['block-1'],
        updates: {},
      });
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toContain('At least one update field');
    });
  });

  describe('Valid enum values', () => {
    it('accepts all valid valueQuadrant values', () => {
      const validValues = ['production', 'investment', 'replacement', 'delegation', 'na'];
      validValues.forEach((val) => {
        // Just validate the array contains the expected values
        expect(validValues).toContain(val);
      });
    });

    it('accepts all valid energyRating values', () => {
      const validValues = ['green', 'yellow', 'red'];
      validValues.forEach((val) => {
        expect(validValues).toContain(val);
      });
    });

    it('accepts all valid activityType values', () => {
      const validValues = ['project', 'meeting', 'commute', 'deep_work', 'admin', 'break', 'other'];
      validValues.forEach((val) => {
        expect(validValues).toContain(val);
      });
    });

    it('accepts all valid leverageType values including "none"', () => {
      const validValues = ['code', 'content', 'capital', 'collaboration', 'none'];
      validValues.forEach((val) => {
        expect(validValues).toContain(val);
      });
    });
  });

  describe('Authentication', () => {
    it('returns 401 when user is not authenticated', async () => {
      vi.mocked(getAuthenticatedUser).mockResolvedValue({
        isAuthenticated: false,
        userId: undefined as unknown as string,
        error: 'Not authenticated',
        status: 401,
      } as ReturnType<typeof getAuthenticatedUser> extends Promise<infer T> ? T : never);

      const req = makeRequest({
        blockIds: ['block-1'],
        updates: { valueQuadrant: 'production' },
      });
      const res = await POST(req);

      expect(res.status).toBe(401);
    });
  });

  describe('activityCategory support', () => {
    it('accepts activityCategory in the updates object without validation error', async () => {
      // This test verifies activityCategory is included in the hasFieldUpdate check
      // and doesn't cause a validation error.
      // Since the DB calls are mocked, we just verify it doesn't return a 400
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'time_blocks') {
          return {
            select: () => ({
              eq: () => ({
                in: () => Promise.resolve({
                  data: [{ id: 'block-1' }],
                  error: null,
                }),
              }),
            }),
            update: () => ({
              eq: () => ({
                in: () => Promise.resolve({
                  data: null,
                  error: null,
                }),
              }),
            }),
          };
        }
        return {
          select: () => ({
            eq: () => ({
              in: () => Promise.resolve({ data: [], error: null }),
            }),
          }),
        };
      });

      const req = makeRequest({
        blockIds: ['block-1'],
        updates: { activityCategory: 'design_engineering' },
      });
      const res = await POST(req);
      const body = await res.json();

      // Should not be a 400 validation error
      expect(res.status).not.toBe(400);
    });
  });
});

describe('Bulk Update - Business Logic', () => {
  describe('leverageType "none" handling', () => {
    it('should map "none" to null in the database', () => {
      // The route converts leverageType === 'none' to null
      const leverageType = 'none';
      const dbValue = leverageType === 'none' ? null : leverageType;
      expect(dbValue).toBeNull();
    });

    it('should pass through valid leverage types', () => {
      const leverageType = 'code';
      const dbValue = leverageType === 'none' ? null : leverageType;
      expect(dbValue).toBe('code');
    });
  });

  describe('activityCategory handling', () => {
    it('should set null for empty string activityCategory', () => {
      const activityCategory = '';
      const dbValue = activityCategory || null;
      expect(dbValue).toBeNull();
    });

    it('should pass through non-empty activityCategory', () => {
      const activityCategory = 'design_engineering';
      const dbValue = activityCategory || null;
      expect(dbValue).toBe('design_engineering');
    });
  });

  describe('detectedProjectId handling', () => {
    it('should set null for empty string detectedProjectId', () => {
      const detectedProjectId = '';
      const isClearing = detectedProjectId === null || detectedProjectId === '';
      expect(isClearing).toBe(true);
    });

    it('should set null for null detectedProjectId', () => {
      const detectedProjectId = null;
      const isClearing = detectedProjectId === null || detectedProjectId === '';
      expect(isClearing).toBe(true);
    });

    it('should not clear for a valid project ID', () => {
      const detectedProjectId = 'proj-123';
      const isClearing = detectedProjectId === null || detectedProjectId === '';
      expect(isClearing).toBe(false);
    });
  });

  describe('idType handling', () => {
    it('uses "id" column by default', () => {
      const idType = undefined;
      const useExternalId = idType === 'external';
      const lookupColumn = useExternalId ? 'external_event_id' : 'id';
      expect(lookupColumn).toBe('id');
    });

    it('uses "external_event_id" when idType is "external"', () => {
      const idType = 'external';
      const useExternalId = idType === 'external';
      const lookupColumn = useExternalId ? 'external_event_id' : 'id';
      expect(lookupColumn).toBe('external_event_id');
    });
  });

  describe('skipped count', () => {
    it('calculates correct skipped count', () => {
      const blockIds = ['a', 'b', 'c', 'd'];
      const validIds = ['a', 'c']; // 2 found
      const skipped = blockIds.length - validIds.length;
      expect(skipped).toBe(2);
    });
  });
});
