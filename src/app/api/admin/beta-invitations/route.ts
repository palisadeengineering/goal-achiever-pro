import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/resend';
import { generateBetaInvitationEmailHtml } from '@/lib/email/templates/beta-invitation';

// Generate a secure random token
function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Verify the requesting user is an authenticated admin
async function verifyAdmin(): Promise<{ userId: string | null; email: string | null; isAdmin: boolean; error?: string }> {
  const supabase = await createClient();

  if (!supabase) {
    return { userId: null, email: null, isAdmin: false, error: 'Database connection failed' };
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { userId: null, email: null, isAdmin: false, error: 'Authentication required' };
  }

  // Check if user has admin role in profiles table
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (error || !profile) {
    return { userId: user.id, email: user.email || null, isAdmin: false, error: 'Failed to verify admin status' };
  }

  if (!profile.is_admin) {
    return { userId: user.id, email: user.email || null, isAdmin: false, error: 'Admin access required' };
  }

  return { userId: user.id, email: user.email || null, isAdmin: true };
}

// GET - List all beta invitations
export async function GET() {
  try {
    const { isAdmin, error: authError } = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { error: authError || 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const supabase = createServiceRoleClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const { data: invitations, error } = await supabase
      .from('beta_invitations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching beta invitations:', error);
      return NextResponse.json({ error: 'Failed to fetch invitations' }, { status: 500 });
    }

    return NextResponse.json({ invitations });
  } catch (error) {
    console.error('Error in beta invitations GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new beta invitation and send email
export async function POST(request: NextRequest) {
  try {
    const { isAdmin, email: adminEmail, error: authError } = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { error: authError || 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, note } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    // Check if email already has an invitation
    const { data: existing } = await supabase
      .from('beta_invitations')
      .select('id, status')
      .ilike('email', email)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: `An invitation already exists for this email (status: ${existing.status})` },
        { status: 409 }
      );
    }

    // Generate invite token
    const inviteToken = generateToken();

    // Create invitation record
    const { data: invitation, error: insertError } = await supabase
      .from('beta_invitations')
      .insert({
        email: email.toLowerCase(),
        invite_token: inviteToken,
        invited_by_email: adminEmail,
        status: 'pending',
        note: note || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating invitation:', insertError);
      return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 });
    }

    // Send invitation email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://goalachieverpro.com';
    const inviteUrl = `${appUrl}/invite/${inviteToken}`;

    const emailHtml = generateBetaInvitationEmailHtml({
      inviteUrl,
      inviteeEmail: email,
    });

    const emailResult = await sendEmail({
      to: email,
      subject: "You're Invited to Goal Achiever Pro",
      html: emailHtml,
      from: 'Goal Achiever Pro <hello@goalachieverpro.com>',
    });

    if (!emailResult.success) {
      console.error('Failed to send invitation email:', emailResult.error);
      // Still return success - invitation is created, email just failed
      return NextResponse.json({
        invitation,
        warning: 'Invitation created but email failed to send. You may need to resend.',
      });
    }

    return NextResponse.json({ invitation, emailSent: true });
  } catch (error) {
    console.error('Error in beta invitations POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
