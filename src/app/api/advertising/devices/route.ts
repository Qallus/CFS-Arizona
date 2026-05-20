import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

const DATA_FILE = path.join(process.cwd(), 'data', 'advertising-devices.json');

export interface AudioDevice {
  id: string;
  deviceId: string;           // Hardware identifier
  name: string;
  description?: string;
  locationId?: string;        // Link to advertising location
  locationName?: string;
  locationAddress?: string;
  lat?: number;
  lng?: number;
  region?: string;
  groupIds?: string[];        // Device groups
  siteMapX?: number;          // Position on site map (0-100%)
  siteMapY?: number;          // Position on site map (0-100%)
  
  // Status
  status: 'online' | 'offline' | 'error' | 'provisioning';
  lastHeartbeat?: string;
  lastPlayback?: string;
  currentMedia?: string;      // Currently playing media ID
  
  // Hardware info
  firmwareVersion?: string;
  hardwareModel?: string;
  ipAddress?: string;
  macAddress?: string;
  wifiStrength?: number;
  volume?: number;
  
  // Auth
  apiKeyHash?: string;        // Hashed API key for device auth
  sshEnabled?: boolean;       // If SSH control is enabled
  sshUser?: string;           // SSH username for direct control
  
  // Deployment
  assignedMediaIds?: string[];
  schedule?: {
    enabled: boolean;
    startTime?: string;       // HH:mm
    endTime?: string;
    daysOfWeek?: number[];    // 0-6
    spotsPerHour?: number;
  };
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  lastSyncAt?: string;
}

async function readData(): Promise<{ devices: AudioDevice[] }> {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { devices: [] };
  }
}

async function writeData(data: { devices: AudioDevice[] }): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

function generateApiKey(): string {
  return `ccast_${crypto.randomBytes(32).toString('hex')}`;
}

function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

// GET - List all devices or filter
export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get('status');
  const region = req.nextUrl.searchParams.get('region');
  const groupId = req.nextUrl.searchParams.get('groupId');
  
  const data = await readData();
  let devices = data.devices;
  
  // Check for stale devices (no heartbeat in 2 minutes = offline)
  const now = Date.now();
  devices = devices.map(device => {
    if (device.status === 'online' && device.lastHeartbeat) {
      const lastBeat = new Date(device.lastHeartbeat).getTime();
      if (now - lastBeat > 120000) {
        return { ...device, status: 'offline' as const };
      }
    }
    return device;
  });
  
  if (status) {
    devices = devices.filter(d => d.status === status);
  }
  if (region) {
    devices = devices.filter(d => d.region === region);
  }
  if (groupId) {
    devices = devices.filter(d => d.groupIds?.includes(groupId));
  }
  
  // Don't expose API key hashes
  devices = devices.map(({ apiKeyHash, ...device }) => device);
  
  // Stats
  const stats = {
    total: data.devices.length,
    online: devices.filter(d => d.status === 'online').length,
    offline: devices.filter(d => d.status === 'offline').length,
    error: devices.filter(d => d.status === 'error').length,
  };
  
  return NextResponse.json({ devices, stats });
}

// POST - Register/create new device
export async function POST(req: NextRequest) {
  const body = await req.json();
  const data = await readData();
  
  // Check for duplicate deviceId
  if (body.deviceId && data.devices.some(d => d.deviceId === body.deviceId)) {
    return NextResponse.json({ error: 'Device ID already registered' }, { status: 400 });
  }
  
  // Generate API key for device auth
  const apiKey = generateApiKey();
  const apiKeyHash = hashApiKey(apiKey);
  
  const newDevice: AudioDevice = {
    id: `dev-${Date.now()}`,
    deviceId: body.deviceId || `DEV-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
    name: body.name || 'New Audio Player',
    description: body.description,
    locationId: body.locationId,
    locationName: body.locationName,
    locationAddress: body.locationAddress,
    lat: body.lat,
    lng: body.lng,
    region: body.region,
    groupIds: body.groupIds || [],
    status: 'provisioning',
    firmwareVersion: body.firmwareVersion,
    hardwareModel: body.hardwareModel,
    volume: body.volume ?? 80,
    apiKeyHash,
    assignedMediaIds: [],
    schedule: {
      enabled: false,
      startTime: '06:00',
      endTime: '22:00',
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      spotsPerHour: 4,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  data.devices.push(newDevice);
  await writeData(data);
  
  // Return the API key ONLY on creation (won't be shown again)
  return NextResponse.json({ 
    success: true, 
    device: { ...newDevice, apiKeyHash: undefined },
    apiKey, // Only returned once!
    message: 'Save this API key - it will not be shown again'
  });
}

// PUT - Update device
export async function PUT(req: NextRequest) {
  const body = await req.json();
  const data = await readData();
  
  const index = data.devices.findIndex(d => d.id === body.id);
  if (index === -1) {
    return NextResponse.json({ error: 'Device not found' }, { status: 404 });
  }
  
  // Don't allow updating apiKeyHash via normal update
  const { apiKeyHash, ...updateData } = body;
  
  data.devices[index] = {
    ...data.devices[index],
    ...updateData,
    updatedAt: new Date().toISOString(),
  };
  
  await writeData(data);
  
  const { apiKeyHash: _, ...device } = data.devices[index];
  return NextResponse.json({ success: true, device });
}

// DELETE - Remove device
export async function DELETE(req: NextRequest) {
  const body = await req.json();
  const data = await readData();
  
  const index = data.devices.findIndex(d => d.id === body.id);
  if (index === -1) {
    return NextResponse.json({ error: 'Device not found' }, { status: 404 });
  }
  
  data.devices.splice(index, 1);
  await writeData(data);
  
  return NextResponse.json({ success: true });
}
