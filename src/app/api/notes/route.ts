import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const NOTES_FILE = path.join(DATA_DIR, 'notes.json');

async function ensureFile() {
  try {
    await fs.access(NOTES_FILE);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(NOTES_FILE, '[]');
  }
}

async function readNotes() {
  await ensureFile();
  const data = await fs.readFile(NOTES_FILE, 'utf-8');
  return JSON.parse(data);
}

async function writeNotes(notes: any[]) {
  await fs.writeFile(NOTES_FILE, JSON.stringify(notes, null, 2));
}

export async function GET() {
  const notes = await readNotes();
  // Sort by most recent first
  notes.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return NextResponse.json(notes);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const notes = await readNotes();
  
  const newNote = {
    id: `note_${Date.now()}`,
    title: body.title || 'Untitled',
    content: body.content || '',
    type: body.type || 'note',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    // Meeting specific
    audioUrl: body.audioUrl,
    duration: body.duration,
    transcription: body.transcription,
    aiSummary: body.aiSummary,
    attendees: body.attendees || [],
  };
  
  notes.push(newNote);
  await writeNotes(notes);
  
  return NextResponse.json(newNote, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, ...updates } = body;
  
  if (!id) {
    return NextResponse.json({ error: 'ID required' }, { status: 400 });
  }
  
  const notes = await readNotes();
  const index = notes.findIndex((n: any) => n.id === id);
  
  if (index === -1) {
    return NextResponse.json({ error: 'Note not found' }, { status: 404 });
  }
  
  notes[index] = {
    ...notes[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  await writeNotes(notes);
  
  return NextResponse.json(notes[index]);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  
  if (!id) {
    return NextResponse.json({ error: 'ID required' }, { status: 400 });
  }
  
  const notes = await readNotes();
  const filtered = notes.filter((n: any) => n.id !== id);
  
  if (filtered.length === notes.length) {
    return NextResponse.json({ error: 'Note not found' }, { status: 404 });
  }
  
  await writeNotes(filtered);
  
  return NextResponse.json({ success: true });
}
