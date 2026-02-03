'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Plus,
  Code,
  FileText,
  DollarSign,
  Users,
  Clock,
  Trash2,
  Edit2,
  Lightbulb,
  Loader2,
  BarChart3,
  List,
} from 'lucide-react';
import { ShareButton } from '@/components/features/sharing';
import { LeverageAnalyticsSection } from '@/components/features/leverage/leverage-analytics-section';

type LeverageType = 'code' | 'content' | 'capital' | 'collaboration';
type LeverageStatus = 'idea' | 'planning' | 'implementing' | 'active' | 'archived';

interface LeverageItem {
  id: string;
  type: LeverageType;
  title: string;
  description: string;
  status: LeverageStatus;
  estimatedHoursSaved: number;
  actualHoursSaved: number;
  notes: string;
  createdAt: string;
}

const LEVERAGE_TYPES = {
  code: {
    name: 'Code',
    description: 'Software, automation, scripts that work 24/7',
    icon: Code,
    color: 'bg-blue-500',
    examples: ['API integrations', 'Automated workflows', 'Custom tools'],
  },
  content: {
    name: 'Content',
    description: 'Assets that educate and sell while you sleep',
    icon: FileText,
    color: 'bg-purple-500',
    examples: ['Blog posts', 'Videos', 'Courses', 'Templates'],
  },
  capital: {
    name: 'Capital',
    description: 'Money working for you (hiring, investing)',
    icon: DollarSign,
    color: 'bg-cyan-500',
    examples: ['Hire assistants', 'Outsource tasks', 'Invest in tools'],
  },
  collaboration: {
    name: 'Collaboration',
    description: 'Partnerships and joint ventures',
    icon: Users,
    color: 'bg-orange-500',
    examples: ['Strategic partnerships', 'Referral networks', 'Masterminds'],
  },
};

const STATUS_OPTIONS = [
  { value: 'idea', label: 'Idea', color: 'bg-gray-500' },
  { value: 'planning', label: 'Planning', color: 'bg-blue-500' },
  { value: 'implementing', label: 'Implementing', color: 'bg-amber-500' },
  { value: 'active', label: 'Active', color: 'bg-cyan-500' },
  { value: 'archived', label: 'Archived', color: 'bg-gray-400' },
];

export default function LeveragePage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('items');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LeverageItem | null>(null);

  // Form state
  const [type, setType] = useState<LeverageType>('code');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<LeverageStatus>('idea');
  const [estimatedHoursSaved, setEstimatedHoursSaved] = useState('');
  const [notes, setNotes] = useState('');

  // Fetch leverage items from API
  const { data: items = [], isLoading } = useQuery<LeverageItem[]>({
    queryKey: ['leverage-items'],
    queryFn: async () => {
      const response = await fetch('/api/leverage');
      if (!response.ok) throw new Error('Failed to fetch leverage items');
      return response.json();
    },
  });

  // Create item mutation
  const createMutation = useMutation({
    mutationFn: async (newItem: Omit<LeverageItem, 'id' | 'createdAt' | 'actualHoursSaved'>) => {
      const response = await fetch('/api/leverage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem),
      });
      if (!response.ok) throw new Error('Failed to create item');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leverage-items'] });
    },
  });

  // Update item mutation
  const updateMutation = useMutation({
    mutationFn: async (item: LeverageItem) => {
      const response = await fetch('/api/leverage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (!response.ok) throw new Error('Failed to update item');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leverage-items'] });
    },
  });

  // Delete item mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/leverage?id=${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete item');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leverage-items'] });
    },
  });

  const resetForm = () => {
    setType('code');
    setTitle('');
    setDescription('');
    setStatus('idea');
    setEstimatedHoursSaved('');
    setNotes('');
    setEditingItem(null);
  };

  const openForm = (item?: LeverageItem) => {
    if (item) {
      setEditingItem(item);
      setType(item.type);
      setTitle(item.title);
      setDescription(item.description);
      setStatus(item.status);
      setEstimatedHoursSaved(item.estimatedHoursSaved.toString());
      setNotes(item.notes);
    } else {
      resetForm();
    }
    setIsFormOpen(true);
  };

  const saveItem = () => {
    if (editingItem) {
      updateMutation.mutate({
        ...editingItem,
        type,
        title,
        description,
        status,
        estimatedHoursSaved: parseFloat(estimatedHoursSaved) || 0,
        notes,
      });
    } else {
      createMutation.mutate({
        type,
        title,
        description,
        status,
        estimatedHoursSaved: parseFloat(estimatedHoursSaved) || 0,
        notes,
      });
    }
    setIsFormOpen(false);
    resetForm();
  };

  const deleteItem = (id: string) => {
    deleteMutation.mutate(id);
  };

  // Calculate stats
  const totalEstimatedHours = items
    .filter(i => i.status !== 'archived')
    .reduce((sum, i) => sum + i.estimatedHoursSaved, 0);

  const activeItems = items.filter(i => i.status === 'active');

  // Group items by type
  const groupedItems = (leverageType: LeverageType) =>
    items.filter(i => i.type === leverageType && i.status !== 'archived');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leverage & 4 C's"
        description="Multiply your impact with Code, Content, Capital, and Collaboration"
        actions={
          <div className="flex items-center gap-2">
            <ShareButton tabName="leverage" />
            {activeTab === 'items' && (
              <Button onClick={() => openForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Leverage
              </Button>
            )}
          </div>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="items" className="gap-2">
            <List className="h-4 w-4" />
            Items
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(LEVERAGE_TYPES).map(([key, config]) => {
              const Icon = config.icon;
              const count = groupedItems(key as LeverageType).length;
              return (
                <Card key={key}>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${config.color} text-white`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{count}</div>
                        <div className="text-sm text-muted-foreground">{config.name}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Time Saved Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="h-8 w-8 text-cyan-500" />
                  <div>
                    <div className="text-3xl font-bold">{totalEstimatedHours} hours/week</div>
                    <div className="text-sm text-muted-foreground">Estimated time savings from active leverage</div>
                  </div>
                </div>
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  {activeItems.length} active
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* 4 C's Grid */}
          <div className="grid md:grid-cols-2 gap-6">
        {Object.entries(LEVERAGE_TYPES).map(([key, config]) => {
          const Icon = config.icon;
          const typeItems = groupedItems(key as LeverageType);

          return (
            <Card key={key}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${config.color} text-white`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{config.name}</CardTitle>
                      <CardDescription>{config.description}</CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setType(key as LeverageType);
                      openForm();
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Loader2 className="h-8 w-8 mx-auto mb-2 opacity-50 animate-spin" />
                    <p className="text-sm">Loading...</p>
                  </div>
                ) : typeItems.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No {config.name.toLowerCase()} leverage yet</p>
                    <p className="text-xs mt-1">Examples: {config.examples.join(', ')}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {typeItems.map(item => {
                      const statusConfig = STATUS_OPTIONS.find(s => s.value === item.status);
                      return (
                        <div
                          key={item.id}
                          className="flex items-start justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{item.title}</span>
                              <Badge variant="outline" className="text-xs">
                                <span
                                  className={`w-2 h-2 rounded-full ${statusConfig?.color} mr-1`}
                                />
                                {statusConfig?.label}
                              </Badge>
                            </div>
                            {item.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {item.description}
                              </p>
                            )}
                            {item.estimatedHoursSaved > 0 && (
                              <p className="text-xs text-cyan-600 mt-1">
                                ~{item.estimatedHoursSaved} hrs/week saved
                              </p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openForm(item)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => deleteItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
            );
          })}
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <LeverageAnalyticsSection />
        </TabsContent>
      </Tabs>

      {/* Add/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit' : 'Add'} Leverage Item</DialogTitle>
            <DialogDescription>
              Create leverage to multiply your impact and save time
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as LeverageType)}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LEVERAGE_TYPES).map(([key, config]) => {
                    const Icon = config.icon;
                    return (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {config.name}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Email automation sequence"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What does this leverage do?"
                rows={2}
                className="mt-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as LeverageStatus)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${option.color}`} />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="hours">Est. Hours Saved/Week</Label>
                <Input
                  id="hours"
                  type="number"
                  value={estimatedHoursSaved}
                  onChange={(e) => setEstimatedHoursSaved(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="0.5"
                  className="mt-2"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Implementation notes, resources, etc."
                rows={2}
                className="mt-2"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveItem} disabled={!title.trim()}>
              {editingItem ? 'Save Changes' : 'Add Leverage'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
