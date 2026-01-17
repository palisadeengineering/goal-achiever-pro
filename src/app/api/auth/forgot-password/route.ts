import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Use the standard resetPasswordForEmail which triggers the Send Email hook
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${appUrl}/reset-password`,
    });

    if (error) {
      console.error('Error sending recovery email:', error);
      // Don't reveal whether the email exists or not for security
    }

    // Always return success to not reveal email existence
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
