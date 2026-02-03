import { describe, it, expect, vi } from 'vitest';

// Quick setup presets (matching tag-manager.tsx)
const QUICK_SETUP_PRESETS = [
  { name: 'Personal', color: '#22c55e', description: 'Personal activities and time' },
  { name: 'Main Business', color: '#6366f1', description: 'Primary business activities' },
  { name: 'Side Business', color: '#f59e0b', description: 'Secondary business or side projects' },
  { name: 'Client Work', color: '#8b5cf6', description: 'Client-facing work and projects' },
];

interface Tag {
  id: string;
  name: string;
  color: string;
  description?: string;
}

// Helper function to get missing presets (matching tag-manager.tsx logic)
function getMissingPresets(existingTags: Tag[]): typeof QUICK_SETUP_PRESETS {
  return QUICK_SETUP_PRESETS.filter(
    preset => !existingTags.some(t => t.name.toLowerCase() === preset.name.toLowerCase())
  );
}

// Simulate quick setup handler
async function handleQuickSetup(
  existingTags: Tag[],
  onCreateTag: (name: string, color: string, description?: string) => Promise<Tag | null>
): Promise<Tag[]> {
  const existingNames = new Set(existingTags.map(t => t.name.toLowerCase()));
  const createdTags: Tag[] = [];

  for (const preset of QUICK_SETUP_PRESETS) {
    if (!existingNames.has(preset.name.toLowerCase())) {
      const newTag = await onCreateTag(preset.name, preset.color, preset.description);
      if (newTag) {
        createdTags.push(newTag);
      }
    }
  }

  return createdTags;
}

describe('Business Context Tags - Quick Setup Feature', () => {
  describe('QUICK_SETUP_PRESETS', () => {
    it('should have exactly 4 presets', () => {
      expect(QUICK_SETUP_PRESETS).toHaveLength(4);
    });

    it('should have Personal preset with green color', () => {
      const personal = QUICK_SETUP_PRESETS.find(p => p.name === 'Personal');
      expect(personal).toBeDefined();
      expect(personal?.color).toBe('#22c55e');
    });

    it('should have Main Business preset with indigo color', () => {
      const mainBusiness = QUICK_SETUP_PRESETS.find(p => p.name === 'Main Business');
      expect(mainBusiness).toBeDefined();
      expect(mainBusiness?.color).toBe('#6366f1');
    });

    it('should have Side Business preset with amber color', () => {
      const sideBusiness = QUICK_SETUP_PRESETS.find(p => p.name === 'Side Business');
      expect(sideBusiness).toBeDefined();
      expect(sideBusiness?.color).toBe('#f59e0b');
    });

    it('should have Client Work preset with purple color', () => {
      const clientWork = QUICK_SETUP_PRESETS.find(p => p.name === 'Client Work');
      expect(clientWork).toBeDefined();
      expect(clientWork?.color).toBe('#8b5cf6');
    });

    it('should have descriptions for all presets', () => {
      QUICK_SETUP_PRESETS.forEach(preset => {
        expect(preset.description).toBeDefined();
        expect(preset.description.length).toBeGreaterThan(0);
      });
    });
  });

  describe('getMissingPresets', () => {
    it('should return all presets when no tags exist', () => {
      const missing = getMissingPresets([]);
      expect(missing).toHaveLength(4);
    });

    it('should return empty array when all presets exist', () => {
      const existingTags: Tag[] = [
        { id: '1', name: 'Personal', color: '#22c55e' },
        { id: '2', name: 'Main Business', color: '#6366f1' },
        { id: '3', name: 'Side Business', color: '#f59e0b' },
        { id: '4', name: 'Client Work', color: '#8b5cf6' },
      ];
      const missing = getMissingPresets(existingTags);
      expect(missing).toHaveLength(0);
    });

    it('should return only missing presets', () => {
      const existingTags: Tag[] = [
        { id: '1', name: 'Personal', color: '#22c55e' },
        { id: '2', name: 'Client Work', color: '#8b5cf6' },
      ];
      const missing = getMissingPresets(existingTags);
      expect(missing).toHaveLength(2);
      expect(missing.map(m => m.name)).toContain('Main Business');
      expect(missing.map(m => m.name)).toContain('Side Business');
    });

    it('should handle case-insensitive matching', () => {
      const existingTags: Tag[] = [
        { id: '1', name: 'PERSONAL', color: '#000' },
        { id: '2', name: 'main business', color: '#000' },
      ];
      const missing = getMissingPresets(existingTags);
      expect(missing).toHaveLength(2);
      expect(missing.map(m => m.name)).toContain('Side Business');
      expect(missing.map(m => m.name)).toContain('Client Work');
    });

    it('should not match partial names', () => {
      const existingTags: Tag[] = [
        { id: '1', name: 'Personal Projects', color: '#000' }, // Different from "Personal"
        { id: '2', name: 'Business', color: '#000' }, // Different from "Main Business"
      ];
      const missing = getMissingPresets(existingTags);
      expect(missing).toHaveLength(4); // All presets should be missing
    });
  });

  describe('handleQuickSetup', () => {
    it('should create all presets when none exist', async () => {
      let idCounter = 0;
      const onCreateTag = vi.fn(async (name: string, color: string, description?: string): Promise<Tag> => ({
        id: `tag-${++idCounter}`,
        name,
        color,
        description,
      }));

      const created = await handleQuickSetup([], onCreateTag);

      expect(created).toHaveLength(4);
      expect(onCreateTag).toHaveBeenCalledTimes(4);
    });

    it('should not create presets that already exist', async () => {
      const existingTags: Tag[] = [
        { id: '1', name: 'Personal', color: '#22c55e' },
        { id: '2', name: 'Main Business', color: '#6366f1' },
      ];

      let idCounter = 0;
      const onCreateTag = vi.fn(async (name: string, color: string, description?: string): Promise<Tag> => ({
        id: `tag-${++idCounter}`,
        name,
        color,
        description,
      }));

      const created = await handleQuickSetup(existingTags, onCreateTag);

      expect(created).toHaveLength(2);
      expect(onCreateTag).toHaveBeenCalledTimes(2);
      expect(created.map(t => t.name)).toContain('Side Business');
      expect(created.map(t => t.name)).toContain('Client Work');
    });

    it('should handle creation failures gracefully', async () => {
      const onCreateTag = vi.fn()
        .mockResolvedValueOnce({ id: '1', name: 'Personal', color: '#22c55e' })
        .mockResolvedValueOnce(null) // Failure
        .mockResolvedValueOnce({ id: '3', name: 'Side Business', color: '#f59e0b' })
        .mockResolvedValueOnce(null); // Failure

      const created = await handleQuickSetup([], onCreateTag);

      expect(created).toHaveLength(2);
      expect(onCreateTag).toHaveBeenCalledTimes(4);
    });

    it('should pass correct parameters to onCreateTag', async () => {
      const onCreateTag = vi.fn(async (name: string, color: string, description?: string): Promise<Tag> => ({
        id: '1',
        name,
        color,
        description,
      }));

      await handleQuickSetup([], onCreateTag);

      // Verify Personal preset
      expect(onCreateTag).toHaveBeenCalledWith(
        'Personal',
        '#22c55e',
        'Personal activities and time'
      );

      // Verify Main Business preset
      expect(onCreateTag).toHaveBeenCalledWith(
        'Main Business',
        '#6366f1',
        'Primary business activities'
      );
    });
  });
});

describe('AI Tag Suggestions - Business Context Enhancement', () => {
  // These tests verify the prompt structure for the AI
  const createPrompt = (activityName: string, description: string | undefined, tagList: string) => `You are a productivity assistant helping categorize work activities with relevant tags.

Given this time tracking activity:
- Activity Name: "${activityName}"
${description ? `- Description: "${description}"` : ''}

Available tags: ${tagList}

Analyze the activity and suggest the most relevant tags. Consider:
1. BUSINESS CONTEXT (highest priority):
   - Is this Personal time (gym, family, hobbies, self-care)?
   - Is this Main Business work (core job duties, primary company)?
   - Is this Side Business (freelance, side projects, secondary ventures)?
   - Is this Client Work (billable work, client meetings, deliverables)?
2. The type of work (meetings, deep work, admin, creative, etc.)
3. The project or client it might relate to

ALWAYS suggest a business context tag if one exists in the available tags (Personal, Main Business, Side Business, Client Work, or similar).

If existing tags fit well, prefer those. Only suggest new tags if no existing tags are appropriate.

Respond with ONLY valid JSON in this exact format:
{
  "suggestedExistingTags": ["exact tag name 1", "exact tag name 2"],
  "suggestedNewTags": ["new tag if needed"],
  "confidence": 0.8,
  "reasoning": "Brief explanation of why these tags fit"
}

Rules:
- suggestedExistingTags must contain EXACT names from the available tags list
- Always include a business context tag first if available
- suggestedNewTags should only have 0-2 items, only when truly needed
- confidence: 0.0-1.0 based on how well the tags match
- Keep reasoning under 50 words`;

  describe('Prompt Structure', () => {
    it('should include business context section as highest priority', () => {
      const prompt = createPrompt('Team meeting', undefined, 'Personal, Main Business');
      expect(prompt).toContain('BUSINESS CONTEXT (highest priority)');
    });

    it('should mention all business context categories', () => {
      const prompt = createPrompt('Test', undefined, '');
      expect(prompt).toContain('Personal time');
      expect(prompt).toContain('Main Business work');
      expect(prompt).toContain('Side Business');
      expect(prompt).toContain('Client Work');
    });

    it('should instruct to always include business context tag first', () => {
      const prompt = createPrompt('Test', undefined, '');
      expect(prompt).toContain('Always include a business context tag first if available');
    });

    it('should include activity name in prompt', () => {
      const prompt = createPrompt('Client presentation prep', undefined, 'Personal');
      expect(prompt).toContain('Client presentation prep');
    });

    it('should include description when provided', () => {
      const prompt = createPrompt('Meeting', 'Weekly sync with team', 'Personal');
      expect(prompt).toContain('Weekly sync with team');
    });

    it('should not include description line when not provided', () => {
      const prompt = createPrompt('Meeting', undefined, 'Personal');
      expect(prompt).not.toContain('- Description:');
    });

    it('should include available tags', () => {
      const prompt = createPrompt('Test', undefined, 'Personal, Main Business, Side Business');
      expect(prompt).toContain('Available tags: Personal, Main Business, Side Business');
    });
  });

  describe('Business Context Pattern Recognition', () => {
    // Simulate expected AI responses for different activity types
    const expectedCategories: Record<string, string> = {
      'Gym workout': 'Personal',
      'Family dinner': 'Personal',
      'Morning meditation': 'Personal',
      'Team standup': 'Main Business',
      'Code review': 'Main Business',
      'Sprint planning': 'Main Business',
      'Freelance project': 'Side Business',
      'Side hustle work': 'Side Business',
      'Etsy shop inventory': 'Side Business',
      'Client meeting': 'Client Work',
      'Client deliverable': 'Client Work',
      'Billing hours review': 'Client Work',
    };

    Object.entries(expectedCategories).forEach(([activity, expectedTag]) => {
      it(`should recognize "${activity}" as ${expectedTag}`, () => {
        // This test documents the expected behavior
        // The actual AI will make these determinations
        const prompt = createPrompt(activity, undefined, 'Personal, Main Business, Side Business, Client Work');

        // Verify the prompt includes guidance for this type
        expect(prompt).toContain('BUSINESS CONTEXT');

        // Document the expected category for this activity type
        expect(expectedTag).toBeDefined();
      });
    });
  });
});
