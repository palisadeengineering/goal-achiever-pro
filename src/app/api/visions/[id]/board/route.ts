import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/api-auth';
import { sanitizeErrorForClient } from '@/lib/utils/api-errors';

// GET /api/visions/[id]/board - Get all images for a vision board
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const userId = auth.userId;
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }
    const { id: visionId } = await params;

    const { data: images, error } = await supabase
      .from('vision_board_images')
      .select('*')
      .eq('vision_id', visionId)
      .eq('user_id', userId)
      .order('sort_order', { ascending: true });

    if (error) {
      return NextResponse.json({ error: sanitizeErrorForClient(error, 'fetch vision board images') }, { status: 500 });
    }

    // Get signed URLs for each image
    const imagesWithUrls = await Promise.all(
      (images || []).map(async (image) => {
        const { data } = await supabase.storage
          .from('vision-boards')
          .createSignedUrl(image.file_path, 3600); // 1 hour expiry

        return {
          ...image,
          signedUrl: data?.signedUrl || null,
        };
      })
    );

    return NextResponse.json(imagesWithUrls);
  } catch (error) {
    console.error('Error fetching vision board images:', error);
    return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 });
  }
}

// POST /api/visions/[id]/board - Upload a new image
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const userId = auth.userId;
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }
    const { id: visionId } = await params;

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const caption = formData.get('caption') as string | null;
    const isCover = formData.get('isCover') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    // Generate unique file path
    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const filePath = `${userId}/${visionId}/${timestamp}-${randomId}.${fileExt}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('vision-boards')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: sanitizeErrorForClient(uploadError, 'upload vision board image') },
        { status: 500 }
      );
    }

    // Get current max sort order
    const { data: existingImages } = await supabase
      .from('vision_board_images')
      .select('sort_order')
      .eq('vision_id', visionId)
      .eq('user_id', userId);

    const maxSortOrder = existingImages && existingImages.length > 0
      ? Math.max(...existingImages.map((i) => i.sort_order || 0))
      : -1;

    // If this is the cover, unset other covers
    if (isCover) {
      await supabase
        .from('vision_board_images')
        .update({ is_cover: false })
        .eq('vision_id', visionId)
        .eq('user_id', userId);
    }

    // Save to database
    const { data: newImage, error: insertError } = await supabase
      .from('vision_board_images')
      .insert({
        user_id: userId,
        vision_id: visionId,
        file_path: filePath,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        caption,
        is_cover: isCover || (existingImages?.length || 0) === 0, // First image is cover by default
        sort_order: maxSortOrder + 1,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: sanitizeErrorForClient(insertError, 'save vision board image') }, { status: 500 });
    }

    // Get signed URL for the new image
    const { data: signedUrlData } = await supabase.storage
      .from('vision-boards')
      .createSignedUrl(filePath, 3600);

    return NextResponse.json({
      ...newImage,
      signedUrl: signedUrlData?.signedUrl || null,
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}

// DELETE /api/visions/[id]/board - Delete an image
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const userId = auth.userId;
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }
    const { id: visionId } = await params;

    const { imageId } = await request.json();

    if (!imageId) {
      return NextResponse.json({ error: 'Image ID required' }, { status: 400 });
    }

    // Get the image to delete
    const { data: image, error: fetchError } = await supabase
      .from('vision_board_images')
      .select('*')
      .eq('id', imageId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // Delete from Supabase Storage
    const { error: deleteStorageError } = await supabase.storage
      .from('vision-boards')
      .remove([image.file_path]);

    if (deleteStorageError) {
      console.error('Storage delete error:', deleteStorageError);
      // Continue anyway to clean up database
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('vision_board_images')
      .delete()
      .eq('id', imageId);

    if (deleteError) {
      return NextResponse.json({ error: sanitizeErrorForClient(deleteError, 'delete vision board image') }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 });
  }
}

// PUT /api/visions/[id]/board - Update image metadata
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const userId = auth.userId;
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }
    const { id: visionId } = await params;

    const { imageId, caption, isCover, sortOrder } = await request.json();

    if (!imageId) {
      return NextResponse.json({ error: 'Image ID required' }, { status: 400 });
    }

    // If setting as cover, unset other covers first
    if (isCover) {
      await supabase
        .from('vision_board_images')
        .update({ is_cover: false })
        .eq('vision_id', visionId)
        .eq('user_id', userId);
    }

    // Update the image
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (caption !== undefined) updateData.caption = caption;
    if (isCover !== undefined) updateData.is_cover = isCover;
    if (sortOrder !== undefined) updateData.sort_order = sortOrder;

    const { data: updated, error: updateError } = await supabase
      .from('vision_board_images')
      .update(updateData)
      .eq('id', imageId)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError || !updated) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // Get signed URL
    const { data: signedUrlData } = await supabase.storage
      .from('vision-boards')
      .createSignedUrl(updated.file_path, 3600);

    return NextResponse.json({
      ...updated,
      signedUrl: signedUrlData?.signedUrl || null,
    });
  } catch (error) {
    console.error('Error updating image:', error);
    return NextResponse.json({ error: 'Failed to update image' }, { status: 500 });
  }
}
