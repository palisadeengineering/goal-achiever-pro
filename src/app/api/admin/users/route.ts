import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

// Admin endpoint to manage users
// Requires SUPABASE_SERVICE_ROLE_KEY and authenticated admin user

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

// Verify the requesting user is an authenticated admin
async function verifyAdmin(): Promise<{ isAdmin: boolean; error?: string }> {
  const supabase = await createServerClient();

  if (!supabase) {
    return { isAdmin: false, error: 'Database connection failed' };
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { isAdmin: false, error: 'Authentication required' };
  }

  // Check if user has admin role in profiles table
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (error || !profile) {
    return { isAdmin: false, error: 'Failed to verify admin status' };
  }

  if (!profile.is_admin) {
    return { isAdmin: false, error: 'Admin access required' };
  }

  return { isAdmin: true };
}

// GET - List all users (admin only)
export async function GET() {
  // Verify admin access
  const { isAdmin, error: authError } = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json(
      { error: authError || 'Unauthorized' },
      { status: 403 }
    );
  }

  const supabase = getAdminClient();

  if (!supabase) {
    return NextResponse.json(
      { error: 'Admin client not configured' },
      { status: 500 }
    );
  }

  const { data, error } = await supabase.auth.admin.listUsers();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    users: data.users.map(u => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      provider: u.app_metadata?.provider || 'email'
    }))
  });
}

// DELETE - Delete a user by email (admin only)
export async function DELETE(request: Request) {
  // Verify admin access
  const { isAdmin, error: authError } = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json(
      { error: authError || 'Unauthorized' },
      { status: 403 }
    );
  }

  const supabase = getAdminClient();

  if (!supabase) {
    return NextResponse.json(
      { error: 'Admin client not configured' },
      { status: 500 }
    );
  }

  const { email } = await request.json();

  if (!email) {
    return NextResponse.json(
      { error: 'Email is required' },
      { status: 400 }
    );
  }

  // Find user by email
  const { data: users, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    return NextResponse.json(
      { error: listError.message },
      { status: 500 }
    );
  }

  const user = users.users.find(u => u.email?.toLowerCase() === email.toLowerCase());

  if (!user) {
    return NextResponse.json(
      { error: `User not found: ${email}` },
      { status: 404 }
    );
  }

  // Delete the user
  const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);

  if (deleteError) {
    return NextResponse.json(
      { error: deleteError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    message: `Successfully deleted user: ${email}`,
    deletedUser: {
      id: user.id,
      email: user.email
    }
  });
}
