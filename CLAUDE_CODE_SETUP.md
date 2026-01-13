# Claude Code Setup Guide

This document outlines the specific Claude Code configuration for the Goal Achiever Pro project.

## MCPs (Model Context Protocols)

MCPs extend Claude Code's capabilities by providing specialized tools for different services.

### 1. Supabase MCP

Provides tools for interacting with your Supabase database and services.

**Installation:**
```bash
npx @supabase/mcp install
```

**Tools Provided:**
- `search_docs` - Search Supabase documentation
- `list_tables` - List database tables
- `list_extensions` - List database extensions
- `list_migrations` - List database migrations
- `apply_migration` - Apply database migrations
- `execute_sql` - Execute SQL queries
- `get_logs` - Get project logs
- `get_advisors` - Get security/performance advisories
- `get_project_url` - Get API URL
- `get_publishable_keys` - Get API keys
- `generate_typescript_types` - Generate TypeScript types
- Edge Function management tools
- Branch management tools (development branches)

**Usage in Claude Code:**
Once installed, these tools are available with the `mcp__supabase__*` prefix.

### 2. Chrome DevTools MCP

Enables browser automation and testing capabilities.

**Installation:**
```bash
npx @modelcontextprotocol/server-chrome-devtools install
```

**Tools Provided:**
- Browser page management (list, create, navigate, close)
- Element interaction (click, fill, hover, drag)
- Screenshots and snapshots
- Console and network request inspection
- Performance tracing
- Script evaluation
- Dialog handling
- And many more...

**Usage in Claude Code:**
Once installed, these tools are available with the `mcp__chrome-devtools__*` prefix.

## Claude Code Plugins

### Ralph Loop Plugin

The Ralph Loop plugin enables iterative, systematic problem-solving workflows. It's particularly useful for complex debugging and feature implementation tasks.

**Installation:**
```bash
claude code plugin install ralph-loop
```

**Usage:**
The Ralph Loop plugin can be invoked using the `/ralph-loop` command or via the Skill tool.

**Configuration:**
Loop parameters are stored in `.claude/ralph-loop.local.md` and include:
- `active`: Whether loop is running
- `iteration`: Current iteration number
- `max_iterations`: Maximum iterations (0 = unlimited)
- `completion_promise`: Criteria for completion
- `started_at`: Timestamp when loop started

**Example Ralph Loop Configuration:**
```yaml
---
active: true
iteration: 1
max_iterations: 10
completion_promise: "All tests pass and feature is complete"
started_at: "2026-01-12T22:33:08Z"
---

ROLE: You are Claude Code operating inside the Goal Achiever Pro repo.
TASK: [Your task description]

[Task details and requirements...]
```

## Project-Level Permissions

The `.claude/settings.local.json` file configures permissions for the project.

**Current Configuration:**
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

**Permission Breakdown:**
- `Edit` - Allows Claude to edit existing files
- `Write` - Allows Claude to create new files
- `Bash` - Allows Claude to execute shell commands
- `WebFetch` - Allows Claude to fetch web content
- `WebSearch` - Allows Claude to search the web
- `mcp__supabase__*` - Grants access to all Supabase MCP tools
- `mcp__chrome-devtools__*` - Grants access to all Chrome DevTools MCP tools
- `Skill(ralph-loop:ralph-loop)` - Allows Ralph Loop plugin execution

## Setting Up Claude Code on New Computer

### Step 1: Install Claude Code CLI

Follow the official installation guide:
```bash
npm install -g @anthropic-ai/claude-code
```

Or visit: https://github.com/anthropics/claude-code

### Step 2: Configure Claude Code

Sign in to Claude Code:
```bash
claude code auth login
```

### Step 3: Install MCPs

Install the required MCPs in the project directory:

```bash
# Navigate to project root
cd goal-achiever-pro

# Install Supabase MCP
npx @supabase/mcp install

# Install Chrome DevTools MCP
npx @modelcontextprotocol/server-chrome-devtools install
```

### Step 4: Install Plugins

```bash
# Install Ralph Loop plugin
claude code plugin install ralph-loop
```

### Step 5: Copy Project Configuration

The project configuration is already in the repository:
- `.claude/settings.local.json` - Project permissions

These files should be automatically used when you open Claude Code in the project directory.

### Step 6: Verify Setup

Start Claude Code in the project:
```bash
claude code
```

Then test the MCPs:
```
# In Claude Code chat
Can you list the Supabase tables?
```

If the MCP is working, Claude will use the `mcp__supabase__list_tables` tool.

## Troubleshooting

### MCPs Not Available

If MCPs aren't showing up:

1. **Check installation:**
   ```bash
   claude code mcp list
   ```

2. **Reinstall MCPs:**
   ```bash
   npx @supabase/mcp uninstall
   npx @supabase/mcp install
   ```

3. **Check permissions in `.claude/settings.local.json`**

### Ralph Loop Not Working

If Ralph Loop isn't functioning:

1. **Verify plugin installation:**
   ```bash
   claude code plugin list
   ```

2. **Reinstall plugin:**
   ```bash
   claude code plugin uninstall ralph-loop
   claude code plugin install ralph-loop
   ```

3. **Check permission in `.claude/settings.local.json`:**
   - Ensure `"Skill(ralph-loop:ralph-loop)"` is in the allow list

### Permission Denied Errors

If you get permission errors:

1. Check `.claude/settings.local.json` exists
2. Verify the tool you're trying to use is in the `allow` list
3. Restart Claude Code

## Best Practices

### When to Use Supabase MCP

- Database schema exploration
- Running migrations
- Querying data during development
- Generating TypeScript types
- Checking security advisories
- Managing Edge Functions

### When to Use Chrome DevTools MCP

- Testing UI interactions
- Debugging visual issues
- Automated testing workflows
- Performance profiling
- Screenshot capture for documentation

### When to Use Ralph Loop

- Complex multi-step debugging
- Systematic feature implementation
- Iterative problem-solving with clear completion criteria
- Tasks requiring multiple verification cycles

## Additional Resources

- [Claude Code Documentation](https://github.com/anthropics/claude-code)
- [MCP Protocol Specification](https://modelcontextprotocol.io)
- [Supabase MCP Documentation](https://supabase.com/docs/guides/ai/mcp)
- [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/)

## Environment-Specific Notes

### Windows
- Use PowerShell or Git Bash for commands
- Path separators use backslashes `\`
- npm scripts work the same

### macOS/Linux
- Use Terminal or your preferred shell
- Path separators use forward slashes `/`
- May need `sudo` for global npm installs

## Updating Claude Code and MCPs

### Update Claude Code
```bash
npm update -g @anthropic-ai/claude-code
```

### Update MCPs
```bash
# Supabase MCP
npx @supabase/mcp update

# Chrome DevTools MCP
npx @modelcontextprotocol/server-chrome-devtools update
```

### Update Plugins
```bash
claude code plugin update ralph-loop
```
