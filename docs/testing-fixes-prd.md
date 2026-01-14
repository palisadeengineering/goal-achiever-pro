# PRD: Testing Fixes - Authentication & Navigation Issues

## Overview

This document outlines the issues discovered during end-to-end testing of the Goal Achiever Pro application and the required fixes to address them.

## Problem Statement

During user acceptance testing as a new user, several critical issues were identified that impact the core user experience:

1. **Sign-out functionality is broken** - Users cannot log out of the application
2. **Footer links lead to 404 errors** - Privacy, Terms, and Contact pages don't exist
3. **Guide page accessibility** - Footer links to guide which requires authentication

## Issues & Solutions

### Issue 1: Sign-Out Button Not Functional

**Severity:** Critical
**Impact:** Users cannot log out of the application, forcing them to clear browser cookies manually

**Root Cause Analysis:**
- The `Header` component (`src/components/layout/header.tsx`) accepts an `onSignOut` prop but it's optional
- The dashboard layout (`src/app/(dashboard)/layout.tsx`) never passes the `onSignOut` prop to the Header
- No actual sign-out handler exists that calls `supabase.auth.signOut()`
- The dashboard layout is a Server Component, which cannot pass client-side event handlers directly

**Technical Solution:**
1. Create a client-side wrapper component that handles the sign-out logic
2. Use Supabase browser client to call `auth.signOut()`
3. Redirect user to login page after sign-out
4. Pass the sign-out handler to the Header component

**Files to Modify:**
- `src/app/(dashboard)/layout.tsx` - Update to use client wrapper
- `src/components/layout/header.tsx` - Ensure onSignOut is properly called

**Files to Create:**
- `src/components/layout/dashboard-header.tsx` - Client component wrapper with sign-out logic

---

### Issue 2: Missing Footer Pages

**Severity:** Medium
**Impact:** Footer links lead to 404 errors, creating a poor user experience and potential trust issues

**Missing Pages:**
| Page | URL | Status |
|------|-----|--------|
| Privacy Policy | `/privacy` | Missing |
| Terms of Service | `/terms` | Missing |
| Contact | `/contact` | Missing |

**Technical Solution:**
1. Create static pages for Privacy Policy, Terms of Service, and Contact
2. Place them in `src/app/(marketing)/` folder so they're publicly accessible
3. Add basic content structure with placeholder text
4. Style consistently with the marketing pages

**Files to Create:**
- `src/app/(marketing)/privacy/page.tsx`
- `src/app/(marketing)/terms/page.tsx`
- `src/app/(marketing)/contact/page.tsx`

---

### Issue 3: Guide Page Accessibility

**Severity:** Low
**Impact:** Footer links to `/guide` which is in the dashboard (protected) area

**Current State:**
- Guide page exists at `src/app/(dashboard)/guide/page.tsx`
- Requires authentication to access
- Footer on public homepage links to it

**Technical Solution:**
- Keep the guide in the dashboard as-is (it's appropriate for authenticated users)
- The link from footer is acceptable since it will redirect to login if not authenticated
- No changes required

---

## Implementation Plan

### Phase 1: Sign-Out Fix (Critical)

1. Create `DashboardHeader` client component
2. Implement sign-out handler using Supabase browser client
3. Update dashboard layout to use the new component
4. Test sign-out flow end-to-end

### Phase 2: Footer Pages (Medium)

1. Create marketing layout for footer pages (if not exists)
2. Create Privacy Policy page with standard sections
3. Create Terms of Service page with standard sections
4. Create Contact page with contact information
5. Test all footer links

### Phase 3: Verification

1. Test complete authentication flow (signup -> login -> dashboard -> signout)
2. Test all footer links from homepage
3. Test navigation between all dashboard pages
4. Test mobile responsiveness of new pages

---

## Success Criteria

1. Users can successfully sign out from the dashboard header dropdown
2. After sign-out, users are redirected to the login page
3. All footer links (Privacy, Terms, Contact) load valid pages
4. No 404 errors when clicking any navigation link
5. Sign-out works on both desktop and mobile views

---

## Out of Scope

- Full legal review of Privacy Policy and Terms content
- Contact form functionality (placeholder only)
- Newsletter signup functionality
- Blog pages mentioned in footer

---

## Technical Notes

### Supabase Sign-Out Flow
```typescript
import { createClient } from '@/lib/supabase/client';

const handleSignOut = async () => {
  const supabase = createClient();
  await supabase.auth.signOut();
  // Redirect to login
  window.location.href = '/login';
};
```

### Server vs Client Components
The dashboard layout is a Server Component that:
- Fetches user data server-side
- Cannot pass event handlers directly to child components

Solution: Create a thin client wrapper that:
- Receives user data as props from server component
- Handles client-side interactions (sign-out)
- Renders the Header component with proper handlers

---

## Timeline Estimate

- Phase 1 (Sign-Out Fix): Core fix implementation
- Phase 2 (Footer Pages): Page creation and styling
- Phase 3 (Verification): Testing and QA

---

## Appendix: Files Changed Summary

| File | Action | Description |
|------|--------|-------------|
| `src/components/layout/dashboard-header.tsx` | Create | Client wrapper for Header with sign-out |
| `src/app/(dashboard)/layout.tsx` | Modify | Use DashboardHeader |
| `src/app/(marketing)/privacy/page.tsx` | Create | Privacy Policy page |
| `src/app/(marketing)/terms/page.tsx` | Create | Terms of Service page |
| `src/app/(marketing)/contact/page.tsx` | Create | Contact page |
