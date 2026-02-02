import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/api-auth';

// GET - Fetch all contacts for user
export async function GET() {
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

    const { data: contacts, error } = await supabase
      .from('friend_inventory')
      .select('*')
      .eq('user_id', userId)
      .eq('is_archived', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching contacts:', error);
      return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
    }

    // Transform to match frontend interface
    const transformedContacts = (contacts || []).map(contact => ({
      id: contact.id,
      name: contact.name,
      relationship: contact.relationship_type || '',
      energyImpact: contact.energy_impact || 'neutral',
      frequency: contact.connection_frequency || 'monthly',
      timeLimitMinutes: contact.time_limit_weekly_minutes || 0,
      boundaries: contact.boundaries_notes || '',
      notes: contact.notes || '',
      lastContact: contact.last_contact_date || '',
      createdAt: contact.created_at,
    }));

    return NextResponse.json(transformedContacts);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
  }
}

// POST - Create a new contact
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

    const {
      name,
      relationship,
      energyImpact,
      frequency,
      timeLimitMinutes,
      boundaries,
      notes,
    } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const { data: contact, error } = await supabase
      .from('friend_inventory')
      .insert({
        user_id: userId,
        name,
        relationship_type: relationship || null,
        energy_impact: energyImpact || 'neutral',
        connection_frequency: frequency || 'monthly',
        time_limit_weekly_minutes: timeLimitMinutes || null,
        boundaries_notes: boundaries || null,
        notes: notes || null,
        is_archived: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating contact:', error);
      return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 });
    }

    return NextResponse.json({
      id: contact.id,
      name: contact.name,
      relationship: contact.relationship_type || '',
      energyImpact: contact.energy_impact || 'neutral',
      frequency: contact.connection_frequency || 'monthly',
      timeLimitMinutes: contact.time_limit_weekly_minutes || 0,
      boundaries: contact.boundaries_notes || '',
      notes: contact.notes || '',
      lastContact: contact.last_contact_date || '',
      createdAt: contact.created_at,
    });
  } catch (error) {
    console.error('Error creating contact:', error);
    return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 });
  }
}

// PUT - Update a contact
export async function PUT(request: NextRequest) {
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

    const {
      id,
      name,
      relationship,
      energyImpact,
      frequency,
      timeLimitMinutes,
      boundaries,
      notes,
      lastContact,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Contact ID is required' }, { status: 400 });
    }

    const { data: contact, error } = await supabase
      .from('friend_inventory')
      .update({
        name,
        relationship_type: relationship || null,
        energy_impact: energyImpact || 'neutral',
        connection_frequency: frequency || 'monthly',
        time_limit_weekly_minutes: timeLimitMinutes || null,
        boundaries_notes: boundaries || null,
        notes: notes || null,
        last_contact_date: lastContact || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating contact:', error);
      return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 });
    }

    return NextResponse.json({
      id: contact.id,
      name: contact.name,
      relationship: contact.relationship_type || '',
      energyImpact: contact.energy_impact || 'neutral',
      frequency: contact.connection_frequency || 'monthly',
      timeLimitMinutes: contact.time_limit_weekly_minutes || 0,
      boundaries: contact.boundaries_notes || '',
      notes: contact.notes || '',
      lastContact: contact.last_contact_date || '',
      createdAt: contact.created_at,
    });
  } catch (error) {
    console.error('Error updating contact:', error);
    return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 });
  }
}

// DELETE - Delete a contact (soft delete)
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Contact ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('friend_inventory')
      .update({ is_archived: true, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting contact:', error);
      return NextResponse.json({ error: 'Failed to delete contact' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting contact:', error);
    return NextResponse.json({ error: 'Failed to delete contact' }, { status: 500 });
  }
}
