import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import * as mm from 'music-metadata';

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads', 'audio');
const DATA_FILE = path.join(process.cwd(), 'data', 'audio-media.json');

// Max file size: 50MB
const MAX_FILE_SIZE = 50 * 1024 * 1024;

// Allowed audio types
const ALLOWED_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/aac',
  'audio/ogg',
  'audio/flac',
  'audio/m4a',
  'audio/x-m4a',
];

async function readData() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { media: [], clients: [] };
  }
}

async function writeData(data: any) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

export async function POST(req: NextRequest) {
  try {
    // Ensure uploads directory exists
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const name = formData.get('name') as string | null;
    const description = formData.get('description') as string | null;
    const clientId = formData.get('clientId') as string | null;
    const clientName = formData.get('clientName') as string | null;
    const tags = formData.get('tags') as string | null;
    const pricingModel = formData.get('pricingModel') as string | null;
    const pricePerUnit = formData.get('pricePerUnit') as string | null;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Allowed: MP3, WAV, AAC, OGG, FLAC, M4A' 
      }, { status: 400 });
    }
    
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 50MB' 
      }, { status: 400 });
    }
    
    // Generate unique filename
    const ext = path.extname(file.name) || '.mp3';
    const uniqueId = crypto.randomBytes(8).toString('hex');
    const filename = `${Date.now()}-${uniqueId}${ext}`;
    const filepath = path.join(UPLOADS_DIR, filename);
    
    // Read file buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Calculate checksum
    const checksum = crypto.createHash('md5').update(buffer).digest('hex');
    
    // Write file
    await fs.writeFile(filepath, buffer);
    
    // Extract audio duration using music-metadata
    let durationSeconds = 0;
    try {
      const metadata = await mm.parseFile(filepath);
      durationSeconds = Math.round(metadata.format.duration || 0);
    } catch (err) {
      console.error('Error extracting audio duration:', err);
    }
    
    // Create media record
    const mediaId = `media-${Date.now()}`;
    const newMedia = {
      id: mediaId,
      name: name || file.name.replace(ext, ''),
      filename,
      originalFilename: file.name,
      mimeType: file.type,
      fileSize: file.size,
      durationSeconds,
      checksum,
      storageType: 'local',
      storageUrl: `/uploads/audio/${filename}`,
      storagePath: filepath,
      description: description || '',
      clientId: clientId || undefined,
      clientName: clientName || undefined,
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      pricingModel: pricingModel || undefined,
      pricePerUnit: pricePerUnit ? parseFloat(pricePerUnit) : undefined,
      status: 'ready',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // Save to data file
    const data = await readData();
    data.media.push(newMedia);
    await writeData(data);
    
    return NextResponse.json({ 
      success: true, 
      media: newMedia,
      message: 'File uploaded successfully'
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      error: 'Upload failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Handle GCS upload (for later)
export async function PUT(req: NextRequest) {
  // This will handle GCS signed URL generation
  const body = await req.json();
  
  // For now, return instructions
  return NextResponse.json({
    message: 'GCS upload not yet configured',
    instructions: 'Configure GCS credentials in settings to enable cloud storage',
    localUpload: 'Use POST to upload files locally'
  });
}
