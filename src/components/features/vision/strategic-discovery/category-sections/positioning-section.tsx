'use client';

import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { PositioningData, MarketSize } from '@/types/strategic-discovery';

interface PositioningSectionProps {
  data: PositioningData;
  onUpdate: (updates: Partial<PositioningData>) => void;
}

const MARKET_SIZES: { value: MarketSize; label: string; description: string; tam: string }[] = [
  { value: 'niche', label: 'Niche', description: 'Specific vertical or use case', tam: '<$100M' },
  { value: 'medium', label: 'Medium', description: 'Growing market with competition', tam: '$100M-$1B' },
  { value: 'large', label: 'Large', description: 'Established market, many players', tam: '$1B-$10B' },
  { value: 'massive', label: 'Massive', description: 'Horizontal play, huge TAM', tam: '>$10B' },
];

export function PositioningSection({ data, onUpdate }: PositioningSectionProps) {
  const completedFields = [
    data.targetCustomer,
    data.problemSolved,
    data.differentiator,
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {completedFields} of 3 required fields completed
        </span>
        {completedFields === 3 && (
          <Badge className="bg-cyan-100 text-cyan-700">Complete</Badge>
        )}
      </div>

      {/* Target Customer */}
      <div className="space-y-2">
        <Label htmlFor="target-customer">
          Target Customer <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="target-customer"
          placeholder="e.g., SaaS founders with $10K-100K MRR who struggle with time management and feel overwhelmed by operational tasks"
          value={data.targetCustomer}
          onChange={(e) => onUpdate({ targetCustomer: e.target.value })}
          rows={3}
        />
        <p className="text-xs text-muted-foreground">
          Be specific: Who exactly are they? What&apos;s their situation? What do they value?
        </p>
      </div>

      {/* Problem Solved */}
      <div className="space-y-2">
        <Label htmlFor="problem-solved">
          Problem You Solve <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="problem-solved"
          placeholder="e.g., Founders waste 20+ hours/week on low-value tasks because they lack a systematic approach to time optimization and delegation"
          value={data.problemSolved}
          onChange={(e) => onUpdate({ problemSolved: e.target.value })}
          rows={3}
        />
        <p className="text-xs text-muted-foreground">
          What painful problem do they have right now? Why is it costing them money/time/stress?
        </p>
      </div>

      {/* Competitors / Alternatives */}
      <div className="space-y-2">
        <Label htmlFor="competitors">Competitors & Alternatives</Label>
        <Textarea
          id="competitors"
          placeholder="e.g., Notion (too flexible, no methodology), Asana (team-focused, not for solopreneurs), pen and paper (no accountability), hiring an assistant (expensive, management overhead)"
          value={data.competitors}
          onChange={(e) => onUpdate({ competitors: e.target.value })}
          rows={3}
        />
        <p className="text-xs text-muted-foreground">
          Who/what are they using today? Why doesn&apos;t it work well for them?
        </p>
      </div>

      {/* Differentiator */}
      <div className="space-y-2">
        <Label htmlFor="differentiator">
          Your Differentiation <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="differentiator"
          placeholder="e.g., Only tool that combines Dan Martell's DRIP methodology with AI-powered time analysis and automated accountability - it's like having a time management coach built into your workflow"
          value={data.differentiator}
          onChange={(e) => onUpdate({ differentiator: e.target.value })}
          rows={3}
        />
        <p className="text-xs text-muted-foreground">
          Why would someone choose YOU over the alternatives? What&apos;s unique?
        </p>
      </div>

      {/* Market Size */}
      <div className="space-y-2">
        <Label>Market Size (TAM)</Label>
        <Select
          value={data.marketSize}
          onValueChange={(v) => onUpdate({ marketSize: v as MarketSize })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select market size" />
          </SelectTrigger>
          <SelectContent>
            {MARKET_SIZES.map((size) => (
              <SelectItem key={size.value} value={size.value}>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{size.label}</span>
                  <span className="text-muted-foreground">({size.tam})</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {MARKET_SIZES.find((s) => s.value === data.marketSize)?.description ||
            'How big is the total addressable market?'}
        </p>
      </div>

      {/* Positioning Statement Preview */}
      {data.targetCustomer && data.problemSolved && data.differentiator && (
        <div className="p-4 bg-muted rounded-lg space-y-2">
          <h4 className="font-medium">Positioning Statement</h4>
          <p className="text-sm italic">
            &ldquo;For <span className="font-medium text-primary">{data.targetCustomer.split(' ').slice(0, 8).join(' ')}</span>{' '}
            who <span className="font-medium text-primary">{data.problemSolved.split(' ').slice(0, 8).join(' ')}</span>,
            we provide <span className="font-medium text-primary">{data.differentiator.split(' ').slice(0, 8).join(' ')}</span>.&rdquo;
          </p>
        </div>
      )}
    </div>
  );
}
