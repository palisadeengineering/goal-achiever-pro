# Testing Patterns

**Analysis Date:** 2026-01-11

## Test Framework

**Runner:**
- Not configured (no Jest, Vitest, or other test runner installed)

**Assertion Library:**
- Not configured

**Run Commands:**
```bash
# No test commands available
npm run lint              # Only linting available
```

## Test File Organization

**Location:**
- No test files exist in the codebase
- Recommended: *.test.ts alongside source files (co-located pattern)

**Naming:**
- Recommended: `module-name.test.ts` for unit tests
- Recommended: `feature-name.integration.test.ts` for integration tests

**Structure (Recommended):**
```
src/
  lib/
    hooks/
      use-tags.ts
      use-tags.test.ts        # co-located
  components/
    features/
      time-audit/
        tag-manager.tsx
        tag-manager.test.tsx  # co-located
  app/
    api/
      tags/
        route.ts
        route.test.ts         # co-located
```

## Current Validation Approach

**Type Safety (Primary):**
- TypeScript strict mode enabled: `"strict": true` in `tsconfig.json`
- Comprehensive type definitions in `src/types/database.ts`
- Interface definitions for all component props

**API Validation:**
- Input validation at API layer before database operations
- Example (`src/app/api/tags/route.ts`):
  ```typescript
  if (!name || !name.trim()) {
    return NextResponse.json(
      { error: 'Tag name is required' },
      { status: 400 }
    );
  }
  ```

**Client-side Validation:**
- React Hook Form for form state
- Zod schemas available in `src/lib/validations/` (underutilized)
- Manual validation before API calls

## Coverage

**Requirements:**
- No coverage requirements (no tests configured)

**Configuration:**
- Not configured

## Test Types Needed

**Unit Tests (Priority: High):**
- `src/lib/utils/` - Utility functions (formatHour, formatTime, etc.)
- `src/lib/utils/recurrence.ts` - RRULE parsing
- `src/lib/utils/ai-usage.ts` - Cost calculation

**Hook Tests (Priority: High):**
- `src/lib/hooks/use-time-blocks.ts` - CRUD operations
- `src/lib/hooks/use-tags.ts` - Tag management
- `src/lib/hooks/use-analytics-data.ts` - Analytics computation

**API Route Tests (Priority: Critical):**
- `src/app/api/visions/route.ts` - Vision CRUD
- `src/app/api/time-blocks/route.ts` - Time block operations
- `src/app/api/stripe/webhook/route.ts` - Payment webhook handling
- `src/app/api/ai/generate-smart/route.ts` - AI generation

**Component Tests (Priority: Medium):**
- `src/components/features/time-audit/tag-manager.tsx` - CRUD interactions
- `src/components/features/vision/smart-goal-editor.tsx` - Form submission

**E2E Tests (Priority: Low):**
- Not currently planned
- Consider Playwright for critical user flows

## Common Patterns (Recommended)

**Async Testing:**
```typescript
import { describe, it, expect } from 'vitest';

it('should handle async operation', async () => {
  const result = await asyncFunction();
  expect(result).toBe('expected');
});
```

**Error Testing:**
```typescript
it('should throw on invalid input', () => {
  expect(() => functionCall(null)).toThrow('Invalid input');
});

it('should reject on failure', async () => {
  await expect(asyncCall()).rejects.toThrow('error message');
});
```

**Mock API Calls:**
```typescript
import { vi } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabaseClient)
}));
```

## Setup Recommendations

**Install Vitest:**
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

**Create vitest.config.ts:**
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**Add test script to package.json:**
```json
{
  "scripts": {
    "test": "vitest",
    "test:coverage": "vitest --coverage"
  }
}
```

---

*Testing analysis: 2026-01-11*
*Update when test infrastructure is added*
