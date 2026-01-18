import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail, generateWelcomeEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName, redirectTo, product } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
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

    // Build callback URL with redirect params if provided
    const callbackUrl = new URL('/callback', appUrl);
    if (redirectTo) callbackUrl.searchParams.set('redirect', redirectTo);
    if (product) callbackUrl.searchParams.set('product', product);

    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);

    if (existingUser) {
      // Check if they have confirmed their email
      if (existingUser.email_confirmed_at) {
        return NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 409 }
        );
      }

      // User exists but hasn't confirmed - resend confirmation
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'signup',
        email: email,
        password: password,
        options: {
          data: { full_name: fullName },
          redirectTo: callbackUrl.toString(),
        },
      });

      if (linkError) {
        console.error('Error generating signup link:', linkError);
        return NextResponse.json(
          { error: 'Unable to create account. Please try again.' },
          { status: 500 }
        );
      }

      // Send welcome email with confirmation link
      const emailHtml = generateWelcomeEmail({
        userName: fullName,
        confirmUrl: linkData.properties.action_link,
        loginUrl: `${appUrl}/dashboard`,
      });

      await sendEmail({
        to: email,
        subject: 'Welcome to Goal Achiever Pro - Please Confirm Your Email',
        html: emailHtml,
      });

      return NextResponse.json({
        success: true,
        message: 'Confirmation email resent',
        needsConfirmation: true,
      });
    }

    // Create new user with Supabase Admin API
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'signup',
      email: email,
      password: password,
      options: {
        data: { full_name: fullName },
        redirectTo: callbackUrl.toString(),
      },
    });

    if (linkError) {
      console.error('Error creating user:', linkError);

      // Handle specific errors
      if (linkError.message.includes('already registered')) {
        return NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: 'Unable to create account. Please try again.' },
        { status: 500 }
      );
    }

    if (!linkData?.properties?.action_link) {
      console.error('No action link returned from Supabase');
      return NextResponse.json(
        { error: 'Unable to create account. Please try again.' },
        { status: 500 }
      );
    }

    // Send welcome email with confirmation link
    const emailHtml = generateWelcomeEmail({
      userName: fullName,
      confirmUrl: linkData.properties.action_link,
      loginUrl: `${appUrl}/dashboard`,
    });

    const emailResult = await sendEmail({
      to: email,
      subject: 'Welcome to Goal Achiever Pro - Please Confirm Your Email',
      html: emailHtml,
    });

    if (!emailResult.success) {
      console.error('Failed to send welcome email:', emailResult.error);
      // User is created, but email failed - still return success
      // They can request a new confirmation email later
    }

    return NextResponse.json({
      success: true,
      needsConfirmation: true,
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
