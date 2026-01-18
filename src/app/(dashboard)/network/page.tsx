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
  Plus,
  Users,
  Zap,
  Battery,
  BatteryLow,
  Trash2,
  Edit2,
  UserPlus,
  Clock,
  Shield,
  Loader2,
} from 'lucide-react';
import { ShareButton } from '@/components/features/sharing';

type EnergyImpact = 'energizing' | 'neutral' | 'draining';
type ConnectionFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

interface Contact {
  id: string;
  name: string;
  relationship: string;
  energyImpact: EnergyImpact;
  frequency: ConnectionFrequency;
  timeLimitMinutes: number;
  boundaries: string;
  notes: string;
  lastContact: string;
  createdAt: string;
}

const ENERGY_OPTIONS = {
  energizing: { label: 'Energizing', icon: Zap, color: 'text-cyan-500', bgColor: 'bg-cyan-100' },
  neutral: { label: 'Neutral', icon: Battery, color: 'text-yellow-500', bgColor: 'bg-yellow-100' },
  draining: { label: 'Draining', icon: BatteryLow, color: 'text-red-500', bgColor: 'bg-red-100' },
};

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];

export default function NetworkPage() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [filter, setFilter] = useState<EnergyImpact | 'all'>('all');

  // Form state
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [energyImpact, setEnergyImpact] = useState<EnergyImpact>('neutral');
  const [frequency, setFrequency] = useState<ConnectionFrequency>('monthly');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState('');
  const [boundaries, setBoundaries] = useState('');
  const [notes, setNotes] = useState('');

  // Fetch contacts from API
  const { data: contacts = [], isLoading } = useQuery<Contact[]>({
    queryKey: ['network-contacts'],
    queryFn: async () => {
      const response = await fetch('/api/network');
      if (!response.ok) throw new Error('Failed to fetch contacts');
      return response.json();
    },
  });

  // Create contact mutation
  const createMutation = useMutation({
    mutationFn: async (newContact: Omit<Contact, 'id' | 'createdAt' | 'lastContact'>) => {
      const response = await fetch('/api/network', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newContact),
      });
      if (!response.ok) throw new Error('Failed to create contact');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['network-contacts'] });
    },
  });

  // Update contact mutation
  const updateMutation = useMutation({
    mutationFn: async (contact: Contact) => {
      const response = await fetch('/api/network', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contact),
      });
      if (!response.ok) throw new Error('Failed to update contact');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['network-contacts'] });
    },
  });

  // Delete contact mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/network?id=${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete contact');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['network-contacts'] });
    },
  });

  const resetForm = () => {
    setName('');
    setRelationship('');
    setEnergyImpact('neutral');
    setFrequency('monthly');
    setTimeLimitMinutes('');
    setBoundaries('');
    setNotes('');
    setEditingContact(null);
  };

  const openForm = (contact?: Contact) => {
    if (contact) {
      setEditingContact(contact);
      setName(contact.name);
      setRelationship(contact.relationship);
      setEnergyImpact(contact.energyImpact);
      setFrequency(contact.frequency);
      setTimeLimitMinutes(contact.timeLimitMinutes?.toString() || '');
      setBoundaries(contact.boundaries);
      setNotes(contact.notes);
    } else {
      resetForm();
    }
    setIsFormOpen(true);
  };

  const saveContact = () => {
    if (editingContact) {
      updateMutation.mutate({
        ...editingContact,
        name,
        relationship,
        energyImpact,
        frequency,
        timeLimitMinutes: parseInt(timeLimitMinutes) || 0,
        boundaries,
        notes,
      });
    } else {
      createMutation.mutate({
        name,
        relationship,
        energyImpact,
        frequency,
        timeLimitMinutes: parseInt(timeLimitMinutes) || 0,
        boundaries,
        notes,
      });
    }
    setIsFormOpen(false);
    resetForm();
  };

  const deleteContact = (id: string) => {
    deleteMutation.mutate(id);
  };

  // Calculate stats
  const energizingCount = contacts.filter(c => c.energyImpact === 'energizing').length;
  const neutralCount = contacts.filter(c => c.energyImpact === 'neutral').length;
  const drainingCount = contacts.filter(c => c.energyImpact === 'draining').length;

  // Filter contacts
  const filteredContacts = filter === 'all'
    ? contacts
    : contacts.filter(c => c.energyImpact === filter);

  // Sort by energy impact (energizing first)
  const sortedContacts = [...filteredContacts].sort((a, b) => {
    const order = { energizing: 0, neutral: 1, draining: 2 };
    return order[a.energyImpact] - order[b.energyImpact];
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Network & Relationships"
        description="Audit your relationships - spend time with those who energize you"
        actions={
          <div className="flex items-center gap-2">
            <ShareButton tabName="network" />
            <Button onClick={() => openForm()}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Contact
            </Button>
          </div>
        }
      />

      {/* Energy Distribution */}
      <div className="grid grid-cols-3 gap-4">
        <Card
          className={`cursor-pointer transition-all ${filter === 'energizing' ? 'ring-2 ring-cyan-500' : ''}`}
          onClick={() => setFilter(filter === 'energizing' ? 'all' : 'energizing')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-100">
                <Zap className="h-5 w-5 text-cyan-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{energizingCount}</div>
                <div className="text-sm text-muted-foreground">Energizing</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${filter === 'neutral' ? 'ring-2 ring-yellow-500' : ''}`}
          onClick={() => setFilter(filter === 'neutral' ? 'all' : 'neutral')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100">
                <Battery className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{neutralCount}</div>
                <div className="text-sm text-muted-foreground">Neutral</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${filter === 'draining' ? 'ring-2 ring-red-500' : ''}`}
          onClick={() => setFilter(filter === 'draining' ? 'all' : 'draining')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100">
                <BatteryLow className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{drainingCount}</div>
                <div className="text-sm text-muted-foreground">Draining</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contacts Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardContent className="py-12 text-center">
              <Loader2 className="h-12 w-12 mx-auto text-muted-foreground mb-4 animate-spin" />
              <h3 className="text-lg font-semibold mb-2">Loading contacts...</h3>
            </CardContent>
          </Card>
        ) : sortedContacts.length === 0 ? (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No contacts yet</h3>
              <p className="text-muted-foreground mb-4">
                Start auditing your relationships by adding the people you spend time with
              </p>
              <Button onClick={() => openForm()}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Your First Contact
              </Button>
            </CardContent>
          </Card>
        ) : (
          sortedContacts.map(contact => {
            const energyConfig = ENERGY_OPTIONS[contact.energyImpact];
            const EnergyIcon = energyConfig.icon;

            return (
              <Card key={contact.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${energyConfig.bgColor}`}>
                        <EnergyIcon className={`h-4 w-4 ${energyConfig.color}`} />
                      </div>
                      <div>
                        <CardTitle className="text-base">{contact.name}</CardTitle>
                        {contact.relationship && (
                          <CardDescription>{contact.relationship}</CardDescription>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {energyConfig.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Connect {contact.frequency}</span>
                      {contact.timeLimitMinutes > 0 && (
                        <span className="text-xs">({contact.timeLimitMinutes} min limit)</span>
                      )}
                    </div>

                    {contact.boundaries && (
                      <div className="flex items-start gap-2 text-muted-foreground">
                        <Shield className="h-4 w-4 mt-0.5" />
                        <span className="text-xs">{contact.boundaries}</span>
                      </div>
                    )}

                    {contact.notes && (
                      <p className="text-xs text-muted-foreground border-t pt-2 mt-2">
                        {contact.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 mt-4 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openForm(contact)}
                    >
                      <Edit2 className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive"
                      onClick={() => deleteContact(contact.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Tips Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Friend Audit Tips</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p><strong>Energizing:</strong> Spend more time with these people. They elevate you.</p>
          <p><strong>Neutral:</strong> Fine to maintain, but don&apos;t overinvest time here.</p>
          <p><strong>Draining:</strong> Set clear boundaries. Limit time or consider reducing contact.</p>
          <p className="pt-2 border-t"><strong>Remember:</strong> You become the average of the 5 people you spend the most time with.</p>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingContact ? 'Edit' : 'Add'} Contact</DialogTitle>
            <DialogDescription>
              Audit how this relationship affects your energy
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="relationship">Relationship</Label>
                <Input
                  id="relationship"
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  placeholder="Friend, Colleague, Family..."
                  className="mt-2"
                />
              </div>
            </div>

            <div>
              <Label>Energy Impact</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {Object.entries(ENERGY_OPTIONS).map(([key, config]) => {
                  const Icon = config.icon;
                  return (
                    <Button
                      key={key}
                      type="button"
                      variant={energyImpact === key ? 'default' : 'outline'}
                      className="flex items-center gap-2"
                      onClick={() => setEnergyImpact(key as EnergyImpact)}
                    >
                      <Icon className={`h-4 w-4 ${energyImpact !== key ? config.color : ''}`} />
                      {config.label}
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Connect Frequency</Label>
                <Select value={frequency} onValueChange={(v) => setFrequency(v as ConnectionFrequency)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCY_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
                <Input
                  id="timeLimit"
                  type="number"
                  value={timeLimitMinutes}
                  onChange={(e) => setTimeLimitMinutes(e.target.value)}
                  placeholder="Optional"
                  min="0"
                  className="mt-2"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="boundaries">Boundaries</Label>
              <Textarea
                id="boundaries"
                value={boundaries}
                onChange={(e) => setBoundaries(e.target.value)}
                placeholder="e.g., No discussing work after 6pm, Limit to 1 hour calls..."
                rows={2}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any other notes about this relationship..."
                rows={2}
                className="mt-2"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveContact} disabled={!name.trim()}>
              {editingContact ? 'Save Changes' : 'Add Contact'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
