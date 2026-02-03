# Vision Planner V2 - Complete Test Protocol

**Date:** 2026-02-02
**Environment:** Production (https://www.goalachieverpro.com)
**Tester:** Claude (via Chrome DevTools MCP)
**Status:** READY FOR EXECUTION

---

## Overview

This protocol tests the Vision Planner wizard end-to-end, including all 8 steps, AI generation, data persistence, and error handling.

---

## Pre-Test Setup

### 1. Environment Verification
- [ ] Navigate to https://www.goalachieverpro.com
- [ ] Verify user is logged in (check for sidebar with user info)
- [ ] Clear any existing test visions if needed
- [ ] Take initial screenshot for baseline

### 2. Browser Setup
```
Use: mcp__chrome-devtools__navigate_page
URL: https://www.goalachieverpro.com/vision
```

---

## Test Section 1: Navigation to Vision Planner

### 1.1 Access Vision Page
| Step | Action | Expected Result | Tool |
|------|--------|-----------------|------|
| 1.1.1 | Navigate to /vision | Page loads with header "Vision" or wizard | `navigate_page` |
| 1.1.2 | Take snapshot | Confirm page structure | `take_snapshot` |
| 1.1.3 | Check for "Create Vision" button OR existing vision cards | UI renders correctly | Verify in snapshot |

### 1.2 Start New Vision Wizard
| Step | Action | Expected Result | Tool |
|------|--------|-----------------|------|
| 1.2.1 | Find and click "Create Vision" or "+" button | Wizard opens on Step 1 | `click` |
| 1.2.2 | Take snapshot | "Create Vision" header visible, Step 1 of 8 | `take_snapshot` |
| 1.2.3 | Verify progress bar shows 12.5% | Progress indicator works | Verify in snapshot |

---

## Test Section 2: Step 1 - Vision Statement

### 2.1 Input Fields
| Step | Action | Expected Result | Tool |
|------|--------|-----------------|------|
| 2.1.1 | Find "Title" input field | Input element present | `take_snapshot` |
| 2.1.2 | Enter title: "Launch Online Course Business" | Text appears in field | `fill` |
| 2.1.3 | Find "Description" textarea | Textarea element present | Verify in snapshot |
| 2.1.4 | Enter description: "Build and launch a comprehensive online course teaching web development fundamentals, generating $100,000 in first year revenue" | Text appears | `fill` |
| 2.1.5 | Find "Target Date" input | Date picker present | Verify in snapshot |
| 2.1.6 | Enter target date: "2027-02-01" | Date set correctly | `fill` |
| 2.1.7 | Find color picker | Color selector visible | Verify in snapshot |
| 2.1.8 | Select a color (optional) | Color updates | `click` on color option |

### 2.2 Navigation
| Step | Action | Expected Result | Tool |
|------|--------|-----------------|------|
| 2.2.1 | Click "Next" button | Advances to Step 2 | `click` |
| 2.2.2 | Take snapshot | Step 2 "SMART Goals" visible | `take_snapshot` |
| 2.2.3 | Verify progress bar shows 25% | Progress updates | Verify in snapshot |

---

## Test Section 3: Step 2 - SMART Goals

### 3.1 Manual Entry Test
| Step | Action | Expected Result | Tool |
|------|--------|-----------------|------|
| 3.1.1 | Find "Specific" textarea | Input present | `take_snapshot` |
| 3.1.2 | Enter Specific: "Create a 40-hour web development course with 200+ video lessons covering HTML, CSS, JavaScript, React, and Node.js" | Text appears | `fill` |
| 3.1.3 | Find "Measurable" textarea | Input present | Verify in snapshot |
| 3.1.4 | Enter Measurable: "Reach 1,000 enrolled students, achieve $100,000 revenue, maintain 4.5+ star rating with 100+ reviews" | Text appears | `fill` |
| 3.1.5 | Find "Attainable" textarea | Input present | Verify in snapshot |
| 3.1.6 | Enter Attainable: "With 10 years of development experience and existing blog audience of 5,000, the course can be marketed to warm audience" | Text appears | `fill` |
| 3.1.7 | Find "Realistic" textarea | Input present | Verify in snapshot |
| 3.1.8 | Enter Realistic: "Industry average conversion rate of 2-3% from email list, budget allows for paid advertising to supplement organic reach" | Text appears | `fill` |
| 3.1.9 | Find "Time-Bound" textarea | Input present | Verify in snapshot |
| 3.1.10 | Enter Time-Bound: "Course content complete by June 2026, launch by August 2026, hit revenue target by February 2027" | Text appears | `fill` |

### 3.2 AI Generation Test (Optional)
| Step | Action | Expected Result | Tool |
|------|--------|-----------------|------|
| 3.2.1 | Look for "Generate with AI" or sparkle icon | AI button present | `take_snapshot` |
| 3.2.2 | Click AI generate button (if present) | Loading state, then fields populated | `click` |
| 3.2.3 | Wait for AI response (up to 10 seconds) | Fields populated with AI content | `wait_for` or check snapshot |

### 3.3 Navigation
| Step | Action | Expected Result | Tool |
|------|--------|-----------------|------|
| 3.3.1 | Click "Next" button | Advances to Step 3 | `click` |
| 3.3.2 | Take snapshot | Step 3 "Strategy" visible | `take_snapshot` |

---

## Test Section 4: Step 3 - Strategic Discovery

### 4.1 Revenue Calculator
| Step | Action | Expected Result | Tool |
|------|--------|-----------------|------|
| 4.1.1 | Take snapshot | Revenue calculator visible | `take_snapshot` |
| 4.1.2 | Find "Revenue Target" or similar input | Input present | Verify in snapshot |
| 4.1.3 | Enter revenue target: "100000" | Value set | `fill` |
| 4.1.4 | Find "Deal Size" or "Price" input | Input present | Verify in snapshot |
| 4.1.5 | Enter deal size: "297" | Value set | `fill` |
| 4.1.6 | Check for calculated fields (deals needed, etc.) | Math calculates correctly | `take_snapshot` |

### 4.2 Positioning Section (if present)
| Step | Action | Expected Result | Tool |
|------|--------|-----------------|------|
| 4.2.1 | Look for positioning/differentiation section | Section visible or collapsed | `take_snapshot` |
| 4.2.2 | Expand if collapsed | Section expands | `click` |
| 4.2.3 | Fill any required fields | Values saved | `fill` |

### 4.3 Acquisition Section (if present)
| Step | Action | Expected Result | Tool |
|------|--------|-----------------|------|
| 4.3.1 | Look for customer acquisition section | Section visible or collapsed | `take_snapshot` |
| 4.3.2 | Fill any fields (channels, conversion rates, etc.) | Values saved | `fill` |

### 4.4 Navigation
| Step | Action | Expected Result | Tool |
|------|--------|-----------------|------|
| 4.4.1 | Click "Next" button | Advances to Step 4 | `click` |
| 4.4.2 | Take snapshot | Step 4 "Roadmap" visible | `take_snapshot` |

---

## Test Section 5: Step 4 - Monthly Projects (Roadmap)

### 5.1 AI Generation
| Step | Action | Expected Result | Tool |
|------|--------|-----------------|------|
| 5.1.1 | Take snapshot | Monthly projects view visible | `take_snapshot` |
| 5.1.2 | Look for "Generate Roadmap" or AI button | Button present | Verify in snapshot |
| 5.1.3 | Click generate button | Loading state appears | `click` |
| 5.1.4 | Wait for generation (up to 30 seconds) | Monthly projects appear | `wait_for` "Month" or check snapshots |
| 5.1.5 | Take snapshot | Projects displayed with months | `take_snapshot` |

### 5.2 Project Verification
| Step | Action | Expected Result | Tool |
|------|--------|-----------------|------|
| 5.2.1 | Count monthly project cards | Multiple months shown (3-12) | Verify in snapshot |
| 5.2.2 | Verify each has: title, description, milestone | All fields populated | Verify in snapshot |
| 5.2.3 | Check for summary/critical path section | Overview present | Verify in snapshot |

### 5.3 Navigation
| Step | Action | Expected Result | Tool |
|------|--------|-----------------|------|
| 5.3.1 | Click "Next" button | Advances to Step 5 | `click` |
| 5.3.2 | Take snapshot | Step 5 "Reminders" visible | `take_snapshot` |

---

## Test Section 6: Step 5 - Reminders

### 6.1 Reminder Configuration
| Step | Action | Expected Result | Tool |
|------|--------|-----------------|------|
| 6.1.1 | Take snapshot | Reminder settings visible | `take_snapshot` |
| 6.1.2 | Find "Show on Login" toggle | Toggle present, default ON | Verify in snapshot |
| 6.1.3 | Find "Morning Reminder" toggle | Toggle present | Verify in snapshot |
| 6.1.4 | Enable morning reminder if not enabled | Toggle switches ON | `click` |
| 6.1.5 | Find morning time input | Time picker present | Verify in snapshot |
| 6.1.6 | Set morning time: "07:00" | Time updates | `fill` |
| 6.1.7 | Find "Midday Reminder" toggle | Toggle present | Verify in snapshot |
| 6.1.8 | Enable midday reminder | Toggle switches ON | `click` |
| 6.1.9 | Set midday time: "12:00" | Time updates | `fill` |
| 6.1.10 | Find "Evening Reminder" toggle | Toggle present | Verify in snapshot |
| 6.1.11 | Enable evening reminder | Toggle switches ON | `click` |
| 6.1.12 | Set evening time: "20:00" | Time updates | `fill` |

### 6.2 Navigation
| Step | Action | Expected Result | Tool |
|------|--------|-----------------|------|
| 6.2.1 | Click "Next" button | Advances to Step 6 | `click` |
| 6.2.2 | Take snapshot | Step 6 "Vision Board" visible | `take_snapshot` |

---

## Test Section 7: Step 6 - Vision Board

### 7.1 Image Upload Area
| Step | Action | Expected Result | Tool |
|------|--------|-----------------|------|
| 7.1.1 | Take snapshot | Upload area visible | `take_snapshot` |
| 7.1.2 | Verify upload dropzone or button present | "Upload" or "Add Image" visible | Verify in snapshot |
| 7.1.3 | (Optional) Upload test image | Image appears in preview | `upload_file` |
| 7.1.4 | (If uploaded) Add caption | Caption saved | `fill` |

### 7.2 Skip Option (if no images needed for test)
| Step | Action | Expected Result | Tool |
|------|--------|-----------------|------|
| 7.2.1 | Vision board is optional | Can proceed without images | Verify Next button enabled |

### 7.3 Navigation
| Step | Action | Expected Result | Tool |
|------|--------|-----------------|------|
| 7.3.1 | Click "Next" button | Advances to Step 7 | `click` |
| 7.3.2 | Take snapshot | Step 7 "Affirmations" visible | `take_snapshot` |

---

## Test Section 8: Step 7 - Affirmations

### 8.1 Affirmation Entry
| Step | Action | Expected Result | Tool |
|------|--------|-----------------|------|
| 8.1.1 | Take snapshot | Affirmation textarea visible | `take_snapshot` |
| 8.1.2 | Find affirmation text input | Textarea present | Verify in snapshot |
| 8.1.3 | Enter affirmation: "I am a successful course creator. My knowledge transforms lives and creates abundance. I confidently share my expertise with the world." | Text appears | `fill` |

### 8.2 Navigation
| Step | Action | Expected Result | Tool |
|------|--------|-----------------|------|
| 8.2.1 | Click "Next" button | Advances to Step 8 | `click` |
| 8.2.2 | Take snapshot | Step 8 "Review" visible | `take_snapshot` |

---

## Test Section 9: Step 8 - Review & Save

### 9.1 Review Content Verification
| Step | Action | Expected Result | Tool |
|------|--------|-----------------|------|
| 9.1.1 | Take full snapshot | All sections visible | `take_snapshot` |
| 9.1.2 | Verify Vision title displayed | "Launch Online Course Business" visible | Verify in snapshot |
| 9.1.3 | Verify SMART goals summarized | S, M, A, R, T sections shown | Verify in snapshot |
| 9.1.4 | Verify monthly projects count | X projects shown | Verify in snapshot |
| 9.1.5 | Verify reminders configured | 3 reminders active | Verify in snapshot |
| 9.1.6 | Verify affirmation text | Affirmation displayed | Verify in snapshot |

### 9.2 Save Vision
| Step | Action | Expected Result | Tool |
|------|--------|-----------------|------|
| 9.2.1 | Find "Save Vision" button | Button present and enabled | Verify in snapshot |
| 9.2.2 | Click "Save Vision" | Loading state appears | `click` |
| 9.2.3 | Wait for save (up to 10 seconds) | Success toast or redirect | `wait_for` "created" or "success" |
| 9.2.4 | Take snapshot | Confirmation or vision list | `take_snapshot` |

---

## Test Section 10: Post-Save Verification

### 10.1 Vision Created Successfully
| Step | Action | Expected Result | Tool |
|------|--------|-----------------|------|
| 10.1.1 | Navigate to /vision if not already | Vision list page loads | `navigate_page` |
| 10.1.2 | Take snapshot | New vision card visible | `take_snapshot` |
| 10.1.3 | Find "Launch Online Course Business" card | Card present | Verify in snapshot |
| 10.1.4 | Verify color/styling matches selection | Visual consistency | Verify in snapshot |

### 10.2 Vision Detail Page
| Step | Action | Expected Result | Tool |
|------|--------|-----------------|------|
| 10.2.1 | Click on vision card | Detail page opens | `click` |
| 10.2.2 | Take snapshot | Full vision details shown | `take_snapshot` |
| 10.2.3 | Verify SMART goals displayed | All 5 components visible | Verify in snapshot |
| 10.2.4 | Verify 300% tracker present | Clarity/Belief/Consistency sliders | Verify in snapshot |

---

## Test Section 11: Edit Vision Flow

### 11.1 Enter Edit Mode
| Step | Action | Expected Result | Tool |
|------|--------|-----------------|------|
| 11.1.1 | Navigate to /vision | Vision list loads | `navigate_page` |
| 11.1.2 | Click "Edit" on test vision | Wizard opens in edit mode | `click` |
| 11.1.3 | Take snapshot | "Edit Vision" header, data pre-filled | `take_snapshot` |
| 11.1.4 | Verify title pre-populated | "Launch Online Course Business" shown | Verify in snapshot |

### 11.2 Modify and Save
| Step | Action | Expected Result | Tool |
|------|--------|-----------------|------|
| 11.2.1 | Modify title: "Launch Online Course Empire" | Title updates | `fill` |
| 11.2.2 | Navigate to Review step | Click through or use step indicators | `click` multiple |
| 11.2.3 | Click "Save Vision" | Updates saved | `click` |
| 11.2.4 | Verify toast "Vision updated!" | Success message | `wait_for` or snapshot |

---

## Test Section 12: Delete Vision Flow

### 12.1 Delete Vision (OPTIONAL - run only if cleaning up)
| Step | Action | Expected Result | Tool |
|------|--------|-----------------|------|
| 12.1.1 | Enter edit mode for test vision | Wizard opens | `click` |
| 12.1.2 | Find trash/delete icon (top right) | Delete button present | `take_snapshot` |
| 12.1.3 | Click delete icon | Confirmation dialog appears | `click` |
| 12.1.4 | Take snapshot | "Delete Vision?" dialog visible | `take_snapshot` |
| 12.1.5 | Click "Delete Vision" in dialog | Vision deleted | `click` |
| 12.1.6 | Verify redirect to vision list | List shows, vision removed | `take_snapshot` |

---

## Test Section 13: API Health Check

### 13.1 Network Requests
| Step | Action | Expected Result | Tool |
|------|--------|-----------------|------|
| 13.1.1 | During create flow, check network | /api/visions POST returns 200/201 | `list_network_requests` |
| 13.1.2 | Check for AI endpoints | /api/ai/* endpoints return 200 | `list_network_requests` |
| 13.1.3 | Check for failed requests | No 4xx/5xx errors | `list_network_requests` |

### 13.2 Console Errors
| Step | Action | Expected Result | Tool |
|------|--------|-----------------|------|
| 13.2.1 | Check console for errors | No critical errors | `list_console_messages` |
| 13.2.2 | Note any warnings (acceptable) | Document for reference | Record in results |

---

## Test Section 14: Edge Cases

### 14.1 Validation - Empty Required Fields
| Step | Action | Expected Result | Tool |
|------|--------|-----------------|------|
| 14.1.1 | Start new vision | Wizard opens | `click` |
| 14.1.2 | Leave title empty, click Next | Validation error OR can proceed | `click`, `take_snapshot` |
| 14.1.3 | Document behavior | Record actual behavior | Note in results |

### 14.2 Validation - Invalid Date
| Step | Action | Expected Result | Tool |
|------|--------|-----------------|------|
| 14.2.1 | Enter past date for target | Error or accepted | `fill`, check response |
| 14.2.2 | Document behavior | Record actual behavior | Note in results |

### 14.3 Cancel Flow
| Step | Action | Expected Result | Tool |
|------|--------|-----------------|------|
| 14.3.1 | Start new vision, enter some data | Data in form | `fill` |
| 14.3.2 | Click X (close) button | Wizard closes | `click` |
| 14.3.3 | Verify no vision created | Vision list unchanged | `take_snapshot` |

### 14.4 Back Navigation
| Step | Action | Expected Result | Tool |
|------|--------|-----------------|------|
| 14.4.1 | Progress to Step 4 | On Roadmap step | `click` through steps |
| 14.4.2 | Click "Previous" button | Returns to Step 3 | `click` |
| 14.4.3 | Verify data preserved | Strategy data still there | `take_snapshot` |

### 14.5 Step Indicator Navigation
| Step | Action | Expected Result | Tool |
|------|--------|-----------------|------|
| 14.5.1 | Click on step 7 indicator | Jumps to Affirmations | `click` on step 7 circle |
| 14.5.2 | Verify jump worked | Step 7 content visible | `take_snapshot` |
| 14.5.3 | Click on step 2 indicator | Jumps back to SMART Goals | `click` on step 2 circle |
| 14.5.4 | Verify all data preserved | All fields still filled | `take_snapshot` |

---

## Test Section 15: Mobile Responsiveness (Optional)

### 15.1 Mobile Viewport
| Step | Action | Expected Result | Tool |
|------|--------|-----------------|------|
| 15.1.1 | Resize to mobile: 375x812 | Viewport changes | `resize_page` |
| 15.1.2 | Take snapshot | Mobile layout visible | `take_snapshot` |
| 15.1.3 | Verify wizard steps readable | Steps may show icons only | Verify in snapshot |
| 15.1.4 | Verify forms usable | Inputs accessible | Verify in snapshot |

### 15.2 Reset to Desktop
| Step | Action | Expected Result | Tool |
|------|--------|-----------------|------|
| 15.2.1 | Resize to desktop: 1920x1080 | Viewport restores | `resize_page` |

---

## Results Summary Template

| Section | Tests | Passed | Failed | Notes |
|---------|-------|--------|--------|-------|
| 1. Navigation | 3 | | | |
| 2. Step 1 Vision | 9 | | | |
| 3. Step 2 SMART | 13 | | | |
| 4. Step 3 Strategy | 10 | | | |
| 5. Step 4 Roadmap | 7 | | | |
| 6. Step 5 Reminders | 14 | | | |
| 7. Step 6 Vision Board | 5 | | | |
| 8. Step 7 Affirmations | 5 | | | |
| 9. Step 8 Review | 8 | | | |
| 10. Post-Save | 6 | | | |
| 11. Edit Flow | 6 | | | |
| 12. Delete Flow | 6 | | | |
| 13. API Health | 4 | | | |
| 14. Edge Cases | 12 | | | |
| 15. Mobile (Optional) | 4 | | | |
| **TOTAL** | **~112** | | | |

---

## Issues Found

| # | Section | Test | Issue | Severity | Screenshot |
|---|---------|------|-------|----------|------------|
| 1 | | | | | |
| 2 | | | | | |

---

## Execution Commands Reference

### Quick Start
```javascript
// Navigate to Vision page
mcp__chrome-devtools__navigate_page({ url: "https://www.goalachieverpro.com/vision" })

// Take snapshot
mcp__chrome-devtools__take_snapshot({})

// Click element
mcp__chrome-devtools__click({ uid: "element_uid" })

// Fill input
mcp__chrome-devtools__fill({ uid: "element_uid", value: "text value" })

// Wait for text
mcp__chrome-devtools__wait_for({ text: "Success", timeout: 10000 })

// Check network
mcp__chrome-devtools__list_network_requests({})

// Check console
mcp__chrome-devtools__list_console_messages({})
```

---

## Test Data Reference

### Vision 1: Online Course Business
```json
{
  "title": "Launch Online Course Business",
  "description": "Build and launch a comprehensive online course teaching web development fundamentals, generating $100,000 in first year revenue",
  "targetDate": "2027-02-01",
  "specific": "Create a 40-hour web development course with 200+ video lessons covering HTML, CSS, JavaScript, React, and Node.js",
  "measurable": "Reach 1,000 enrolled students, achieve $100,000 revenue, maintain 4.5+ star rating with 100+ reviews",
  "attainable": "With 10 years of development experience and existing blog audience of 5,000, the course can be marketed to warm audience",
  "realistic": "Industry average conversion rate of 2-3% from email list, budget allows for paid advertising to supplement organic reach",
  "timeBound": "Course content complete by June 2026, launch by August 2026, hit revenue target by February 2027",
  "affirmation": "I am a successful course creator. My knowledge transforms lives and creates abundance. I confidently share my expertise with the world."
}
```

### Vision 2: Fitness Goal (Alternative Test)
```json
{
  "title": "Complete First Marathon",
  "description": "Train for and complete my first full marathon under 4 hours",
  "targetDate": "2026-10-15",
  "specific": "Run the Chicago Marathon 2026, finishing in under 4 hours with proper nutrition and pacing strategy",
  "measurable": "Complete 26.2 miles, finish time under 4:00:00, maintain 9:09/mile pace or better",
  "attainable": "Currently running 10K regularly at 8:30/mile pace, have 8 months to train progressively",
  "realistic": "Following Hal Higdon Intermediate 1 training plan, have access to running group and nutritionist",
  "timeBound": "Begin training March 2026, complete marathon October 2026",
  "affirmation": "I am a strong, capable runner. Every step brings me closer to my goal. I embrace the challenge and grow stronger each day."
}
```

---

## Sign-Off

**Tester:** _________________________
**Date:** _________________________
**Overall Result:** PASS / FAIL
**Notes:** _________________________
