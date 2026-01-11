'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User, UserPlus, Check, X, Loader2, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TeamMember } from '@/types/team';

export interface Assignee {
  id?: string;
  name: string;
  email?: string;
  avatarUrl?: string;
}

interface AssigneeSelectProps {
  value: Assignee | null;
  onChange: (assignee: Assignee | null) => void;
  currentUserName?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  // Optional: pass team members directly to avoid fetching
  teamMembers?: TeamMember[];
  // Whether to show the option to add custom assignees
  allowCustom?: boolean;
  // Whether to show the current user as an option
  showSelfOption?: boolean;
}

export function AssigneeSelect({
  value,
  onChange,
  currentUserName = 'Me',
  placeholder = 'Assign to...',
  disabled = false,
  className,
  teamMembers: externalTeamMembers,
  allowCustom = true,
  showSelfOption = true,
}: AssigneeSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(externalTeamMembers || []);
  const [isLoading, setIsLoading] = useState(!externalTeamMembers);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch team members if not provided
  const fetchTeamMembers = useCallback(async () => {
    if (externalTeamMembers) return;
    try {
      const response = await fetch('/api/team');
      if (response.ok) {
        const data = await response.json();
        setTeamMembers(data);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
    } finally {
      setIsLoading(false);
    }
  }, [externalTeamMembers]);

  useEffect(() => {
    if (isOpen && !externalTeamMembers) {
      fetchTeamMembers();
    }
  }, [isOpen, externalTeamMembers, fetchTeamMembers]);

  // Update team members when external prop changes
  useEffect(() => {
    if (externalTeamMembers) {
      setTeamMembers(externalTeamMembers);
      setIsLoading(false);
    }
  }, [externalTeamMembers]);

  const handleSelectSelf = () => {
    onChange({ name: currentUserName, id: 'self' });
    setIsOpen(false);
  };

  const handleSelectTeamMember = (member: TeamMember) => {
    onChange({
      id: member.id,
      name: member.name,
      email: member.email || undefined,
      avatarUrl: member.avatarUrl || undefined,
    });
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setIsOpen(false);
  };

  const handleCustomAssignee = () => {
    if (customName.trim()) {
      onChange({
        name: customName.trim(),
        email: customEmail.trim() || undefined,
      });
      setCustomName('');
      setCustomEmail('');
      setShowCustomForm(false);
      setIsOpen(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Filter team members by search query
  const filteredMembers = teamMembers.filter((member) =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Popover open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) setSearchQuery(''); }}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          disabled={disabled}
          className={cn('w-full justify-start', className)}
        >
          {value ? (
            <div className="flex items-center gap-2">
              <Avatar className="h-5 w-5">
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {getInitials(value.name)}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">{value.name}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{placeholder}</span>
            </div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2" align="start">
        {!showCustomForm ? (
          <div className="space-y-2">
            {/* Search input when there are team members */}
            {teamMembers.length > 3 && (
              <div className="px-1">
                <Input
                  placeholder="Search team members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8"
                  autoFocus
                />
              </div>
            )}

            <ScrollArea className="max-h-[200px]">
              <div className="space-y-1">
                {/* Self option */}
                {showSelfOption && (
                  <button
                    onClick={handleSelectSelf}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted transition-colors text-left"
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {getInitials(currentUserName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <span className="block">{currentUserName}</span>
                      <span className="text-xs text-muted-foreground">Myself</span>
                    </div>
                    {value?.id === 'self' && <Check className="h-4 w-4 text-primary" />}
                  </button>
                )}

                {/* Team members section */}
                {isLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredMembers.length > 0 ? (
                  <>
                    {showSelfOption && (
                      <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        Team Members
                      </div>
                    )}
                    {filteredMembers.map((member) => (
                      <button
                        key={member.id}
                        onClick={() => handleSelectTeamMember(member)}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted transition-colors text-left"
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {getInitials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <span className="block truncate">{member.name}</span>
                          {member.title && (
                            <span className="text-xs text-muted-foreground truncate block">
                              {member.title}
                            </span>
                          )}
                        </div>
                        {value?.id === member.id && <Check className="h-4 w-4 text-primary flex-shrink-0" />}
                      </button>
                    ))}
                  </>
                ) : searchQuery ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    No team members found
                  </div>
                ) : null}
              </div>
            </ScrollArea>

            {/* Custom assignee option */}
            {allowCustom && (
              <>
                <div className="border-t my-1" />
                <button
                  onClick={() => setShowCustomForm(true)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted transition-colors text-left"
                >
                  <div className="h-6 w-6 rounded-full border-2 border-dashed flex items-center justify-center">
                    <UserPlus className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <span className="text-muted-foreground">Add someone else...</span>
                </button>
              </>
            )}

            {/* Clear option */}
            {value && (
              <>
                <div className="border-t my-1" />
                <button
                  onClick={handleClear}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted transition-colors text-left text-muted-foreground"
                >
                  <X className="h-4 w-4" />
                  <span>Clear assignee</span>
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="assignee-name">Name *</Label>
              <Input
                id="assignee-name"
                placeholder="Enter name"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assignee-email">Email (optional)</Label>
              <Input
                id="assignee-email"
                type="email"
                placeholder="email@example.com"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => {
                  setShowCustomForm(false);
                  setCustomName('');
                  setCustomEmail('');
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={handleCustomAssignee}
                disabled={!customName.trim()}
              >
                Add
              </Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

// Compact display version for lists
export function AssigneeBadge({
  assignee,
  size = 'default',
}: {
  assignee: Assignee | null;
  size?: 'sm' | 'default';
}) {
  if (!assignee) return null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex items-center gap-1.5">
      <Avatar className={size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'}>
        <AvatarFallback
          className={cn(
            'bg-primary/10 text-primary',
            size === 'sm' ? 'text-[10px]' : 'text-xs'
          )}
        >
          {getInitials(assignee.name)}
        </AvatarFallback>
      </Avatar>
      <span className={cn('truncate', size === 'sm' ? 'text-xs' : 'text-sm')}>
        {assignee.name}
      </span>
    </div>
  );
}
