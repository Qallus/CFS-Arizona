import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const CONTACTS_FILE = path.join(DATA_DIR, 'local-contacts.json');

async function ensureFile() {
  try {
    await fs.access(CONTACTS_FILE);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(CONTACTS_FILE, '[]');
  }
}

async function readContacts() {
  await ensureFile();
  const data = await fs.readFile(CONTACTS_FILE, 'utf-8');
  return JSON.parse(data);
}

async function writeContacts(contacts: any[]) {
  await fs.writeFile(CONTACTS_FILE, JSON.stringify(contacts, null, 2));
}

// GET - List local contacts
export async function GET() {
  const contacts = await readContacts();
  return NextResponse.json({ contacts });
}

// POST - Create local contact
export async function POST(request: NextRequest) {
  const body = await request.json();
  const contacts = await readContacts();
  
  const newContact = {
    id: `local_${Date.now()}`,
    first_name: body.first_name || body.firstName || '',
    last_name: body.last_name || body.lastName || '',
    email: body.email || '',
    phone: body.phone || '',
    company_name: body.company_name || body.company || '',
    notes: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  contacts.push(newContact);
  await writeContacts(contacts);
  
  return NextResponse.json({ contact: newContact }, { status: 201 });
}

// PUT - Update local contact
export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, ...updates } = body;
  
  if (!id) {
    return NextResponse.json({ error: 'ID required' }, { status: 400 });
  }
  
  const contacts = await readContacts();
  const index = contacts.findIndex((c: any) => c.id === id);
  
  if (index === -1) {
    return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
  }
  
  contacts[index] = {
    ...contacts[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  await writeContacts(contacts);
  
  return NextResponse.json({ contact: contacts[index] });
}

// DELETE - Delete local contact
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  
  if (!id) {
    return NextResponse.json({ error: 'ID required' }, { status: 400 });
  }
  
  const contacts = await readContacts();
  const filtered = contacts.filter((c: any) => c.id !== id);
  await writeContacts(filtered);
  
  return NextResponse.json({ success: true });
}
