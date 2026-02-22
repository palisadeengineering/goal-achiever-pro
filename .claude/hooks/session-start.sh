#!/bin/bash
set -euo pipefail

# Only run in Claude Code remote (web) sessions
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

echo "==> Installing npm dependencies..."
cd "$CLAUDE_PROJECT_DIR"

# Skip Puppeteer browser download (it's used for PDF generation, not E2E)
export PUPPETEER_SKIP_DOWNLOAD=true

# Install all dependencies (uses cache on subsequent runs)
npm install

echo "==> Installing Playwright browser..."
npx playwright install chromium --with-deps 2>/dev/null || {
  echo "WARN: Could not install Playwright browser. E2E tests may not work."
  echo "      Run 'npx playwright install chromium' manually if needed."
}

echo "==> Session startup complete."
