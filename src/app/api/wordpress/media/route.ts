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

// GET - List media
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  try {
    const params = new URLSearchParams();
    params.append('per_page', searchParams.get('per_page') || '100');
    params.append('orderby', 'date');
    params.append('order', 'desc');
    params.append('media_type', 'image');
    
    if (searchParams.get('search')) {
      params.append('search', searchParams.get('search')!);
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    const authHeader = getAuthHeader();
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const res = await fetch(`${WP_REST_API_URL}/media?${params}`, { headers });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('WordPress API error:', errorText);
      return NextResponse.json({ error: 'Failed to fetch media from WordPress', details: errorText }, { status: res.status });
    }

    const media = await res.json();
    return NextResponse.json({ media });
  } catch (error) {
    console.error('Error fetching media:', error);
    return NextResponse.json({ error: 'Failed to fetch media' }, { status: 500 });
  }
}
