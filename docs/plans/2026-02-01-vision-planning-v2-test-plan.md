# Vision & Goal Planning V2 - Test Plan

**Date:** 2026-02-01
**Feature:** Vision & Goal Planning System Redesign
**Tester:** _________________

---

## Overview

This test plan covers the new V2 goal planning system including:
- Vision Planner (conversational wizard)
- Projects with Key Results, Milestones, Tasks
- 300% Daily Check-in
- Rewards System
- Gamification (XP, Levels, Streaks)

---

## Pre-Test Setup

- [ ] Dev server running (`npm run dev`)
- [ ] Logged in as test user
- [ ] Browser DevTools open (Console tab for errors)

---

## Test Cases

### 1. Vision Planner Flow

**Path:** `/vision-planner`

| # | Test | Steps | Expected Result | Pass/Fail |
|---|------|-------|-----------------|-----------|
| 1.1 | Page loads | Navigate to `/vision-planner` | Page displays with "What do you want to achieve?" prompt | |
| 1.2 | Goal type detection - Revenue | Enter "I want to make $100k per year" | Detects as revenue goal, shows revenue math calculator | |
| 1.3 | Goal type detection - Non-revenue | Enter "I want to run a marathon" | Detects as non-revenue goal, skips revenue math | |
| 1.4 | Revenue math calculator | Enter revenue goal, fill in price/units | Shows calculated breakdown (monthly, weekly targets) | |
| 1.5 | AI generation option | Select "Use AI to help" | AI generates SMART goal components | |
| 1.6 | Manual entry option | Select "I'll do it myself" | Shows manual SMART input fields | |
| 1.7 | Project creation | Complete wizard and submit | Project created, redirects to project hub | |

---

### 2. Projects List

**Path:** `/projects`

| # | Test | Steps | Expected Result | Pass/Fail |
|---|------|-------|-----------------|-----------|
| 2.1 | Page loads | Navigate to `/projects` | Shows project grid with any existing projects | |
| 2.2 | Empty state | (If no projects) View empty state | Shows "No projects yet" with CTA to Vision Planner | |
| 2.3 | Project cards | View project cards | Each card shows: title, color, progress %, 300% score | |
| 2.4 | Focus project | Click star icon on a project | Project marked as focused, highlighted | |
| 2.5 | Navigate to project | Click on project card | Navigates to `/projects/[id]` | |
| 2.6 | Create new project | Click "New Project" button | Opens creation dialog or navigates to Vision Planner | |

---

### 3. Project Hub (Detail Page)

**Path:** `/projects/[id]`

| # | Test | Steps | Expected Result | Pass/Fail |
|---|------|-------|-----------------|-----------|
| 3.1 | Page loads | Navigate to project detail | Shows project with stats, tabs, check-in card | |
| 3.2 | Stats display | View stats row | Shows: Progress %, 300% Score, Key Results count, Milestones count, Tasks count | |
| 3.3 | Edit project | Click "Edit" button | Form fields become editable | |
| 3.4 | Save project | Edit title/description, click Save | Changes persist, returns to view mode | |
| 3.5 | 300% Check-in | Adjust sliders for Clarity/Belief/Consistency | Score updates in real-time (sum × 10) | |
| 3.6 | Submit check-in | Click "Submit Check-in" | Check-in saved, shows "Already checked in today" | |

**Key Results Tab:**

| # | Test | Steps | Expected Result | Pass/Fail |
|---|------|-------|-----------------|-----------|
| 3.7 | View Key Results | Click "Key Results" tab | Shows list of KRs with progress bars | |
| 3.8 | Add Key Result | Click "Add Key Result", fill form | New KR appears in list | |
| 3.9 | Update KR value | Change current value input, blur | Value updates, progress recalculates | |

**Milestones Tab:**

| # | Test | Steps | Expected Result | Pass/Fail |
|---|------|-------|-----------------|-----------|
| 3.10 | View Milestones | Click "Milestones" tab | Shows list of milestones | |
| 3.11 | Add Milestone | Click "Add Milestone", fill form | New milestone appears with quarter badge | |

**Tasks Tab:**

| # | Test | Steps | Expected Result | Pass/Fail |
|---|------|-------|-----------------|-----------|
| 3.12 | View Tasks | Click "Tasks" tab | Shows task list with priorities | |
| 3.13 | Add Task | Click "Add Task", fill form | New task appears in list | |
| 3.14 | Task priority | Create tasks with different priorities | Priority badges show correct colors | |

**SMART Goal Tab:**

| # | Test | Steps | Expected Result | Pass/Fail |
|---|------|-------|-----------------|-----------|
| 3.15 | View SMART | Click "SMART Goal" tab | Shows S-M-A-R-T breakdown | |
| 3.16 | Edit SMART | In edit mode, modify SMART fields | Fields editable, save persists changes | |

---

### 4. Rewards System

**Path:** `/rewards`

| # | Test | Steps | Expected Result | Pass/Fail |
|---|------|-------|-----------------|-----------|
| 4.1 | Page loads | Navigate to `/rewards` | Shows rewards page with stats and tabs | |
| 4.2 | Stats display | View stats cards | Shows: Total Rewards, Ready to Claim, Claimed, Total Value | |
| 4.3 | Empty state | (If no rewards) View tabs | Shows appropriate empty messages | |
| 4.4 | Open create dialog | Click "Add Reward" | Dialog opens with form | |
| 4.5 | Trigger type - Milestone | Select "Milestone" trigger | Shows milestone dropdown | |
| 4.6 | Trigger type - Key Result | Select "Key Result" trigger | Shows key result dropdown | |
| 4.7 | Trigger type - XP | Select "XP Threshold" trigger | Shows XP input field | |
| 4.8 | Create reward | Fill form, click "Create Reward" | Reward appears in "In Progress" tab | |
| 4.9 | Reward progress | View locked reward | Shows progress bar toward unlock | |
| 4.10 | Claim reward | (If unlocked) Click "Claim Reward!" | Confetti animation, reward moves to "Claimed" tab | |

---

### 5. Today Page Integration

**Path:** `/today`

| # | Test | Steps | Expected Result | Pass/Fail |
|---|------|-------|-----------------|-----------|
| 5.1 | Focus Tasks widget | View "Focus Tasks" section | Shows tasks from focused V2 project | |
| 5.2 | Project selector | Change project in Focus Tasks dropdown | Tasks update to show selected project's tasks | |
| 5.3 | Momentum widget | View "Momentum" card | Shows Level, XP, XP to next level, streak info | |
| 5.4 | 300% Check-in widget | View "300% Check-in" card | Shows sliders for focused project | |
| 5.5 | Submit check-in | Fill sliders, click "Save Check-in" | Check-in saved, widget updates | |
| 5.6 | Quick Actions | View Quick Actions card | Shows links to: Vision Planner, Projects, Rewards | |
| 5.7 | Quick Action - Vision Planner | Click "Vision Planner" | Navigates to `/vision-planner` | |
| 5.8 | Quick Action - Projects | Click "View Projects" | Navigates to `/projects` | |
| 5.9 | Quick Action - Rewards | Click "View Rewards" | Navigates to `/rewards` | |

---

### 6. Gamification

| # | Test | Steps | Expected Result | Pass/Fail |
|---|------|-------|-----------------|-----------|
| 6.1 | XP display | View Momentum widget | Shows current XP and level | |
| 6.2 | Level progress | View progress bar | Shows progress toward next level | |
| 6.3 | Streak display | View streak section | Shows current streak with badge (Starting/Building/On Fire/etc.) | |
| 6.4 | Streak recovery | (If streak broken) Click "Recover" | Streak recovers, toast confirms | |
| 6.5 | Legacy widget | View "Progress" card | Shows legacy gamification stats | |

---

### 7. Navigation

| # | Test | Steps | Expected Result | Pass/Fail |
|---|------|-------|-----------------|-----------|
| 7.1 | Sidebar - Vision Planner | Click "Vision Planner" in sidebar | Navigates to `/vision-planner`, shows V2 badge | |
| 7.2 | Sidebar - Projects | Click "Projects" in sidebar | Navigates to `/projects`, shows V2 badge | |
| 7.3 | Sidebar - Rewards | Click "Rewards" in sidebar | Navigates to `/rewards`, shows New badge | |
| 7.4 | Sidebar - Legacy Vision | Click "Vision (Legacy)" | Navigates to `/vision` | |

---

### 8. API Health Checks

| # | Test | Steps | Expected Result | Pass/Fail |
|---|------|-------|-----------------|-----------|
| 8.1 | Projects API | `GET /api/projects-v2` | Returns 200 with projects array | |
| 8.2 | Project detail API | `GET /api/projects-v2/[id]` | Returns 200 with project + relations | |
| 8.3 | Key Results API | `POST /api/project-key-results` | Creates KR, returns 201 | |
| 8.4 | Milestones API | `POST /api/milestones-v2` | Creates milestone, returns 201 | |
| 8.5 | Tasks API | `POST /api/tasks-v2` | Creates task, returns 201 | |
| 8.6 | Check-ins API | `POST /api/daily-checkins` | Creates check-in, returns 201 | |
| 8.7 | Rewards API | `GET /api/rewards-v2` | Returns 200 with rewards array | |
| 8.8 | Rewards claim API | `POST /api/rewards-v2/[id]/claim` | Claims reward, returns 200 | |
| 8.9 | Streaks API | `GET /api/streaks-v2` | Returns 200 with streaks array | |
| 8.10 | Profile API | `GET /api/profile` | Returns 200 with XP/level data | |

---

### 9. Error Handling

| # | Test | Steps | Expected Result | Pass/Fail |
|---|------|-------|-----------------|-----------|
| 9.1 | Invalid project ID | Navigate to `/projects/invalid-uuid` | Shows "Project not found" with back button | |
| 9.2 | Empty reward name | Try to create reward without name | Shows validation error | |
| 9.3 | Missing trigger | Try to create reward without selecting trigger | Shows validation error | |
| 9.4 | Already claimed | Try to claim already-claimed reward | Shows error message | |

---

### 10. Browser Console

| # | Test | Steps | Expected Result | Pass/Fail |
|---|------|-------|-----------------|-----------|
| 10.1 | No console errors | Navigate through all V2 pages | No JavaScript errors in console | |
| 10.2 | No 404s | Check Network tab | All API calls return 200/201 | |

---

## Test Summary

| Section | Total Tests | Passed | Failed |
|---------|-------------|--------|--------|
| 1. Vision Planner | 7 | | |
| 2. Projects List | 6 | | |
| 3. Project Hub | 16 | | |
| 4. Rewards System | 10 | | |
| 5. Today Page | 9 | | |
| 6. Gamification | 5 | | |
| 7. Navigation | 4 | | |
| 8. API Health | 10 | | |
| 9. Error Handling | 4 | | |
| 10. Browser Console | 2 | | |
| **TOTAL** | **73** | | |

---

## Issues Found

| # | Description | Severity | Steps to Reproduce |
|---|-------------|----------|-------------------|
| | | | |
| | | | |
| | | | |

---

## Notes

_Additional observations during testing:_

