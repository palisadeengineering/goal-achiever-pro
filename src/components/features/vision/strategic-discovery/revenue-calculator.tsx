'use client';

import { useState, useEffect, useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calculator, Loader2, CheckCircle2, Star } from 'lucide-react';
import type { RevenueMathData, RevenueOption, RevenueType } from '@/types/strategic-discovery';

interface RevenueCalculatorProps {
  data: RevenueMathData;
  onUpdate: (updates: Partial<RevenueMathData>) => void;
}

export function RevenueCalculator({ data, onUpdate }: RevenueCalculatorProps) {
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculatedOptions, setCalculatedOptions] = useState<RevenueOption[]>(
    data.calculatedOptions || []
  );

  // Format currency
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);

  // Calculate MRR from input
  const calculateMRR = useCallback(() => {
    if (!data.revenueTarget || data.revenueTarget <= 0) return 0;

    if (data.revenueType === 'arr') {
      return data.revenueTarget / 12;
    } else if (data.revenueType === 'mrr') {
      return data.revenueTarget;
    } else {
      // One-time: estimate monthly equivalent
      const monthsRemaining = data.targetTimeframe
        ? Math.max(1, Math.ceil((new Date(data.targetTimeframe).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)))
        : 12;
      return data.revenueTarget / monthsRemaining;
    }
  }, [data.revenueTarget, data.revenueType, data.targetTimeframe]);

  const monthlyTarget = calculateMRR();

  // Calculate options locally for immediate feedback
  const calculateOptionsLocally = useCallback(() => {
    if (monthlyTarget <= 0) return [];

    const pricingModels = [
      { name: 'Mass Market', price: 10, notes: 'High volume, viral growth needed' },
      { name: 'Prosumer', price: 29, notes: 'Sweet spot for solo founders' },
      { name: 'SMB', price: 79, notes: 'Small business focus' },
      { name: 'Enterprise', price: 299, notes: 'Fewer customers, higher touch' },
    ];

    return pricingModels.map((model) => {
      const customersNeeded = Math.ceil(monthlyTarget / model.price);
      const isRecommended = model.price >= 29 && model.price <= 79 &&
        customersNeeded >= 50 && customersNeeded <= 3000;

      return {
        name: model.name,
        pricePerMonth: model.price,
        customersNeeded,
        description: model.notes,
        recommended: isRecommended,
      };
    });
  }, [monthlyTarget]);

  // Auto-calculate when revenue changes
  useEffect(() => {
    if (data.revenueTarget && data.revenueTarget > 0) {
      const options = calculateOptionsLocally();
      setCalculatedOptions(options);
      onUpdate({ calculatedOptions: options });
    }
  }, [data.revenueTarget, data.revenueType, calculateOptionsLocally, onUpdate]);

  // Call API for detailed calculation
  const runDetailedCalculation = async () => {
    if (!data.revenueTarget || !data.targetTimeframe) return;

    setIsCalculating(true);
    try {
      const response = await fetch('/api/ai/calculate-revenue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetRevenue: data.revenueTarget,
          revenueType: data.revenueType,
          targetDate: data.targetTimeframe,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.options) {
          setCalculatedOptions(result.options);
          onUpdate({
            calculatedOptions: result.options,
            arpu: result.options.find((o: RevenueOption) => o.recommended)?.pricePerMonth || data.arpu,
          });
        }
      }
    } catch (error) {
      console.error('Calculation error:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  const selectPricingModel = (option: RevenueOption) => {
    onUpdate({
      pricingModel: option.name.toLowerCase().replace(' ', '_') as RevenueMathData['pricingModel'],
      basePrice: option.pricePerMonth,
      targetCustomerCount: option.customersNeeded,
      arpu: option.pricePerMonth,
    });
  };

  return (
    <div className="space-y-6">
      {/* Input Fields */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="revenue-target">Revenue Target ($)</Label>
          <Input
            id="revenue-target"
            type="number"
            placeholder="500000"
            value={data.revenueTarget || ''}
            onChange={(e) => onUpdate({ revenueTarget: Number(e.target.value) })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="revenue-type">Revenue Type</Label>
          <Select
            value={data.revenueType}
            onValueChange={(v) => onUpdate({ revenueType: v as RevenueType })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="arr">ARR (Annual Recurring)</SelectItem>
              <SelectItem value="mrr">MRR (Monthly Recurring)</SelectItem>
              <SelectItem value="one-time">One-time Revenue</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="target-date">Target Date</Label>
          <Input
            id="target-date"
            type="date"
            value={data.targetTimeframe}
            onChange={(e) => onUpdate({ targetTimeframe: e.target.value })}
          />
        </div>
      </div>

      {/* MRR Breakdown */}
      {monthlyTarget > 0 && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(data.revenueTarget || 0)} {data.revenueType.toUpperCase()} breaks down to:
                </p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                  {formatCurrency(monthlyTarget)} / month
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={runDetailedCalculation}
                disabled={isCalculating || !data.targetTimeframe}
              >
                {isCalculating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Calculator className="h-4 w-4 mr-2" />
                )}
                Calculate Options
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pricing Model Options */}
      {calculatedOptions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Pricing Model Options</Label>
            <p className="text-xs text-muted-foreground">Click to select</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {calculatedOptions.map((option) => {
              const isSelected = data.basePrice === option.pricePerMonth;

              return (
                <Card
                  key={option.name}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    isSelected
                      ? 'ring-2 ring-primary border-primary'
                      : option.recommended
                      ? 'border-green-300 dark:border-green-700'
                      : ''
                  }`}
                  onClick={() => selectPricingModel(option)}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{option.name}</span>
                          {option.recommended && (
                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                              <Star className="h-3 w-3 mr-1" />
                              Recommended
                            </Badge>
                          )}
                          {isSelected && (
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <p className="text-2xl font-bold">
                          {formatCurrency(option.pricePerMonth)}
                          <span className="text-sm font-normal text-muted-foreground">/mo</span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {option.customersNeeded.toLocaleString()} customers needed
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {option.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Model Summary */}
      {data.targetCustomerCount > 0 && (
        <Card className="bg-muted/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span className="font-medium">Selected Target</span>
            </div>
            <p className="text-sm">
              At <strong>{formatCurrency(data.basePrice)}/month</strong>, you need{' '}
              <strong>{data.targetCustomerCount.toLocaleString()}</strong> paying customers to hit{' '}
              <strong>{formatCurrency(monthlyTarget)} MRR</strong>.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
