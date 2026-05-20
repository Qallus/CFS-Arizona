import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

const DEVICES_FILE = path.join(process.cwd(), 'data', 'audio-devices.json');
const LOGS_FILE = path.join(process.cwd(), 'data', 'playback-logs.json');

async function readDevices() {
  try {
    const data = await fs.readFile(DEVICES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { devices: [] };
  }
}

async function writeDevices(data: any) {
  await fs.writeFile(DEVICES_FILE, JSON.stringify(data, null, 2));
}

async function readLogs() {
  try {
    const data = await fs.readFile(LOGS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { logs: [], deviceEvents: [] };
  }
}

// GET - Get single device with logs
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await readDevices();
  const logsData = await readLogs();
  
  const device = data.devices.find((d: any) => d.id === id || d.deviceId === id);
  if (!device) {
    return NextResponse.json({ error: 'Device not found' }, { status: 404 });
  }
  
  // Get recent logs for this device
  const recentLogs = logsData.logs
    .filter((l: any) => l.deviceId === device.id)
    .slice(-100);
  
  const recentEvents = logsData.deviceEvents
    .filter((e: any) => e.deviceId === device.id)
    .slice(-50);
  
  // Calculate stats
  const today = new Date().toISOString().split('T')[0];
  const todayLogs = recentLogs.filter((l: any) => l.playedAt?.startsWith(today));
  
  const stats = {
    playsToday: todayLogs.length,
    playsThisWeek: recentLogs.filter((l: any) => {
      const logDate = new Date(l.playedAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return logDate > weekAgo;
    }).length,
    uptimePercent: calculateUptime(recentEvents),
    lastError: recentEvents.find((e: any) => e.eventType === 'error'),
  };
  
  const { apiKeyHash, ...safeDevice } = device;
  
  return NextResponse.json({ device: safeDevice, logs: recentLogs, events: recentEvents, stats });
}

// PATCH - Update device
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const data = await readDevices();
  
  const index = data.devices.findIndex((d: any) => d.id === id);
  if (index === -1) {
    return NextResponse.json({ error: 'Device not found' }, { status: 404 });
  }
  
  // Don't allow updating apiKeyHash
  const { apiKeyHash, ...updateData } = body;
  
  data.devices[index] = {
    ...data.devices[index],
    ...updateData,
    updatedAt: new Date().toISOString(),
  };
  
  await writeDevices(data);
  
  const { apiKeyHash: _, ...device } = data.devices[index];
  return NextResponse.json({ success: true, device });
}

// DELETE - Remove device
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await readDevices();
  
  const index = data.devices.findIndex((d: any) => d.id === id);
  if (index === -1) {
    return NextResponse.json({ error: 'Device not found' }, { status: 404 });
  }
  
  data.devices.splice(index, 1);
  await writeDevices(data);
  
  return NextResponse.json({ success: true });
}

// POST - Special actions (regenerate key, deploy, etc.)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const action = body.action;
  const data = await readDevices();
  
  const index = data.devices.findIndex((d: any) => d.id === id);
  if (index === -1) {
    return NextResponse.json({ error: 'Device not found' }, { status: 404 });
  }
  
  switch (action) {
    case 'regenerate-key': {
      const apiKey = `ccast_${crypto.randomBytes(32).toString('hex')}`;
      const apiKeyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
      data.devices[index].apiKeyHash = apiKeyHash;
      data.devices[index].updatedAt = new Date().toISOString();
      await writeDevices(data);
      return NextResponse.json({ 
        success: true, 
        apiKey,
        message: 'Save this API key - it will not be shown again'
      });
    }
    
    case 'deploy': {
      // Mark device for sync
      data.devices[index].lastSyncAt = null;
      data.devices[index].updatedAt = new Date().toISOString();
      await writeDevices(data);
      return NextResponse.json({ success: true, message: 'Device marked for sync' });
    }
    
    case 'revoke': {
      // Clear API key to revoke access
      data.devices[index].apiKeyHash = undefined;
      data.devices[index].status = 'offline';
      data.devices[index].updatedAt = new Date().toISOString();
      await writeDevices(data);
      return NextResponse.json({ success: true, message: 'Device access revoked' });
    }
    
    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }
}

function calculateUptime(events: any[]): number {
  if (events.length === 0) return 0;
  
  const heartbeats = events.filter((e: any) => e.eventType === 'heartbeat');
  if (heartbeats.length < 2) return 100;
  
  // Simple calculation: ratio of heartbeats received vs expected (1 per minute)
  const firstBeat = new Date(heartbeats[0].createdAt).getTime();
  const lastBeat = new Date(heartbeats[heartbeats.length - 1].createdAt).getTime();
  const expectedMinutes = (lastBeat - firstBeat) / 60000;
  
  if (expectedMinutes < 1) return 100;
  
  const uptime = (heartbeats.length / expectedMinutes) * 100;
  return Math.min(100, Math.round(uptime));
}
