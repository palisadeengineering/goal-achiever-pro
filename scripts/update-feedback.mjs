import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateFeedback() {
  // Mark the critical bug as resolved
  const { error: error1 } = await supabase
    .from('beta_feedback')
    .update({
      status: 'resolved',
      admin_response: 'Fixed! Event deletion now uses optimistic updates for instant UI response. The categorization popup is suppressed after deletion. Changes deployed.',
      resolved_at: new Date().toISOString(),
      responded_at: new Date().toISOString(),
    })
    .eq('id', '07d3b3be-a55a-426f-b607-5aa293d60653');

  if (error1) console.error('Error updating bug feedback:', error1);
  else console.log('✅ Bug feedback marked as resolved');

  // Mark the feature request as resolved
  const { error: error2 } = await supabase
    .from('beta_feedback')
    .update({
      status: 'resolved',
      admin_response: 'Implemented! All dialogs on the time-audit page are now draggable. Look for the grip icon at the top of each dialog - drag there to reposition the window.',
      resolved_at: new Date().toISOString(),
      responded_at: new Date().toISOString(),
    })
    .eq('id', '600bf104-7517-4b95-be9c-36b60edece19');

  if (error2) console.error('Error updating feature feedback:', error2);
  else console.log('✅ Feature request marked as resolved');

  // Close the test feedback
  const { error: error3 } = await supabase
    .from('beta_feedback')
    .update({
      status: 'closed',
      admin_response: 'Test submission - closing.',
      resolved_at: new Date().toISOString(),
      responded_at: new Date().toISOString(),
    })
    .eq('id', '864f1b2f-a7b9-46b8-93e6-7f1fc781f116');

  if (error3) console.error('Error closing test feedback:', error3);
  else console.log('✅ Test feedback closed');

  console.log('\nAll feedback items updated!');
}

updateFeedback();
