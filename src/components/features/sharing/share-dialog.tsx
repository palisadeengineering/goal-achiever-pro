'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Share2,
  Mail,
  Users,
  Eye,
  Edit,
  Trash2,
  Plus,
  Loader2,
  Check,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import type {
  TabName,
  EntityType,
  PermissionLevel,
  TabPermission,
  TAB_DISPLAY_INFO,
} from '@/types/sharing';
import { TAB_DISPLAY_INFO as tabDisplayInfo } from '@/types/sharing';
import type { TeamMember } from '@/types/team';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tabName?: TabName;
  entityType?: EntityType;
  entityId?: string;
  entityTitle?: string;
}

export function ShareDialog({
  open,
  onOpenChange,
  tabName,
  entityType,
  entityId,
  entityTitle,
}: ShareDialogProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'members' | 'invite'>('members');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePermission, setInvitePermission] = useState<PermissionLevel>('view');
  const [selectedTabs, setSelectedTabs] = useState<Set<TabName>>(
    new Set(tabName ? [tabName] : [])
  );

  // Fetch team members
  const { data: teamData, isLoading: loadingTeam } = useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      const response = await fetch('/api/team');
      if (!response.ok) throw new Error('Failed to fetch team');
      return response.json();
    },
    enabled: open,
  });

  // Fetch existing permissions for this tab
  const { data: permissionsData, isLoading: loadingPermissions } = useQuery({
    queryKey: ['tab-permissions', tabName],
    queryFn: async () => {
      const url = tabName
        ? `/api/sharing/tabs?tabName=${tabName}`
        : '/api/sharing/tabs';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch permissions');
      return response.json();
    },
    enabled: open && !!tabName,
  });

  // Grant permission mutation
  const grantPermission = useMutation({
    mutationFn: async ({
      teamMemberId,
      permissionLevel,
    }: {
      teamMemberId: string;
      permissionLevel: PermissionLevel;
    }) => {
      const response = await fetch('/api/sharing/tabs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamMemberId,
          tabName,
          permissionLevel,
        }),
      });
      if (!response.ok) throw new Error('Failed to grant permission');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tab-permissions'] });
      toast.success('Permission granted');
    },
    onError: () => {
      toast.error('Failed to grant permission');
    },
  });

  // Update permission mutation
  const updatePermission = useMutation({
    mutationFn: async ({
      permissionId,
      permissionLevel,
    }: {
      permissionId: string;
      permissionLevel: PermissionLevel;
    }) => {
      const response = await fetch(`/api/sharing/tabs/${permissionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissionLevel }),
      });
      if (!response.ok) throw new Error('Failed to update permission');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tab-permissions'] });
      toast.success('Permission updated');
    },
    onError: () => {
      toast.error('Failed to update permission');
    },
  });

  // Revoke permission mutation
  const revokePermission = useMutation({
    mutationFn: async (permissionId: string) => {
      const response = await fetch(`/api/sharing/tabs/${permissionId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to revoke permission');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tab-permissions'] });
      toast.success('Permission revoked');
    },
    onError: () => {
      toast.error('Failed to revoke permission');
    },
  });

  // Send invite mutation
  const sendInvite = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/sharing/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          shareType: 'tab',
          tabPermissions: Array.from(selectedTabs).map((tab) => ({
            tabName: tab,
            permissionLevel: invitePermission,
          })),
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send invite');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
      setActiveTab('members');
      // Copy invite link to clipboard
      if (data.invitation?.inviteUrl) {
        navigator.clipboard.writeText(data.invitation.inviteUrl);
        toast.info('Invite link copied to clipboard');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const teamMembers: TeamMember[] = teamData?.members || [];
  const permissions: TabPermission[] = permissionsData?.permissions || [];

  // Get members who don't have permission yet
  const membersWithoutPermission = teamMembers.filter(
    (member) =>
      !permissions.find((p) => p.teamMemberId === member.id) &&
      member.inviteStatus === 'accepted'
  );

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const tabDisplayName = tabName ? tabDisplayInfo[tabName]?.displayName : 'Content';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share {tabDisplayName}
          </DialogTitle>
          <DialogDescription>
            {tabName
              ? `Share access to your ${tabDisplayName} tab with team members`
              : 'Share access to your content with team members'}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'members' | 'invite')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="members">
              <Users className="h-4 w-4 mr-2" />
              Team Members
            </TabsTrigger>
            <TabsTrigger value="invite">
              <Mail className="h-4 w-4 mr-2" />
              Invite New
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-4 mt-4">
            {loadingTeam || loadingPermissions ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {/* Current permissions */}
                {permissions.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">
                      People with access
                    </Label>
                    <ScrollArea className="max-h-[200px]">
                      <div className="space-y-2">
                        {permissions.map((permission) => (
                          <div
                            key={permission.id}
                            className="flex items-center justify-between p-2 rounded-lg border"
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                  {getInitials(permission.teamMember?.name || 'U')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">
                                  {permission.teamMember?.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {permission.teamMember?.email}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Select
                                value={permission.permissionLevel}
                                onValueChange={(value: PermissionLevel) =>
                                  updatePermission.mutate({
                                    permissionId: permission.id,
                                    permissionLevel: value,
                                  })
                                }
                              >
                                <SelectTrigger className="w-[100px] h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="view">
                                    <div className="flex items-center gap-2">
                                      <Eye className="h-3 w-3" />
                                      View
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="edit">
                                    <div className="flex items-center gap-2">
                                      <Edit className="h-3 w-3" />
                                      Edit
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => revokePermission.mutate(permission.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {/* Add team member */}
                {membersWithoutPermission.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">
                      Add team members
                    </Label>
                    <ScrollArea className="max-h-[150px]">
                      <div className="space-y-2">
                        {membersWithoutPermission.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between p-2 rounded-lg border hover:bg-muted/50"
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs bg-muted">
                                  {getInitials(member.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">{member.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {member.email}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  grantPermission.mutate({
                                    teamMemberId: member.id,
                                    permissionLevel: 'view',
                                  })
                                }
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  grantPermission.mutate({
                                    teamMemberId: member.id,
                                    permissionLevel: 'edit',
                                  })
                                }
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {permissions.length === 0 && membersWithoutPermission.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground">
                      No team members yet. Use the Invite tab to add someone.
                    </p>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="invite" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Permission level</Label>
              <Select
                value={invitePermission}
                onValueChange={(v) => setInvitePermission(v as PermissionLevel)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      <div>
                        <p className="font-medium">View only</p>
                        <p className="text-xs text-muted-foreground">
                          Can view but not modify
                        </p>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="edit">
                    <div className="flex items-center gap-2">
                      <Edit className="h-4 w-4" />
                      <div>
                        <p className="font-medium">Can edit</p>
                        <p className="text-xs text-muted-foreground">
                          Can view and modify
                        </p>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {!tabName && (
              <div className="space-y-2">
                <Label>Select tabs to share</Label>
                <ScrollArea className="max-h-[150px] border rounded-lg p-2">
                  <div className="space-y-2">
                    {Object.entries(tabDisplayInfo).map(([key, info]) => (
                      <div key={key} className="flex items-center space-x-2">
                        <Checkbox
                          id={key}
                          checked={selectedTabs.has(key as TabName)}
                          onCheckedChange={(checked) => {
                            const newTabs = new Set(selectedTabs);
                            if (checked) {
                              newTabs.add(key as TabName);
                            } else {
                              newTabs.delete(key as TabName);
                            }
                            setSelectedTabs(newTabs);
                          }}
                        />
                        <label
                          htmlFor={key}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {info.displayName}
                        </label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            <Button
              className="w-full"
              onClick={() => sendInvite.mutate()}
              disabled={
                !inviteEmail ||
                sendInvite.isPending ||
                (!tabName && selectedTabs.size === 0)
              }
            >
              {sendInvite.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Mail className="h-4 w-4 mr-2" />
              )}
              Send Invitation
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
