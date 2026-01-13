# Quick Start: Setting Up on a New Computer

This is a condensed checklist for quickly setting up Goal Achiever Pro on a new computer. For detailed instructions, see [SETUP.md](./SETUP.md).

## Prerequisites Checklist

- [ ] Node.js v20+ installed
- [ ] Git installed
- [ ] npm updated to latest version

## 1. Clone & Install (5 minutes)

```bash
git clone <your-repo-url>
cd goal-achiever-pro
npm install
```

## 2. Environment Setup (10 minutes)

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

### Required
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `DATABASE_URL`
- [ ] `ANTHROPIC_API_KEY`
- [ ] `STRIPE_SECRET_KEY`
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`

### Optional
- [ ] `GOOGLE_CLIENT_ID`
- [ ] `GOOGLE_CLIENT_SECRET`

## 3. Database Setup (2 minutes)

```bash
npx drizzle-kit push
```

## 4. Claude Code Setup (5 minutes)

### Install Claude Code CLI
```bash
npm install -g @anthropic-ai/claude-code
claude code auth login
```

### Install MCPs
```bash
# Supabase MCP
npx @supabase/mcp install

# Chrome DevTools MCP
npx @modelcontextprotocol/server-chrome-devtools install
```

### Install Plugins
```bash
# Ralph Loop Plugin
claude code plugin install ralph-loop
```

### Verify Configuration
The `.claude/settings.json` file is already in the repo and will be automatically used.

## 5. Run the App (1 minute)

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 6. Verify Everything Works

- [ ] App loads without errors
- [ ] Can create/login to account
- [ ] Can create a Vision
- [ ] AI features work (generate Power Goals, etc.)
- [ ] Database operations work

## What's Already in the Repo

These files are committed and ready to use:
- `.claude/settings.json` - Claude Code permissions
- `.claude/README.md` - Claude configuration docs
- `.env.example` - Environment variable template
- `CLAUDE.md` - Project summary for Claude
- `SETUP.md` - Detailed setup guide
- `CLAUDE_CODE_SETUP.md` - Claude Code specific setup
- `NEW_COMPUTER_SETUP.md` - This quick start guide

## Common Issues

### Database Connection Error
- Verify `DATABASE_URL` is correct
- Check Supabase project is running
- Ensure IP is whitelisted in Supabase

### AI Features Not Working
- Verify `ANTHROPIC_API_KEY` is set
- Check API key is valid at console.anthropic.com

### MCPs Not Working
```bash
claude code mcp list  # Should show supabase and chrome-devtools
```

If not listed, reinstall:
```bash
npx @supabase/mcp uninstall && npx @supabase/mcp install
```

## Total Setup Time

**Estimated: 25-30 minutes** (excluding service signup time)

- Clone & Install: ~5 min
- Environment Setup: ~10 min
- Database Setup: ~2 min
- Claude Code Setup: ~5 min
- Run & Verify: ~5 min

## Next Steps

After setup is complete:
1. Read [CLAUDE.md](./CLAUDE.md) for project overview
2. Explore the codebase structure in `src/`
3. Check out the features in the app
4. Review any pending issues or todos

## Need Help?

- Detailed setup: [SETUP.md](./SETUP.md)
- Claude Code setup: [CLAUDE_CODE_SETUP.md](./CLAUDE_CODE_SETUP.md)
- Project overview: [CLAUDE.md](./CLAUDE.md)
- Git issues: Check git status and recent commits
