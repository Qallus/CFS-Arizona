import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

const DATA_FILE = path.join(process.cwd(), 'data', 'audio-media.json');
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads', 'audio');

export interface AudioMedia {
  id: string;
  name: string;
  filename: string;
  originalFilename: string;
  
  // File info
  mimeType: string;
  fileSize: number;
  durationSeconds: number;
  checksum?: string;
  
  // Storage
  storageType: 'local' | 'gcs';
  storageUrl: string;
  storagePath?: string;
  
  // Metadata
  description?: string;
  clientId?: string;
  clientName?: string;
  tags?: string[];
  
  // Pricing (for revenue tracking)
  pricingModel?: 'per_play' | 'cpm' | 'flat' | 'duration';
  pricePerUnit?: number;
  
  // Status
  status: 'processing' | 'ready' | 'error' | 'archived';
  
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  notes?: string;
  createdAt: string;
}

async function readData(): Promise<{ media: AudioMedia[]; clients: Client[] }> {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { media: [], clients: [] };
  }
}

async function writeData(data: { media: AudioMedia[]; clients: Client[] }): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

// GET - List all media or filter
export async function GET(req: NextRequest) {
  const clientId = req.nextUrl.searchParams.get('clientId');
  const status = req.nextUrl.searchParams.get('status');
  const search = req.nextUrl.searchParams.get('search');
  
  const data = await readData();
  let media = data.media;
  
  if (clientId) {
    media = media.filter(m => m.clientId === clientId);
  }
  if (status) {
    media = media.filter(m => m.status === status);
  }
  if (search) {
    const q = search.toLowerCase();
    media = media.filter(m => 
      m.name.toLowerCase().includes(q) ||
      m.clientName?.toLowerCase().includes(q) ||
      m.tags?.some(t => t.toLowerCase().includes(q))
    );
  }
  
  // Sort by most recent
  media = media.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  
  // Stats
  const stats = {
    total: data.media.length,
    ready: data.media.filter(m => m.status === 'ready').length,
    totalDuration: data.media.reduce((sum, m) => sum + (m.durationSeconds || 0), 0),
    totalSize: data.media.reduce((sum, m) => sum + (m.fileSize || 0), 0),
  };
  
  return NextResponse.json({ media, clients: data.clients, stats });
}

// POST - Create new media (metadata only, file uploaded separately)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const data = await readData();
  
  const newMedia: AudioMedia = {
    id: `media-${Date.now()}`,
    name: body.name || 'Untitled Audio',
    filename: body.filename || '',
    originalFilename: body.originalFilename || body.filename || '',
    mimeType: body.mimeType || 'audio/mpeg',
    fileSize: body.fileSize || 0,
    durationSeconds: body.durationSeconds || 0,
    checksum: body.checksum,
    storageType: body.storageType || 'local',
    storageUrl: body.storageUrl || '',
    storagePath: body.storagePath,
    description: body.description,
    clientId: body.clientId,
    clientName: body.clientName,
    tags: body.tags || [],
    pricingModel: body.pricingModel,
    pricePerUnit: body.pricePerUnit,
    status: body.status || 'ready',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  data.media.push(newMedia);
  await writeData(data);
  
  return NextResponse.json({ success: true, media: newMedia });
}

// PUT - Update media
export async function PUT(req: NextRequest) {
  const body = await req.json();
  const data = await readData();
  
  const index = data.media.findIndex(m => m.id === body.id);
  if (index === -1) {
    return NextResponse.json({ error: 'Media not found' }, { status: 404 });
  }
  
  data.media[index] = {
    ...data.media[index],
    ...body,
    updatedAt: new Date().toISOString(),
  };
  
  await writeData(data);
  
  return NextResponse.json({ success: true, media: data.media[index] });
}

// DELETE - Remove media
export async function DELETE(req: NextRequest) {
  const body = await req.json();
  const data = await readData();
  
  const index = data.media.findIndex(m => m.id === body.id);
  if (index === -1) {
    return NextResponse.json({ error: 'Media not found' }, { status: 404 });
  }
  
  const media = data.media[index];
  
  // Delete local file if exists
  if (media.storageType === 'local' && media.filename) {
    try {
      await fs.unlink(path.join(UPLOADS_DIR, media.filename));
    } catch {
      // File might not exist
    }
  }
  
  data.media.splice(index, 1);
  await writeData(data);
  
  return NextResponse.json({ success: true });
}
