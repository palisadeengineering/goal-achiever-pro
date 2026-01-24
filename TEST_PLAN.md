# Goal Achiever Pro - Ship Readiness Test Plan

## Pre-Launch Configuration Checklist

### Environment Variables (Vercel/Production)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Correct production Supabase URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Production anon key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Service role key (server only)
- [ ] `DATABASE_URL` - Production database connection string
- [ ] `ANTHROPIC_API_KEY` - Valid API key with credits
- [ ] `STRIPE_SECRET_KEY` - Production Stripe key (starts with `sk_live_`)
- [ ] `STRIPE_WEBHOOK_SECRET` - Production webhook secret
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Production publishable key
- [ ] `NEXT_PUBLIC_APP_URL` - Exact production URL (`https://goalachieverpro.com`)

### Google Calendar Setup
- [ ] `GOOGLE_CLIENT_ID` set
- [ ] `GOOGLE_CLIENT_SECRET` set
- [ ] In Google Cloud Console > OAuth 2.0 Client:
  - [ ] Add redirect URI: `https://goalachieverpro.com/api/calendar/google/callback`
  - [ ] OAuth consent screen configured for "External" users
  - [ ] Required scopes added: `calendar`, `calendar.events`
  - [ ] App verified (if >100 users) or test users added

### Stripe Configuration
- [ ] Products created: Free, Pro, Elite tiers
- [ ] Price IDs match what's in code
- [ ] Webhook endpoint: `https://goalachieverpro.com/api/stripe/webhook`
- [ ] Webhook events: `checkout.session.completed`, `customer.subscription.*`

---

## 1. Authentication Flows

### Signup Flow
- [ ] Navigate to `/signup`
- [ ] Create account with email/password
- [ ] Receive verification email
- [ ] Click verification link - redirected to app
- [ ] Profile created in `profiles` table

### Login Flow
- [ ] Navigate to `/login`
- [ ] Login with valid credentials - redirected to `/dashboard`
- [ ] Login with invalid credentials - error message shown
- [ ] "Forgot password" link works

### Password Reset
- [ ] Request reset at `/forgot-password`
- [ ] Receive reset email
- [ ] Reset link works at `/reset-password`
- [ ] Can login with new password

### Beta Invite Flow
- [ ] Admin creates invite at `/admin/beta-access`
- [ ] Invite email received
- [ ] `/accept-invite/[token]` works
- [ ] User can sign up with pre-approved access

### Session Management
- [ ] Session persists across page refreshes
- [ ] Session expires appropriately
- [ ] Logout clears session

---

## 2. Dashboard & Navigation

### Main Dashboard `/dashboard`
- [ ] Page loads without errors
- [ ] Shows summary of visions, goals, tasks
- [ ] Quick actions work
- [ ] Navigation sidebar visible

### Today View `/today`
- [ ] Shows today's scheduled items
- [ ] MINs display correctly
- [ ] Calendar events sync (if Google connected)

### Progress `/progress`
- [ ] Progress metrics display
- [ ] Charts/visualizations render
- [ ] Date range filters work

---

## 3. Vision & Goals Module

### Vision Page `/vision`
- [ ] Create new vision
- [ ] Edit existing vision
- [ ] Delete vision (with confirmation)
- [ ] SMART goal editor works:
  - [ ] Specific field
  - [ ] Measurable field
  - [ ] Achievable field
  - [ ] Relevant field
  - [ ] Time-bound field (date picker)

### AI Features (Vision)
- [ ] "Generate SMART Goals" button calls `/api/ai/generate-smart`
- [ ] AI suggestions populate fields
- [ ] "AI Suggestions" for vision improvement works
- [ ] KPI generation from vision works

### Vision Detail `/vision/[id]`
- [ ] Loads correct vision data
- [ ] Edit mode works
- [ ] Save changes persists

### Power Goals `/goals`
- [ ] List view shows all goals
- [ ] Create new Power Goal
- [ ] Link goal to vision
- [ ] Set quarter (Q1-Q4)
- [ ] Goal grid displays correctly

### Generate Power Goals
- [ ] "Generate from SMART Goals" button works
- [ ] AI generates 12 annual projects
- [ ] Can approve/reject suggestions
- [ ] Saves selected goals

### Goal Detail `/goals/[id]`
- [ ] View goal details
- [ ] Edit goal
- [ ] Mark progress
- [ ] Archive goal

---

## 4. Target Hierarchy

### Monthly Targets
- [ ] View monthly targets for a Power Goal
- [ ] Create monthly target
- [ ] AI target generation works (`/api/ai/generate-targets`)

### Weekly Targets
- [ ] Break monthly into weekly
- [ ] View weekly breakdown
- [ ] Update status

### Daily Actions
- [ ] View daily breakdown
- [ ] Check off completed actions
- [ ] Reschedule actions

---

## 5. MINs (Most Important Next Steps)

### MINs Page `/mins`
- [ ] List all MINs
- [ ] Create new MIN
- [ ] Link MIN to Power Goal
- [ ] Set priority
- [ ] Set due date/time
- [ ] Mark as complete
- [ ] Reschedule MIN
- [ ] Delete MIN

### Calendar View
- [ ] Week view displays MINs correctly
- [ ] Drag-and-drop to reschedule
- [ ] Click to view details

---

## 6. Time Audit Module

### Basic Time Audit `/time-audit`
- [ ] 15-minute block entry
- [ ] Select activity category
- [ ] Rate energy level (1-5)
- [ ] Assign DRIP category (D/R/I/P)
- [ ] Week view renders correctly

### DRIP Matrix `/drip`
- [ ] Matrix quadrants display
- [ ] Activities categorized correctly
- [ ] Percentages calculate
- [ ] Recommendations shown

### Pro Features
- [ ] Biweekly audit view (Pro only)
- [ ] Monthly audit view (Elite only)
- [ ] Non-Pro users see upgrade prompt

---

## 7. Daily Systems

### Routines `/routines`
- [ ] View morning/midday/evening routines
- [ ] Create custom routine
- [ ] Add routine steps
- [ ] Reorder steps (drag-drop)
- [ ] Delete steps
- [ ] Mark routine complete

### Reviews `/reviews`
- [ ] Morning review form
- [ ] Midday review form (Pro only)
- [ ] Evening review form
- [ ] Submit review saves to database
- [ ] View past reviews

### Pomodoro Timer `/pomodoro`
- [ ] Timer starts/stops
- [ ] Work/break intervals correct (25/5)
- [ ] Sound notification (if enabled)
- [ ] Session count tracks
- [ ] Link session to Power Goal

---

## 8. Backtrack Planning

### Backtrack `/backtrack`
- [ ] Create new backtrack plan
- [ ] Set target date
- [ ] Work backwards to create milestones
- [ ] Calendar sync creates events

### Backtrack Detail `/backtrack/[id]`
- [ ] View plan details
- [ ] Edit milestones
- [ ] Mark milestones complete

---

## 9. OKRs Module

### OKRs `/okrs`
- [ ] Create Objective
- [ ] Add Key Results
- [ ] Set target values
- [ ] Update current values
- [ ] Progress auto-calculates

---

## 10. Pro/Elite Features

### Leverage (4 C's) `/leverage` [Pro]
- [ ] Code tracking
- [ ] Content tracking
- [ ] Capital tracking
- [ ] Collaboration tracking
- [ ] Non-Pro sees upgrade prompt

### Network `/network` [Pro]
- [ ] Add friend/contact
- [ ] Categorize relationship
- [ ] Set follow-up reminders
- [ ] View friend inventory

### Team `/team`
- [ ] Add team members
- [ ] Assign roles
- [ ] Track delegation

---

## 11. Analytics & Metrics

### Analytics `/analytics`
- [ ] Charts render correctly
- [ ] Date filters work
- [ ] Data refreshes on change

### 300% Rule Scores
- [ ] Clarity score displays
- [ ] Belief score displays
- [ ] Consistency score displays
- [ ] Trend arrows work

---

## 12. Settings & Integrations

### Settings `/settings`
- [ ] Profile info loads
- [ ] Update profile saves
- [ ] Theme toggle works
- [ ] Notification preferences save

### Google Calendar Integration
- [ ] "Connect Google Calendar" initiates OAuth
- [ ] OAuth completes without redirect_uri error
- [ ] Calendar status shows "Connected"
- [ ] Events sync to app
- [ ] Two-way sync works (create event in app - appears in Google)
- [ ] Disconnect removes integration

### Subscription `/settings/subscription`
- [ ] Current plan displayed
- [ ] Upgrade to Pro/Elite works
- [ ] Stripe checkout redirects correctly
- [ ] Webhook updates subscription in database
- [ ] Cancel subscription works
- [ ] Billing portal accessible

---

## 13. Stripe & Billing

### Checkout Flow
- [ ] Select Pro plan - Stripe checkout
- [ ] Complete test payment (use `4242 4242 4242 4242`)
- [ ] Redirect back to app with success
- [ ] Subscription active in database
- [ ] Pro features unlocked

### Webhook Processing
- [ ] `checkout.session.completed` updates subscription
- [ ] `customer.subscription.updated` handles upgrades/downgrades
- [ ] `customer.subscription.deleted` handles cancellation

---

## 14. Edge Cases & Error Handling

### API Error Handling
- [ ] API rate limits show friendly message
- [ ] Network errors show retry option
- [ ] Invalid data shows validation errors

### Auth Edge Cases
- [ ] Expired session redirects to login
- [ ] Invalid JWT handled gracefully
- [ ] Demo mode works for `joel@pe-se.com`

### Data Edge Cases
- [ ] Empty states show helpful prompts
- [ ] Long text truncates properly
- [ ] Special characters handled

---

## 15. Mobile & Responsive

### Mobile Breakpoints
- [ ] Sidebar collapses on mobile
- [ ] Touch targets >= 44px
- [ ] Forms usable on mobile
- [ ] Calendar view adapts

### Tablet
- [ ] Layout adapts appropriately
- [ ] No horizontal scroll

---

## 16. Performance

### Page Load
- [ ] Dashboard loads in <3s
- [ ] No blocking requests
- [ ] Images optimized

### Lighthouse Scores
- [ ] Performance: >70
- [ ] Accessibility: >90
- [ ] Best Practices: >90

---

## Quick Reference: Key URLs

| Environment | URL |
|-------------|-----|
| Production | https://goalachieverpro.com |
| Vercel Preview | https://goal-achiever-pro.vercel.app |
| Google Calendar Callback | https://goalachieverpro.com/api/calendar/google/callback |
| Stripe Webhook | https://goalachieverpro.com/api/stripe/webhook |
| Supabase Auth Callback | https://goalachieverpro.com/auth/callback |
