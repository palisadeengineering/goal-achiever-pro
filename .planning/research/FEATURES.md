# Feature Landscape: KPI/Goal Cascading Systems

**Domain:** OKR/KPI goal-setting and performance management
**Researched:** 2026-01-23
**Confidence:** MEDIUM (based on WebSearch verification with multiple sources)

## Executive Summary

Research across Lattice, 15Five, Weekdone, Perdoo, and Quantive reveals a mature OKR/goal cascading market with well-established table stakes. The key insight is that **alignment beats cascading** - modern products emphasize bidirectional goal linking rather than rigid top-down hierarchies. For Goal Achiever Pro's time optimization methodology integration, the differentiation opportunity lies in combining the 300% Rule (Clarity + Belief + Consistency) with standard progress roll-up mechanics.

---

## Table Stakes

Features users expect. Missing these = product feels incomplete or unprofessional.

| Feature | Why Expected | Complexity | Dependencies | Notes |
|---------|--------------|------------|--------------|-------|
| **Parent-Child Goal Linking** | Core OKR concept - every product has this | Medium | Goal schema | Already exists in schema via `parentKpiId`, `visionId` references |
| **Automatic Progress Roll-up** | Users expect child progress to bubble up | Medium | Parent-child linking | Must handle weighted vs. unweighted calculations |
| **Visual Goal Hierarchy (Tree View)** | Users need to see relationships at a glance | Medium | Parent-child linking | Critical for understanding - Lattice, Perdoo, Weekdone all feature prominently |
| **Progress Tracking Dashboard** | Real-time visibility into goal status | Low-Medium | Goals + progress data | Visual indicators: % complete, status badges, trend arrows |
| **Goal Status Indicators** | On-track/At-risk/Behind status | Low | Progress data | Color-coded (green/yellow/red) universally expected |
| **Time Period Scoping** | Filter by quarter/month/week | Low | Date fields on goals | Users expect quarterly OKR cycles as default |
| **Manual Progress Override** | Owner can override calculated progress | Low | Progress fields | Critical for context owners know that algorithms don't |
| **Basic Check-ins** | Weekly/monthly progress update mechanism | Low-Medium | Goals + date | 15-30 minute cadence is standard; can be simple form |
| **Multi-Level Hierarchy** | Company > Department > Team > Individual | Medium | Goal schema | Perdoo: "no restriction in number of levels" |
| **Goal Owner Assignment** | Clear accountability | Low | User reference | Already in schema via `assigneeId` |

### Sources for Table Stakes
- [Lattice Cascading Goals](https://help.lattice.com/hc/en-us/articles/1500001356821-Cascading-Goals)
- [15Five Parent-Child Alignment](https://success.15five.com/hc/en-us/articles/360002690152-Align-an-objective-with-a-parent-objective)
- [Perdoo Alignment Options](https://support.perdoo.com/en/articles/5391069-aligning-okrs)
- [Weekdone OKR Hierarchy](https://weekdone.com/product)

---

## Differentiators

Features that set products apart. Not expected, but valued when present.

| Feature | Value Proposition | Complexity | Dependencies | Notes |
|---------|-------------------|------------|--------------|-------|
| **300% Rule Tracking (Clarity/Belief/Consistency)** | Unique to time optimization methodology - no competitor has this | Medium | Vision + daily reviews | **GAP Opportunity**: No OKR tool tracks belief/conviction alongside progress |
| **Confidence Scoring** | Predictive indicator separate from progress | Low | Goals + weekly check-in | Perdoo, Viva Goals feature this; 0-10 scale asking "how confident are you?" |
| **Weighted Progress Calculation** | Higher-weight items contribute more to roll-up | Medium | Progress calculation | 15Five: "assign weight to each key result and child objective" |
| **AI-Generated Goals/KPIs** | Reduce friction in goal creation | High | AI integration | Already in GAP; Lattice has "AI recommends goal alignments" |
| **Goal Alignment Suggestions** | AI flags conflicts, recommends connections | High | Goals + AI | Lattice: "AI flags potential conflicts" - emerging differentiator |
| **Streak Tracking for Habits** | Gamification for daily/weekly activities | Medium | Completion logs + dates | Already in GAP schema (`kpiStreaks`); Duolingo-style motivation |
| **Strategy Map Visualization** | Shows how initiatives connect to strategic pillars | High | Full hierarchy + UI | Perdoo specialty: "Strategy Map communicates strategy understood by people" |
| **Non-Negotiables/Habits Integration** | Daily behaviors tied to goals | Medium | Routine system | Already in GAP; unique integration opportunity |
| **Buyback Rate Calculation** | Time value of delegation decisions | Medium | Time audit data | time optimization-specific; no competitor has this |
| **Pulse Surveys + OKRs Combined** | Engagement meets performance | High | Survey system | 15Five, Lattice combine these; not in GAP scope |
| **Bi-directional Calendar Sync** | Goals appear on calendar, calendar affects goals | High | Calendar API | Already in GAP; two-way sync is premium feature |
| **OKR Retrospectives** | End-of-quarter learnings capture | Low-Medium | Review system | Often overlooked but high value |

### Sources for Differentiators
- [Perdoo Strategy Map](https://support.perdoo.com/en/articles/3112288-map)
- [15Five Weighted Objectives](https://success.15five.com/hc/en-us/articles/17103846921243-Objectives-Feature-Overview)
- [OKR Confidence Scoring](https://okrquickstart.com/okrtemplates/okr-confidence-scoring)
- [Lattice AI-Powered Insights](https://lattice.com/platform/goals/okrs)

---

## Anti-Features

Features to deliberately NOT build. Common mistakes or traps in this domain.

| Anti-Feature | Why Avoid | What to Do Instead | Source |
|--------------|-----------|-------------------|--------|
| **Mandatory Cascading (Top-Down Only)** | "When something is cascaded from management, there's high chance it's a KPI target, not an actual OKR" - Weekdone | Allow bidirectional alignment; bottom-up goal creation | [Weekdone on Alignment](https://weekdone.com/resources/articles/goal-alignment) |
| **OKRs Tied to Compensation** | "Teams almost always sandbag their OKRs" when pay is tied to them | Keep OKRs separate from performance reviews; expect 70-80% achievement | [OKR Anti-patterns](https://jeffgothelf.com/blog/sandbagging-okr-antipattern/) |
| **Too Many OKRs** | Overwhelms users, defeats focus purpose | Enforce 3-5 objectives max per quarter; 2-3 key results each | [Perdoo OKR Mistakes](https://www.perdoo.com/resources/blog/common-okr-mistakes-and-how-to-overcome-them) |
| **Output-Based Key Results** | "Build feature X" is not a result - it's an output | Prompt users toward outcomes: "Increase Y by Z%" | [Atlassian OKR Mistakes](https://www.atlassian.com/blog/teamwork/how-to-avoid-common-okrs-mistakes) |
| **Complex Permission Hierarchies** | Over-engineering sharing kills adoption | Start with simple owner/viewer; add granularity only when needed | Enterprise feedback patterns |
| **Real-time Progress Updates** | Creates pressure, discourages honesty | Weekly cadence is sufficient for quarterly OKRs | [What Matters - Why Not Weekly Grading](https://www.whatmatters.com/faqs/weekly-okr-grading-check-in) |
| **Notification Overload** | Too many reminders leads to dismissal | Thoughtful weekly nudges, not daily spam | User retention research |
| **Confusing OKRs with KPIs** | Different purposes, different management | Keep KPIs (health metrics) separate from OKRs (change metrics) | [OKR vs KPI Confusion](https://www.perdoo.com/resources/blog/okr-confidence-levels) |
| **Reverse-Engineering OKRs to Backlog** | Teams fit goals to existing work instead of changing direction | New OKRs should drive new initiatives | [Jeff Gothelf Anti-pattern](https://jeffgothelf.com/blog/okr-anti-pattern-reverse-engineering-key-results-to-match-your-backlog/) |

---

## Feature Dependencies

```
Vision (SMART Goals)
    |
    +-- 300% Rule Tracking (Clarity/Belief/Consistency)
    |       |
    |       +-- Daily Check-ins (feeds consistency score)
    |       +-- Confidence Scoring (feeds belief score)
    |
    +-- Vision KPIs (AI-generated)
            |
            +-- Quarterly KPIs
            |       |
            |       +-- Monthly KPIs
            |               |
            |               +-- Weekly KPIs
            |                       |
            |                       +-- Daily Habits
            |
            +-- Progress Roll-up (bubbles up from daily to vision)
            |
            +-- Streak Tracking (applies to daily/weekly)
            |
            +-- Tree View Visualization (requires full hierarchy)
```

### Critical Path for Implementation

1. **Parent-Child Linking** (schema already exists via `parentKpiId`)
2. **Progress Roll-up Calculation** (requires linking to work)
3. **Tree View UI** (requires roll-up to display meaningful data)
4. **Weekly Check-ins** (requires basic goal CRUD)
5. **Confidence Scoring** (layer on top of check-ins)
6. **300% Rule Integration** (connect to daily reviews)
7. **Weighted Progress** (advanced roll-up)
8. **AI Alignment Suggestions** (requires pattern data)

---

## UX Patterns from Research

### Creating a Goal That Cascades Down

**Best Practice (from Lattice, 15Five, Perdoo):**
1. User creates goal with standard fields (title, description, target, owner, due date)
2. "Align to parent" optional dropdown shows eligible parent goals
3. Progress impact toggle: "This goal impacts parent's progress"
4. Weight assignment (optional): how much this child affects parent
5. Visual confirmation: shows goal in hierarchy context

**GAP Implementation Note:** Already have `parentKpiId` field. Need UI for:
- Parent goal selection
- Weight assignment
- Progress impact toggle

### Viewing Progress Roll-Up

**Best Practice (from Weekdone, Synergita, Viva Goals):**
1. **Tree View**: Collapsible hierarchy, each node shows % complete
2. **List View**: Tabular with parent relationship column
3. **Chart View**: Visual alignment diagram (Perdoo Strategy Map style)
4. **Dual View**: Toggle between tree and list (Synergita pattern)

**Key UX Elements:**
- Progress bars on each goal
- Color-coded status indicators (green/yellow/red)
- Expandable children with inline progress
- Click-through to detail view
- "Impact" indicator showing which children are driving/lagging

### Daily/Weekly Check-ins

**Best Practice (from 15Five, Weekdone, Tability):**
1. **Cadence**: Weekly for quarterly OKRs; can do daily for habits
2. **Duration**: 15-30 minutes maximum
3. **Format**:
   - Current value update (numeric or %)
   - Confidence level (1-10)
   - Quick notes (optional)
   - Blockers (optional)
4. **Automation**: Slack/email reminders, integrations pull data

**GAP Implementation Note:** Already have `kpiLogs` table. Add:
- Confidence level field
- Weekly aggregation view
- Reminder system

### Dashboard Visualizations

**Table Stakes Dashboards:**
1. **Progress Overview**: All goals with % completion bars
2. **Status Distribution**: Pie/bar chart of on-track/at-risk/behind
3. **Time-Based Trends**: Progress over weeks/months
4. **Owner View**: Goals grouped by assignee

**Differentiator Dashboards:**
1. **300% Rule Gauge**: Three meters for Clarity/Belief/Consistency
2. **Streak Calendar**: GitHub-style contribution graph for daily habits
3. **Cascade Impact**: Which low-level activities drive top-level goals
4. **Confidence Trend**: How belief changes over time

---

## MVP Recommendation

For MVP KPI cascade features, prioritize:

### Must Have (Phase 1)
1. **Parent-child goal linking** - Core cascade relationship
2. **Automatic progress roll-up** - Unweighted average first
3. **Basic tree view** - See hierarchy at a glance
4. **Goal status indicators** - On-track/at-risk/behind
5. **Weekly check-in form** - Simple progress + notes

### Should Have (Phase 2)
1. **Confidence scoring** - Add to check-ins
2. **300% Rule dashboard** - Unique differentiator
3. **Streak tracking** - For daily KPIs
4. **Weighted progress** - Allow importance differentiation
5. **Goal filtering** - By quarter/owner/status

### Defer to Later
1. **AI alignment suggestions** - Needs usage patterns
2. **Strategy map visualization** - Complex UI
3. **Pulse survey integration** - Out of scope for GAP
4. **Real-time integrations** - JIRA, Asana, etc.

---

## Gap Analysis: Current State vs. Market

| Feature | Current GAP State | Market Standard | Gap Size |
|---------|-------------------|-----------------|----------|
| Parent-child linking | Schema exists (`parentKpiId`) | Full CRUD + UI | **Small** - needs UI |
| Progress roll-up | Not implemented | Automatic calculation | **Medium** - needs logic + UI |
| Tree view | Not implemented | Standard feature | **Medium** - needs component |
| Confidence scoring | Not in schema | Emerging feature | **Medium** - needs field + UI |
| 300% Rule | Schema exists | **No competitor has this** | **Advantage** - needs dashboard |
| Streaks | Schema exists (`kpiStreaks`) | Premium feature | **Small** - needs UI |
| Check-ins | `kpiLogs` exists | Weekly cadence UI | **Small** - needs workflow |
| Weighted progress | Not implemented | Premium feature | **Medium** - optional |

---

## Confidence Assessment

| Finding | Confidence | Reason |
|---------|------------|--------|
| Table stakes features | HIGH | Consistent across all 5 products researched |
| Progress roll-up mechanics | MEDIUM | WebSearch sources; specifics vary by product |
| Anti-patterns | HIGH | Multiple authoritative sources (Jeff Gothelf, What Matters) |
| UX patterns | MEDIUM | Based on help docs and product marketing; not hands-on testing |
| 300% Rule differentiation | HIGH | Verified no competitor implements this specific framework |
| Gamification effectiveness | MEDIUM | Based on Duolingo research, not OKR-specific studies |

---

## Sources

### Authoritative (HIGH confidence)
- [Lattice Help Center - Cascading Goals](https://help.lattice.com/hc/en-us/articles/1500001356821-Cascading-Goals)
- [15Five Help Center - Objectives Feature Overview](https://success.15five.com/hc/en-us/articles/17103846921243-Objectives-Feature-Overview)
- [Perdoo Support - Aligning OKRs](https://support.perdoo.com/en/articles/5391069-aligning-okrs)
- [Weekdone - Goal Alignment vs Cascading](https://weekdone.com/resources/articles/goal-alignment)
- [What Matters - Why We Don't Grade OKRs Weekly](https://www.whatmatters.com/faqs/weekly-okr-grading-check-in)

### Secondary (MEDIUM confidence)
- [Jeff Gothelf - OKR Anti-patterns](https://jeffgothelf.com/blog/sandbagging-okr-antipattern/)
- [Perdoo - Common OKR Mistakes](https://www.perdoo.com/resources/blog/common-okr-mistakes-and-how-to-overcome-them)
- [OKR Quickstart - Confidence Scoring](https://okrquickstart.com/okrtemplates/okr-confidence-scoring)
- [Trophy - Gamification Case Studies](https://trophy.so/blog/streaks-gamification-case-study)
- [time optimization - 300% Rule (Twitter/X)](https://x.com/danmartell/status/1902440329309254021)

### Market Research (MEDIUM confidence)
- [Datalligence - 15 Must-Have OKR Features 2025](https://datalligence.ai/blogs/okr-software-features/)
- [Synergita - OKR Hierarchy Tree](https://support.synergita.com/support/solutions/articles/4000201295-exploring-hierarchy-tree)
- [Workpath - Enterprise OKR Software 2025](https://www.workpath.com/en/magazine/best-ai-okr-kpi-business-review-software)
