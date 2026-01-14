# Backtrack Planning Wizard - Fix Plan

## Issue
The Backtrack Planning Wizard shows "Failed to parse AI response" error when clicking "Generate Backtrack Plan".

## Error Location
- **UI**: Backtrack Planning Wizard modal (Step 2: Generate)
- **Endpoint**: `/api/ai/generate-backtrack` (`src/app/api/ai/generate-backtrack/route.ts`)

## Problem Analysis
1. The AI generates a massive JSON response (25,000+ characters)
2. JSON parsing fails due to:
   - Truncated responses (max_tokens limit hit)
   - Malformed JSON from AI (trailing commas, unclosed brackets)
   - Response too complex for reliable parsing

## Attempted Fixes (did not fully resolve)
1. Reduced daily actions from 50 to 25
2. Added JSON repair logic for truncated responses
3. Added detailed logging
4. Made prompt stricter about JSON-only output

## Next Steps to Try

### 1. Check Server Logs
```bash
# Look at the Next.js dev server console for detailed error output
# The endpoint now logs:
# - Raw AI response (first 1000 chars)
# - JSON extraction method used
# - Parsed content preview
# - Detailed parse errors
```

### 2. Reduce Response Complexity Further
In `src/app/api/ai/generate-backtrack/route.ts`:
- Reduce `max_tokens` from 8000 to 4000
- Reduce daily actions from 25 to 15
- Reduce weekly targets from 8 to 4
- Simplify the prompt structure

### 3. Use Streaming Response
Convert to streaming to handle large responses better:
```typescript
// Consider using streaming API instead of waiting for full response
const stream = await anthropic.messages.stream({...})
```

### 4. Split into Multiple API Calls
Break the generation into phases:
1. Generate quarterly targets + power goals (first call)
2. Generate monthly + weekly targets (second call)
3. Generate daily actions (third call)

### 5. Test the Endpoint Directly
```bash
curl -X POST http://localhost:3000/api/ai/generate-backtrack \
  -H "Content-Type: application/json" \
  -d '{
    "visionId": "67068c1e-bdef-47f5-a881-8d7fd909d0db",
    "vision": "Build a $1M structural engineering firm",
    "smartGoals": {"specific": "Build 5 engineers", "measurable": "$1M revenue"},
    "targetDate": "2026-12-31",
    "startDate": "2025-01-13",
    "availableHoursPerWeek": 20,
    "saveToDatabase": false
  }'
```

### 6. Check Frontend Error Handling
Look at the component calling this endpoint:
- Search for `generate-backtrack` in components
- Check if there's a timeout on the frontend fetch
- Ensure error state is properly displayed

## Files to Investigate
- `src/app/api/ai/generate-backtrack/route.ts` - API endpoint
- `src/components/features/backtrack/` - UI components (if exists)
- Search for "BacktrackPlanningWizard" or "backtrack" in components

## Related Context
- Vision ID: `67068c1e-bdef-47f5-a881-8d7fd909d0db`
- Vision: "Build a $1M structural engineering firm with a team of 5 licensed engineers..."
- The endpoint worked in CLI testing but fails in UI - could be timeout or frontend issue
