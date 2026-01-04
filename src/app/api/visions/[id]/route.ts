import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Demo user ID for development
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

async function getUserId(supabase: Awaited<ReturnType<typeof createClient>>) {
  if (!supabase) return DEMO_USER_ID;

  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || DEMO_USER_ID;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const userId = await getUserId(supabase);

    // Fetch the vision
    const { data: vision, error: visionError } = await supabase
      .from('visions')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .is('archived_at', null)
      .single();

    if (visionError || !vision) {
      console.error('Error fetching vision:', visionError);
      return NextResponse.json(
        { error: 'Vision not found' },
        { status: 404 }
      );
    }

    // Fetch board images for this vision
    const { data: boardImages, error: imagesError } = await supabase
      .from('vision_board_images')
      .select('id, file_path, caption, is_cover, created_at')
      .eq('vision_id', id)
      .order('is_cover', { ascending: false })
      .order('created_at', { ascending: true });

    if (imagesError) {
      console.error('Error fetching board images:', imagesError);
    }

    // Transform board images with signed URLs
    const transformedImages = await Promise.all(
      (boardImages || []).map(async (img) => {
        // Get signed URL from storage
        const { data: signedUrlData } = await supabase.storage
          .from('vision-boards')
          .createSignedUrl(img.file_path, 3600); // 1 hour expiry

        return {
          id: img.id,
          url: signedUrlData?.signedUrl || '',
          caption: img.caption,
          is_cover: img.is_cover,
        };
      })
    );

    return NextResponse.json({
      vision,
      boardImages: transformedImages,
    });
  } catch (error) {
    console.error('Get vision error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vision' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const userId = await getUserId(supabase);
    const body = await request.json();

    const {
      title,
      description,
      specific,
      measurable,
      attainable,
      realistic,
      timeBound,
      clarityScore,
      beliefScore,
      consistencyScore,
      color,
      affirmationText,
    } = body;

    // Update vision
    const { data: vision, error } = await supabase
      .from('visions')
      .update({
        title,
        description: description || null,
        specific: specific || null,
        measurable: measurable || null,
        attainable: attainable || null,
        realistic: realistic || null,
        time_bound: timeBound || null,
        clarity_score: clarityScore ?? undefined,
        belief_score: beliefScore ?? undefined,
        consistency_score: consistencyScore ?? undefined,
        color: color ?? undefined,
        affirmation_text: affirmationText ?? undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating vision:', error);
      return NextResponse.json(
        { error: 'Failed to update vision' },
        { status: 500 }
      );
    }

    return NextResponse.json({ vision });
  } catch (error) {
    console.error('Update vision error:', error);
    return NextResponse.json(
      { error: 'Failed to update vision' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const hardDelete = searchParams.get('hard') === 'true';

    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const userId = await getUserId(supabase);

    if (hardDelete) {
      // Hard delete - cascades to all related data via foreign keys
      // First delete vision board images from storage
      const { data: boardImages } = await supabase
        .from('vision_board_images')
        .select('file_path')
        .eq('vision_id', id)
        .eq('user_id', userId);

      if (boardImages && boardImages.length > 0) {
        const filePaths = boardImages.map((img) => img.file_path);
        await supabase.storage.from('vision-boards').remove(filePaths);
      }

      // Delete calendar events for this vision's items
      await supabase
        .from('calendar_events')
        .delete()
        .eq('user_id', userId)
        .eq('entity_type', 'vision')
        .eq('entity_id', id);

      // Delete the vision (cascades to backtrack_plans, quarterly_targets,
      // non_negotiables, vision_reminders, vision_kpis, etc.)
      const { error } = await supabase
        .from('visions')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting vision:', error);
        return NextResponse.json(
          { error: 'Failed to delete vision' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, deleted: true });
    } else {
      // Soft delete - archive the vision
      const { error } = await supabase
        .from('visions')
        .update({
          is_active: false,
          archived_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        console.error('Error archiving vision:', error);
        return NextResponse.json(
          { error: 'Failed to archive vision' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, archived: true });
    }
  } catch (error) {
    console.error('Delete vision error:', error);
    return NextResponse.json(
      { error: 'Failed to delete vision' },
      { status: 500 }
    );
  }
}
