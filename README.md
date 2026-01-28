# Goal Achiever Pro

A comprehensive goal-setting and time-optimization web app built on **proven productivity and time optimization methodologies**. Helps entrepreneurs define visions, create Impact Projects, track time, and optimize productivity.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16.1.1 (App Router) |
| Language | TypeScript (strict mode) |
| UI | React 19, Tailwind CSS 4, shadcn/ui |
| State | Zustand, TanStack React Query |
| Database | Supabase (PostgreSQL) |
| ORM | Drizzle ORM |
| AI | OpenAI GPT-4o-mini |
| Payments | Stripe |
| Auth | Supabase Auth |

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Stripe account (for payments)

### Environment Variables

Create a `.env.local` file:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Database
DATABASE_URL=your_database_url

# Anthropic
ANTHROPIC_API_KEY=your_anthropic_key

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret
STRIPE_WEBHOOK_SECRET=your_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_publishable_key

# Google Calendar (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Database Setup

```bash
# Push schema changes
npx drizzle-kit push

# Generate migrations
npx drizzle-kit generate
```

## Core Features

### Goal Hierarchy
```
Vision (SMART Goals)
  └── 12 Impact Projects (annual projects, 4 quarters)
       └── Monthly Targets
            └── Weekly Targets
                 └── Daily Actions
```

### Key Modules

| Module | Description |
|--------|-------------|
| **Vision** | SMART goal framework with AI-assisted generation |
| **Impact Projects** | 12 annual projects for strategic planning |
| **MINs** | Most Important Next Steps scheduling |
| **Time Audit** | 15-minute block tracking with Value Matrix categorization |
| **Value Matrix** | Delegation, Replacement, Investment, Production quadrants |
| **300% Rule** | Track Clarity, Belief, Consistency scores |
| **KPI Tracking** | AI-generated KPIs aligned with vision |
| **Leverage (4 C's)** | Code, Content, Capital, Collaboration tracking |
| **Routines** | Morning, midday, and evening routine builder |
| **Reviews** | 3x daily review system |
| **Pomodoro** | Focus timer with session tracking |
| **Analytics** | Dashboard with charts and progress visualization |

## Project Structure

```
src/
├── app/
│   ├── (auth)/              # Login, signup, callback
│   ├── (dashboard)/         # Protected routes
│   │   ├── vision/          # Vision & SMART goals
│   │   ├── goals/           # Impact Projects
│   │   ├── mins/            # Most Important Next Steps
│   │   ├── time-audit/      # Time tracking
│   │   ├── drip/            # Value Matrix analysis
│   │   ├── routines/        # Daily routines
│   │   ├── pomodoro/        # Focus timer
│   │   ├── reviews/         # Daily reviews
│   │   ├── leverage/        # 4 C's tracking
│   │   ├── network/         # Friend inventory
│   │   ├── analytics/       # Dashboard
│   │   └── settings/        # Settings & subscription
│   ├── (marketing)/         # Public pages
│   ├── (onboarding)/        # Onboarding flow
│   └── api/                 # API routes
├── components/
│   ├── layout/              # Header, Sidebar, PageHeader
│   ├── ui/                  # shadcn/ui components
│   ├── features/            # Domain-specific components
│   └── shared/              # Reusable components
├── lib/
│   ├── db/                  # Drizzle schema & migrations
│   ├── supabase/            # Supabase clients
│   ├── stripe/              # Stripe integration
│   ├── hooks/               # Custom hooks
│   ├── stores/              # Zustand stores
│   └── validations/         # Zod schemas
├── types/                   # TypeScript interfaces
├── constants/               # Routes and constants
└── middleware.ts            # Auth middleware
```

## Subscription Tiers

| Feature | Free | Pro | Elite |
|---------|------|-----|-------|
| Vision & Impact Projects | Yes | Yes | Yes |
| Basic Time Tracking | Yes | Yes | Yes |
| Biweekly Time Audit | No | Yes | Yes |
| Leverage/Network | No | Yes | Yes |
| Midday Reviews | No | Yes | Yes |
| Monthly Time Audit | No | No | Yes |
| Accountability Features | No | No | Yes |

## Branding

| Element | Value |
|---------|-------|
| Primary Color | `#00BEFF` (Cyan) |
| Background Dark | `#0A0A0A` |
| Text Light | `#FAFAFA` |
| Font Primary | Outfit |
| Font Secondary | Plus Jakarta Sans |

---

## Marketing Materials

The `/marketing` folder contains a complete content marketing system.

### Content Calendar & Strategy

| File | Description |
|------|-------------|
| `social-media-content-calendar.md` | 6-week content calendar for all platforms |
| `content-calendar-template.csv` | Master planning spreadsheet |
| `buffer-import-template.csv` | Ready-to-import Buffer CSV |
| `content-calendar-guide.md` | Usage guide and workflow |
| `posting-schedule.md` | Optimal posting times by platform |

### YouTube Production System

| File | Description |
|------|-------------|
| `youtube-production-system.md` | Complete YouTube playbook |

**Includes:**
- YouTube algorithm strategies
- 15 viral hook formulas
- 5 complete long-form video scripts with B-roll
- 10 YouTube Shorts scripts
- Retention engineering tactics
- 90-day launch plan
- 50 video ideas + 100 Shorts ideas
- Batch production workflow
- Monetization pathways

### Thumbnail Templates

| File | Description |
|------|-------------|
| `youtube-thumbnail-templates.md` | Specs and design guide |
| `thumbnails/template-1-face-text.svg` | Face + Text layout |
| `thumbnails/template-2-big-number.svg` | Big Number layout |
| `thumbnails/template-3-before-after.svg` | Before/After split |
| `thumbnails/template-4-drip-matrix.svg` | Value Matrix visual |
| `thumbnails/template-5-text-only.svg` | Bold text only |
| `thumbnails/template-6-app-feature.svg` | App feature showcase |
| `thumbnails/template-7-list-number.svg` | List/Number format |

### Lead Magnets

Free downloadable resources for email list building:

| File | Description |
|------|-------------|
| `lead-magnets/time-audit-template.md` | 7-day time tracking worksheet |
| `lead-magnets/drip-matrix-worksheet.md` | Value Matrix analysis + delegation planner |
| `lead-magnets/power-goals-template.md` | 12-month Impact Projects workbook |
| `lead-magnets/300-rule-worksheet.md` | Clarity + Belief + Consistency tracker |
| `lead-magnets/weekly-planning-template.md` | 30-minute weekly planning system |
| `lead-magnets/daily-routine-checklists.md` | Morning, midday, evening routines |

### Social Media Templates

**Instagram Carousels** (`instagram-carousels/`)
- 4 weeks of carousel templates (HTML + CSS)
- Ready-to-export designs
- Matching captions

**LinkedIn Posts** (`linkedin-posts/`)
- Professional post templates
- Week-by-week content
- Export-ready graphics

**Instagram Stories** (`instagram-stories/`)
- Story templates for engagement
- Q&A and poll formats

**X/Twitter** (`x-twitter/`)
- Thread templates
- Viral hook formulas
- Daily post content

### Exporting Graphics

```bash
# Export all marketing graphics to PNG
node marketing/export-graphics.js
```

---

## API Endpoints

### AI Generation
- `POST /api/ai/generate-smart` - Generate SMART components
- `POST /api/ai/generate-power-goals` - Create Impact Projects
- `POST /api/ai/generate-kpis` - Generate KPIs
- `POST /api/ai/generate-targets` - Generate targets
- `POST /api/ai/suggest-vision` - AI vision suggestions

### Data CRUD
- `/api/visions` - Vision management
- `/api/power-goals` - Impact Projects management
- `/api/targets` - Target management

### Integrations
- `/api/stripe/*` - Payment processing
- `/api/calendar/google/*` - Google Calendar sync

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run linting and tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

---

Built with Next.js, Supabase, and proven productivity methodologies.
