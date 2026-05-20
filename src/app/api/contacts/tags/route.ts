import { NextRequest, NextResponse } from 'next/server';

const WP_SITE_URL = process.env.WP_SITE_URL!;
const WP_APPLICATION_USERNAME = process.env.WP_APPLICATION_USERNAME!;
const WP_APPLICATION_PASSWORD = process.env.WP_APPLICATION_PASSWORD!;

const authHeader = 'Basic ' + Buffer.from(`${WP_APPLICATION_USERNAME}:${WP_APPLICATION_PASSWORD}`).toString('base64');

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(
      `${WP_SITE_URL}/wp-json/fluent-crm/v2/tags`,
      {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      throw new Error(`Fluent CRM API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform tags
    const tags = (data.tags || data || []).map((tag: any) => ({
      id: tag.id?.toString() || tag.slug,
      title: tag.title || tag.name,
      slug: tag.slug,
      count: tag.subscribers_count || tag.count || 0,
    }));

    return NextResponse.json({ tags });
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json({ error: 'Failed to fetch tags', tags: [] }, { status: 500 });
  }
}
