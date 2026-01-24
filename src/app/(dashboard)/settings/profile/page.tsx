'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  User,
  Mail,
  Calendar,
  Loader2,
  Check,
  ArrowLeft,
  Shield,
} from 'lucide-react';
import { format } from 'date-fns';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at?: string;
}

export default function ProfileSettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/user/profile');
        if (response.ok) {
          const data = await response.json();
          setProfile(data);
          setFullName(data.full_name || '');
        } else {
          setError('Failed to load profile');
        }
      } catch (err) {
        setError('Failed to load profile');
        console.error('Profile fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName }),
      });

      if (response.ok) {
        setSaveSuccess(true);
        setProfile(prev => prev ? { ...prev, full_name: fullName } : null);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to save profile');
      }
    } catch (err) {
      setError('Failed to save profile');
      console.error('Profile save error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return email.charAt(0).toUpperCase();
  };

  const hasChanges = profile && fullName !== (profile.full_name || '');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/settings')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <PageHeader
          title="Profile Settings"
          description="Manage your personal information"
        />
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Skeleton className="h-20 w-20 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      ) : profile ? (
        <>
          {/* Profile Overview */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="text-2xl bg-primary/10">
                    {getInitials(profile.full_name, profile.email)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-semibold">
                    {profile.full_name || profile.email.split('@')[0]}
                  </h2>
                  <p className="text-muted-foreground">{profile.email}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Member since {format(new Date(profile.created_at), 'MMMM yyyy')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Edit Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Update your profile information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Input
                    id="email"
                    value={profile.email}
                    disabled
                    className="bg-muted pr-10"
                  />
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed. Contact support if you need to update it.
                </p>
              </div>

              {error && (
                <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950 p-3 rounded-md">
                  {error}
                </div>
              )}

              <div className="flex items-center gap-3">
                <Button
                  onClick={handleSave}
                  disabled={isSaving || !hasChanges}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : saveSuccess ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Saved!
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
                {hasChanges && (
                  <Button
                    variant="ghost"
                    onClick={() => setFullName(profile.full_name || '')}
                  >
                    Discard
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Account Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Account Information
              </CardTitle>
              <CardDescription>
                Your account details and security
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-lg">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium">Account Created</div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(profile.created_at), 'MMMM d, yyyy')}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between py-3 border-b">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-lg">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium">Email Status</div>
                    <div className="text-sm text-muted-foreground">Verified</div>
                  </div>
                </div>
                <span className="text-sm text-green-600 font-medium">Verified</span>
              </div>

              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-lg">
                    <Shield className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium">Password</div>
                    <div className="text-sm text-muted-foreground">
                      Last changed: Unknown
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Change Password
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {error || 'Unable to load profile'}
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
