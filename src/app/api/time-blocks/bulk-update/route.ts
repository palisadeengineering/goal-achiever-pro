import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/api-auth';

// POST: Bulk update multiple time blocks with the same changes
// Supports: valueQuadrant, energyRating, leverageType, activityType, detectedProjectId, tagIds (merge mode)
export async function POST(request: NextRequest) {
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

    const body = await request.json();

    const { blockIds, updates, idType, events: eventsMeta } = body;

    if (!blockIds || !Array.isArray(blockIds) || blockIds.length === 0) {
      return NextResponse.json(
        { error: 'blockIds array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Cap blockIds to prevent oversized queries
    if (blockIds.length > 500) {
      return NextResponse.json(
        { error: 'blockIds array must not exceed 500 items' },
        { status: 400 }
      );
    }

    if (!updates || typeof updates !== 'object') {
      return NextResponse.json(
        { error: 'updates object is required' },
        { status: 400 }
      );
    }

    const { valueQuadrant, energyRating, leverageType, activityType, activityCategory, detectedProjectId, tagIds, tagMode } = updates;

    // Validate enum values
    const validValueQuadrants = ['production', 'investment', 'replacement', 'delegation', 'na'];
    const validEnergyRatings = ['green', 'yellow', 'red'];
    const validActivityTypes = ['project', 'meeting', 'commute', 'deep_work', 'admin', 'break', 'other'];
    const validLeverageTypes = ['code', 'content', 'capital', 'collaboration', 'none'];

    if (valueQuadrant !== undefined && !validValueQuadrants.includes(valueQuadrant)) {
      return NextResponse.json({ error: `Invalid valueQuadrant: ${valueQuadrant}` }, { status: 400 });
    }
    if (energyRating !== undefined && !validEnergyRatings.includes(energyRating)) {
      return NextResponse.json({ error: `Invalid energyRating: ${energyRating}` }, { status: 400 });
    }
    if (activityType !== undefined && !validActivityTypes.includes(activityType)) {
      return NextResponse.json({ error: `Invalid activityType: ${activityType}` }, { status: 400 });
    }
    if (leverageType !== undefined && !validLeverageTypes.includes(leverageType)) {
      return NextResponse.json({ error: `Invalid leverageType: ${leverageType}` }, { status: 400 });
    }

    // Ensure at least one field is being updated
    const hasFieldUpdate = valueQuadrant !== undefined || energyRating !== undefined ||
      leverageType !== undefined || activityType !== undefined || activityCategory !== undefined ||
      detectedProjectId !== undefined;
    const hasTagUpdate = tagIds !== undefined && Array.isArray(tagIds);

    if (!hasFieldUpdate && !hasTagUpdate) {
      return NextResponse.json(
        { error: 'At least one update field is required' },
        { status: 400 }
      );
    }

    // Support lookup by external_event_id (for Google Calendar events) or by primary key id
    const useExternalId = idType === 'external';
    const lookupColumn = useExternalId ? 'external_event_id' : 'id';

    // Verify all blocks belong to the user before updating
    const { data: existingBlocks, error: verifyError } = await supabase
      .from('time_blocks')
      .select('id')
      .eq('user_id', userId)
      .in(lookupColumn, blockIds);

    if (verifyError) {
      console.error('Error verifying time blocks:', verifyError);
      return NextResponse.json(
        { error: 'Failed to verify time blocks' },
        { status: 500 }
      );
    }

    // Filter to only IDs (always use primary key id for updates)
    const validIds = (existingBlocks || []).map(b => b.id);

    // When using external IDs and some/all blocks are missing, auto-create from event metadata
    if (useExternalId && validIds.length < blockIds.length && Array.isArray(eventsMeta) && eventsMeta.length > 0) {
      // The initial query already looked up by external_event_id, so we know which IDs exist
      // Build a set of external IDs that already have time_blocks
      const { data: existingWithExternal } = await supabase
        .from('time_blocks')
        .select('external_event_id')
        .eq('user_id', userId)
        .in('external_event_id', blockIds);
      const existingExternalIds = new Set<string>();
      for (const row of existingWithExternal || []) {
        if (row.external_event_id) existingExternalIds.add(row.external_event_id);
      }

      const eventsMetaMap = new Map<string, { activityName?: string; date?: string; startTime?: string; endTime?: string }>();
      for (const em of eventsMeta) {
        if (em.externalEventId) eventsMetaMap.set(em.externalEventId, em);
      }

      const toInsert: Array<Record<string, unknown>> = [];
      for (const externalId of blockIds) {
        if (existingExternalIds.has(externalId)) continue;
        const meta = eventsMetaMap.get(externalId);
        if (!meta || !meta.date || !meta.startTime || !meta.endTime) continue;

        // Calculate duration in minutes
        const [startH, startM] = meta.startTime.split(':').map(Number);
        const [endH, endM] = meta.endTime.split(':').map(Number);
        const durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);
        if (durationMinutes <= 0) continue;

        toInsert.push({
          user_id: userId,
          block_date: meta.date,
          start_time: meta.startTime,
          end_time: meta.endTime,
          duration_minutes: durationMinutes,
          activity_name: meta.activityName || 'Google Calendar Event',
          source: 'google_calendar',
          external_event_id: externalId,
          drip_quadrant: valueQuadrant || null,
          energy_rating: energyRating || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      if (toInsert.length > 0) {
        const { data: insertedBlocks, error: insertError } = await supabase
          .from('time_blocks')
          .insert(toInsert)
          .select('id');

        if (insertError) {
          console.error('Error auto-creating time blocks from events:', insertError);
        } else if (insertedBlocks) {
          for (const block of insertedBlocks) {
            validIds.push(block.id);
          }
        }
      }
    }

    if (validIds.length === 0) {
      return NextResponse.json(
        { error: 'No valid time blocks found to update' },
        { status: 404 }
      );
    }

    // Build update data for time_blocks table columns
    if (hasFieldUpdate) {
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (valueQuadrant !== undefined) {
        updateData.drip_quadrant = valueQuadrant;
      }
      if (energyRating !== undefined) {
        updateData.energy_rating = energyRating;
      }
      if (leverageType !== undefined) {
        updateData.leverage_type = leverageType === 'none' ? null : leverageType;
      }
      if (activityType !== undefined) {
        updateData.activity_type = activityType;
      }
      if (activityCategory !== undefined) {
        updateData.activity_category = activityCategory || null;
      }
      if (detectedProjectId !== undefined) {
        if (detectedProjectId === null || detectedProjectId === '') {
          updateData.detected_project_id = null;
        } else {
          // Verify project belongs to user
          const { data: projectCheck } = await supabase
            .from('detected_projects')
            .select('id')
            .eq('id', detectedProjectId)
            .eq('user_id', userId)
            .single();
          if (projectCheck) {
            updateData.detected_project_id = detectedProjectId;
          }
          // Silently skip if project not found/not owned
        }
      }

      const { error: updateError } = await supabase
        .from('time_blocks')
        .update(updateData)
        .eq('user_id', userId)
        .in('id', validIds);

      if (updateError) {
        console.error('Error bulk updating time blocks:', updateError);
        return NextResponse.json(
          { error: 'Failed to update time blocks' },
          { status: 500 }
        );
      }
    }

    // Handle tag assignments (merge mode by default, replace if tagMode === 'replace')
    const tagWarnings: string[] = [];
    if (hasTagUpdate) {
      const useReplace = tagMode === 'replace';

      if (useReplace) {
        // Delete existing tag assignments for all blocks
        const { error: deleteError } = await supabase
          .from('time_block_tag_assignments')
          .delete()
          .in('time_block_id', validIds);

        if (deleteError) {
          console.error('Error clearing tag assignments:', deleteError);
          tagWarnings.push('Failed to clear existing tag assignments; tags were merged instead of replaced');
        }
      }

      if (tagIds.length > 0) {
        // Verify tags belong to user
        const { data: validTags } = await supabase
          .from('time_block_tags')
          .select('id')
          .eq('user_id', userId)
          .eq('is_active', true)
          .in('id', tagIds);

        const validTagIds = (validTags || []).map(t => t.id);

        if (validTagIds.length > 0) {
          // Build assignment rows for all block+tag combinations
          const assignments = validIds.flatMap(blockId =>
            validTagIds.map(tagId => ({
              time_block_id: blockId,
              tag_id: tagId,
            }))
          );

          // Upsert to handle merge mode (ignore conflicts on duplicate)
          const { error: insertError } = await supabase
            .from('time_block_tag_assignments')
            .upsert(assignments, {
              onConflict: 'time_block_id,tag_id',
              ignoreDuplicates: true,
            });

          if (insertError) {
            console.error('Error assigning tags:', insertError);
            tagWarnings.push('Failed to assign some tags');
          }
        }
      }
    }

    // Fetch updated blocks for response
    const { data: updatedBlocks } = await supabase
      .from('time_blocks')
      .select('*')
      .eq('user_id', userId)
      .in('id', validIds);

    // Transform to camelCase
    const transformed = (updatedBlocks || []).map(block => ({
      id: block.id,
      userId: block.user_id,
      date: block.block_date,
      startTime: block.start_time,
      endTime: block.end_time,
      durationMinutes: block.duration_minutes,
      activityName: block.activity_name,
      activityCategory: block.activity_category,
      notes: block.notes,
      energyRating: block.energy_rating,
      valueQuadrant: block.drip_quadrant || 'na',
      leverageType: block.leverage_type,
      activityType: block.activity_type,
      detectedProjectId: block.detected_project_id,
      source: block.source,
      externalEventId: block.external_event_id,
      createdAt: block.created_at,
      updatedAt: block.updated_at,
    }));

    return NextResponse.json({
      success: true,
      updated: transformed.length,
      skipped: blockIds.length - validIds.length,
      timeBlocks: transformed,
      ...(tagWarnings.length > 0 && { warnings: tagWarnings }),
    });
  } catch (error) {
    console.error('Bulk update time blocks error:', error);
    return NextResponse.json(
      { error: 'Failed to bulk update time blocks' },
      { status: 500 }
    );
  }
}
