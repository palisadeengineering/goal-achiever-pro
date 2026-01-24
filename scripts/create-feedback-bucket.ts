import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createBucket() {
  console.log('Creating feedback-screenshots bucket...');

  // Create the bucket
  const { data, error } = await supabase.storage.createBucket('feedback-screenshots', {
    public: true,
    fileSizeLimit: 5242880, // 5MB
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
  });

  if (error) {
    if (error.message.includes('already exists')) {
      console.log('Bucket already exists, skipping creation.');
    } else {
      console.error('Error creating bucket:', error.message);
      process.exit(1);
    }
  } else {
    console.log('Bucket created successfully:', data);
  }

  console.log('\nDone! The feedback-screenshots bucket is ready.');
  console.log('\nNote: RLS policies for storage are managed via Supabase Dashboard.');
  console.log('Go to Storage > Policies to add policies if needed.');
}

createBucket();
