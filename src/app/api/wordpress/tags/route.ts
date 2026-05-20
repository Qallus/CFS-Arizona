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

// GET - List tags
export async function GET(request: NextRequest) {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    const authHeader = getAuthHeader();
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const res = await fetch(`${WP_REST_API_URL}/tags?per_page=100`, { headers });
    
    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json({ error: 'Failed to fetch tags', details: errorText }, { status: res.status });
    }

    const tags = await res.json();
    return NextResponse.json({ tags });
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 });
  }
}
