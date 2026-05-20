import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET - Fetch voicemails
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const unreadOnly = searchParams.get('unread') === 'true';

    let query = supabaseAdmin
      .from('voicemails')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data: voicemails, error, count } = await query;

    if (error) throw error;

    // Get unread count
    const { count: unreadCount } = await supabaseAdmin
      .from('voicemails')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false);

    return NextResponse.json({ voicemails, total: count, unreadCount });
  } catch (error) {
    console.error('Error fetching voicemails:', error);
    return NextResponse.json({ error: 'Failed to fetch voicemails' }, { status: 500 });
  }
}

// POST - Mark voicemail as read or delete
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, voicemailId } = body;

    if (action === 'mark-read' && voicemailId) {
      await supabaseAdmin
        .from('voicemails')
        .update({ is_read: true })
        .eq('id', voicemailId);

      return NextResponse.json({ success: true });
    }

    if (action === 'mark-unread' && voicemailId) {
      await supabaseAdmin
        .from('voicemails')
        .update({ is_read: false })
        .eq('id', voicemailId);

      return NextResponse.json({ success: true });
    }

    if (action === 'delete' && voicemailId) {
      await supabaseAdmin
        .from('voicemails')
        .delete()
        .eq('id', voicemailId);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error processing voicemail action:', error);
    return NextResponse.json({ error: 'Failed to process action' }, { status: 500 });
  }
}
