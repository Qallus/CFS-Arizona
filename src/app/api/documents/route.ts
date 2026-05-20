import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

const DATA_FILE = path.join(process.cwd(), 'data', 'documents.json');

async function readDocuments() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { documents: [], templates: [] };
  }
}

async function writeDocuments(data: any) {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

// GET - List documents with optional filters
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const projectId = searchParams.get('projectId');
  const contactId = searchParams.get('contactId');
  const id = searchParams.get('id');
  const templatesOnly = searchParams.get('templates') === 'true';
  
  const data = await readDocuments();
  
  // Return templates only
  if (templatesOnly) {
    let templates = data.templates || [];
    if (type) {
      templates = templates.filter((t: any) => t.type === type);
    }
    return NextResponse.json({ templates });
  }
  
  // Return single document
  if (id) {
    const doc = data.documents.find((d: any) => d.id === id);
    return NextResponse.json({ document: doc, templates: data.templates });
  }
  
  let documents = data.documents || [];
  
  if (type) {
    documents = documents.filter((d: any) => d.type === type);
  }
  
  if (projectId) {
    documents = documents.filter((d: any) => d.projectId === projectId);
  }
  
  if (contactId) {
    documents = documents.filter((d: any) => d.contactId === contactId);
  }
  
  // Group by type for tabs
  const byType = {
    contract: documents.filter((d: any) => d.type === 'contract'),
    doc: documents.filter((d: any) => d.type === 'doc'),
    note: documents.filter((d: any) => d.type === 'note'),
    sow: documents.filter((d: any) => d.type === 'sow'),
    outline: documents.filter((d: any) => d.type === 'outline'),
  };
  
  return NextResponse.json({ documents, byType, templates: data.templates });
}

// POST - Create document
export async function POST(req: NextRequest) {
  const body = await req.json();
  const data = await readDocuments();
  
  const newDocument = {
    id: `doc-${Date.now()}`,
    name: body.name || 'Untitled Document',
    type: body.type || 'doc', // contract, doc, note, sow, outline
    templateId: body.templateId || null,
    projectId: body.projectId || null,
    contactId: body.contactId || null,
    content: body.content || '',
    fields: body.fields || {},
    status: body.status || 'draft', // draft, sent, viewed, signed, completed
    
    // Signature tracking
    signatures: body.signatures || [],
    signatureToken: crypto.randomBytes(16).toString('hex'),
    
    // Metadata
    createdBy: body.createdBy || 'Jeremy',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sentAt: null,
    signedAt: null,
  };
  
  data.documents = data.documents || [];
  data.documents.push(newDocument);
  await writeDocuments(data);
  
  return NextResponse.json({ document: newDocument, success: true });
}

// PUT - Update document
export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, ...updates } = body;
  
  if (!id) {
    return NextResponse.json({ error: 'Document ID required' }, { status: 400 });
  }
  
  const data = await readDocuments();
  const index = data.documents.findIndex((d: any) => d.id === id);
  
  if (index === -1) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }
  
  // Track status changes
  if (updates.status === 'sent' && data.documents[index].status !== 'sent') {
    updates.sentAt = new Date().toISOString();
  }
  if (updates.status === 'signed' && data.documents[index].status !== 'signed') {
    updates.signedAt = new Date().toISOString();
  }
  
  data.documents[index] = {
    ...data.documents[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  await writeDocuments(data);
  return NextResponse.json({ document: data.documents[index], success: true });
}

// DELETE - Delete document
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  
  if (!id) {
    return NextResponse.json({ error: 'Document ID required' }, { status: 400 });
  }
  
  const data = await readDocuments();
  data.documents = data.documents.filter((d: any) => d.id !== id);
  await writeDocuments(data);
  
  return NextResponse.json({ success: true });
}
