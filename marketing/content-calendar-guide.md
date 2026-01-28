# Content Calendar & Buffer Upload Guide

Complete system for managing, reviewing, and scheduling social media content.

---

## Files Overview

| File | Purpose |
|------|---------|
| `content-calendar-template.csv` | Master planning document with all content details, review workflow |
| `buffer-import-template.csv` | Simplified format ready for Buffer bulk upload |
| `social-media-content-calendar.md` | Full content library with 6 weeks of posts |
| `youtube-production-system.md` | Complete YouTube production playbook |

---

## Content Calendar Template Structure

### Column Definitions

| Column | Description | Values |
|--------|-------------|--------|
| **Week** | Week number | 1, 2, 3... |
| **Day** | Day of week | Monday-Sunday |
| **Date** | Publish date | YYYY-MM-DD |
| **Platform** | Social platform | X, LinkedIn, Instagram, YouTube |
| **Content Type** | Format | Tweet, Thread, Post, Carousel, Reel, Short, Story, Long-form |
| **Status** | Workflow stage | Draft, Review, Approved, Scheduled, Published |
| **Theme** | Content theme | Vision, 300% Rule, Impact Projects, Value, Time Audit, etc. |
| **Hook/Title** | Opening hook or title | First line/headline |
| **Full Caption** | Complete post text | Full content with formatting |
| **Hashtags** | Platform hashtags | #tag1 #tag2 |
| **Media Type** | Visual format | Text, Image, Carousel, Video, Story |
| **Media File** | Filename reference | carousel_vision.zip, reel_drip.mp4 |
| **Link** | URL to include | goalachieverpro.com |
| **CTA** | Call-to-action | Comment, Share, Link in bio |
| **Publish Time** | Scheduled time | HH:MM AM/PM |
| **Buffer Queue** | Buffer queue assignment | Queue 1, Queue 2 |
| **Notes** | Production notes | Slide count, duration, special instructions |
| **Review By** | Reviewer name | Joel |
| **Approved** | Approval status | Yes, No |

---

## Workflow Process

### 1. Content Planning (Weekly)

```
Sunday/Monday:
□ Review upcoming week in content-calendar-template.csv
□ Adjust dates based on events/news
□ Assign themes to each day
□ Draft hooks for all posts
```

### 2. Content Creation (Batch)

```
Tuesday/Wednesday:
□ Write full captions for all posts
□ Create visual assets in Canva
□ Record any video content
□ Export media with correct filenames
```

### 3. Review & Approval

```
Thursday:
□ Review all content (spelling, links, hashtags)
□ Update Status column: Draft → Review
□ Get approval (internal or external)
□ Update Approved column: No → Yes
□ Update Status column: Review → Approved
```

### 4. Buffer Upload

```
Friday:
□ Export approved content to buffer-import-template.csv format
□ Upload to Buffer via bulk upload
□ Verify all posts scheduled correctly
□ Update Status column: Approved → Scheduled
```

### 5. Monitor & Engage

```
Daily:
□ Check published posts
□ Respond to comments within 1 hour
□ Track engagement metrics
□ Update Status column: Scheduled → Published
```

---

## Buffer Import Instructions

### Option 1: Manual Buffer Entry

1. Open `content-calendar-template.csv` in Google Sheets/Excel
2. Filter by Status = "Approved"
3. Copy content from "Full Caption" column
4. Paste into Buffer composer
5. Add media from "Media File" reference
6. Set publish time from "Publish Time" column
7. Add to queue

### Option 2: Buffer Bulk Upload

1. Open `buffer-import-template.csv`
2. Review and update content
3. In Buffer, go to **Publishing** > **Queue**
4. Click **...** (more options) > **Bulk Upload**
5. Upload the CSV file
6. Review imported posts
7. Confirm scheduling

### Buffer CSV Format Requirements

```csv
Text,Link,Photo,Scheduled Date,Scheduled Time,Profile
"Your post text here",https://link.com,image.jpg,2025-02-03,10:00,Twitter
```

**Column Notes:**
- **Text**: Full post content (use quotes if contains commas)
- **Link**: URL to include (optional)
- **Photo**: Image filename or URL (optional)
- **Scheduled Date**: YYYY-MM-DD format
- **Scheduled Time**: HH:MM (24-hour) or HH:MM AM/PM
- **Profile**: Twitter, LinkedIn, Instagram, Facebook

---

## Platform-Specific Formatting

### X (Twitter)

```
Character Limit: 280
Best Time: 10:00 AM, 1:00 PM, 7:00 PM
Format Tips:
- Lead with hook
- Use line breaks for readability
- Thread long content (use 🧵 indicator)
- No hashtags or 1-2 max
```

### LinkedIn

```
Character Limit: 3,000
Best Time: 8:00 AM, 12:00 PM, 5:00 PM (Tue-Thu)
Format Tips:
- Hook in first 2 lines (before "see more")
- Use single-line paragraphs
- Bullet points for lists
- 3-5 relevant hashtags at end
- Ask question to drive comments
```

### Instagram Feed

```
Caption Limit: 2,200
Best Time: 12:00 PM, 7:00 PM
Format Tips:
- Hook in first line
- Line breaks for readability
- Call-to-action (save, comment)
- 20-30 hashtags (first comment or end)
- Carousel: 5-7 slides optimal
```

### Instagram Stories

```
Duration: 15 sec per story
Best Time: 9:00 AM, 12:00 PM, 7:00 PM
Format Tips:
- Poll/question stickers for engagement
- Link sticker for CTAs
- Location tag for reach
- Consistent aesthetic
```

### Instagram Reels

```
Duration: 30-90 seconds optimal
Best Time: 12:00 PM, 7:00 PM
Format Tips:
- Hook in first 3 seconds
- Captions always on
- Trending audio when relevant
- Clear CTA at end
```

### YouTube Shorts

```
Duration: 30-60 seconds
Best Time: 3:00 PM, 7:00 PM
Format Tips:
- Immediate hook (no intro)
- Vertical 9:16 format
- Text overlays for key points
- End with subscribe CTA
```

---

## Content Status Workflow

```
DRAFT → REVIEW → APPROVED → SCHEDULED → PUBLISHED
  │        │         │          │          │
  │        │         │          │          └── After posting
  │        │         │          └── After Buffer upload
  │        │         └── After approval
  │        └── Ready for review
  └── Initial creation
```

### Status Definitions

| Status | Description | Next Action |
|--------|-------------|-------------|
| **Draft** | Content written, needs polish | Review for errors |
| **Review** | Ready for approval | Get sign-off |
| **Approved** | Signed off, ready to schedule | Upload to Buffer |
| **Scheduled** | In Buffer queue | Monitor for issues |
| **Published** | Live on platform | Engage with responses |

---

## Batch Production Schedule

### Weekly Schedule Template

| Day | Task | Output |
|-----|------|--------|
| **Sunday** | Plan upcoming week | Calendar updated |
| **Monday** | Write X + LinkedIn posts | 14 posts drafted |
| **Tuesday** | Create Instagram content | 7 posts + stories |
| **Wednesday** | Record video content | Reels + Shorts |
| **Thursday** | Review + approve all | All approved |
| **Friday** | Upload to Buffer | Week scheduled |
| **Saturday** | Create bonus content | Extra posts banked |

### Monthly Overview

```
Week 1: Theme A (e.g., Vision & Goals)
Week 2: Theme B (e.g., Time Management)
Week 3: Theme C (e.g., Routines & Systems)
Week 4: Theme D (e.g., Leverage & Scale)
```

---

## Hashtag Banks

### X (Twitter)
```
#productivity #entrepreneur #startup #buildinpublic #SaaS #goalsetting
```

### LinkedIn
```
#Productivity #Entrepreneurship #TimeManagement #TimeOptimization #Leadership #BusinessGrowth #StartupLife #GoalSetting #WorkLifeBalance
```

### Instagram
```
#productivity #productivitytips #entrepreneur #entrepreneurlife #goalsetting #timemanagement #morningroutine #businessowner #smallbusiness #startup #motivation #success #growth #mindset #hustle #goals #planning #focus #discipline #habits
```

---

## Media File Naming Convention

```
[platform]_[type]_[topic]_[version].[ext]

Examples:
ig_carousel_vision_v1.zip
ig_reel_drip_v2.mp4
yt_short_300rule_v1.mp4
li_image_quote_v1.png
tw_image_infographic_v1.png
```

### Folder Structure

```
marketing/
├── content/
│   ├── images/
│   │   ├── linkedin/
│   │   ├── instagram/
│   │   └── twitter/
│   ├── videos/
│   │   ├── reels/
│   │   ├── shorts/
│   │   └── long-form/
│   └── carousels/
├── templates/
│   ├── canva/
│   └── figma/
└── schedules/
    ├── content-calendar-template.csv
    ├── buffer-import-template.csv
    └── archive/
```

---

## Quick Reference: Optimal Post Times

| Platform | Day | Time (EST) |
|----------|-----|------------|
| X | Tue-Thu | 10:00 AM |
| X | Daily | 1:00 PM, 7:00 PM |
| LinkedIn | Tue-Thu | 8:00 AM |
| LinkedIn | Tue-Thu | 12:00 PM, 5:00 PM |
| Instagram Feed | Daily | 12:00 PM |
| Instagram Feed | Daily | 7:00 PM |
| Instagram Stories | Daily | 9:00 AM, 12:00 PM, 7:00 PM |
| YouTube Shorts | Daily | 3:00 PM |
| YouTube Long-form | Wed | 10:00 AM |

---

## Engagement Response Templates

### Positive Comment
```
Thank you! [Specific acknowledgment of their point]. Have you tried [relevant feature/tip]?
```

### Question
```
Great question! [Answer]. This is exactly why we built [feature] into the app. Would you like me to explain more?
```

### Feature Request
```
Love this idea! Adding it to our consideration list. What would this help you accomplish specifically?
```

### Skepticism
```
Totally understand the skepticism. The key difference here is [specific differentiator]. Happy to share more if helpful!
```

---

## Analytics Tracking

### Weekly Metrics to Track

| Metric | X | LinkedIn | Instagram | YouTube |
|--------|---|----------|-----------|---------|
| Impressions | ✓ | ✓ | ✓ | ✓ |
| Engagement Rate | ✓ | ✓ | ✓ | ✓ |
| Profile Visits | ✓ | ✓ | ✓ | ✓ |
| Link Clicks | ✓ | ✓ | ✓ | ✓ |
| Followers Gained | ✓ | ✓ | ✓ | ✓ |
| Top Post | ✓ | ✓ | ✓ | ✓ |

### Monthly Review Questions

1. Which content themes performed best?
2. What post types got highest engagement?
3. Which times drove most interaction?
4. What drove the most link clicks?
5. What content should we create more of?

---

## Troubleshooting

### Buffer Upload Issues

**Problem:** CSV not importing correctly
**Solution:** Check for:
- Proper quote escaping around text with commas
- Correct date format (YYYY-MM-DD)
- Valid profile names (Twitter, LinkedIn, Instagram, Facebook)
- UTF-8 encoding

**Problem:** Images not attaching
**Solution:**
- Use direct image URLs or upload images separately
- Check image format (JPG, PNG, GIF supported)
- Verify file size limits

### Content Issues

**Problem:** Post too long for platform
**Solution:** Trim content to fit character limits:
- Twitter: 280 chars
- Instagram caption: 2,200 chars
- LinkedIn: 3,000 chars

**Problem:** Link not tracking
**Solution:** Use UTM parameters:
```
https://goalachieverpro.com?utm_source=twitter&utm_medium=social&utm_campaign=week1
```

---

## Checklist: Weekly Content Prep

```
PLANNING
□ Review content calendar for upcoming week
□ Check for conflicts with holidays/events
□ Assign themes and topics
□ Write hooks for all posts

CREATION
□ Write full captions
□ Create visual assets
□ Record video content
□ Export with correct filenames

REVIEW
□ Spell check all content
□ Verify links work
□ Check hashtags are relevant
□ Confirm media files exist
□ Get approval if needed

SCHEDULING
□ Export to Buffer format
□ Upload to Buffer
□ Verify all scheduled correctly
□ Set reminders for engagement

MONITORING
□ Check posts went live
□ Respond to comments
□ Track metrics
□ Note top performers
```

---

## Automation Opportunities

### Tools to Connect

| Tool | Purpose | Integration |
|------|---------|-------------|
| **Canva** | Design templates | Export media files |
| **Buffer** | Scheduling | CSV import |
| **Google Sheets** | Calendar management | Share/collaborate |
| **Zapier** | Automation | Connect tools |
| **Notion** | Content database | Planning hub |

### Zaps to Set Up

1. **New row in Google Sheet → Create Buffer post**
2. **Buffer post published → Log to analytics sheet**
3. **New comment → Notify in Slack**
4. **Weekly → Send content performance report**

---

## Quick Start Checklist

```
□ 1. Download content-calendar-template.csv
□ 2. Open in Google Sheets (for collaboration) or Excel
□ 3. Customize dates for your schedule
□ 4. Review and edit content as needed
□ 5. Create media assets referenced in "Media File" column
□ 6. Mark content as "Approved" when ready
□ 7. Export approved content to buffer-import-template.csv format
□ 8. Upload to Buffer
□ 9. Monitor and engage when posts go live
```
