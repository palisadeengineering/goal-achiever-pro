'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { DRIP_QUADRANTS, ENERGY_RATINGS } from '@/constants/drip';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { DripQuadrant, EnergyRating } from '@/types/database';

interface HeatmapCell {
  dayOfWeek: number;
  hour: number;
  value: number;
  dominantEnergy: EnergyRating | null;
  dominantDrip: DripQuadrant | null;
  hoursLogged: number;
}

interface ProductivityHeatmapProps {
  data: HeatmapCell[];
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

type ColorMode = 'productivity' | 'energy' | 'drip';

export function ProductivityHeatmap({ data }: ProductivityHeatmapProps) {
  const [colorMode, setColorMode] = useState<ColorMode>('productivity');

  const getCellData = (day: number, hour: number): HeatmapCell | undefined => {
    return data.find((d) => d.dayOfWeek === day && d.hour === hour);
  };

  const getColor = (cell: HeatmapCell | undefined): string => {
    if (!cell || cell.value === 0) {
      return 'hsl(var(--muted))';
    }

    const intensity = Math.max(0.2, cell.value); // Minimum visibility

    if (colorMode === 'energy' && cell.dominantEnergy) {
      const color = ENERGY_RATINGS[cell.dominantEnergy].color;
      return `${color}${Math.round(intensity * 255).toString(16).padStart(2, '0')}`;
    }

    if (colorMode === 'drip' && cell.dominantDrip) {
      const color = DRIP_QUADRANTS[cell.dominantDrip].color;
      return `${color}${Math.round(intensity * 255).toString(16).padStart(2, '0')}`;
    }

    // Default productivity view (purple intensity)
    return `rgba(139, 92, 246, ${intensity})`;
  };

  const formatHour = (hour: number): string => {
    if (hour === 0) return '12a';
    if (hour === 12) return '12p';
    if (hour < 12) return `${hour}a`;
    return `${hour - 12}p`;
  };

  const hasData = data.some((cell) => cell.value > 0);

  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        <div className="text-center">
          <p>No time data available yet</p>
          <p className="text-sm mt-1">Start logging time blocks to see your patterns</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Color Mode Toggle */}
        <div className="flex gap-2">
          <Button
            variant={colorMode === 'productivity' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setColorMode('productivity')}
          >
            Productivity
          </Button>
          <Button
            variant={colorMode === 'energy' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setColorMode('energy')}
          >
            Energy
          </Button>
          <Button
            variant={colorMode === 'drip' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setColorMode('drip')}
          >
            DRIP
          </Button>
        </div>

        {/* Heatmap Grid */}
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            {/* Hour labels */}
            <div className="flex">
              <div className="w-12" /> {/* Empty corner */}
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="flex-1 text-center text-xs text-muted-foreground"
                  style={{ minWidth: '20px' }}
                >
                  {hour % 3 === 0 ? formatHour(hour) : ''}
                </div>
              ))}
            </div>

            {/* Data rows */}
            {DAYS.map((day, dayIndex) => (
              <div key={day} className="flex items-center">
                <div className="w-12 text-sm text-muted-foreground pr-2">{day}</div>
                <div className="flex flex-1 gap-0.5">
                  {HOURS.map((hour) => {
                    const cell = getCellData(dayIndex, hour);
                    const bgColor = getColor(cell);

                    return (
                      <Tooltip key={`${dayIndex}-${hour}`}>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              'h-6 flex-1 rounded-sm cursor-pointer transition-all hover:ring-2 hover:ring-primary hover:ring-offset-1',
                              !cell?.value && 'opacity-50'
                            )}
                            style={{
                              backgroundColor: bgColor,
                              minWidth: '20px',
                            }}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-sm">
                            <p className="font-medium">
                              {day} {formatHour(hour)}
                            </p>
                            {cell && cell.hoursLogged > 0 ? (
                              <>
                                <p>{cell.hoursLogged.toFixed(1)}h logged</p>
                                {cell.dominantDrip && (
                                  <p>
                                    Primary:{' '}
                                    <span
                                      style={{ color: DRIP_QUADRANTS[cell.dominantDrip].color }}
                                    >
                                      {DRIP_QUADRANTS[cell.dominantDrip].name}
                                    </span>
                                  </p>
                                )}
                                {cell.dominantEnergy && (
                                  <p>
                                    Energy:{' '}
                                    <span
                                      style={{ color: ENERGY_RATINGS[cell.dominantEnergy].color }}
                                    >
                                      {ENERGY_RATINGS[cell.dominantEnergy].name}
                                    </span>
                                  </p>
                                )}
                              </>
                            ) : (
                              <p className="text-muted-foreground">No data</p>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 justify-center text-sm">
          {colorMode === 'productivity' && (
            <>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: 'rgba(139, 92, 246, 0.2)' }}
                />
                <span>Low activity</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: 'rgba(139, 92, 246, 0.6)' }}
                />
                <span>Medium activity</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: 'rgba(139, 92, 246, 1)' }}
                />
                <span>High activity</span>
              </div>
            </>
          )}

          {colorMode === 'energy' && (
            <>
              {Object.entries(ENERGY_RATINGS).map(([key, rating]) => (
                <div key={key} className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: rating.color }}
                  />
                  <span>{rating.name}</span>
                </div>
              ))}
            </>
          )}

          {colorMode === 'drip' && (
            <>
              {Object.entries(DRIP_QUADRANTS).map(([key, quadrant]) => (
                <div key={key} className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: quadrant.color }}
                  />
                  <span>{quadrant.name}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
