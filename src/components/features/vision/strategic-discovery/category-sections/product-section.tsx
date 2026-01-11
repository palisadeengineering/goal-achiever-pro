'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, X, Star, Package } from 'lucide-react';
import type { ProductData, PricingTier } from '@/types/strategic-discovery';

interface ProductSectionProps {
  data: ProductData;
  onUpdate: (updates: Partial<ProductData>) => void;
}

export function ProductSection({ data, onUpdate }: ProductSectionProps) {
  const [newFeature, setNewFeature] = useState('');
  const [showTierForm, setShowTierForm] = useState(false);
  const [newTier, setNewTier] = useState<Partial<PricingTier>>({
    name: '',
    price: 0,
    billingCycle: 'monthly',
    features: [],
    isPopular: false,
  });
  const [tierFeature, setTierFeature] = useState('');

  const addFeature = () => {
    if (newFeature.trim()) {
      onUpdate({
        coreFeatures: [...(data.coreFeatures || []), newFeature.trim()],
      });
      setNewFeature('');
    }
  };

  const removeFeature = (index: number) => {
    onUpdate({
      coreFeatures: data.coreFeatures.filter((_, i) => i !== index),
    });
  };

  const addTierFeature = () => {
    if (tierFeature.trim()) {
      setNewTier({
        ...newTier,
        features: [...(newTier.features || []), tierFeature.trim()],
      });
      setTierFeature('');
    }
  };

  const removeTierFeature = (index: number) => {
    setNewTier({
      ...newTier,
      features: newTier.features?.filter((_, i) => i !== index),
    });
  };

  const saveTier = () => {
    if (newTier.name && newTier.price) {
      onUpdate({
        pricingTiers: [
          ...(data.pricingTiers || []),
          {
            ...newTier,
            name: newTier.name!,
            price: newTier.price!,
            billingCycle: newTier.billingCycle || 'monthly',
            features: newTier.features || [],
          } as PricingTier,
        ],
      });
      setNewTier({
        name: '',
        price: 0,
        billingCycle: 'monthly',
        features: [],
        isPopular: false,
      });
      setShowTierForm(false);
    }
  };

  const removeTier = (index: number) => {
    onUpdate({
      pricingTiers: data.pricingTiers.filter((_, i) => i !== index),
    });
  };

  const togglePopular = (index: number) => {
    onUpdate({
      pricingTiers: data.pricingTiers.map((tier, i) => ({
        ...tier,
        isPopular: i === index ? !tier.isPopular : false,
      })),
    });
  };

  return (
    <div className="space-y-6">
      {/* Core Features */}
      <div className="space-y-2">
        <Label>
          Core Features <span className="text-red-500">*</span>
        </Label>
        <p className="text-xs text-muted-foreground mb-2">
          What are the 3-5 key features that deliver your core value proposition?
        </p>

        <div className="flex gap-2">
          <Input
            placeholder="e.g., AI-powered time tracking"
            value={newFeature}
            onChange={(e) => setNewFeature(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
          />
          <Button onClick={addFeature} size="sm">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 mt-2">
          {data.coreFeatures?.map((feature, i) => (
            <Badge key={i} variant="secondary" className="flex items-center gap-1">
              <Package className="h-3 w-3" />
              {feature}
              <button
                onClick={() => removeFeature(i)}
                className="ml-1 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {(!data.coreFeatures || data.coreFeatures.length === 0) && (
            <p className="text-sm text-muted-foreground">No features added yet</p>
          )}
        </div>
      </div>

      {/* Pricing Tiers */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Pricing Tiers</Label>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTierForm(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Tier
          </Button>
        </div>

        {/* Existing Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {data.pricingTiers?.map((tier, i) => (
            <Card key={i} className={tier.isPopular ? 'border-primary' : ''}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{tier.name}</span>
                      {tier.isPopular && (
                        <Badge className="bg-primary text-primary-foreground">
                          <Star className="h-3 w-3 mr-1" />
                          Popular
                        </Badge>
                      )}
                    </div>
                    <p className="text-2xl font-bold mt-1">
                      ${tier.price}
                      <span className="text-sm font-normal text-muted-foreground">
                        /{tier.billingCycle === 'yearly' ? 'yr' : 'mo'}
                      </span>
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => togglePopular(i)}
                    >
                      <Star className={`h-3 w-3 ${tier.isPopular ? 'fill-primary text-primary' : ''}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-red-500"
                      onClick={() => removeTier(i)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <ul className="mt-2 space-y-1">
                  {tier.features.map((f, fi) => (
                    <li key={fi} className="text-xs text-muted-foreground">
                      • {f}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* New Tier Form */}
        {showTierForm && (
          <Card className="border-dashed">
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tier Name</Label>
                  <Input
                    placeholder="e.g., Pro"
                    value={newTier.name}
                    onChange={(e) => setNewTier({ ...newTier, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Price ($)</Label>
                  <Input
                    type="number"
                    placeholder="29"
                    value={newTier.price || ''}
                    onChange={(e) => setNewTier({ ...newTier, price: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Features</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Feature included in this tier"
                    value={tierFeature}
                    onChange={(e) => setTierFeature(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTierFeature())}
                  />
                  <Button size="sm" onClick={addTierFeature}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {newTier.features?.map((f, i) => (
                    <Badge key={i} variant="outline">
                      {f}
                      <button onClick={() => removeTierFeature(i)} className="ml-1">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setShowTierForm(false)}>
                  Cancel
                </Button>
                <Button onClick={saveTier}>Save Tier</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Retention Strategy */}
      <div className="space-y-2">
        <Label htmlFor="retention">Retention Strategy</Label>
        <Textarea
          id="retention"
          placeholder="e.g., Daily review habit creates stickiness. Weekly email summaries with progress. In-app streaks and achievement badges."
          value={data.retentionStrategy}
          onChange={(e) => onUpdate({ retentionStrategy: e.target.value })}
          rows={3}
        />
        <p className="text-xs text-muted-foreground">
          What keeps users coming back daily/weekly? How do you create habit loops?
        </p>
      </div>

      {/* Upgrade Path */}
      <div className="space-y-2">
        <Label htmlFor="upgrade-path">Upgrade Path</Label>
        <Textarea
          id="upgrade-path"
          placeholder="e.g., Free users hit 3 vision limit. Pro unlocks unlimited + AI features. Enterprise adds team features and SSO."
          value={data.upgradePath}
          onChange={(e) => onUpdate({ upgradePath: e.target.value })}
          rows={2}
        />
        <p className="text-xs text-muted-foreground">
          How do users naturally discover they need to upgrade?
        </p>
      </div>
    </div>
  );
}
