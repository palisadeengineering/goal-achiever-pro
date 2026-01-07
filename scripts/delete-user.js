#!/usr/bin/env node

/**
 * Delete a user from Supabase by email
 * Usage: node scripts/delete-user.js <email>
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load env from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Error: Missing Supabase environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function deleteUserByEmail(email) {
  console.log(`Looking up user: ${email}`);

  // First, find the user by email
  const { data: users, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    console.error('Error listing users:', listError.message);
    return false;
  }

  const user = users.users.find(u => u.email?.toLowerCase() === email.toLowerCase());

  if (!user) {
    console.log(`User not found: ${email}`);
    return false;
  }

  console.log(`Found user: ${user.id} (${user.email})`);
  console.log(`Created: ${user.created_at}`);
  console.log(`Last sign-in: ${user.last_sign_in_at || 'never'}`);

  // Delete the user
  const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);

  if (deleteError) {
    console.error('Error deleting user:', deleteError.message);
    return false;
  }

  console.log(`Successfully deleted user: ${email}`);
  return true;
}

async function listAllUsers() {
  const { data: users, error } = await supabase.auth.admin.listUsers();

  if (error) {
    console.error('Error listing users:', error.message);
    return;
  }

  console.log('\nAll users in database:');
  console.log('='.repeat(60));
  users.users.forEach(u => {
    console.log(`- ${u.email} (id: ${u.id.substring(0, 8)}..., created: ${new Date(u.created_at).toLocaleDateString()})`);
  });
  console.log('='.repeat(60));
  console.log(`Total: ${users.users.length} users\n`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--list') {
    await listAllUsers();
    return;
  }

  const email = args[0];
  await deleteUserByEmail(email);
}

main().catch(console.error);
