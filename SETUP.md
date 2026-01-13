# Goal Achiever Pro - Complete Setup Guide

This guide will help you set up the Goal Achiever Pro project on a new computer with all necessary dependencies, MCPs, and Claude Code configuration.

## Prerequisites

- **Node.js**: v20.x or higher
- **npm**: Latest version
- **Git**: For version control
- **Claude Code CLI**: [Installation guide](https://github.com/anthropics/claude-code)

## 1. Clone the Repository

```bash
git clone <your-repo-url>
cd goal-achiever-pro
```

## 2. Install Dependencies

```bash
npm install
```

## 3. Environment Variables

Copy the example environment file and fill in your credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your actual credentials:

### Required Services

| Service | Variables | How to Get |
|---------|-----------|------------|
| **Supabase** | `NEXT_PUBLIC_SUPABASE_URL`<br>`NEXT_PUBLIC_SUPABASE_ANON_KEY`<br>`SUPABASE_SERVICE_ROLE_KEY`<br>`DATABASE_URL` | 1. Create project at [supabase.com](https://supabase.com)<br>2. Find keys in Project Settings > API<br>3. Get `DATABASE_URL` from Database Settings |
| **Anthropic AI** | `ANTHROPIC_API_KEY` | Get API key from [console.anthropic.com](https://console.anthropic.com) |
| **Stripe** | `STRIPE_SECRET_KEY`<br>`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`<br>`STRIPE_WEBHOOK_SECRET` | 1. Create account at [stripe.com](https://stripe.com)<br>2. Get keys from Dashboard > Developers > API keys<br>3. Set up webhook endpoint for local testing |
| **Google Calendar** (Optional) | `GOOGLE_CLIENT_ID`<br>`GOOGLE_CLIENT_SECRET` | 1. Create project in [Google Cloud Console](https://console.cloud.google.com)<br>2. Enable Google Calendar API<br>3. Create OAuth 2.0 credentials |

## 4. Database Setup

Run Drizzle migrations to set up your database schema:

```bash
npx drizzle-kit push
```

Or generate and run migrations:

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

## 5. Claude Code Configuration

### 5.1 Install MCPs (Model Context Protocols)

This project uses the following MCPs:

#### Supabase MCP
```bash
npx @supabase/mcp install
```

#### Chrome DevTools MCP
```bash
npx @modelcontextprotocol/server-chrome-devtools install
```

### 5.2 Install Claude Code Plugins

#### Ralph Loop Plugin
This plugin enables iterative problem-solving workflows.

```bash
# Install the Ralph Loop plugin
claude code plugin install ralph-loop
```

### 5.3 Project-Level Settings

Create `.claude/settings.local.json` in your project root:

```json
{
  "permissions": {
    "allow": [
      "Edit",
      "Write",
      "Bash",
      "WebFetch",
      "WebSearch",
      "mcp__supabase__*",
      "mcp__chrome-devtools__*",
      "Skill(ralph-loop:ralph-loop)"
    ]
  }
}
```

This configuration:
- Grants permissions for file operations (Edit, Write)
- Enables shell commands (Bash)
- Allows web operations (WebFetch, WebSearch)
- Activates Supabase MCP tools
- Activates Chrome DevTools MCP tools
- Enables Ralph Loop plugin

### 5.4 Verify MCP Configuration

Check that MCPs are properly configured:

```bash
# List available MCPs
claude code mcp list

# Test Supabase MCP connection
claude code mcp test supabase
```

## 6. Run the Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## 7. Build for Production

```bash
npm run build
npm run start
```

## Project Structure Overview

```
├── .claude/                    # Claude Code configuration
│   ├── settings.local.json    # Project-level permissions
│   └── ralph-loop.local.md    # Ralph Loop state (if active)
├── src/
│   ├── app/                   # Next.js App Router
│   ├── components/            # React components
│   ├── lib/                   # Utilities and integrations
│   └── types/                 # TypeScript types
├── .env.local                 # Environment variables (not committed)
├── .env.example               # Environment template
├── CLAUDE.md                  # Project documentation for Claude
└── SETUP.md                   # This file
```

## Troubleshooting

### Database Connection Issues

If you encounter database connection errors:

1. Verify your `DATABASE_URL` is correct
2. Check that your Supabase project is running
3. Ensure your IP is allowed in Supabase project settings

### MCP Not Working

If MCPs aren't functioning:

```bash
# Reinstall MCPs
npx @supabase/mcp uninstall
npx @supabase/mcp install

# Check Claude Code version
claude code --version

# Update Claude Code if needed
npm install -g @anthropic-ai/claude-code@latest
```

### Authentication Issues

For demo/development mode:
- The app has a whitelisted demo email: `joel@pe-se.com`
- Check `src/middleware.ts` for auth bypass logic

### Stripe Webhook Issues

For local webhook testing:

```bash
# Install Stripe CLI
# Then forward webhooks to local server
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Update `STRIPE_WEBHOOK_SECRET` with the webhook signing secret from the CLI output.

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [Claude Code Documentation](https://github.com/anthropics/claude-code)
- [Dan Martell's "Buy Back Your Time"](https://buybackyourtime.com)

## Key Features to Test

After setup, verify these core features work:

1. **Authentication**: Sign up / Login
2. **Vision Creation**: Create a SMART goal vision
3. **Power Goals**: Generate 12 annual projects
4. **Time Audit**: Track time in 15-minute blocks
5. **AI Generation**: Test AI-powered features (requires ANTHROPIC_API_KEY)
6. **Google Calendar Sync**: Connect calendar (if configured)
7. **Subscription Tiers**: Test free/pro/premium gating

## Demo User

For testing without setting up authentication:
- Email: `joel@pe-se.com`
- This email bypasses some auth checks for development

## Support

For issues or questions:
1. Check existing GitHub issues
2. Review error logs in browser console and terminal
3. Verify all environment variables are set correctly
4. Ensure all services (Supabase, Stripe, etc.) are properly configured
