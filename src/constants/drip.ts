// DRIP Matrix constants and helpers

import { DripQuadrant, EnergyRating } from '@/types/database';

export const DRIP_QUADRANTS: Record<DripQuadrant, {
  name: string;
  description: string;
  action: string;
  color: string;
  bgColor: string;
  borderColor: string;
  moneyLevel: 'low' | 'high';
  energyLevel: 'low' | 'high';
}> = {
  delegation: {
    name: 'Delegation',
    description: 'Low earning, low energy tasks',
    action: 'Delegate to others',
    color: '#9333ea', // Purple
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    borderColor: 'border-purple-500 dark:border-purple-400',
    moneyLevel: 'low',
    energyLevel: 'low',
  },
  replacement: {
    name: 'Replacement',
    description: 'High earning, low energy tasks',
    action: 'Automate or replace with systems',
    color: '#f97316', // Orange
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    borderColor: 'border-orange-500 dark:border-orange-400',
    moneyLevel: 'high',
    energyLevel: 'low',
  },
  investment: {
    name: 'Investment',
    description: 'Low earning, high energy tasks',
    action: 'Keep for long-term growth',
    color: '#3b82f6', // Blue
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    borderColor: 'border-blue-500 dark:border-blue-400',
    moneyLevel: 'low',
    energyLevel: 'high',
  },
  production: {
    name: 'Production',
    description: 'High earning, high energy tasks',
    action: 'Focus here! Your sweet spot',
    color: '#22c55e', // Green
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    borderColor: 'border-green-500 dark:border-green-400',
    moneyLevel: 'high',
    energyLevel: 'high',
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
    bgColor: 'bg-green-500',
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

// Helper to determine DRIP quadrant from money and energy scores
export function getDripQuadrant(moneyScore: number, energyScore: number): DripQuadrant {
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

// DRIP quadrant icons (Lucide icon names)
export const DRIP_ICONS: Record<DripQuadrant, string> = {
  delegation: 'Users',
  replacement: 'Cog',
  investment: 'TrendingUp',
  production: 'Zap',
};
