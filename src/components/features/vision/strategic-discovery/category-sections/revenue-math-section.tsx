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
import { Badge } from '@/components/ui/badge';
import { Building2, Briefcase, Clock, TrendingUp } from 'lucide-react';
import type { RevenueMathData, PricingModel, DynamicPricingOption } from '@/types/strategic-discovery';

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

// Helper to format the selected dynamic pricing option
function formatDynamicOption(option: DynamicPricingOption): string {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);

  if (option.maxAmount) {
    return `${formatCurrency(option.baseAmount)} - ${formatCurrency(option.maxAmount)} ${option.unit}`;
  }
  return `${formatCurrency(option.baseAmount)} ${option.unit}`;
}

// Helper to get icon for pricing structure
function getStructureIcon(structure: string) {
  switch (structure) {
    case 'project':
      return <Briefcase className="h-4 w-4" />;
    case 'hourly':
      return <Clock className="h-4 w-4" />;
    case 'retainer':
    case 'subscription':
      return <TrendingUp className="h-4 w-4" />;
    default:
      return <Building2 className="h-4 w-4" />;
  }
}

export function RevenueMathSection({ data, onUpdate }: RevenueMathSectionProps) {
  const isAIMode = data.pricingModelMode === 'ai_generated';
  const selectedDynamicOption = data.dynamicOptions?.find(
    (opt) => opt.baseAmount === data.basePrice
  );

  return (
    <div className="space-y-6">
      {/* Pricing Model Selection - only show in standard mode */}
      {!isAIMode && (
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
      )}

      {/* AI Mode - Show selected dynamic pricing option */}
      {isAIMode && selectedDynamicOption && (
        <div className="space-y-2">
          <Label>Selected Pricing Model</Label>
          <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2 mb-2">
              {getStructureIcon(selectedDynamicOption.structure)}
              <span className="font-semibold">{selectedDynamicOption.name}</span>
              <Badge variant="outline" className="ml-auto text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700">
                {selectedDynamicOption.structure}
              </Badge>
            </div>
            <p className="text-lg font-bold text-purple-700 dark:text-purple-300">
              {formatDynamicOption(selectedDynamicOption)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {selectedDynamicOption.description}
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Change your selection in the pricing models above, or switch to standard mode
          </p>
        </div>
      )}

      {/* AI Mode - No selection yet */}
      {isAIMode && !selectedDynamicOption && data.dynamicOptions && data.dynamicOptions.length === 0 && (
        <div className="space-y-2">
          <Label>Pricing Model</Label>
          <div className="p-4 bg-muted rounded-lg text-center">
            <p className="text-sm text-muted-foreground">
              Click &quot;Generate AI Models&quot; above to get pricing suggestions based on your business type
            </p>
          </div>
        </div>
      )}

      {/* Base and Premium Pricing - contextual labels based on mode */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="base-price">
            {isAIMode && selectedDynamicOption
              ? `${selectedDynamicOption.structure === 'hourly' ? 'Hourly Rate' : selectedDynamicOption.structure === 'project' ? 'Project Min' : 'Base Amount'}`
              : 'Base Price ($/month)'}
          </Label>
          <Input
            id="base-price"
            type="number"
            placeholder={isAIMode ? '25000' : '29'}
            value={data.basePrice || ''}
            onChange={(e) => onUpdate({ basePrice: Number(e.target.value) })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="premium-price">
            {isAIMode && selectedDynamicOption?.maxAmount
              ? `${selectedDynamicOption.structure === 'project' ? 'Project Max' : 'Maximum Amount'}`
              : 'Premium Price ($/month)'}
          </Label>
          <Input
            id="premium-price"
            type="number"
            placeholder={isAIMode ? '75000' : '79'}
            value={data.premiumPrice || ''}
            onChange={(e) => onUpdate({ premiumPrice: Number(e.target.value) })}
          />
          <p className="text-xs text-muted-foreground">
            {isAIMode ? 'Optional upper range' : 'Optional higher tier'}
          </p>
        </div>
      </div>

      {/* ARPU / Average Value */}
      <div className="space-y-2">
        <Label htmlFor="arpu">
          {isAIMode
            ? 'Average Value Per Client/Project'
            : 'Average Revenue Per User (ARPU)'}
        </Label>
        <Input
          id="arpu"
          type="number"
          placeholder={isAIMode ? '35000' : '35'}
          value={data.arpu || ''}
          onChange={(e) => onUpdate({ arpu: Number(e.target.value) })}
        />
        <p className="text-xs text-muted-foreground">
          {isAIMode
            ? 'Expected average per client or project. Used for revenue projections.'
            : 'Expected average across all tiers. Usually between base and premium price.'}
        </p>
      </div>

      {/* Summary - contextual based on mode */}
      {data.targetCustomerCount > 0 && data.arpu > 0 && (
        <div className="p-4 bg-muted rounded-lg space-y-2">
          <h4 className="font-medium">Revenue Math Summary</h4>
          <div className="text-sm space-y-1">
            {isAIMode && selectedDynamicOption ? (
              <>
                <p>
                  <strong>{data.targetCustomerCount.toLocaleString()}</strong>{' '}
                  {selectedDynamicOption.structure === 'hourly' ? 'billable hours' : 'clients/projects'} ×{' '}
                  <strong>${data.arpu.toLocaleString()}</strong>
                  {selectedDynamicOption.structure === 'hourly' ? '/hour' : ' average'} ={' '}
                  <strong>
                    ${(data.targetCustomerCount * data.arpu).toLocaleString()}
                  </strong>{' '}
                  revenue
                </p>
                {selectedDynamicOption.structure === 'retainer' && (
                  <p className="text-muted-foreground">
                    That&apos;s{' '}
                    <strong>
                      ${(data.targetCustomerCount * data.arpu * 12).toLocaleString()}
                    </strong>{' '}
                    annual recurring revenue
                  </p>
                )}
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
