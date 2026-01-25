import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getFeedback() {
  const { data, error } = await supabase
    .from('beta_feedback')
    .select('*, profiles:user_id(email, full_name)')
    .eq('status', 'open')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.log('No open feedback items found.');
    return;
  }

  console.log(`\n=== ${data.length} Open Feedback Items ===\n`);

  data.forEach((item, i) => {
    console.log(`--- Item ${i + 1} ---`);
    console.log(`ID: ${item.id}`);
    console.log(`Type: ${item.feedback_type}`);
    console.log(`Priority: ${item.priority}`);
    console.log(`Title: ${item.title}`);
    console.log(`URL: ${item.current_url || 'N/A'}`);
    console.log(`User: ${item.profiles?.email || 'Unknown'}`);
    console.log(`Description:\n${item.description || 'No description'}`);
    console.log(`Screenshot: ${item.screenshot_url ? 'Yes' : 'No'}`);
    if (item.screenshot_url) {
      console.log(`Screenshot URL: ${item.screenshot_url}`);
    }
    console.log(`Created: ${item.created_at}`);
    console.log('');
  });
}

getFeedback();
