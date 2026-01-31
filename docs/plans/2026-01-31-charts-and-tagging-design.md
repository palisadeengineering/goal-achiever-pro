# Charts Tab & Event Tagging System Design

**Date:** 2026-01-31
**Status:** Approved
**Feature:** Customizable charts with time block tagging

## Overview

Add a new "Charts" tab to the Time & Energy Audit page that displays customizable analytics based on user-defined tags. Users can tag time blocks with multiple flat tags and visualize their time distribution and trends through various chart types.

## Requirements

- **Tagging System:** Flat tags with optional grouping (no hierarchy)
- **Charts:** Both distribution (pie/bar) and trend (line) analysis
- **Chart Management:** Smart defaults + user customization
- **Tag UI:** Full editing in dialog + quick-tag from calendar view
- **Date Ranges:** Shared page default with per-chart override option

---

## Navigation & Page Structure

**New tab added to the Time & Energy Audit page:**

```
Calendar | Insights | Manage Events | Charts
```

The Charts tab is a dedicated view (`ChartsView`) containing:
- Date range picker (inherits from page-level selection)
- Auto-generated charts based on user tags
- Ability to add, remove, and customize charts

This keeps the existing Insights tab focused on AI-generated insights and data quality, while the new Charts tab handles visual analytics and tag breakdowns.

---

## Database Schema

### New `tags` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Foreign key to profiles |
| `name` | varchar(100) | Tag name |
| `color` | varchar(7) | Optional hex color (e.g., #FF5733) |
| `created_at` | timestamp | Creation timestamp |
| `updated_at` | timestamp | Last update timestamp |

**Constraints:**
- Unique constraint on `(user_id, name)` to prevent duplicate tags per user

### New `time_block_tags` Junction Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `time_block_id` | uuid | Foreign key to time_blocks |
| `tag_id` | uuid | Foreign key to tags |
| `created_at` | timestamp | Creation timestamp |

**Constraints:**
- Unique constraint on `(time_block_id, tag_id)`
- Cascade delete when time_block or tag is deleted

### New `user_charts` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Foreign key to profiles |
| `chart_type` | varchar(20) | Type: 'pie', 'bar', 'line' |
| `title` | varchar(100) | Chart display title |
| `config` | jsonb | Configuration object (see below) |
| `position` | integer | Display order |
| `is_auto_generated` | boolean | True if smart-default chart |
| `created_at` | timestamp | Creation timestamp |
| `updated_at` | timestamp | Last update timestamp |

**Config JSONB Structure:**
```json
{
  "tagIds": ["uuid1", "uuid2"],     // null = all tags
  "dateRangeOverride": {            // null = use page default
    "start": "2026-01-01",
    "end": "2026-01-31"
  },
  "aggregation": "daily",           // daily, weekly, monthly (for line charts)
  "showLegend": true,
  "showValues": true
}
```

---

## Tagging UI on Calendar Events

### Time Block Edit Dialog

- New "Tags" field below existing category/energy/notes fields
- Autocomplete input showing existing tags as user types
- Click to add tag, X button to remove
- "+ New Tag" option with color picker when typed tag doesn't exist
- Tags display as colored chips/badges

### Quick-Tag from Calendar View

- Right-click on any time block opens context menu
- "Add Tag" submenu shows existing tags as checkboxes (toggle on/off)
- "Create new tag..." option at bottom opens mini-dialog
- Visual indicator on time blocks that have tags (small colored dots below event title)

### Tag Management

- "Manage Tags" link accessible from:
  - Quick-tag context menu
  - Charts tab header
  - Settings page
- Management panel allows:
  - Rename tags
  - Change tag colors
  - Delete tags (with confirmation - removes from all time blocks)
  - View usage count per tag

---

## Chart Types

### Available Types

| Type | Name | Description |
|------|------|-------------|
| `pie` | Tag Distribution Pie | Percentage of time per tag for selected date range |
| `bar` | Tag Distribution Bar | Same data as pie, horizontal/vertical bars (better for many tags) |
| `line` | Tag Trend Line | Hours per tag over time with daily/weekly/monthly data points |

### Smart Defaults

When user has 2+ tags with associated time block data, auto-generate:

1. **"Time Distribution"** - Pie chart showing all tags
2. **"Weekly Trends"** - Line chart showing top 5 tags by usage

These charts:
- Appear automatically on first visit to Charts tab
- Have `is_auto_generated: true` flag
- Can be hidden, deleted, or customized by user
- Regenerate if deleted and user has qualifying data

### Chart Customization Options

Each chart can be configured with:

| Option | Description |
|--------|-------------|
| Title | Editable display name |
| Tags | All tags, or select specific ones |
| Date Range | Inherit page default, or set custom override |
| Chart Type | Switch between pie/bar/line |
| Aggregation | For line charts: daily, weekly, or monthly data points |
| Show Legend | Toggle legend visibility |
| Show Values | Toggle value labels on chart |

---

## Charts Tab UI Layout

### Desktop Layout (2 columns)

```
┌─────────────────────────────────────────────────────────────┐
│  Date Range: [This Week ▼]  Jan 25 - Jan 31, 2026          │
├─────────────────────────────────────────────────────────────┤
│  [+ Add Chart]                              [Manage Tags]   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────┐  ┌─────────────────────────┐  │
│  │ Time Distribution    ⚙️ ✕│  │ Weekly Trends        ⚙️ ✕│  │
│  │                         │  │                         │  │
│  │      [Pie Chart]        │  │     [Line Chart]        │  │
│  │                         │  │                         │  │
│  └─────────────────────────┘  └─────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────┐                               │
│  │ Project X Time       ⚙️ ✕│  (user-created)              │
│  │                         │                               │
│  │      [Bar Chart]        │                               │
│  │                         │                               │
│  └─────────────────────────┘                               │
└─────────────────────────────────────────────────────────────┘
```

### Mobile Layout (1 column)

Charts stack vertically, full width.

### UI Elements

| Element | Behavior |
|---------|----------|
| Date Range Picker | Inherits from page-level, affects all charts without override |
| "+ Add Chart" button | Opens chart creation modal |
| "Manage Tags" button | Opens tag management panel |
| Chart card | Contains title, chart visualization, settings gear, delete X |
| Settings gear (⚙️) | Opens chart configuration modal |
| Delete X | Removes chart (with confirmation for user-created) |

### Empty State

When user has no tags or no charts:
```
No charts yet

Add tags to your time blocks to see analytics here.
[Go to Calendar] or [Create a Tag]
```

### "+ Add Chart" Flow

1. Click "+ Add Chart"
2. Modal opens with chart type selection (pie, bar, line)
3. Select type → configure title, tags, options
4. Save → chart appears in grid

---

## Implementation Plan

### Phase 1: Database & API Foundation

**Tasks:**
- Add `tags`, `time_block_tags`, `user_charts` tables to Drizzle schema (`src/lib/db/schema.ts`)
- Run `drizzle-kit push` to update Supabase
- Create API endpoints:
  - `GET/POST /api/tags` - List and create tags
  - `PATCH/DELETE /api/tags/[id]` - Update and delete tags
  - `GET/POST /api/user-charts` - List and create charts
  - `PATCH/DELETE /api/user-charts/[id]` - Update and delete charts
- Update time blocks API to include/manage tag relationships

### Phase 2: Tagging on Time Blocks

**Tasks:**
- Create `TagInput` component (autocomplete with create option)
- Update `TimeBlockEditDialog` to include tags field
- Add right-click context menu to `WeeklyCalendarView` for quick-tagging
- Add visual tag indicators on time blocks in calendar view
- Create `ManageTagsDialog` component for tag CRUD

### Phase 3: Charts Tab & Visualization

**Tasks:**
- Add "Charts" tab to time-audit page tab navigation
- Create `ChartsView` component with responsive grid layout
- Install/configure Recharts library (if not present)
- Create `ChartCard` component with header, settings, delete controls
- Build responsive grid layout (2 cols desktop, 1 col mobile)

### Phase 4: Chart Types & Smart Defaults

**Tasks:**
- Create chart components:
  - `TagDistributionPieChart`
  - `TagDistributionBarChart`
  - `TagTrendLineChart`
- Build `ChartConfigModal` for creating/editing charts
- Implement data aggregation queries (by tag, by date range)
- Add smart default generation logic
- Wire up date range inheritance with per-chart override

### Phase 5: Polish

**Tasks:**
- Add loading states for charts
- Add empty states for no data / no tags
- Mobile responsive testing and fixes
- Optional: drag-and-drop chart reordering

---

## Technical Notes

### Charting Library

Use **Recharts** - commonly paired with shadcn/ui, React-based, good TypeScript support.

### Data Fetching

- Use React Query for chart data fetching
- Aggregate queries should happen server-side for performance
- Cache chart data with appropriate invalidation on time block changes

### Performance Considerations

- Limit default date range to avoid massive queries
- Use pagination or top-N limits for charts with many tags
- Consider background refresh for smart defaults

---

## Future Enhancements (Not in Scope)

- Export charts as images/PDF
- Share charts publicly
- Chart templates/presets
- Tag groups/categories (hierarchical tags)
- Comparison between time periods
- Goal lines on trend charts
