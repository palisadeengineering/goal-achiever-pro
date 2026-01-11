'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, X, Flag, Calendar, Megaphone } from 'lucide-react';
import type { AcquisitionData, AcquisitionChannel, Milestone } from '@/types/strategic-discovery';

interface AcquisitionSectionProps {
  data: AcquisitionData;
  onUpdate: (updates: Partial<AcquisitionData>) => void;
}

const CHANNEL_OPTIONS = [
  { value: 'content', label: 'Content Marketing', description: 'Blog, YouTube, Podcast' },
  { value: 'social', label: 'Social Media', description: 'Twitter, LinkedIn, TikTok' },
  { value: 'paid', label: 'Paid Ads', description: 'Google, Facebook, LinkedIn Ads' },
  { value: 'partnerships', label: 'Partnerships', description: 'Affiliates, integrations' },
  { value: 'outreach', label: 'Direct Outreach', description: 'Cold email, sales' },
  { value: 'plg', label: 'Product-Led Growth', description: 'Referrals, virality' },
  { value: 'seo', label: 'SEO', description: 'Organic search traffic' },
  { value: 'community', label: 'Community', description: 'Discord, Slack, forums' },
];

export function AcquisitionSection({ data, onUpdate }: AcquisitionSectionProps) {
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [newMilestone, setNewMilestone] = useState<Partial<Milestone>>({
    title: '',
    targetDate: '',
    metric: '',
    targetValue: '',
    isCritical: false,
  });
  const [newCriticalPath, setNewCriticalPath] = useState('');

  const toggleChannel = (channelName: string) => {
    const existing = data.primaryChannels?.find((c) => c.name === channelName);
    if (existing) {
      onUpdate({
        primaryChannels: data.primaryChannels.filter((c) => c.name !== channelName),
      });
    } else {
      onUpdate({
        primaryChannels: [
          ...(data.primaryChannels || []),
          {
            name: channelName,
            estimatedCost: 0,
            estimatedReach: 0,
            timeToResults: '1-3 months',
            isPrimary: data.primaryChannels?.length === 0,
          },
        ],
      });
    }
  };

  const updateChannelDetails = (channelName: string, updates: Partial<AcquisitionChannel>) => {
    onUpdate({
      primaryChannels: data.primaryChannels.map((c) =>
        c.name === channelName ? { ...c, ...updates } : c
      ),
    });
  };

  const saveMilestone = () => {
    if (newMilestone.title && newMilestone.targetDate) {
      onUpdate({
        milestones: [
          ...(data.milestones || []),
          {
            ...newMilestone,
            id: crypto.randomUUID(),
            title: newMilestone.title!,
            targetDate: newMilestone.targetDate!,
            metric: newMilestone.metric || '',
            targetValue: newMilestone.targetValue || '',
            isCritical: newMilestone.isCritical || false,
          } as Milestone,
        ],
      });
      setNewMilestone({
        title: '',
        targetDate: '',
        metric: '',
        targetValue: '',
        isCritical: false,
      });
      setShowMilestoneForm(false);
    }
  };

  const removeMilestone = (id: string) => {
    onUpdate({
      milestones: data.milestones.filter((m) => m.id !== id),
    });
  };

  const addCriticalPath = () => {
    if (newCriticalPath.trim()) {
      onUpdate({
        criticalPath: [...(data.criticalPath || []), newCriticalPath.trim()],
      });
      setNewCriticalPath('');
    }
  };

  const removeCriticalPath = (index: number) => {
    onUpdate({
      criticalPath: data.criticalPath.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-6">
      {/* Primary Channels */}
      <div className="space-y-2">
        <Label>Primary Acquisition Channels</Label>
        <p className="text-xs text-muted-foreground mb-2">
          Select 1-3 channels you&apos;ll focus on. Quality over quantity.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {CHANNEL_OPTIONS.map((channel) => {
            const isSelected = data.primaryChannels?.some((c) => c.name === channel.value);
            return (
              <Card
                key={channel.value}
                className={`cursor-pointer transition-all ${
                  isSelected ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground/50'
                }`}
                onClick={() => toggleChannel(channel.value)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <Checkbox checked={isSelected} />
                    <div>
                      <p className="text-sm font-medium">{channel.label}</p>
                      <p className="text-xs text-muted-foreground">{channel.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Channel Details */}
        {data.primaryChannels?.length > 0 && (
          <div className="space-y-3 mt-4">
            {data.primaryChannels.map((channel) => {
              const info = CHANNEL_OPTIONS.find((c) => c.value === channel.name);
              return (
                <Card key={channel.name}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Megaphone className="h-4 w-4" />
                        <span className="font-medium">{info?.label}</span>
                        {channel.isPrimary && (
                          <Badge>Primary</Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleChannel(channel.name)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs">Monthly Budget ($)</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={channel.estimatedCost || ''}
                          onChange={(e) =>
                            updateChannelDetails(channel.name, {
                              estimatedCost: Number(e.target.value),
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Est. Monthly Reach</Label>
                        <Input
                          type="number"
                          placeholder="1000"
                          value={channel.estimatedReach || ''}
                          onChange={(e) =>
                            updateChannelDetails(channel.name, {
                              estimatedReach: Number(e.target.value),
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Time to Results</Label>
                        <Select
                          value={channel.timeToResults}
                          onValueChange={(v) =>
                            updateChannelDetails(channel.name, { timeToResults: v })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="immediate">Immediate</SelectItem>
                            <SelectItem value="1-3 months">1-3 months</SelectItem>
                            <SelectItem value="3-6 months">3-6 months</SelectItem>
                            <SelectItem value="6-12 months">6-12 months</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Estimated CAC */}
      <div className="space-y-2">
        <Label htmlFor="cac">Estimated Customer Acquisition Cost (CAC)</Label>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">$</span>
          <Input
            id="cac"
            type="number"
            placeholder="50"
            className="max-w-32"
            value={data.estimatedCAC || ''}
            onChange={(e) => onUpdate({ estimatedCAC: Number(e.target.value) })}
          />
          <span className="text-muted-foreground">per customer</span>
        </div>
        <p className="text-xs text-muted-foreground">
          How much will it cost to acquire each paying customer on average?
        </p>
      </div>

      {/* Launch Date */}
      <div className="space-y-2">
        <Label htmlFor="launch-date">Launch Date</Label>
        <Input
          id="launch-date"
          type="date"
          value={data.launchDate}
          onChange={(e) => onUpdate({ launchDate: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          When do you plan to launch (or when did you launch)?
        </p>
      </div>

      {/* Milestones */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Key Milestones</Label>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMilestoneForm(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Milestone
          </Button>
        </div>

        {data.milestones?.length > 0 && (
          <div className="space-y-2">
            {data.milestones.map((milestone) => (
              <Card key={milestone.id} className={milestone.isCritical ? 'border-red-300' : ''}>
                <CardContent className="pt-3 pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      <Flag className={`h-4 w-4 mt-0.5 ${milestone.isCritical ? 'text-red-500' : 'text-muted-foreground'}`} />
                      <div>
                        <p className="font-medium">{milestone.title}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(milestone.targetDate).toLocaleDateString()}
                          {milestone.metric && (
                            <span>
                              • {milestone.metric}: {milestone.targetValue}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeMilestone(milestone.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {showMilestoneForm && (
          <Card className="border-dashed">
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Milestone Title</Label>
                  <Input
                    placeholder="e.g., Launch MVP"
                    value={newMilestone.title}
                    onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Target Date</Label>
                  <Input
                    type="date"
                    value={newMilestone.targetDate}
                    onChange={(e) => setNewMilestone({ ...newMilestone, targetDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Metric (optional)</Label>
                  <Input
                    placeholder="e.g., MRR, Users"
                    value={newMilestone.metric}
                    onChange={(e) => setNewMilestone({ ...newMilestone, metric: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Target Value</Label>
                  <Input
                    placeholder="e.g., $10,000"
                    value={newMilestone.targetValue}
                    onChange={(e) => setNewMilestone({ ...newMilestone, targetValue: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="is-critical"
                  checked={newMilestone.isCritical}
                  onCheckedChange={(checked) =>
                    setNewMilestone({ ...newMilestone, isCritical: checked as boolean })
                  }
                />
                <Label htmlFor="is-critical" className="text-sm">
                  This is a critical milestone (must-hit deadline)
                </Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setShowMilestoneForm(false)}>
                  Cancel
                </Button>
                <Button onClick={saveMilestone}>Save Milestone</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Critical Path */}
      <div className="space-y-2">
        <Label>Critical Path Steps</Label>
        <p className="text-xs text-muted-foreground mb-2">
          What are the must-do steps in sequence to reach your goal?
        </p>

        <div className="flex gap-2">
          <Input
            placeholder="e.g., Validate idea with 10 customer interviews"
            value={newCriticalPath}
            onChange={(e) => setNewCriticalPath(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCriticalPath())}
          />
          <Button onClick={addCriticalPath} size="sm">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {data.criticalPath?.length > 0 && (
          <div className="space-y-1 mt-2">
            {data.criticalPath.map((step, i) => (
              <div
                key={i}
                className="flex items-center gap-2 bg-muted p-2 rounded text-sm"
              >
                <span className="font-mono text-xs text-muted-foreground w-6">
                  {i + 1}.
                </span>
                <span className="flex-1">{step}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => removeCriticalPath(i)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
