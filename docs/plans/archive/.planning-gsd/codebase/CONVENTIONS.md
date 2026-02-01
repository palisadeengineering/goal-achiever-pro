# Coding Conventions

**Analysis Date:** 2026-01-11

## Naming Patterns

**Files:**
- kebab-case for all TypeScript files: `smart-goal-editor.tsx`, `use-time-blocks.ts`
- route.ts for API routes (Next.js convention)
- Test files: *.test.ts alongside source (not implemented yet)
- Barrel exports: `index.ts` in feature directories

**Functions:**
- camelCase for all functions: `getUserId`, `handleSave`, `createTag`
- No special prefix for async functions
- Event handlers: `handle*` prefix: `handleClick`, `handleSubmit`, `handleSave`
- Hooks: `use*` prefix: `useTimeBlocks`, `useAnalyticsData`

**Variables:**
- camelCase for variables: `userId`, `timeBlocks`, `isLoading`
- UPPER_SNAKE_CASE for constants: `DEMO_USER_ID`, `PRESET_COLORS`, `SMART_FIELDS`
- No underscore prefix for private members

**Types:**
- PascalCase for interfaces: `SmartGoalData`, `TagManagerProps`, `TimeBlock`
- PascalCase for type aliases: `SubscriptionTier`, `DripQuadrant`
- No `I` prefix for interfaces (use `UserProps` not `IUserProps`)

**Database:**
- snake_case in PostgreSQL: `user_id`, `created_at`, `drip_quadrant`
- Transform to camelCase in API responses: `userId`, `createdAt`, `dripQuadrant`

## Code Style

**Formatting:**
- 2 spaces for indentation
- Single quotes for imports: `import { create } from 'zustand'`
- Double quotes in JSX string attributes: `className="flex"`
- Semicolons required at end of statements
- No Prettier configured (ESLint only)

**Linting:**
- ESLint 9 with flat config: `eslint.config.mjs`
- Extends: eslint-config-next/core-web-vitals, typescript
- Run with: `npm run lint`

## Import Organization

**Order:**
1. React/Next.js imports: `import { useState } from 'react'`
2. External packages: `import { create } from 'zustand'`
3. UI components: `import { Button } from '@/components/ui/button'`
4. Feature components: `import { TagManager } from '@/components/features/time-audit'`
5. Utilities: `import { cn } from '@/lib/utils'`
6. Types: `import type { Tag } from '@/lib/hooks/use-tags'`

**Grouping:**
- Blank line between groups
- No enforced sorting within groups

**Path Aliases:**
- `@/*` maps to `src/*` - configured in `tsconfig.json`
- Always use aliases for src imports: `@/lib/utils` not `../../lib/utils`

## Error Handling

**Patterns:**
- Try/catch at API route level with error logging
- Return { error: message } with HTTP status codes
- Consistent error response structure (mostly)

**API Routes:**
```typescript
try {
  // ... operation
  return NextResponse.json({ data });
} catch (error) {
  console.error('Operation error:', error);
  return NextResponse.json(
    { error: 'Failed to perform operation' },
    { status: 500 }
  );
}
```

**Component Error States:**
- Loading state: `const [isLoading, setIsLoading] = useState(false)`
- Error state: `const [error, setError] = useState<string | null>(null)`
- Show toast on error: `toast.error('Failed to save')`

## Logging

**Framework:**
- console.log for debugging
- console.error for errors
- No structured logging configured

**Patterns:**
- Log error with context: `console.error('Create tag error:', error)`
- Avoid console.log in production (should configure ESLint rule)

## Comments

**When to Comment:**
- Complex business logic
- Non-obvious workarounds
- Section headers in large files

**Section Headers:**
```typescript
// =============================================
// SECTION NAME
// =============================================
```

**JSDoc:**
- Used for utility functions in `src/lib/utils.ts`
- Format: @param, @returns tags

**TODO Comments:**
- Format: `// TODO: description`
- Found in: `src/app/(dashboard)/today/page.tsx`, `src/components/features/accountability/`

## Function Design

**Size:**
- Keep under 50 lines where possible
- Extract helpers for complex logic
- Some files exceed this (time-audit page is 1751 lines)

**Parameters:**
- Max 3 parameters preferred
- Use options object for more: `function create(options: CreateOptions)`
- Destructure props: `function Component({ id, name, onSave }: Props)`

**Return Values:**
- Explicit return statements
- Return early for guard clauses
- API routes return NextResponse.json()

## Module Design

**Exports:**
- Named exports preferred
- Default exports for pages (Next.js requirement)
- Barrel exports from feature directories

**Component Organization:**
```typescript
'use client';

import { useState } from 'react';
// ... other imports

interface ComponentProps {
  // props
}

const CONSTANTS = [...];

export function Component({ prop }: ComponentProps) {
  // hooks
  // handlers
  // render
}
```

## React Patterns

**State Management:**
- useState for local state
- Zustand for global UI state
- React Query for server state (via TanStack Query)

**Event Handlers:**
- Define as const functions: `const handleSave = async () => {}`
- Wrap in useCallback when passed to children

**Effects:**
- useEffect for side effects
- useMemo for expensive computations
- useCallback for stable function references

---

*Convention analysis: 2026-01-11*
*Update when patterns change*
