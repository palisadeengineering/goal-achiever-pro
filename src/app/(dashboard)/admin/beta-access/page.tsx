'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Users,
  Mail,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Send,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { format } from 'date-fns';

interface BetaInvitation {
  id: string;
  email: string;
  invite_token: string;
  invited_by_email: string | null;
  status: 'pending' | 'accepted' | 'revoked';
  created_at: string;
  accepted_at: string | null;
  note: string | null;
}

export default function AdminBetaAccessPage() {
  const [invitations, setInvitations] = useState<BetaInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [newNote, setNewNote] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [invitationToRevoke, setInvitationToRevoke] = useState<BetaInvitation | null>(null);

  const fetchInvitations = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/beta-invitations');

      if (!response.ok) {
        if (response.status === 403) {
          setError('Unauthorized - Admin access required');
        } else {
          setError('Failed to fetch invitations');
        }
        return;
      }

      const data = await response.json();
      setInvitations(data.invitations || []);
    } catch (err) {
      setError('Failed to fetch invitations');
      console.error('Error fetching invitations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendError(null);
    setSendSuccess(null);
    setIsSending(true);

    try {
      const response = await fetch('/api/admin/beta-invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail, note: newNote || undefined }),
      });

      const data = await response.json();

      if (!response.ok) {
        setSendError(data.error || 'Failed to send invitation');
        return;
      }

      setSendSuccess(`Invitation sent to ${newEmail}`);
      setNewEmail('');
      setNewNote('');
      fetchInvitations();
    } catch (err) {
      setSendError('Failed to send invitation');
      console.error('Error sending invitation:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleResend = async (invitation: BetaInvitation) => {
    setResendingId(invitation.id);

    try {
      const response = await fetch(`/api/admin/beta-invitations/${invitation.id}/resend`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        setSendError(data.error || 'Failed to resend invitation');
        return;
      }

      setSendSuccess(`Invitation resent to ${invitation.email}`);
      fetchInvitations();
    } catch (err) {
      setSendError('Failed to resend invitation');
      console.error('Error resending invitation:', err);
    } finally {
      setResendingId(null);
    }
  };

  const handleRevoke = async () => {
    if (!invitationToRevoke) return;

    try {
      const response = await fetch(`/api/admin/beta-invitations/${invitationToRevoke.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        setSendError(data.error || 'Failed to revoke invitation');
        return;
      }

      setSendSuccess(`Access revoked for ${invitationToRevoke.email}`);
      fetchInvitations();
    } catch (err) {
      setSendError('Failed to revoke invitation');
      console.error('Error revoking invitation:', err);
    } finally {
      setRevokeDialogOpen(false);
      setInvitationToRevoke(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return (
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
            <CheckCircle className="h-3 w-3 mr-1" />
            Accepted
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'revoked':
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100">
            <XCircle className="h-3 w-3 mr-1" />
            Revoked
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const stats = {
    total: invitations.length,
    accepted: invitations.filter((i) => i.status === 'accepted').length,
    pending: invitations.filter((i) => i.status === 'pending').length,
    revoked: invitations.filter((i) => i.status === 'revoked').length,
  };

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Beta Access Management"
          description="Invite and manage beta users"
        />
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <p className="text-lg font-medium text-destructive">{error}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Please contact an administrator if you believe this is an error.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Beta Access Management"
        description="Invite and manage beta users"
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invites</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accepted</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{stats.accepted}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revoked</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.revoked}</div>
          </CardContent>
        </Card>
      </div>

      {/* Send Invite Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Beta Invitation
          </CardTitle>
          <CardDescription>
            Enter an email address to send a beta access invitation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSendInvite} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="note">Note (optional)</Label>
                <Input
                  id="note"
                  type="text"
                  placeholder="e.g., Friend from mastermind"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                />
              </div>
            </div>

            {sendError && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                {sendError}
              </div>
            )}

            {sendSuccess && (
              <div className="flex items-center gap-2 text-sm text-emerald-600">
                <CheckCircle className="h-4 w-4" />
                {sendSuccess}
              </div>
            )}

            <Button type="submit" disabled={isSending}>
              {isSending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Invitation
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Invitations Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Invitations</CardTitle>
          <CardDescription>
            Manage existing beta access invitations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : invitations.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              No invitations yet. Send your first invite above!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead>Invited</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invitations.map((invitation) => (
                    <TableRow key={invitation.id}>
                      <TableCell className="font-medium">
                        {invitation.email}
                      </TableCell>
                      <TableCell>{getStatusBadge(invitation.status)}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {invitation.note || '-'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(invitation.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {invitation.status === 'pending' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleResend(invitation)}
                              disabled={resendingId === invitation.id}
                            >
                              {resendingId === invitation.id ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <RefreshCw className="h-4 w-4" />
                              )}
                              <span className="ml-1">Resend</span>
                            </Button>
                          )}
                          {invitation.status !== 'revoked' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => {
                                setInvitationToRevoke(invitation);
                                setRevokeDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="ml-1">Revoke</span>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Revoke Confirmation Dialog */}
      <AlertDialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Beta Access?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke beta access for{' '}
              <strong>{invitationToRevoke?.email}</strong>? They will lose access
              to the app on their next page load.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevoke}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Revoke Access
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
