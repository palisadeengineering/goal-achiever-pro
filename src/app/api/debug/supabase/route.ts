import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

// GET - Debug Supabase connection (temporary)
export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

  const supabase = createServiceRoleClient();

  if (!supabase) {
    return NextResponse.json({
      configured: false,
      supabaseUrl,
      hasServiceKey,
      error: 'Service role client not configured'
    });
  }

  // Try to list tables
  let tablesResult = null;
  let tablesError = null;
  try {
    const { data, error } = await supabase
      .from('beta_invitations')
      .select('count')
      .limit(1);

    if (error) {
      tablesError = { message: error.message, code: error.code, details: error.details };
    } else {
      tablesResult = data;
    }
  } catch (e) {
    tablesError = String(e);
  }

  return NextResponse.json({
    configured: true,
    supabaseUrl,
    hasServiceKey,
    serviceKeyPrefix: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) + '...',
    tableTest: {
      result: tablesResult,
      error: tablesError
    }
  });
}
