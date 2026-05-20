import { NextRequest, NextResponse } from 'next/server';

const GATEWAY_URL = process.env.HERMES_GATEWAY_URL || 'http://localhost:18789';
const GATEWAY_TOKEN = process.env.HERMES_GATEWAY_TOKEN || '';

async function gatewayRequest(endpoint: string, method: string = 'GET', body?: unknown) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (GATEWAY_TOKEN) {
    headers['Authorization'] = `Bearer ${GATEWAY_TOKEN}`;
  }

  const response = await fetch(`${GATEWAY_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  return response.json();
}

export async function GET() {
  try {
    const data = await gatewayRequest('/api/cron/list');
    return NextResponse.json({ jobs: data.jobs || [] });
  } catch (error) {
    console.error('Error fetching cron jobs:', error);
    return NextResponse.json({ jobs: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, jobId, job } = body;

    if (action === 'delete') {
      await gatewayRequest(`/api/cron/${jobId}`, 'DELETE');
    } else if (action === 'run') {
      await gatewayRequest(`/api/cron/${jobId}/run`, 'POST');
    } else if (action === 'add') {
      await gatewayRequest('/api/cron', 'POST', job);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error with cron action:', error);
    return NextResponse.json({ error: 'Failed to perform action' }, { status: 500 });
  }
}
