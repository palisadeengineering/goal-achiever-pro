# Claude Code Configuration

This directory contains configuration files for Claude Code.

## Files

### `settings.json` (Committed)
Template configuration that should be committed to the repository. Contains the standard permissions and MCP configurations for this project.

### `settings.local.json` (Not Committed)
Local overrides for machine-specific settings. This file is ignored by git and can be used to customize permissions on your local machine without affecting the team configuration.

### `ralph-loop.local.md` (Not Committed)
Active Ralph Loop session state. This file is automatically created and managed by the Ralph Loop plugin during active loops. It's not committed to git as it contains session-specific information.

## Setup on New Computer

1. The `settings.json` file will be automatically used when you clone the repository
2. If you need machine-specific overrides, create `settings.local.json` (it will take precedence)
3. The Ralph Loop plugin will create `ralph-loop.local.md` automatically when you start a loop

## Required MCPs

This project requires the following MCPs to be installed:

1. **Supabase MCP**
   ```bash
   npx @supabase/mcp install
   ```

2. **Chrome DevTools MCP**
   ```bash
   npx @modelcontextprotocol/server-chrome-devtools install
   ```

## Required Plugins

1. **Ralph Loop Plugin**
   ```bash
   claude code plugin install ralph-loop
   ```

See `../CLAUDE_CODE_SETUP.md` for complete setup instructions.
