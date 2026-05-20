import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

const DEVICES_FILE = path.join(process.cwd(), 'data', 'audio-devices.json');
const MEDIA_FILE = path.join(process.cwd(), 'data', 'audio-media.json');
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

async function readMedia() {
  try {
    const data = await fs.readFile(MEDIA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { media: [], clients: [] };
  }
}

async function readLogs() {
  try {
    const data = await fs.readFile(LOGS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { logs: [], deviceEvents: [] };
  }
}

async function writeLogs(data: any) {
  await fs.mkdir(path.dirname(LOGS_FILE), { recursive: true });
  await fs.writeFile(LOGS_FILE, JSON.stringify(data, null, 2));
}

// Authenticate device by API key
async function authenticateDevice(req: NextRequest): Promise<any | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  
  const apiKey = authHeader.substring(7);
  const apiKeyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
  
  const data = await readDevices();
  return data.devices.find((d: any) => d.apiKeyHash === apiKeyHash);
}

// POST - Device actions (register, heartbeat, log)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const action = body.action;
  
  switch (action) {
    case 'register': {
      // Self-registration with hardware ID
      return handleRegister(body);
    }
    
    case 'heartbeat': {
      const device = await authenticateDevice(req);
      if (!device) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      return handleHeartbeat(device, body);
    }
    
    case 'log': {
      const device = await authenticateDevice(req);
      if (!device) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      return handlePlaybackLog(device, body);
    }
    
    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }
}

// GET - Get schedule and media assignments
export async function GET(req: NextRequest) {
  const device = await authenticateDevice(req);
  if (!device) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const endpoint = req.nextUrl.searchParams.get('endpoint');
  
  switch (endpoint) {
    case 'schedule': {
      return getSchedule(device);
    }
    
    case 'media': {
      const mediaId = req.nextUrl.searchParams.get('id');
      if (!mediaId) {
        return NextResponse.json({ error: 'Media ID required' }, { status: 400 });
      }
      return getMediaDownloadUrl(device, mediaId);
    }
    
    case 'sync': {
      return getFullSync(device);
    }
    
    default:
      return getFullSync(device);
  }
}

// Handle device self-registration
async function handleRegister(body: any) {
  const { hardwareId, hardwareModel, firmwareVersion, macAddress } = body;
  
  if (!hardwareId) {
    return NextResponse.json({ error: 'Hardware ID required' }, { status: 400 });
  }
  
  const data = await readDevices();
  
  // Check if already registered
  const existing = data.devices.find((d: any) => d.deviceId === hardwareId);
  if (existing) {
    // If device exists but has no key, it was revoked
    if (!existing.apiKeyHash) {
      return NextResponse.json({ error: 'Device has been revoked' }, { status: 403 });
    }
    return NextResponse.json({ 
      error: 'Device already registered',
      message: 'Use existing API key or contact admin to regenerate'
    }, { status: 409 });
  }
  
  // Auto-register new device (admin can approve later)
  const apiKey = `ccast_${crypto.randomBytes(32).toString('hex')}`;
  const apiKeyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
  
  const newDevice = {
    id: `dev-${Date.now()}`,
    deviceId: hardwareId,
    name: `Audio Player ${hardwareId.slice(-6)}`,
    status: 'provisioning',
    firmwareVersion,
    hardwareModel,
    macAddress,
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
  await writeDevices(data);
  
  // Log registration event
  const logsData = await readLogs();
  logsData.deviceEvents.push({
    id: `evt-${Date.now()}`,
    deviceId: newDevice.id,
    eventType: 'registration',
    payload: { hardwareModel, firmwareVersion, macAddress },
    createdAt: new Date().toISOString(),
  });
  await writeLogs(logsData);
  
  return NextResponse.json({
    success: true,
    deviceId: newDevice.id,
    apiKey, // Only returned once!
    message: 'Device registered. Save this API key - it will not be shown again.'
  });
}

// Handle device heartbeat
async function handleHeartbeat(device: any, body: any) {
  const { status, currentMedia, wifiStrength, ipAddress, volume, errors } = body;
  
  const data = await readDevices();
  const index = data.devices.findIndex((d: any) => d.id === device.id);
  
  if (index === -1) {
    return NextResponse.json({ error: 'Device not found' }, { status: 404 });
  }
  
  // Update device status
  data.devices[index] = {
    ...data.devices[index],
    status: errors?.length ? 'error' : 'online',
    lastHeartbeat: new Date().toISOString(),
    currentMedia,
    wifiStrength,
    ipAddress,
    volume,
    updatedAt: new Date().toISOString(),
  };
  
  await writeDevices(data);
  
  // Log heartbeat event
  const logsData = await readLogs();
  logsData.deviceEvents.push({
    id: `evt-${Date.now()}`,
    deviceId: device.id,
    eventType: 'heartbeat',
    payload: { wifiStrength, ipAddress, volume, errors },
    createdAt: new Date().toISOString(),
  });
  
  // Keep only last 1000 events per device
  logsData.deviceEvents = logsData.deviceEvents.slice(-5000);
  await writeLogs(logsData);
  
  // Check if device needs to sync (schedule or media changed)
  const needsSync = !device.lastSyncAt || 
    new Date(device.updatedAt) > new Date(device.lastSyncAt);
  
  return NextResponse.json({
    success: true,
    needsSync,
    serverTime: new Date().toISOString(),
  });
}

// Handle playback log
async function handlePlaybackLog(device: any, body: any) {
  const { mediaId, playedAt, durationPlayed, completed, campaignId } = body;
  
  const logsData = await readLogs();
  
  logsData.logs.push({
    id: `log-${Date.now()}`,
    deviceId: device.id,
    mediaId,
    campaignId,
    playedAt: playedAt || new Date().toISOString(),
    durationPlayed,
    completed: completed !== false,
    createdAt: new Date().toISOString(),
  });
  
  // Keep only last 10000 logs
  logsData.logs = logsData.logs.slice(-10000);
  await writeLogs(logsData);
  
  // Update device last playback time
  const devicesData = await readDevices();
  const index = devicesData.devices.findIndex((d: any) => d.id === device.id);
  if (index !== -1) {
    devicesData.devices[index].lastPlayback = new Date().toISOString();
    devicesData.devices[index].currentMedia = mediaId;
    await writeDevices(devicesData);
  }
  
  return NextResponse.json({ success: true });
}

// Get device schedule and assigned media
async function getSchedule(device: any) {
  const mediaData = await readMedia();
  
  // Get assigned media details
  const assignedMedia = (device.assignedMediaIds || [])
    .map((id: string) => mediaData.media.find((m: any) => m.id === id))
    .filter(Boolean)
    .map((m: any) => ({
      id: m.id,
      name: m.name,
      filename: m.filename,
      duration: m.durationSeconds,
      downloadUrl: `/api/advertising/device-api?endpoint=media&id=${m.id}`,
    }));
  
  return NextResponse.json({
    schedule: device.schedule,
    media: assignedMedia,
    lastUpdated: device.updatedAt,
  });
}

// Get signed download URL for media file
async function getMediaDownloadUrl(device: any, mediaId: string) {
  const mediaData = await readMedia();
  const media = mediaData.media.find((m: any) => m.id === mediaId);
  
  if (!media) {
    return NextResponse.json({ error: 'Media not found' }, { status: 404 });
  }
  
  // Check if device is authorized for this media
  if (!device.assignedMediaIds?.includes(mediaId)) {
    return NextResponse.json({ error: 'Not authorized for this media' }, { status: 403 });
  }
  
  // For now, return direct URL - later integrate with GCS signed URLs
  return NextResponse.json({
    mediaId,
    filename: media.filename,
    downloadUrl: media.storageUrl || `/uploads/audio/${media.filename}`,
    mimeType: media.mimeType,
    duration: media.durationSeconds,
    checksum: media.checksum,
  });
}

// Get full sync data for device
async function getFullSync(device: any) {
  const mediaData = await readMedia();
  
  const assignedMedia = (device.assignedMediaIds || [])
    .map((id: string) => mediaData.media.find((m: any) => m.id === id))
    .filter(Boolean)
    .map((m: any) => ({
      id: m.id,
      name: m.name,
      filename: m.filename,
      duration: m.durationSeconds,
      downloadUrl: m.storageUrl || `/uploads/audio/${m.filename}`,
      mimeType: m.mimeType,
      checksum: m.checksum,
    }));
  
  // Mark device as synced
  const devicesData = await readDevices();
  const index = devicesData.devices.findIndex((d: any) => d.id === device.id);
  if (index !== -1) {
    devicesData.devices[index].lastSyncAt = new Date().toISOString();
    await writeDevices(devicesData);
  }
  
  return NextResponse.json({
    deviceId: device.id,
    schedule: device.schedule,
    media: assignedMedia,
    volume: device.volume || 80,
    serverTime: new Date().toISOString(),
    syncedAt: new Date().toISOString(),
  });
}
