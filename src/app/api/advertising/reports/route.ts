import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const LOGS_FILE = path.join(process.cwd(), 'data', 'playback-logs.json');
const DEVICES_FILE = path.join(process.cwd(), 'data', 'audio-devices.json');
const MEDIA_FILE = path.join(process.cwd(), 'data', 'audio-media.json');

async function readLogs() {
  try {
    const data = await fs.readFile(LOGS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { logs: [], deviceEvents: [] };
  }
}

async function readDevices() {
  try {
    const data = await fs.readFile(DEVICES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { devices: [] };
  }
}

async function readMedia() {
  try {
    const data = await fs.readFile(MEDIA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { media: [] };
  }
}

// GET - Get playback logs and stats
export async function GET(req: NextRequest) {
  const deviceId = req.nextUrl.searchParams.get('deviceId');
  const mediaId = req.nextUrl.searchParams.get('mediaId');
  const startDate = req.nextUrl.searchParams.get('startDate');
  const endDate = req.nextUrl.searchParams.get('endDate');
  
  const logsData = await readLogs();
  let logs = logsData.logs || [];
  
  // Apply filters
  if (deviceId) {
    logs = logs.filter((l: any) => l.deviceId === deviceId);
  }
  if (mediaId) {
    logs = logs.filter((l: any) => l.mediaId === mediaId);
  }
  if (startDate) {
    const start = new Date(startDate).getTime();
    logs = logs.filter((l: any) => new Date(l.playedAt).getTime() >= start);
  }
  if (endDate) {
    const end = new Date(endDate).getTime();
    logs = logs.filter((l: any) => new Date(l.playedAt).getTime() <= end);
  }
  
  // Sort by most recent
  logs = logs.sort((a: any, b: any) => 
    new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime()
  );
  
  // Calculate summary stats
  const devicesData = await readDevices();
  const mediaData = await readMedia();
  
  const stats = {
    totalPlays: logs.length,
    completedPlays: logs.filter((l: any) => l.completed).length,
    uniqueDevices: new Set(logs.map((l: any) => l.deviceId)).size,
    uniqueMedia: new Set(logs.map((l: any) => l.mediaId)).size,
    totalDuration: logs.reduce((sum: number, l: any) => sum + (l.durationPlayed || 0), 0),
    
    // Revenue calculation
    estimatedRevenue: logs.reduce((sum: number, log: any) => {
      const mediaItem = mediaData.media.find((m: any) => m.id === log.mediaId);
      if (mediaItem?.pricePerUnit) {
        switch (mediaItem.pricingModel) {
          case 'per_play':
            return sum + mediaItem.pricePerUnit;
          case 'duration':
            return sum + (mediaItem.pricePerUnit * (log.durationPlayed || 0));
          default:
            return sum;
        }
      }
      return sum;
    }, 0),
  };
  
  // Plays by device
  const playsByDevice = devicesData.devices.map((device: any) => ({
    deviceId: device.id,
    deviceName: device.name,
    locationName: device.locationName,
    plays: logs.filter((l: any) => l.deviceId === device.id).length,
  })).sort((a: any, b: any) => b.plays - a.plays);
  
  // Plays by media
  const playsByMedia = mediaData.media.map((m: any) => ({
    mediaId: m.id,
    mediaName: m.name,
    clientName: m.clientName,
    plays: logs.filter((l: any) => l.mediaId === m.id).length,
  })).sort((a: any, b: any) => b.plays - a.plays);
  
  return NextResponse.json({
    logs: logs.slice(0, 1000), // Limit to recent 1000
    stats,
    playsByDevice,
    playsByMedia,
    deviceEvents: logsData.deviceEvents || [],
  });
}
