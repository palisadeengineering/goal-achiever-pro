# Goal Achiever Pro v2.0 Release Notes

**Release Date:** February 2026

---

## Overview

Version 2.0 introduces a completely redesigned goal planning system with AI-powered project creation, gamification, and a rewards system to keep you motivated on your journey to achieving your goals.

---

## New Features

### Vision Planner (V2)

A conversational wizard that transforms your goals into actionable projects.

**Key Capabilities:**
- **Natural Language Input** - Describe your goal in plain English
- **Smart Goal Detection** - Automatically categorizes goals (Revenue, Career, Health, Personal Growth, Relationships)
- **Revenue Math Calculator** - For business goals, calculates exactly how many deals, proposals, and leads you need
- **AI-Powered SMART Goals** - Claude AI generates Specific, Measurable, Achievable, Relevant, and Time-bound components
- **Flexible Creation Modes** - Choose AI-Generated, AI-Assisted, or Manual entry

**How to Access:** Sidebar → Vision Planner (V2 badge)

---

### Projects System (V2)

A comprehensive project management system built around the SMART goal framework.

**Features:**
- **Project Hub** - Central dashboard for each project with stats, progress tracking, and 300% check-ins
- **Key Results** - Track measurable outcomes with progress bars and current/target values
- **Milestones** - Set quarterly milestones with due dates and completion tracking
- **Tasks** - Break down work into prioritized tasks (High/Medium/Low) with time estimates
- **SMART Goal Tab** - View and edit your project's SMART components anytime

**Project Stats at a Glance:**
- Overall progress percentage
- 300% Score (Clarity × Belief × Consistency)
- Key Results, Milestones, and Tasks counts

**How to Access:** Sidebar → Projects (V2 badge)

---

### 300% Daily Check-in

A daily reflection system based on the proven 300% methodology.

**Three Pillars:**
1. **Clarity (0-10)** - How clear are you on what needs to be done?
2. **Belief (0-10)** - How confident are you that you'll achieve this goal?
3. **Consistency (0-10)** - How consistent have you been with your actions?

**Score Calculation:** (Clarity + Belief + Consistency) × 10 = Your 300% Score

Check in daily from:
- Project Hub page
- Today page widget

---

### Rewards System

Motivate yourself with real rewards for achieving your goals.

**Trigger Types:**
- **Milestone** - Unlock when you complete a project milestone
- **Key Result** - Unlock when a Key Result reaches 100%
- **XP Threshold** - Unlock when you earn a certain amount of XP

**Features:**
- Create custom rewards with descriptions and estimated values
- Track progress toward unlocking rewards
- Claim rewards with celebration confetti animation
- View your reward history and total value earned

**How to Access:** Sidebar → Rewards (New badge)

---

### Gamification

Level up and build streaks as you work toward your goals.

**XP System:**
- Earn XP for completing tasks, milestones, and check-ins
- Level up as you accumulate XP
- View your progress in the Momentum widget on Today page

**Streaks:**
- Build daily streaks by completing check-ins
- Streak badges: Starting, Building, On Fire, and more
- Streak recovery option if you miss a day

---

### Today Page Integration

The Today page now features V2 widgets:

- **Quick Actions** - Fast links to Vision Planner, Projects, and Rewards
- **Momentum Widget** - Shows your Level, XP, and streak status
- **300% Check-in Widget** - Quick daily check-in for your focused project
- **Focus Tasks** - Tasks from your focused V2 project

---

## Navigation Updates

New sidebar items with badges:
- **Vision Planner** (V2) - New conversational wizard
- **Projects** (V2) - Project management hub
- **Rewards** (New) - Gamification rewards

Legacy features remain accessible:
- Vision (Legacy) - Original vision system
- Key Results - OKR tracking
- Milestones - Goal milestones

---

## API Endpoints

New V2 endpoints for developers:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/projects-v2` | GET/POST | List/create projects |
| `/api/projects-v2/[id]` | GET/PUT/DELETE | Project CRUD |
| `/api/project-key-results` | POST | Create key results |
| `/api/milestones-v2` | POST | Create milestones |
| `/api/tasks-v2` | POST | Create tasks |
| `/api/daily-checkins` | POST | Submit 300% check-ins |
| `/api/rewards-v2` | GET/POST | List/create rewards |
| `/api/rewards-v2/[id]/claim` | POST | Claim a reward |
| `/api/profile` | GET | User profile with XP/level |
| `/api/streaks-v2` | GET | Streak data |
| `/api/ai/generate-smart` | POST | AI SMART goal generation |

---

## Bug Fixes

- Fixed AI SMART generation API payload field mapping
- Fixed revenue math data typo (revenueMath → revenueData)
- Improved date parsing for time-bound goals

---

## Technical Notes

- Built with Next.js 16.1.1 (App Router)
- AI powered by Claude claude-opus-4-20250514
- Confetti animations via canvas-confetti
- Full TypeScript support
- Supabase database backend

---

## Migration from V1

V1 features (Vision, Key Results, Milestones) remain fully functional. The V2 system is additive - you can use both systems simultaneously or migrate your goals to V2 projects at your own pace.

---

## Feedback

We'd love to hear your thoughts on V2! Use the Feedback button in the bottom-right corner of any page to share your experience.

---

*Goal Achiever Pro - Achieve Your Goals with Clarity*
