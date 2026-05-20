import { NextRequest, NextResponse } from 'next/server';

const WP_SITE_URL = process.env.WP_SITE_URL || 'https://channelcast.io';
const WP_REST_API_URL = process.env.WP_REST_API_URL || `${WP_SITE_URL}/wp-json/wp/v2`;
const WP_USERNAME = process.env.WP_APPLICATION_USERNAME;
const WP_PASSWORD = process.env.WP_APPLICATION_PASSWORD;

function getAuthHeader() {
  if (!WP_USERNAME || !WP_PASSWORD) {
    return null;
  }
  const credentials = Buffer.from(`${WP_USERNAME}:${WP_PASSWORD}`).toString('base64');
  return `Basic ${credentials}`;
}

// GET - List posts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  try {
    const params = new URLSearchParams();
    params.append('per_page', searchParams.get('per_page') || '50');
    params.append('orderby', 'date');
    params.append('order', 'desc');
    
    if (searchParams.get('_embed')) {
      params.append('_embed', 'true');
    }
    if (searchParams.get('status')) {
      params.append('status', searchParams.get('status')!);
    }
    if (searchParams.get('search')) {
      params.append('search', searchParams.get('search')!);
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    // Add auth header to get drafts and private posts
    const authHeader = getAuthHeader();
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    // If no status filter and we have auth, get all statuses
    if (!searchParams.get('status') && authHeader) {
      params.append('status', 'publish,draft,pending,private');
    }

    const res = await fetch(`${WP_REST_API_URL}/posts?${params}`, { headers });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('WordPress API error:', errorText);
      return NextResponse.json({ error: 'Failed to fetch posts from WordPress', details: errorText }, { status: res.status });
    }

    const posts = await res.json();
    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

// POST - Create new post
export async function POST(request: NextRequest) {
  const authHeader = getAuthHeader();
  if (!authHeader) {
    return NextResponse.json({ error: 'WordPress credentials not configured' }, { status: 401 });
  }

  try {
    const body = await request.json();

    const postData: any = {
      title: body.title,
      content: body.content,
      status: body.status || 'draft',
    };

    if (body.excerpt) {
      postData.excerpt = body.excerpt;
    }
    if (body.featured_media) {
      postData.featured_media = body.featured_media;
    }
    if (body.categories && body.categories.length > 0) {
      postData.categories = body.categories;
    }
    if (body.tags && body.tags.length > 0) {
      postData.tags = body.tags;
    }

    const res = await fetch(`${WP_REST_API_URL}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(postData),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('WordPress API error:', errorText);
      return NextResponse.json({ error: 'Failed to create post', details: errorText }, { status: res.status });
    }

    const post = await res.json();
    return NextResponse.json({ post, success: true });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}

// PUT - Update post
export async function PUT(request: NextRequest) {
  const authHeader = getAuthHeader();
  if (!authHeader) {
    return NextResponse.json({ error: 'WordPress credentials not configured' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Post ID required' }, { status: 400 });
    }

    const postData: any = {};
    if (updateData.title !== undefined) postData.title = updateData.title;
    if (updateData.content !== undefined) postData.content = updateData.content;
    if (updateData.excerpt !== undefined) postData.excerpt = updateData.excerpt;
    if (updateData.status !== undefined) postData.status = updateData.status;
    if (updateData.featured_media !== undefined) postData.featured_media = updateData.featured_media;
    if (updateData.categories !== undefined) postData.categories = updateData.categories;
    if (updateData.tags !== undefined) postData.tags = updateData.tags;

    const res = await fetch(`${WP_REST_API_URL}/posts/${id}`, {
      method: 'POST', // WordPress uses POST for updates
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(postData),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('WordPress API error:', errorText);
      return NextResponse.json({ error: 'Failed to update post', details: errorText }, { status: res.status });
    }

    const post = await res.json();
    return NextResponse.json({ post, success: true });
  } catch (error) {
    console.error('Error updating post:', error);
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
  }
}

// DELETE - Delete post
export async function DELETE(request: NextRequest) {
  const authHeader = getAuthHeader();
  if (!authHeader) {
    return NextResponse.json({ error: 'WordPress credentials not configured' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Post ID required' }, { status: 400 });
  }

  try {
    const res = await fetch(`${WP_REST_API_URL}/posts/${id}?force=true`, {
      method: 'DELETE',
      headers: {
        'Authorization': authHeader,
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('WordPress API error:', errorText);
      return NextResponse.json({ error: 'Failed to delete post', details: errorText }, { status: res.status });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}
