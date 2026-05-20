import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'quotes.json');

async function readQuotes() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { quotes: [], settings: { nextQuoteNumber: 1 } };
  }
}

async function writeQuotes(data: any) {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

// GET - List quotes
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const id = searchParams.get('id');
  
  const data = await readQuotes();
  let quotes = data.quotes || [];
  
  if (id) {
    const quote = quotes.find((q: any) => q.id === id);
    return NextResponse.json({ quote });
  }
  
  if (status) {
    quotes = quotes.filter((q: any) => q.status === status);
  }
  
  return NextResponse.json({ quotes, settings: data.settings });
}

// POST - Create quote
export async function POST(req: NextRequest) {
  const body = await req.json();
  const data = await readQuotes();
  
  const quoteNumber = `QT-${new Date().getFullYear()}-${String(data.settings?.nextQuoteNumber || 1).padStart(3, '0')}`;
  
  const items = (body.items || []).map((item: any, idx: number) => ({
    id: `item-${Date.now()}-${idx}`,
    description: item.description || '',
    quantity: item.quantity || 1,
    unitPrice: item.unitPrice || 0,
    amount: (item.quantity || 1) * (item.unitPrice || 0),
  }));
  
  const total = items.reduce((sum: number, i: any) => sum + i.amount, 0);
  
  const newQuote = {
    id: `quote-${Date.now()}`,
    quoteNumber,
    status: body.status || 'pending',
    billTo: body.billTo || { name: '', email: '' },
    items,
    total,
    issueDate: body.issueDate || new Date().toISOString().split('T')[0],
    validUntil: body.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: body.notes || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  data.quotes = data.quotes || [];
  data.quotes.push(newQuote);
  data.settings = data.settings || {};
  data.settings.nextQuoteNumber = (data.settings.nextQuoteNumber || 1) + 1;
  
  await writeQuotes(data);
  return NextResponse.json({ quote: newQuote, success: true });
}

// PUT - Update quote
export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, ...updates } = body;
  
  if (!id) {
    return NextResponse.json({ error: 'Quote ID required' }, { status: 400 });
  }
  
  const data = await readQuotes();
  const index = data.quotes.findIndex((q: any) => q.id === id);
  
  if (index === -1) {
    return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
  }
  
  if (updates.items) {
    updates.items = updates.items.map((item: any, idx: number) => ({
      ...item,
      id: item.id || `item-${Date.now()}-${idx}`,
      amount: (item.quantity || 1) * (item.unitPrice || 0),
    }));
    updates.total = updates.items.reduce((sum: number, i: any) => sum + i.amount, 0);
  }
  
  data.quotes[index] = {
    ...data.quotes[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  await writeQuotes(data);
  return NextResponse.json({ quote: data.quotes[index], success: true });
}

// DELETE - Delete quote
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  
  if (!id) {
    return NextResponse.json({ error: 'Quote ID required' }, { status: 400 });
  }
  
  const data = await readQuotes();
  data.quotes = data.quotes.filter((q: any) => q.id !== id);
  await writeQuotes(data);
  
  return NextResponse.json({ success: true });
}
