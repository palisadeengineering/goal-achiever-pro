'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Gift,
  Plus,
  Trophy,
  Lock,
  Unlock,
  Check,
  Loader2,
  Target,
  Zap,
  Milestone,
  PartyPopper,
  DollarSign,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';

interface Reward {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  estimated_value: number | null;
  trigger_type: 'milestone' | 'key_result' | 'xp_threshold';
  trigger_id: string | null;
  trigger_value: string | null;
  progress_percentage: number;
  current_progress: number;
  status: 'locked' | 'unlocked' | 'claimed';
  unlocked_at: string | null;
  sort_order: number;
  created_at: string;
  reward_claims?: Array<{
    id: string;
    claimed_at: string;
    note: string | null;
  }>;
}

interface Project {
  id: string;
  title: string;
  milestones: Array<{ id: string; title: string }>;
  keyResults: Array<{ id: string; name: string }>;
}

async function fetchRewards(): Promise<{ rewards: Reward[] }> {
  const response = await fetch('/api/rewards-v2');
  if (!response.ok) throw new Error('Failed to fetch rewards');
  return response.json();
}

async function fetchProjects(): Promise<{ projects: Project[] }> {
  const response = await fetch('/api/projects-v2');
  if (!response.ok) throw new Error('Failed to fetch projects');
  return response.json();
}

async function createReward(data: {
  name: string;
  description?: string;
  estimatedValue?: number;
  triggerType: string;
  triggerId?: string;
  triggerValue?: string;
}): Promise<{ reward: Reward }> {
  const response = await fetch('/api/rewards-v2', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create reward');
  return response.json();
}

async function claimReward(id: string, note?: string): Promise<{ claim: unknown; reward: Reward }> {
  const response = await fetch(`/api/rewards-v2/${id}/claim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ note }),
  });
  if (!response.ok) throw new Error('Failed to claim reward');
  return response.json();
}

const TRIGGER_TYPE_INFO = {
  milestone: {
    label: 'Milestone',
    icon: Milestone,
    description: 'Unlock when a milestone is completed',
    color: 'text-blue-500',
  },
  key_result: {
    label: 'Key Result',
    icon: Target,
    description: 'Unlock when a Key Result hits 100%',
    color: 'text-green-500',
  },
  xp_threshold: {
    label: 'XP Threshold',
    icon: Zap,
    description: 'Unlock when you earn enough XP',
    color: 'text-purple-500',
  },
};

function triggerConfetti() {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
  });
}

export default function RewardsPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isClaimOpen, setIsClaimOpen] = useState(false);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [claimNote, setClaimNote] = useState('');

  const [newReward, setNewReward] = useState({
    name: '',
    description: '',
    estimatedValue: '',
    triggerType: 'milestone' as 'milestone' | 'key_result' | 'xp_threshold',
    triggerId: '',
    triggerValue: '',
  });

  const { data: rewardsData, isLoading: isLoadingRewards } = useQuery({
    queryKey: ['rewards-v2'],
    queryFn: fetchRewards,
  });

  const { data: projectsData } = useQuery({
    queryKey: ['projects-v2'],
    queryFn: fetchProjects,
  });

  const createMutation = useMutation({
    mutationFn: createReward,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards-v2'] });
      setIsCreateOpen(false);
      setNewReward({
        name: '',
        description: '',
        estimatedValue: '',
        triggerType: 'milestone',
        triggerId: '',
        triggerValue: '',
      });
      toast.success('Reward created!');
    },
    onError: () => {
      toast.error('Failed to create reward');
    },
  });

  const claimMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) => claimReward(id, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards-v2'] });
      setIsClaimOpen(false);
      setSelectedReward(null);
      setClaimNote('');
      triggerConfetti();
      toast.success('Reward claimed! Enjoy your treat!');
    },
    onError: () => {
      toast.error('Failed to claim reward');
    },
  });

  const rewards = rewardsData?.rewards || [];
  const projects = projectsData?.projects || [];

  const lockedRewards = rewards.filter((r) => r.status === 'locked');
  const unlockedRewards = rewards.filter((r) => r.status === 'unlocked');
  const claimedRewards = rewards.filter((r) => r.status === 'claimed');

  // Get all milestones and KRs from projects for dropdowns
  const allMilestones = projects.flatMap((p) =>
    (p.milestones || []).map((m) => ({ ...m, projectTitle: p.title }))
  );
  const allKeyResults = projects.flatMap((p) =>
    (p.keyResults || []).map((kr) => ({ ...kr, projectTitle: p.title }))
  );

  const handleCreateReward = () => {
    if (!newReward.name.trim()) {
      toast.error('Please enter a reward name');
      return;
    }

    if (newReward.triggerType === 'xp_threshold' && !newReward.triggerValue) {
      toast.error('Please enter XP threshold amount');
      return;
    }

    if (
      (newReward.triggerType === 'milestone' || newReward.triggerType === 'key_result') &&
      !newReward.triggerId
    ) {
      toast.error(`Please select a ${newReward.triggerType.replace('_', ' ')}`);
      return;
    }

    createMutation.mutate({
      name: newReward.name,
      description: newReward.description || undefined,
      estimatedValue: newReward.estimatedValue ? Number(newReward.estimatedValue) : undefined,
      triggerType: newReward.triggerType,
      triggerId: newReward.triggerId || undefined,
      triggerValue: newReward.triggerValue || undefined,
    });
  };

  const handleOpenClaim = (reward: Reward) => {
    setSelectedReward(reward);
    setIsClaimOpen(true);
  };

  const handleClaim = () => {
    if (selectedReward) {
      claimMutation.mutate({ id: selectedReward.id, note: claimNote || undefined });
    }
  };

  const getStatusBadge = (status: Reward['status']) => {
    switch (status) {
      case 'locked':
        return (
          <Badge variant="secondary" className="gap-1">
            <Lock className="h-3 w-3" />
            Locked
          </Badge>
        );
      case 'unlocked':
        return (
          <Badge className="gap-1 bg-yellow-500 hover:bg-yellow-600">
            <Unlock className="h-3 w-3" />
            Unlocked!
          </Badge>
        );
      case 'claimed':
        return (
          <Badge variant="outline" className="gap-1 text-green-600 border-green-600">
            <Check className="h-3 w-3" />
            Claimed
          </Badge>
        );
    }
  };

  if (isLoadingRewards) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Rewards"
          description="Earn rewards for achieving your goals"
          icon={<Gift className="h-6 w-6" />}
        />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rewards"
        description="Earn rewards for achieving your goals - real motivation for real results"
        icon={<Gift className="h-6 w-6" />}
        actions={
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Reward
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  Create New Reward
                </DialogTitle>
                <DialogDescription>
                  Set up a reward you'll earn when you hit your target
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="name">Reward Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Weekend spa trip, New AirPods"
                    value={newReward.name}
                    onChange={(e) => setNewReward({ ...newReward, name: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Why do you want this reward?"
                    value={newReward.description}
                    onChange={(e) => setNewReward({ ...newReward, description: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="value">Estimated Value (optional)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="value"
                      type="number"
                      className="pl-9"
                      placeholder="0"
                      value={newReward.estimatedValue}
                      onChange={(e) => setNewReward({ ...newReward, estimatedValue: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label>Trigger Type</Label>
                  <Select
                    value={newReward.triggerType}
                    onValueChange={(value: 'milestone' | 'key_result' | 'xp_threshold') =>
                      setNewReward({ ...newReward, triggerType: value, triggerId: '', triggerValue: '' })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TRIGGER_TYPE_INFO).map(([key, info]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <info.icon className={cn('h-4 w-4', info.color)} />
                            {info.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {TRIGGER_TYPE_INFO[newReward.triggerType].description}
                  </p>
                </div>

                {newReward.triggerType === 'milestone' && (
                  <div>
                    <Label>Select Milestone</Label>
                    <Select
                      value={newReward.triggerId}
                      onValueChange={(value) => setNewReward({ ...newReward, triggerId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a milestone..." />
                      </SelectTrigger>
                      <SelectContent>
                        {allMilestones.length === 0 ? (
                          <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                            No milestones yet. Create a project first.
                          </div>
                        ) : (
                          allMilestones.map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.title} ({m.projectTitle})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {newReward.triggerType === 'key_result' && (
                  <div>
                    <Label>Select Key Result</Label>
                    <Select
                      value={newReward.triggerId}
                      onValueChange={(value) => setNewReward({ ...newReward, triggerId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a key result..." />
                      </SelectTrigger>
                      <SelectContent>
                        {allKeyResults.length === 0 ? (
                          <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                            No key results yet. Create a project first.
                          </div>
                        ) : (
                          allKeyResults.map((kr) => (
                            <SelectItem key={kr.id} value={kr.id}>
                              {kr.name} ({kr.projectTitle})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {newReward.triggerType === 'xp_threshold' && (
                  <div>
                    <Label>XP Required</Label>
                    <div className="relative">
                      <Zap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-500" />
                      <Input
                        type="number"
                        className="pl-9"
                        placeholder="e.g., 5000"
                        value={newReward.triggerValue}
                        onChange={(e) => setNewReward({ ...newReward, triggerValue: e.target.value })}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      You'll unlock this when you earn this much XP
                    </p>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateReward} disabled={createMutation.isPending}>
                    {createMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Gift className="h-4 w-4 mr-2" />
                    )}
                    Create Reward
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Stats Overview */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Gift className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Rewards</p>
                <p className="text-2xl font-bold">{rewards.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <Unlock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ready to Claim</p>
                <p className="text-2xl font-bold">{unlockedRewards.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Check className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Claimed</p>
                <p className="text-2xl font-bold">{claimedRewards.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">
                  ${rewards.reduce((sum, r) => sum + (r.estimated_value || 0), 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rewards Tabs */}
      <Tabs defaultValue="unlocked" className="space-y-4">
        <TabsList>
          <TabsTrigger value="unlocked" className="gap-2">
            <Unlock className="h-4 w-4" />
            Ready to Claim ({unlockedRewards.length})
          </TabsTrigger>
          <TabsTrigger value="locked" className="gap-2">
            <Lock className="h-4 w-4" />
            In Progress ({lockedRewards.length})
          </TabsTrigger>
          <TabsTrigger value="claimed" className="gap-2">
            <Trophy className="h-4 w-4" />
            Claimed ({claimedRewards.length})
          </TabsTrigger>
        </TabsList>

        {/* Unlocked Rewards */}
        <TabsContent value="unlocked" className="space-y-4">
          {unlockedRewards.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <PartyPopper className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-2">No unlocked rewards yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Keep working on your projects - rewards unlock automatically when you hit your targets!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {unlockedRewards.map((reward) => (
                <Card
                  key={reward.id}
                  className="border-2 border-yellow-400 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-yellow-500" />
                        {reward.name}
                      </CardTitle>
                      {getStatusBadge(reward.status)}
                    </div>
                    {reward.description && (
                      <CardDescription>{reward.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {reward.estimated_value && (
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4 text-green-500" />
                        <span className="font-medium">
                          ${reward.estimated_value.toLocaleString()}
                        </span>
                      </div>
                    )}
                    <Button
                      className="w-full gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                      onClick={() => handleOpenClaim(reward)}
                    >
                      <Gift className="h-4 w-4" />
                      Claim Reward!
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Locked Rewards */}
        <TabsContent value="locked" className="space-y-4">
          {lockedRewards.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Gift className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-2">No rewards set up yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Create rewards to motivate yourself - link them to milestones, key results, or XP goals!
                </p>
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Reward
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {lockedRewards.map((reward) => {
                const triggerInfo = TRIGGER_TYPE_INFO[reward.trigger_type];
                const TriggerIcon = triggerInfo.icon;

                return (
                  <Card key={reward.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base">{reward.name}</CardTitle>
                        {getStatusBadge(reward.status)}
                      </div>
                      {reward.description && (
                        <CardDescription>{reward.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <TriggerIcon className={cn('h-4 w-4', triggerInfo.color)} />
                        <span>{triggerInfo.label}</span>
                        {reward.trigger_value && reward.trigger_type === 'xp_threshold' && (
                          <span className="font-medium">
                            ({Number(reward.trigger_value).toLocaleString()} XP)
                          </span>
                        )}
                      </div>

                      {reward.estimated_value && (
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="h-4 w-4 text-green-500" />
                          <span className="font-medium">
                            ${reward.estimated_value.toLocaleString()}
                          </span>
                        </div>
                      )}

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{reward.progress_percentage}%</span>
                        </div>
                        <Progress value={reward.progress_percentage} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Claimed Rewards */}
        <TabsContent value="claimed" className="space-y-4">
          {claimedRewards.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Trophy className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-2">No claimed rewards yet</h3>
                <p className="text-muted-foreground text-center">
                  Your claimed rewards will appear here as a reminder of your achievements!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {claimedRewards.map((reward) => (
                <Card key={reward.id} className="opacity-80">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                        {reward.name}
                      </CardTitle>
                      {getStatusBadge(reward.status)}
                    </div>
                    {reward.description && (
                      <CardDescription>{reward.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {reward.estimated_value && (
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4 text-green-500" />
                        <span className="font-medium">
                          ${reward.estimated_value.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {reward.reward_claims?.[0] && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Claimed{' '}
                          {new Date(reward.reward_claims[0].claimed_at).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Claim Dialog */}
      <Dialog open={isClaimOpen} onOpenChange={setIsClaimOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PartyPopper className="h-5 w-5 text-yellow-500" />
              Claim Your Reward!
            </DialogTitle>
            <DialogDescription>
              Congratulations on achieving your goal!
            </DialogDescription>
          </DialogHeader>
          {selectedReward && (
            <div className="space-y-4 mt-4">
              <div className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg">
                <h3 className="text-lg font-semibold">{selectedReward.name}</h3>
                {selectedReward.description && (
                  <p className="text-muted-foreground mt-1">{selectedReward.description}</p>
                )}
                {selectedReward.estimated_value && (
                  <p className="text-green-600 font-medium mt-2">
                    Value: ${selectedReward.estimated_value.toLocaleString()}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="note">Add a note (optional)</Label>
                <Textarea
                  id="note"
                  placeholder="How did it feel to achieve this? What will you do to celebrate?"
                  value={claimNote}
                  onChange={(e) => setClaimNote(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsClaimOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleClaim}
                  disabled={claimMutation.isPending}
                  className="gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                >
                  {claimMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Gift className="h-4 w-4" />
                  )}
                  Claim Reward!
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
