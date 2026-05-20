import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'invoices.json');

async function readInvoices() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { invoices: [], settings: { nextInvoiceNumber: 1 } };
  }
}

async function writeInvoices(data: any) {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

// GET - List invoices with optional filters
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const search = searchParams.get('search');
  const id = searchParams.get('id');
  
  const data = await readInvoices();
  let invoices = data.invoices || [];
  
  // Return single invoice if ID provided
  if (id) {
    const invoice = invoices.find((i: any) => i.id === id);
    return NextResponse.json({ invoice, settings: data.settings });
  }
  
  if (status) {
    invoices = invoices.filter((i: any) => i.status === status);
  }
  
  if (search) {
    const q = search.toLowerCase();
    invoices = invoices.filter((i: any) => 
      i.invoiceNumber.toLowerCase().includes(q) ||
      i.billTo.name.toLowerCase().includes(q) ||
      i.billTo.email.toLowerCase().includes(q)
    );
  }
  
  // Calculate stats
  const stats = {
    total: invoices.length,
    draft: invoices.filter((i: any) => i.status === 'draft').length,
    sent: invoices.filter((i: any) => i.status === 'sent').length,
    paid: invoices.filter((i: any) => i.status === 'paid').length,
    overdue: invoices.filter((i: any) => i.status === 'overdue').length,
    totalRevenue: invoices.filter((i: any) => i.status === 'paid').reduce((sum: number, i: any) => sum + i.total, 0),
    totalOutstanding: invoices.filter((i: any) => ['sent', 'overdue'].includes(i.status)).reduce((sum: number, i: any) => sum + i.amountDue, 0),
  };
  
  return NextResponse.json({ invoices, stats, settings: data.settings });
}

// POST - Create new invoice
export async function POST(req: NextRequest) {
  const body = await req.json();
  const data = await readInvoices();
  
  const invoiceNumber = `INV-${new Date().getFullYear()}-${String(data.settings?.nextInvoiceNumber || 1).padStart(3, '0')}`;
  
  const items = (body.items || []).map((item: any, idx: number) => ({
    id: `item-${Date.now()}-${idx}`,
    description: item.description || '',
    quantity: item.quantity || 1,
    unitPrice: item.unitPrice || 0,
    amount: (item.quantity || 1) * (item.unitPrice || 0),
  }));
  
  const subtotal = items.reduce((sum: number, i: any) => sum + i.amount, 0);
  const taxRate = body.taxRate || data.settings?.defaultTaxRate || 0;
  const taxAmount = subtotal * (taxRate / 100);
  const discount = body.discount || 0;
  const total = subtotal + taxAmount - discount;
  
  const newInvoice = {
    id: `inv-${Date.now()}`,
    invoiceNumber,
    status: body.status || 'draft',
    contactId: body.contactId || null,
    dealId: body.dealId || null,
    projectId: body.projectId || null,
    billTo: body.billTo || {
      name: '',
      email: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      country: 'USA',
    },
    items,
    subtotal,
    taxRate,
    taxAmount,
    discount,
    total,
    amountPaid: 0,
    amountDue: total,
    issueDate: body.issueDate || new Date().toISOString().split('T')[0],
    dueDate: body.dueDate || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    paidDate: null,
    stripeInvoiceId: null,
    stripePaymentIntentId: null,
    paymentMethod: null,
    paymentUrl: null,
    notes: body.notes || '',
    terms: body.terms || data.settings?.defaultTerms || 'Payment due within 15 days',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  data.invoices = data.invoices || [];
  data.invoices.push(newInvoice);
  data.settings = data.settings || {};
  data.settings.nextInvoiceNumber = (data.settings.nextInvoiceNumber || 1) + 1;
  
  await writeInvoices(data);
  
  return NextResponse.json({ invoice: newInvoice, success: true });
}

// PUT - Update invoice
export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, ...updates } = body;
  
  if (!id) {
    return NextResponse.json({ error: 'Invoice ID required' }, { status: 400 });
  }
  
  const data = await readInvoices();
  const index = data.invoices.findIndex((i: any) => i.id === id);
  
  if (index === -1) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }
  
  // Recalculate totals if items changed
  if (updates.items) {
    updates.items = updates.items.map((item: any, idx: number) => ({
      ...item,
      id: item.id || `item-${Date.now()}-${idx}`,
      amount: (item.quantity || 1) * (item.unitPrice || 0),
    }));
    
    const subtotal = updates.items.reduce((sum: number, i: any) => sum + i.amount, 0);
    const taxRate = updates.taxRate ?? data.invoices[index].taxRate;
    const taxAmount = subtotal * (taxRate / 100);
    const discount = updates.discount ?? data.invoices[index].discount;
    const total = subtotal + taxAmount - discount;
    const amountPaid = updates.amountPaid ?? data.invoices[index].amountPaid;
    
    updates.subtotal = subtotal;
    updates.taxAmount = taxAmount;
    updates.total = total;
    updates.amountDue = total - amountPaid;
  }
  
  // Update paid status
  if (updates.status === 'paid' && !data.invoices[index].paidDate) {
    updates.paidDate = new Date().toISOString().split('T')[0];
    updates.amountPaid = data.invoices[index].total;
    updates.amountDue = 0;
  }
  
  data.invoices[index] = {
    ...data.invoices[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  await writeInvoices(data);
  return NextResponse.json({ invoice: data.invoices[index], success: true });
}

// DELETE - Delete invoice
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  
  if (!id) {
    return NextResponse.json({ error: 'Invoice ID required' }, { status: 400 });
  }
  
  const data = await readInvoices();
  data.invoices = data.invoices.filter((i: any) => i.id !== id);
  await writeInvoices(data);
  
  return NextResponse.json({ success: true });
}
