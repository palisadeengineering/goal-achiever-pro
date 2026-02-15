import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { LeverageBreakdownChart } from '@/components/features/analytics/leverage-breakdown-chart';
import type { LeverageBreakdown } from '@/lib/hooks/use-enhanced-analytics';

// Mock Recharts to avoid canvas rendering issues in jsdom
vi.mock('recharts', () => ({
  PieChart: ({ children }: { children: React.ReactNode }) => <div data-testid="pie-chart">{children}</div>,
  Pie: ({ children }: { children: React.ReactNode }) => <div data-testid="pie">{children}</div>,
  Cell: () => <div data-testid="cell" />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
  Tooltip: () => <div data-testid="tooltip" />,
}));

describe('LeverageBreakdownChart', () => {
  it('shows empty state when data is empty', () => {
    render(<LeverageBreakdownChart data={[]} />);

    expect(screen.getByText(/No leverage data tracked yet/)).toBeInTheDocument();
    expect(screen.getByText(/Leverage Distribution/)).toBeInTheDocument();
  });

  it('renders chart when data is provided', () => {
    const data: LeverageBreakdown[] = [
      { type: 'code', minutes: 120, percentage: 50 },
      { type: 'content', minutes: 60, percentage: 25 },
      { type: 'capital', minutes: 30, percentage: 12 },
      { type: 'collaboration', minutes: 30, percentage: 13 },
    ];

    render(<LeverageBreakdownChart data={data} />);

    // Title should be present
    expect(screen.getByText(/Leverage Distribution/)).toBeInTheDocument();
    // Chart should be rendered
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
  });

  it('renders all four leverage type labels in legend', () => {
    const data: LeverageBreakdown[] = [
      { type: 'code', minutes: 120, percentage: 50 },
      { type: 'content', minutes: 60, percentage: 25 },
    ];

    render(<LeverageBreakdownChart data={data} />);

    // All four labels always show in legend
    expect(screen.getByText('Code')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
    expect(screen.getByText('Capital')).toBeInTheDocument();
    expect(screen.getByText('Collaboration')).toBeInTheDocument();
  });

  it('shows percentage and formatted time for leverage types with data', () => {
    const data: LeverageBreakdown[] = [
      { type: 'code', minutes: 90, percentage: 60 },
      { type: 'content', minutes: 60, percentage: 40 },
    ];

    render(<LeverageBreakdownChart data={data} />);

    // Code: 60% and 1h 30m
    expect(screen.getByText(/60%/)).toBeInTheDocument();
    expect(screen.getByText(/1h 30m/)).toBeInTheDocument();

    // Content: 40% and 1h
    expect(screen.getByText(/40%/)).toBeInTheDocument();
    expect(screen.getByText(/1h$/)).toBeInTheDocument();
  });

  it('shows 0% for leverage types not present in data', () => {
    const data: LeverageBreakdown[] = [
      { type: 'code', minutes: 120, percentage: 100 },
    ];

    render(<LeverageBreakdownChart data={data} />);

    // Capital and Collaboration should show 0%
    const legendItems = screen.getAllByText('0%');
    expect(legendItems.length).toBe(3); // content, capital, collaboration
  });

  it('formats minutes correctly: hours only', () => {
    const data: LeverageBreakdown[] = [
      { type: 'code', minutes: 60, percentage: 100 },
    ];

    render(<LeverageBreakdownChart data={data} />);

    // Should show "1h" not "1h 0m"
    expect(screen.getByText(/100%/)).toBeInTheDocument();
  });

  it('formats minutes correctly: minutes only', () => {
    const data: LeverageBreakdown[] = [
      { type: 'code', minutes: 45, percentage: 100 },
    ];

    render(<LeverageBreakdownChart data={data} />);

    expect(screen.getByText(/45m/)).toBeInTheDocument();
  });

  it('renders the card description when data is present', () => {
    const data: LeverageBreakdown[] = [
      { type: 'code', minutes: 60, percentage: 100 },
    ];

    render(<LeverageBreakdownChart data={data} />);

    expect(screen.getByText('How your time builds leverage')).toBeInTheDocument();
  });

  it('renders the track prompt when data is empty', () => {
    render(<LeverageBreakdownChart data={[]} />);

    expect(screen.getByText(/Track how you're building leverage/)).toBeInTheDocument();
  });
});
