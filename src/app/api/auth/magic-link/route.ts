import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail, generateMagicLinkEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    if (!supabase) {
      console.error('Supabase admin client not available');
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 503 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Generate a magic link using Supabase Admin API
    const { data, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
      options: {
        redirectTo: `${appUrl}/callback`,
      },
    });

    if (linkError) {
      console.error('Error generating magic link:', linkError);
      // Don't reveal whether the email exists or not for security
      // Still return success to prevent email enumeration
      return NextResponse.json({ success: true });
    }

    if (!data?.properties?.action_link) {
      console.error('No action link returned from Supabase');
      return NextResponse.json({ success: true });
    }

    // Send custom magic link email
    const emailHtml = generateMagicLinkEmail({
      magicLinkUrl: data.properties.action_link,
      userEmail: email,
      expiresInMinutes: 60,
    });

    const emailResult = await sendEmail({
      to: email,
      subject: 'Sign in to Goal Achiever Pro',
      html: emailHtml,
    });

    if (!emailResult.success) {
      console.error('Failed to send magic link email:', emailResult.error);
      // Still return success to not reveal email existence
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Magic link error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
