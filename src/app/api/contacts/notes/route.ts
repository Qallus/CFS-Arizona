import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const CONTACTS_FILE = path.join(DATA_DIR, 'contacts.json');

async function readContacts() {
  try {
    const data = await fs.readFile(CONTACTS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeContacts(contacts: any[]) {
  await fs.writeFile(CONTACTS_FILE, JSON.stringify(contacts, null, 2));
}

// POST - Add note to contact
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { contactId, type, content, title, audioUrl } = body;
  
  if (!contactId || !content) {
    return NextResponse.json({ error: 'Contact ID and content required' }, { status: 400 });
  }
  
  const contacts = await readContacts();
  const index = contacts.findIndex((c: any) => c.id === contactId);
  
  if (index === -1) {
    return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
  }
  
  // Initialize notes array if it doesn't exist
  if (!contacts[index].notes) {
    contacts[index].notes = [];
  }
  
  const newNote = {
    id: `note_${Date.now()}`,
    type: type || 'note',
    title: title || '',
    content,
    audioUrl,
    createdAt: new Date().toISOString(),
  };
  
  contacts[index].notes.unshift(newNote);
  contacts[index].updatedAt = new Date().toISOString();
  
  await writeContacts(contacts);
  
  return NextResponse.json({ note: newNote });
}

// GET - Get notes for a contact
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const contactId = searchParams.get('contactId');
  
  if (!contactId) {
    return NextResponse.json({ error: 'Contact ID required' }, { status: 400 });
  }
  
  const contacts = await readContacts();
  const contact = contacts.find((c: any) => c.id === contactId);
  
  if (!contact) {
    return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
  }
  
  return NextResponse.json({ notes: contact.notes || [] });
}

// DELETE - Delete a note from contact
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const contactId = searchParams.get('contactId');
  const noteId = searchParams.get('noteId');
  
  if (!contactId || !noteId) {
    return NextResponse.json({ error: 'Contact ID and Note ID required' }, { status: 400 });
  }
  
  const contacts = await readContacts();
  const index = contacts.findIndex((c: any) => c.id === contactId);
  
  if (index === -1) {
    return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
  }
  
  if (contacts[index].notes) {
    contacts[index].notes = contacts[index].notes.filter((n: any) => n.id !== noteId);
    contacts[index].updatedAt = new Date().toISOString();
    await writeContacts(contacts);
  }
  
  return NextResponse.json({ success: true });
}
