'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { RevenueMathData, PricingModel } from '@/types/strategic-discovery';

interface RevenueMathSectionProps {
  data: RevenueMathData;
  onUpdate: (updates: Partial<RevenueMathData>) => void;
}

const PRICING_MODELS: { value: PricingModel; label: string; description: string }[] = [
  { value: 'mass_market', label: 'Mass Market ($5-15)', description: 'High volume, low touch' },
  { value: 'prosumer', label: 'Prosumer ($25-50)', description: 'Serious individual users' },
  { value: 'enterprise', label: 'Enterprise ($200+)', description: 'B2B, longer sales cycles' },
  { value: 'hybrid', label: 'Hybrid/Tiered', description: 'Multiple price points' },
];

export function RevenueMathSection({ data, onUpdate }: RevenueMathSectionProps) {
  return (
    <div className="space-y-6">
      {/* Pricing Model Selection */}
      <div className="space-y-2">
        <Label>Pricing Model</Label>
        <Select
          value={data.pricingModel}
          onValueChange={(v) => onUpdate({ pricingModel: v as PricingModel })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select pricing model" />
          </SelectTrigger>
          <SelectContent>
            {PRICING_MODELS.map((model) => (
              <SelectItem key={model.value} value={model.value}>
                <div className="flex flex-col">
                  <span>{model.label}</span>
                  <span className="text-xs text-muted-foreground">{model.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          This determines your go-to-market strategy and required customer volume
        </p>
      </div>

      {/* Base and Premium Pricing */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="base-price">Base Price ($/month)</Label>
          <Input
            id="base-price"
            type="number"
            placeholder="29"
            value={data.basePrice || ''}
            onChange={(e) => onUpdate({ basePrice: Number(e.target.value) })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="premium-price">Premium Price ($/month)</Label>
          <Input
            id="premium-price"
            type="number"
            placeholder="79"
            value={data.premiumPrice || ''}
            onChange={(e) => onUpdate({ premiumPrice: Number(e.target.value) })}
          />
          <p className="text-xs text-muted-foreground">Optional higher tier</p>
        </div>
      </div>

      {/* ARPU */}
      <div className="space-y-2">
        <Label htmlFor="arpu">Average Revenue Per User (ARPU)</Label>
        <Input
          id="arpu"
          type="number"
          placeholder="35"
          value={data.arpu || ''}
          onChange={(e) => onUpdate({ arpu: Number(e.target.value) })}
        />
        <p className="text-xs text-muted-foreground">
          Expected average across all tiers. Usually between base and premium price.
        </p>
      </div>

      {/* Summary */}
      {data.targetCustomerCount > 0 && data.arpu > 0 && (
        <div className="p-4 bg-muted rounded-lg space-y-2">
          <h4 className="font-medium">Revenue Math Summary</h4>
          <div className="text-sm space-y-1">
            <p>
              <strong>{data.targetCustomerCount.toLocaleString()}</strong> customers ×{' '}
              <strong>${data.arpu}</strong>/month ={' '}
              <strong>
                ${(data.targetCustomerCount * data.arpu).toLocaleString()}
              </strong>{' '}
              MRR
            </p>
            <p className="text-muted-foreground">
              That&apos;s{' '}
              <strong>
                ${(data.targetCustomerCount * data.arpu * 12).toLocaleString()}
              </strong>{' '}
              ARR
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
