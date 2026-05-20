import { NextRequest, NextResponse } from 'next/server';

const WP_SITE_URL = process.env.WP_SITE_URL!;
const WP_APPLICATION_USERNAME = process.env.WP_APPLICATION_USERNAME!;
const WP_APPLICATION_PASSWORD = process.env.WP_APPLICATION_PASSWORD!;

const authHeader = 'Basic ' + Buffer.from(`${WP_APPLICATION_USERNAME}:${WP_APPLICATION_PASSWORD}`).toString('base64');

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(
      `${WP_SITE_URL}/wp-json/fluent-crm/v2/lists`,
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
    
    // Transform lists
    const lists = (data.lists || data || []).map((list: any) => ({
      id: list.id?.toString() || list.slug,
      title: list.title || list.name,
      slug: list.slug,
      count: list.subscribers_count || list.count || 0,
    }));

    return NextResponse.json({ lists });
  } catch (error) {
    console.error('Error fetching lists:', error);
    return NextResponse.json({ error: 'Failed to fetch lists', lists: [] }, { status: 500 });
  }
}
