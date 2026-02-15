import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedUser } from '@/lib/auth/api-auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const userId = auth.userId;

    const adminClient = createAdminClient();

    if (!adminClient) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const feedbackType = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '100');

    // Check if user is admin to see all feedback, otherwise just their own
    const { data: profile } = await adminClient
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single();

    const isAdmin = profile?.is_admin === true;

    let query = adminClient
      .from('beta_feedback')
      .select(`
        *,
        profiles:user_id (
          email,
          full_name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Non-admins can only see their own feedback
    if (!isAdmin) {
      query = query.eq('user_id', userId);
    }

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (feedbackType) {
      query = query.eq('feedback_type', feedbackType);
    }

    const { data: feedback, error } = await query;

    if (error) {
      console.error('Error fetching feedback:', error);
      return NextResponse.json(
        { error: 'Failed to fetch feedback' },
        { status: 500 }
      );
    }

    // Get counts by status for summary
    const { data: statusCounts } = await adminClient
      .from('beta_feedback')
      .select('status')
      .then(({ data }) => {
        const counts: Record<string, number> = {};
        data?.forEach((item) => {
          counts[item.status] = (counts[item.status] || 0) + 1;
        });
        return { data: counts };
      });

    return NextResponse.json({
      feedback: feedback || [],
      summary: {
        total: feedback?.length || 0,
        byStatus: statusCounts || {},
      }
    });
  } catch (error) {
    console.error('Get feedback error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feedback' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const userId = auth.userId;

    const adminClient = createAdminClient();

    if (!adminClient) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const {
      feedbackType,
      title,
      description,
      priority,
      currentUrl,
      userAgent,
      screenResolution,
      screenshot,
      capturedErrors,
      errorsCount,
    } = body;

    // Validation
    if (!feedbackType) {
      return NextResponse.json(
        { error: 'Feedback type is required' },
        { status: 400 }
      );
    }

    if (!title || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const validTypes = ['bug', 'feature', 'improvement', 'general'];
    if (!validTypes.includes(feedbackType)) {
      return NextResponse.json(
        { error: 'Invalid feedback type' },
        { status: 400 }
      );
    }

    // Upload screenshot to Supabase Storage if provided
    let screenshotUrl: string | null = null;
    if (screenshot && screenshot.startsWith('data:image')) {
      try {
        // Convert base64 to buffer
        const base64Data = screenshot.split(',')[1];

        // Reject screenshots larger than ~5MB (base64 inflates ~33%, so 7MB base64 ≈ 5MB decoded)
        const MAX_BASE64_LENGTH = 7 * 1024 * 1024;
        if (base64Data.length > MAX_BASE64_LENGTH) {
          return NextResponse.json(
            { error: 'Screenshot too large. Maximum size is 5MB.' },
            { status: 413 }
          );
        }

        const buffer = Buffer.from(base64Data, 'base64');
        const fileName = `feedback/${userId}/${Date.now()}.png`;

        const { error: uploadError } = await adminClient.storage
          .from('feedback-screenshots')
          .upload(fileName, buffer, {
            contentType: 'image/png',
            upsert: false,
          });

        if (!uploadError) {
          const { data: urlData } = adminClient.storage
            .from('feedback-screenshots')
            .getPublicUrl(fileName);
          screenshotUrl = urlData.publicUrl;
        } else {
          console.error('Screenshot upload error:', uploadError);
        }
      } catch (uploadErr) {
        console.error('Failed to upload screenshot:', uploadErr);
        // Continue without screenshot - don't fail the whole request
      }
    }

    // Build full description with captured errors
    let fullDescription = description?.trim() || '';
    if (capturedErrors && capturedErrors !== 'No errors captured') {
      fullDescription += `\n\n---\n**Captured Errors (${errorsCount || 0}):**\n\`\`\`\n${capturedErrors}\n\`\`\``;
    }

    // Create feedback entry
    const { data: feedback, error } = await adminClient
      .from('beta_feedback')
      .insert({
        user_id: userId,
        feedback_type: feedbackType,
        title: title.trim(),
        description: fullDescription,
        priority: priority || (feedbackType === 'bug' ? 'high' : 'medium'),
        current_url: currentUrl || null,
        user_agent: userAgent || null,
        screen_resolution: screenResolution || null,
        screenshot_url: screenshotUrl,
        status: 'open',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating feedback:', error);
      return NextResponse.json(
        { error: 'Failed to submit feedback' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      feedback,
      message: 'Thank you for your feedback!'
    });
  } catch (error) {
    console.error('Create feedback error:', error);
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}

// Admin-only: Update feedback status
export async function PUT(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const userId = auth.userId;

    const adminClient = createAdminClient();

    if (!adminClient) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Check if user is admin
    const { data: profile } = await adminClient
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, status, adminResponse, priority } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Feedback ID is required' },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (status) {
      const validStatuses = ['open', 'in_progress', 'resolved', 'closed', 'wont_fix'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status' },
          { status: 400 }
        );
      }
      updateData.status = status;

      if (status === 'resolved' || status === 'closed') {
        updateData.resolved_at = new Date().toISOString();
      }
    }

    if (adminResponse !== undefined) {
      updateData.admin_response = adminResponse;
      updateData.responded_at = new Date().toISOString();
    }

    if (priority) {
      updateData.priority = priority;
    }

    const { data: feedback, error } = await adminClient
      .from('beta_feedback')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating feedback:', error);
      return NextResponse.json(
        { error: 'Failed to update feedback' },
        { status: 500 }
      );
    }

    return NextResponse.json({ feedback });
  } catch (error) {
    console.error('Update feedback error:', error);
    return NextResponse.json(
      { error: 'Failed to update feedback' },
      { status: 500 }
    );
  }
}
