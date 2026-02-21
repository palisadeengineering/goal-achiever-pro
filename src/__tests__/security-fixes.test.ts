import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ─── Single shared mock for @/lib/supabase/server ──────────────────
// vi.mock is hoisted, so we can only have ONE per module in a file.

const mockCreateClient = vi.fn();
const mockCreateServiceRoleClient = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...args),
  createServiceRoleClient: (...args: unknown[]) => mockCreateServiceRoleClient(...args),
}));

vi.mock('@/lib/auth/api-auth', () => ({
  getAuthenticatedUser: vi.fn().mockResolvedValue({
    isAuthenticated: true,
    userId: 'user-123',
  }),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => null),
}));

// Don't actually send email
vi.mock('@/lib/email/resend', () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true }),
}));
vi.mock('@/lib/email/templates/beta-invitation', () => ({
  generateBetaInvitationEmailHtml: vi.fn(() => '<html></html>'),
}));

/** Build a chainable Supabase query builder that resolves to `finalResult` */
function chainBuilder(finalResult: { data?: unknown; count?: unknown; error?: unknown }) {
  const handler: ProxyHandler<object> = {
    get: (_target, prop) => {
      if (prop === 'then')
        return (resolve: (v: unknown) => void) => resolve(finalResult);
      return () => new Proxy({}, handler);
    },
  };
  return new Proxy({}, handler);
}

// ─────────────────────────────────────────────────────────────────────
// 1. PostgREST Filter Injection — time-blocks DELETE clearSource
// ─────────────────────────────────────────────────────────────────────

describe('Vuln 1: PostgREST filter injection — clearSource whitelist', () => {
  const mockFrom = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReturnValue(chainBuilder({ data: null, count: 0, error: null }));
    mockCreateClient.mockResolvedValue({ from: mockFrom });
  });

  async function callDELETE(url: string) {
    const { DELETE } = await import('@/app/api/time-blocks/route');
    const req = new NextRequest(url, { method: 'DELETE' });
    return DELETE(req);
  }

  it('rejects clearSource with SQL injection payload', async () => {
    const res = await callDELETE(
      'http://localhost/api/time-blocks?clearSource=evil);DROP TABLE time_blocks;--'
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid source value');
  });

  it('rejects clearSource with unknown value', async () => {
    const res = await callDELETE(
      'http://localhost/api/time-blocks?clearSource=unknown_value'
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid source value');
  });

  it('accepts clearSource=google_calendar', async () => {
    const res = await callDELETE(
      'http://localhost/api/time-blocks?clearSource=google_calendar'
    );
    expect(res.status).toBe(200);
  });

  it('accepts clearSource=calendar_sync', async () => {
    const res = await callDELETE(
      'http://localhost/api/time-blocks?clearSource=calendar_sync'
    );
    expect(res.status).toBe(200);
  });

  it('accepts clearSource=manual', async () => {
    const res = await callDELETE(
      'http://localhost/api/time-blocks?clearSource=manual'
    );
    expect(res.status).toBe(200);
  });

  it('accepts clearSource=imported', async () => {
    const res = await callDELETE(
      'http://localhost/api/time-blocks?clearSource=imported'
    );
    expect(res.status).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────
// 2. Insecure Token — beta-invitations use crypto
// ─────────────────────────────────────────────────────────────────────

describe('Vuln 2: Token generation uses crypto, not Math.random', () => {
  it('generateInviteToken returns base64url with sufficient entropy', async () => {
    const { generateInviteToken } = await import('@/lib/permissions/check-access');
    const token = generateInviteToken();

    // 24 bytes → 32 base64url chars
    expect(token.length).toBe(32);
    // Only base64url characters (no +, /, or =)
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('generateInviteToken produces unique tokens', async () => {
    const { generateInviteToken } = await import('@/lib/permissions/check-access');
    const tokens = new Set(Array.from({ length: 50 }, () => generateInviteToken()));
    expect(tokens.size).toBe(50);
  });

  it('beta-invitations/route.ts imports generateInviteToken (not Math.random)', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      'src/app/api/admin/beta-invitations/route.ts',
      'utf-8'
    );
    expect(source).not.toContain('Math.random');
    expect(source).toContain("import { generateInviteToken } from '@/lib/permissions/check-access'");
  });

  it('beta-invitations/[id]/resend/route.ts imports generateInviteToken (not Math.random)', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      'src/app/api/admin/beta-invitations/[id]/resend/route.ts',
      'utf-8'
    );
    expect(source).not.toContain('Math.random');
    expect(source).toContain("import { generateInviteToken } from '@/lib/permissions/check-access'");
  });
});

// ─────────────────────────────────────────────────────────────────────
// 3. Unauthenticated Invite Accept — email verification
// ─────────────────────────────────────────────────────────────────────

describe('Vuln 3: Invite accept requires email verification', () => {
  const mockFrom = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateServiceRoleClient.mockReturnValue({ from: mockFrom });
  });

  function makeRequest(body?: unknown) {
    const init: RequestInit = { method: 'POST' };
    if (body !== undefined) {
      init.body = JSON.stringify(body);
      init.headers = { 'Content-Type': 'application/json' };
    }
    return new NextRequest('http://localhost/api/invite/test-token/accept', init);
  }

  async function callAccept(req: NextRequest) {
    const { POST } = await import('@/app/api/invite/[token]/accept/route');
    return POST(req, { params: Promise.resolve({ token: 'test-token' }) });
  }

  it('rejects request with no body', async () => {
    const req = new NextRequest('http://localhost/api/invite/test-token/accept', {
      method: 'POST',
    });
    const res = await callAccept(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('email');
  });

  it('rejects request with missing email field', async () => {
    const req = makeRequest({});
    const res = await callAccept(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Email is required');
  });

  it('rejects request with wrong email', async () => {
    mockFrom.mockReturnValue(
      chainBuilder({
        data: { id: '1', email: 'invited@example.com', invite_token: 'test-token', status: 'pending' },
        error: null,
      })
    );

    const req = makeRequest({ email: 'wrong@example.com' });
    const res = await callAccept(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('Email mismatch');
  });

  it('accepts request with matching email (case-insensitive)', async () => {
    mockFrom.mockReturnValue(
      chainBuilder({
        data: { id: '1', email: 'invited@example.com', invite_token: 'test-token', status: 'pending' },
        error: null,
      })
    );

    const req = makeRequest({ email: 'INVITED@Example.com' });
    const res = await callAccept(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it('returns 404 when invitation not found', async () => {
    mockFrom.mockReturnValue(
      chainBuilder({ data: null, error: { message: 'not found' } })
    );

    const req = makeRequest({ email: 'someone@example.com' });
    const res = await callAccept(req);
    expect(res.status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────
// 4. Profile Endpoint — no demo fallback
// ─────────────────────────────────────────────────────────────────────

describe('Vuln 4: Profile endpoint returns 401/500, not demo data', () => {
  const mockAuthGetUser = vi.fn();
  const mockAuthUpdateUser = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Default: supabase client available with auth
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: mockAuthGetUser,
        updateUser: mockAuthUpdateUser,
      },
      from: vi.fn(),
    });
  });

  it('GET returns 500 when supabase is null', async () => {
    mockCreateClient.mockResolvedValue(null);

    const { GET } = await import('@/app/api/user/profile/route');
    const res = await GET();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Database connection failed');
  });

  it('GET returns 401 when no user (not demo data)', async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: null } });

    const { GET } = await import('@/app/api/user/profile/route');
    const res = await GET();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
    // Must NOT contain demo user fields
    expect(body).not.toHaveProperty('full_name');
    expect(body).not.toHaveProperty('email', 'demo@example.com');
  });

  it('PUT returns 500 when supabase is null (not fake success)', async () => {
    mockCreateClient.mockResolvedValue(null);

    const { PUT } = await import('@/app/api/user/profile/route');
    const req = new NextRequest('http://localhost/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify({ full_name: 'Test' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await PUT(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Database connection failed');
    expect(body).not.toHaveProperty('success');
  });

  it('PUT returns 401 when no user', async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: null } });

    const { PUT } = await import('@/app/api/user/profile/route');
    const req = new NextRequest('http://localhost/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify({ full_name: 'Test' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await PUT(req);
    expect(res.status).toBe(401);
  });

  it('source file does not contain DEMO_USER', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('src/app/api/user/profile/route.ts', 'utf-8');
    expect(source).not.toContain('DEMO_USER');
    expect(source).not.toContain('demo@example.com');
  });
});

// ─────────────────────────────────────────────────────────────────────
// 5. Subscription Endpoint — no fake fallback
// ─────────────────────────────────────────────────────────────────────

describe('Vuln 5: Subscription endpoint returns 500 when supabase null', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 500 when supabase is null (not fake subscription)', async () => {
    mockCreateClient.mockResolvedValue(null);

    const { GET } = await import('@/app/api/user/subscription/route');
    const res = await GET();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Database connection failed');
    // Must NOT return fake subscription data
    expect(body).not.toHaveProperty('tier');
    expect(body).not.toHaveProperty('stripeCustomerId');
  });

  it('returns 401 when no user authenticated', async () => {
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
    });

    const { GET } = await import('@/app/api/user/subscription/route');
    const res = await GET();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });
});
