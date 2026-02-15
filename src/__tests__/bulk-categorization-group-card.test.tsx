import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';

// Mock TagInput
vi.mock('@/components/shared/tag-input', () => ({
  TagInput: (props: { placeholder?: string }) => (
    <div data-testid="tag-input">{props.placeholder}</div>
  ),
}));

import { GroupCard, type GroupedEvents } from '@/components/features/time-audit/bulk-categorization-view';
import type { GoogleCalendarEvent } from '@/lib/hooks/use-google-calendar';

const makeEvent = (id: string, summary: string): GoogleCalendarEvent => ({
  id,
  summary,
  description: '',
  startTime: '2026-02-10T09:00:00',
  endTime: '2026-02-10T10:00:00',
  start: { dateTime: '2026-02-10T09:00:00' },
  end: { dateTime: '2026-02-10T10:00:00' },
  isAllDay: false,
} as GoogleCalendarEvent);

const mockGroup: GroupedEvents = {
  pattern: 'team standup',
  events: [
    makeEvent('ev-1', 'Team Standup'),
    makeEvent('ev-2', 'Team Standup'),
  ],
  suggestion: null,
};

const defaultProps = {
  group: mockGroup,
  onApply: vi.fn(),
  onIgnore: vi.fn(),
  tags: [],
  onCreateTag: vi.fn().mockResolvedValue(null),
  onSearchTags: vi.fn().mockResolvedValue([]),
  detectedProjects: [
    { id: 'proj-1', name: 'Bridge Project' },
    { id: 'proj-2', name: 'Highway Design' },
  ],
};

describe('GroupCard - Redesigned with all-visible chips', () => {
  it('renders all Value Quadrant chips without any toggle', () => {
    render(<GroupCard {...defaultProps} />);

    expect(screen.getByText('Delegation')).toBeInTheDocument();
    expect(screen.getByText('Replacement')).toBeInTheDocument();
    expect(screen.getByText('Investment')).toBeInTheDocument();
    expect(screen.getByText('Production')).toBeInTheDocument();
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('renders all Energy Rating chips without any toggle', () => {
    render(<GroupCard {...defaultProps} />);

    expect(screen.getByText('Energizing')).toBeInTheDocument();
    expect(screen.getByText('Neutral')).toBeInTheDocument();
    expect(screen.getByText('Draining')).toBeInTheDocument();
  });

  it('renders Work Type chips directly (not dropdowns)', () => {
    render(<GroupCard {...defaultProps} />);

    // Spot-check several work type chips are visible as badges
    expect(screen.getByText('Design/Engineering')).toBeInTheDocument();
    expect(screen.getByText('Project Management')).toBeInTheDocument();
    expect(screen.getByText('Admin/Operations')).toBeInTheDocument();
    expect(screen.getByText('Finance')).toBeInTheDocument();
    // "Personal" appears in both Work Type and Project sections
    expect(screen.getAllByText('Personal').length).toBeGreaterThanOrEqual(2);

    // No combobox/select elements should exist
    expect(screen.queryAllByRole('combobox').length).toBe(0);
  });

  it('renders Leverage Type chips with icons directly (not dropdowns)', () => {
    render(<GroupCard {...defaultProps} />);

    expect(screen.getByText('Not leverage work')).toBeInTheDocument();
    expect(screen.getByText('Code')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
    expect(screen.getByText('Capital')).toBeInTheDocument();
    expect(screen.getByText('Collaboration')).toBeInTheDocument();
  });

  it('renders Project chips including Personal, detected projects, and + New', () => {
    render(<GroupCard {...defaultProps} />);

    // "Personal" appears in both Work Type and Project sections
    expect(screen.getAllByText('Personal').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Bridge Project')).toBeInTheDocument();
    expect(screen.getByText('Highway Design')).toBeInTheDocument();
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('does NOT have the old advanced toggle button', () => {
    render(<GroupCard {...defaultProps} />);

    expect(screen.queryByText(/Show project, work type, leverage/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Hide project, work type, leverage/i)).not.toBeInTheDocument();
  });

  it('renders TagInput for tags', () => {
    render(<GroupCard {...defaultProps} />);

    expect(screen.getByTestId('tag-input')).toBeInTheDocument();
  });

  it('shows new project input when + New chip is clicked', async () => {
    render(<GroupCard {...defaultProps} />);

    const newChip = screen.getByText('New');
    await act(async () => {
      fireEvent.click(newChip);
    });

    expect(screen.getByPlaceholderText('Type project name...')).toBeInTheDocument();
  });

  it('toggles work type chip selection on click', async () => {
    render(<GroupCard {...defaultProps} />);

    const chip = screen.getByText('Finance');
    const getBadge = () => chip.closest('.cursor-pointer');

    // Click to select
    await act(async () => {
      fireEvent.click(chip);
    });
    expect(getBadge()?.className).toContain('ring-2');

    // Click again to deselect
    await act(async () => {
      fireEvent.click(chip);
    });
    expect(getBadge()?.className).not.toContain('ring-2');
  });

  it('toggles leverage type chip selection on click', async () => {
    render(<GroupCard {...defaultProps} />);

    const chip = screen.getByText('Code');
    const getBadge = () => chip.closest('.cursor-pointer');

    await act(async () => {
      fireEvent.click(chip);
    });
    expect(getBadge()?.className).toContain('ring-2');

    await act(async () => {
      fireEvent.click(chip);
    });
    expect(getBadge()?.className).not.toContain('ring-2');
  });

  it('selects a project chip on click', async () => {
    render(<GroupCard {...defaultProps} />);

    const projectChip = screen.getByText('Bridge Project');
    const getBadge = () => projectChip.closest('.cursor-pointer');

    await act(async () => {
      fireEvent.click(projectChip);
    });
    expect(getBadge()?.className).toContain('ring-2');
  });

  it('renders section labels for all categories', () => {
    render(<GroupCard {...defaultProps} />);

    expect(screen.getByText('Value Quadrant')).toBeInTheDocument();
    expect(screen.getByText('Energy')).toBeInTheDocument();
    expect(screen.getByText('Project')).toBeInTheDocument();
    expect(screen.getByText('Task Type')).toBeInTheDocument();
    expect(screen.getByText('Work Type')).toBeInTheDocument();
    expect(screen.getByText('Leverage Type')).toBeInTheDocument();
    expect(screen.getByText('Tags')).toBeInTheDocument();
  });
});

describe('GroupCard - Task Type (Activity Type) chips', () => {
  it('renders all 7 Activity Type chips', () => {
    render(<GroupCard {...defaultProps} />);

    expect(screen.getByText('Project Work')).toBeInTheDocument();
    expect(screen.getByText('Meeting')).toBeInTheDocument();
    expect(screen.getByText('Deep Work')).toBeInTheDocument();
    expect(screen.getByText('Commute')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('Break')).toBeInTheDocument();
    expect(screen.getByText('Other')).toBeInTheDocument();
  });

  it('toggles task type chip selection on click', async () => {
    render(<GroupCard {...defaultProps} />);

    const chip = screen.getByText('Deep Work');
    const getBadge = () => chip.closest('.cursor-pointer');

    // Click to select
    await act(async () => {
      fireEvent.click(chip);
    });
    expect(getBadge()?.className).toContain('ring-2');

    // Click again to deselect
    await act(async () => {
      fireEvent.click(chip);
    });
    expect(getBadge()?.className).not.toContain('ring-2');
  });

  it('only allows one task type to be selected at a time', async () => {
    render(<GroupCard {...defaultProps} />);

    const meetingChip = screen.getByText('Meeting');
    const deepWorkChip = screen.getByText('Deep Work');

    // Select Meeting
    await act(async () => {
      fireEvent.click(meetingChip);
    });
    expect(meetingChip.closest('.cursor-pointer')?.className).toContain('ring-2');

    // Select Deep Work — Meeting should deselect
    await act(async () => {
      fireEvent.click(deepWorkChip);
    });
    expect(deepWorkChip.closest('.cursor-pointer')?.className).toContain('ring-2');
    expect(meetingChip.closest('.cursor-pointer')?.className).not.toContain('ring-2');
  });

  it('renders the "Task Type" label', () => {
    render(<GroupCard {...defaultProps} />);

    expect(screen.getByText('Task Type')).toBeInTheDocument();
  });
});
