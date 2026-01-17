import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail, generateResetPasswordEmail } from '@/lib/email';

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

    // Generate a password recovery link using Supabase Admin API
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const { data, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: `${appUrl}/reset-password`,
      },
    });

    if (linkError) {
      console.error('Error generating recovery link:', linkError);
      // Don't reveal whether the email exists or not for security
      return NextResponse.json({ success: true });
    }

    if (!data?.properties?.action_link) {
      console.error('No action link returned from Supabase');
      return NextResponse.json({ success: true });
    }

    // Get user info for personalization (optional)
    const { data: userData } = await supabase.auth.admin.getUserById(data.user.id);
    const userName = userData?.user?.user_metadata?.full_name;

    // Send custom email using our template
    const emailHtml = generateResetPasswordEmail({
      resetUrl: data.properties.action_link,
      userEmail: email,
      userName: userName,
      expiresInHours: 24,
    });

    const emailResult = await sendEmail({
      to: email,
      subject: 'Reset Your Password - Goal Achiever Pro',
      html: emailHtml,
    });

    if (!emailResult.success) {
      console.error('Failed to send reset email:', emailResult.error);
      // Still return success to not reveal email existence
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
