'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, UserPlus, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

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
}

export function AssigneeSelect({
  value,
  onChange,
  currentUserName = 'Me',
  placeholder = 'Assign to...',
  disabled = false,
  className,
}: AssigneeSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [showCustomForm, setShowCustomForm] = useState(false);

  const handleSelectSelf = () => {
    onChange({ name: currentUserName, id: 'self' });
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

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
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
      <PopoverContent className="w-64 p-2" align="start">
        {!showCustomForm ? (
          <div className="space-y-1">
            {/* Self option */}
            <button
              onClick={handleSelectSelf}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted transition-colors text-left"
            >
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {getInitials(currentUserName)}
                </AvatarFallback>
              </Avatar>
              <span className="flex-1">{currentUserName}</span>
              {value?.id === 'self' && <Check className="h-4 w-4 text-primary" />}
            </button>

            {/* Custom assignee option */}
            <button
              onClick={() => setShowCustomForm(true)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted transition-colors text-left"
            >
              <div className="h-6 w-6 rounded-full border-2 border-dashed flex items-center justify-center">
                <UserPlus className="h-3 w-3 text-muted-foreground" />
              </div>
              <span className="text-muted-foreground">Add someone else...</span>
            </button>

            {/* Clear option */}
            {value && (
              <>
                <div className="border-t my-2" />
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
