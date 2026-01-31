// Value Matrix constants and helpers
// Categorizes tasks by money/energy to optimize time allocation

import { ValueQuadrant, EnergyRating } from '@/types/database';

export const VALUE_QUADRANTS: Record<ValueQuadrant, {
  name: string;
  description: string;
  action: string;
  color: string;
  bgColor: string;
  borderColor: string;
  moneyLevel: 'low' | 'high' | null;
  energyLevel: 'low' | 'high' | null;
}> = {
  delegation: {
    name: 'Delegation',
    description: 'Low earning, low energy tasks',
    action: 'Delegate to others',
    color: '#ef4444', // Red (variant of Draining energy color)
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    borderColor: 'border-red-500 dark:border-red-400',
    moneyLevel: 'low',
    energyLevel: 'low',
  },
  replacement: {
    name: 'Replacement',
    description: 'High earning, low energy tasks',
    action: 'Automate or replace with systems',
    color: '#f59e0b', // Amber/Yellow-ish (more distinct from delegation red)
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    borderColor: 'border-amber-500 dark:border-amber-400',
    moneyLevel: 'high',
    energyLevel: 'low',
  },
  investment: {
    name: 'Investment',
    description: 'Low earning, high energy tasks',
    action: 'Keep for long-term growth',
    color: '#a855f7', // Purple (more distinct from other colors)
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    borderColor: 'border-purple-500 dark:border-purple-400',
    moneyLevel: 'low',
    energyLevel: 'high',
  },
  production: {
    name: 'Production',
    description: 'High earning, high energy tasks',
    action: 'Focus here! Your sweet spot',
    color: '#22c55e', // Green (variant of Energizing energy color)
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
    borderColor: 'border-cyan-500 dark:border-cyan-400',
    moneyLevel: 'high',
    energyLevel: 'high',
  },
  na: {
    name: 'N/A',
    description: 'Not applicable or uncategorized',
    action: 'Review later',
    color: '#3b82f6', // Blue (changed from gray for better visibility)
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    borderColor: 'border-blue-400 dark:border-blue-500',
    moneyLevel: null,
    energyLevel: null,
  },
};

export const ENERGY_RATINGS: Record<EnergyRating, {
  name: string;
  description: string;
  color: string;
  bgColor: string;
}> = {
  green: {
    name: 'Energizing',
    description: 'Gives you energy (amplifier)',
    color: '#22c55e',
    bgColor: 'bg-cyan-500',
  },
  yellow: {
    name: 'Neutral',
    description: 'Neither energizing nor draining',
    color: '#eab308',
    bgColor: 'bg-yellow-500',
  },
  red: {
    name: 'Draining',
    description: 'Drains your energy (vampire)',
    color: '#ef4444',
    bgColor: 'bg-red-500',
  },
};

// Helper to determine Value quadrant from money and energy scores
export function getValueQuadrant(moneyScore: number, energyScore: number): ValueQuadrant {
  const isHighMoney = moneyScore >= 6;
  const isHighEnergy = energyScore >= 6;

  if (!isHighMoney && !isHighEnergy) return 'delegation';
  if (isHighMoney && !isHighEnergy) return 'replacement';
  if (!isHighMoney && isHighEnergy) return 'investment';
  return 'production';
}

// Helper to get energy rating from score
export function getEnergyRating(score: number): EnergyRating {
  if (score >= 7) return 'green';
  if (score >= 4) return 'yellow';
  return 'red';
}

// Value quadrant icons (Lucide icon names)
export const VALUE_ICONS: Record<ValueQuadrant, string> = {
  delegation: 'Users',
  replacement: 'Cog',
  investment: 'TrendingUp',
  production: 'Zap',
  na: 'MinusCircle',
};

// Safe accessor for VALUE_QUADRANTS - handles invalid/corrupted keys from localStorage
export function getValueQuadrantConfig(quadrant: string | undefined | null) {
  if (!quadrant || !(quadrant in VALUE_QUADRANTS)) {
    return VALUE_QUADRANTS.na;
  }
  return VALUE_QUADRANTS[quadrant as ValueQuadrant];
}

// Safe accessor for ENERGY_RATINGS - handles invalid/corrupted keys from localStorage
export function getEnergyRatingConfig(rating: string | undefined | null) {
  if (!rating || !(rating in ENERGY_RATINGS)) {
    return ENERGY_RATINGS.yellow;
  }
  return ENERGY_RATINGS[rating as EnergyRating];
}

// Validate and sanitize a valueQuadrant string - returns valid key or default
export function validateValueQuadrant(quadrant: string | undefined | null): ValueQuadrant {
  if (!quadrant || !(quadrant in VALUE_QUADRANTS)) {
    return 'na';
  }
  return quadrant as ValueQuadrant;
}

// Validate and sanitize an energyRating string - returns valid key or default
export function validateEnergyRating(rating: string | undefined | null): EnergyRating {
  if (!rating || !(rating in ENERGY_RATINGS)) {
    return 'yellow';
  }
  return rating as EnergyRating;
}
