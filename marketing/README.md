# Goal Achiever Pro - 30-Day Marketing Campaign

A complete social media marketing campaign for Goal Achiever Pro, based on Dan Martell's "Buy Back Your Time" methodology.

## Campaign Overview

| Metric | Value |
|--------|-------|
| **Duration** | 30 days |
| **Platforms** | Instagram, LinkedIn |
| **Total Images** | 227 |
| **Content Types** | Carousels, Graphics, Stories |

## Content Summary

| Content Type | Posts | Individual Images | Dimensions |
|--------------|-------|-------------------|------------|
| Instagram Carousels | 22 | 134 slides | 1080x1080 |
| LinkedIn Graphics | 17 | 17 images | 1200x627 |
| Instagram Stories | 8 sets | 42 slides | 1080x1920 |

## Folder Structure

```
marketing/
├── README.md                    # This file
├── posting-schedule.md          # Complete 30-day schedule with checklists
├── export-graphics.js           # Puppeteer script to export PNGs
│
├── instagram-carousels/
│   ├── week1/
│   │   ├── styles.css           # Shared carousel styles
│   │   ├── assets/              # Logo, icons
│   │   ├── day1-smart-vision.html
│   │   ├── day2-300-rule.html
│   │   ├── day3-power-goals.html
│   │   ├── day4-drip-matrix.html
│   │   ├── day5-drip-deep-dive.html
│   │   ├── day7-weekly-recap.html
│   │   └── exports/             # PNG exports
│   ├── week2/
│   │   ├── day8-time-tracking.html
│   │   ├── day9-energy-tracking.html
│   │   ├── day10-mins.html
│   │   ├── day11-app-reveal.html
│   │   ├── day12-300-deep-dive.html
│   │   ├── day14-weekly-recap.html
│   │   └── exports/
│   ├── week3/
│   │   ├── day15-morning-routine.html
│   │   ├── day16-shutdown-ritual.html
│   │   ├── day17-daily-reviews.html
│   │   ├── day18-pomodoro.html
│   │   ├── day21-sunday-planning.html
│   │   └── exports/
│   ├── week4/
│   │   ├── day22-4cs-leverage.html
│   │   ├── day23-delegation.html
│   │   ├── day24-friend-inventory.html
│   │   ├── day25-full-system.html
│   │   ├── day30-take-action.html
│   │   └── exports/
│   └── captions.md              # Instagram captions for all carousels
│
├── linkedin-posts/
│   ├── styles.css               # LinkedIn graphic styles
│   ├── week1/
│   │   ├── day1-smart-vision.html
│   │   ├── day2-300-rule.html
│   │   ├── day3-power-goals.html
│   │   ├── day4-drip-matrix.html
│   │   ├── day5-drip-deep-dive.html
│   │   ├── day7-weekly-recap.html
│   │   └── exports/
│   ├── week2/
│   │   ├── day8-time-tracking.html
│   │   ├── day9-energy-tracking.html
│   │   ├── day10-mins.html
│   │   ├── day11-app-reveal.html
│   │   ├── day12-300-deep-dive.html
│   │   ├── day14-weekly-recap.html
│   │   └── exports/
│   ├── week3/
│   │   ├── day15-morning-routine.html
│   │   ├── day16-shutdown-ritual.html
│   │   ├── day17-daily-reviews.html
│   │   ├── day18-pomodoro.html
│   │   └── exports/
│   ├── week4/
│   │   ├── day22-4cs-leverage.html
│   │   ├── day23-delegation.html
│   │   ├── day24-friend-inventory.html
│   │   ├── day25-full-system.html
│   │   ├── day30-take-action.html
│   │   └── exports/
│   └── captions.md              # LinkedIn captions for all posts
│
└── instagram-stories/
    ├── styles.css               # Story styles (1080x1920)
    ├── week1/
    │   ├── day6-rest-day.html   # 5 stories
    │   └── exports/
    ├── week2/
    │   ├── day13-rest-day.html  # 5 stories
    │   └── exports/
    ├── week3/
    │   ├── day19-qa.html        # 5 stories
    │   ├── day20-rest-day.html  # 5 stories
    │   └── exports/
    └── week4/
        ├── day26-testimonials.html  # 5 stories
        ├── day27-rest-day.html      # 5 stories
        ├── day28-recap.html         # 6 stories
        ├── day29-countdown.html     # 6 stories
        └── exports/
```

## Weekly Themes

| Week | Theme | Core Concepts |
|------|-------|---------------|
| 1 | Vision & Goals | SMART Vision, 300% Rule, 12 Power Goals, DRIP Matrix |
| 2 | Time & Energy | 15-min Time Tracking, Energy Ratings, Daily MINs, App Reveal |
| 3 | Routines & Systems | Morning Routine, Shutdown Ritual, 3x Reviews, Pomodoro |
| 4 | Leverage & Scale | 4 C's of Leverage, Delegation Math, Friend Inventory, Full System |

## Quick Start

### View Graphics in Browser

Open any HTML file in a browser to preview:

```bash
# Example: Open day 1 carousel
open marketing/instagram-carousels/week1/day1-smart-vision.html
```

### Export to PNG

Requires Node.js and Puppeteer:

```bash
# Install dependencies (if not already installed)
npm install puppeteer

# Run export script
cd marketing
node export-graphics.js
```

This exports all graphics to their respective `exports/` folders.

### Use Pre-exported PNGs

All PNGs are already exported and ready to use in the `exports/` folders:

- **Carousels:** Individual slide files named `dayX-topic-slideN.png`
- **LinkedIn:** Single files named `dayX-topic.png`
- **Stories:** Individual story files named `dayX-topic-storyN.png`

## Content Details

### Instagram Carousels (22 posts, 134 slides)

Each carousel is 5-7 slides at 1080x1080px:

| Day | Topic | Slides | Hook |
|-----|-------|--------|------|
| 1 | SMART Vision | 5 | "You're Working Hard. But Toward What?" |
| 2 | 300% Rule | 7 | "Why 99% of Goals Fail" |
| 3 | Power Goals | 6 | "12 Goals. That's It." |
| 4 | DRIP Matrix | 7 | "Not All Tasks Are Equal" |
| 5 | DRIP Deep Dive | 7 | "Know Your Task Value" |
| 7 | Week 1 Recap | 6 | "Week 1 Complete" |
| 8 | Time Tracking | 6 | "I Don't Have Time" |
| 9 | Energy Tracking | 6 | "Time Management Is a Myth" |
| 10 | Daily MINs | 6 | "3 Things. That's It." |
| 11 | App Reveal | 6 | "I Built The Thing" |
| 12 | 300% Deep Dive | 6 | "Rate Yourself Honestly" |
| 14 | Week 2 Recap | 6 | "Week 2 Complete" |
| 15 | Morning Routine | 6 | "First 2 Hours = Next 14" |
| 16 | Shutdown Ritual | 6 | "Permission to Rest" |
| 17 | Daily Reviews | 6 | "Most People Review at 11pm" |
| 18 | Pomodoro | 6 | "Good → Better" |
| 21 | Sunday Planning | 5 | "Most Important Hour of the Week" |
| 22 | 4 C's Leverage | 7 | "How Do I Leverage This?" |
| 23 | Delegation | 7 | "Not an Expense" |
| 24 | Friend Inventory | 6 | "Average of 5 People" |
| 25 | Full System | 6 | "Everything Connected" |
| 30 | Take Action | 5 | "Knowledge ≠ Transformation" |

### LinkedIn Graphics (17 posts)

Single images at 1200x627px with two-column layouts.

### Instagram Stories (8 sets, 42 slides)

Vertical format at 1080x1920px with interactive elements:

| Day | Theme | Slides | Interactive Elements |
|-----|-------|--------|---------------------|
| 6 | Week 1 Rest | 5 | Poll, Slider, Q&A, Quiz |
| 13 | Week 2 Rest | 5 | Poll, Slider, Q&A, Stats |
| 19 | Q&A + BTS | 5 | AMA, Routine, Poll, Beta CTA |
| 20 | Week 3 Rest | 5 | Poll, Slider, Quiz, Q&A |
| 26 | Testimonials | 5 | Quotes, Stats, Poll, Q&A |
| 27 | Week 4 Rest | 5 | Poll, Quiz, Slider, Preview |
| 28 | 4-Week Recap | 6 | Week summaries, Teaser |
| 29 | Countdown | 6 | Countdown, Journey, CTA |

## Brand Guidelines

### Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Brand Cyan | `#0891B2` | Primary brand color |
| Bright Cyan | `#00BEFF` | Accents, CTAs |
| Cyan | `#00BEFF` | Success, highlights |
| Purple | `#a855f7` | DRIP Delegation |
| Amber | `#f59e0b` | DRIP Replacement |
| Blue | `#3b82f6` | DRIP Investment |
| Green | `#00BEFF` | DRIP Production |

### Gradients

- **Brand:** `#0891B2 → #00BEFF → #34d399`
- **Ocean:** `#0891b2 → #06b6d4 → #22d3ee`
- **Sunset:** `#ea580c → #f97316 → #fb923c`
- **Purple:** `#7c3aed → #8b5cf6 → #a78bfa`
- **Dark:** `#0f172a → #1e293b → #334155`

### Typography

- **Headlines:** Inter, 800 weight
- **Body:** Inter, 400-600 weight
- **Labels:** Uppercase, letter-spacing 3px

## Posting Schedule

See `posting-schedule.md` for the complete 30-day schedule including:

- Daily posting times
- Platform assignments
- Content file references
- Daily checklists
- Hashtag strategy
- Success metrics

## Captions

- **Instagram:** `instagram-carousels/captions.md`
- **LinkedIn:** `linkedin-posts/captions.md`

## Customization

### Editing Graphics

1. Open the HTML file in a code editor
2. Modify text, colors, or layout
3. Preview in browser
4. Re-run `export-graphics.js` to generate new PNGs

### Adding New Content

1. Copy an existing HTML file as a template
2. Update content and styles
3. Add to the `graphics` object in `export-graphics.js`
4. Run export script

### Changing Brand Colors

Update the CSS variables in the respective `styles.css` files:

- `instagram-carousels/week1/styles.css`
- `linkedin-posts/styles.css`
- `instagram-stories/styles.css`

## Requirements

- **Viewing:** Any modern browser
- **Exporting:** Node.js 16+, Puppeteer
- **Editing:** Any code editor

## License

Internal use for Goal Achiever Pro marketing.
