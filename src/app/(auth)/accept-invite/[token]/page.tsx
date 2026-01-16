'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Share2,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  LogIn,
} from 'lucide-react';
import { TAB_DISPLAY_INFO } from '@/types/sharing';
import type { TabPermissionData, ItemPermissionData } from '@/types/sharing';

interface InvitationDetails {
  id: string;
  email: string;
  expiresAt: string;
  status: string;
  shareType: string;
  tabPermissions: TabPermissionData[];
  itemPermissions: ItemPermissionData[];
  owner: {
    id: string;
    fullName: string | null;
    email: string;
    avatarUrl: string | null;
  };
}

export default function AcceptInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [needsAuth, setNeedsAuth] = useState(false);

  useEffect(() => {
    const fetchInvitation = async () => {
      try {
        const response = await fetch(`/api/sharing/invite/${token}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Failed to load invitation');
          return;
        }

        setInvitation(data);
      } catch (err) {
        setError('Failed to load invitation');
      } finally {
        setLoading(false);
      }
    };

    fetchInvitation();
  }, [token]);

  const handleAccept = async () => {
    setAccepting(true);
    setError(null);

    try {
      const response = await fetch(`/api/sharing/invite/${token}/accept`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setNeedsAuth(true);
          return;
        }
        setError(data.error || 'Failed to accept invitation');
        return;
      }

      // Redirect to dashboard
      router.push(data.redirectTo || '/today');
    } catch (err) {
      setError('Failed to accept invitation');
    } finally {
      setAccepting(false);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <XCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>Invitation Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button asChild variant="outline">
              <Link href="/login">Go to Login</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (needsAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <LogIn className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Sign in Required</CardTitle>
            <CardDescription>
              Please sign in or create an account to accept this invitation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {invitation && (
              <div className="rounded-lg border p-4 bg-muted/50">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(invitation.owner.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {invitation.owner.fullName || invitation.owner.email}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      wants to share content with you
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex gap-3">
            <Button asChild className="flex-1">
              <Link href={`/login?redirect=/accept-invite/${token}`}>
                Sign In
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href={`/signup?redirect=/accept-invite/${token}`}>
                Create Account
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Share2 className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Sharing Invitation</CardTitle>
          <CardDescription>
            You&apos;ve been invited to access shared content
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Owner Info */}
          {invitation && (
            <div className="flex items-center gap-3 p-4 rounded-lg border">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary/10 text-primary text-lg">
                  {getInitials(invitation.owner.fullName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">
                  {invitation.owner.fullName || 'A user'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {invitation.owner.email}
                </p>
              </div>
            </div>
          )}

          {/* Shared Content */}
          {invitation && invitation.tabPermissions.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Shared tabs:
              </p>
              <div className="space-y-2">
                {invitation.tabPermissions.map((tab, index) => {
                  const tabInfo = TAB_DISPLAY_INFO[tab.tabName];
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <span className="font-medium">
                        {tabInfo?.displayName || tab.tabName}
                      </span>
                      <Badge variant="secondary" className="flex items-center gap-1">
                        {tab.permissionLevel === 'edit' ? (
                          <>
                            <Edit className="h-3 w-3" />
                            Can edit
                          </>
                        ) : (
                          <>
                            <Eye className="h-3 w-3" />
                            View only
                          </>
                        )}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {invitation && invitation.itemPermissions.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Shared items: {invitation.itemPermissions.length}
              </p>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => router.push('/today')}
          >
            Decline
          </Button>
          <Button
            className="flex-1"
            onClick={handleAccept}
            disabled={accepting}
          >
            {accepting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Accept Invitation
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
