import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'payments.json');

async function readPayments() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { payments: [] };
  }
}

async function writePayments(data: any) {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

// GET - List payments
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const invoiceId = searchParams.get('invoiceId');
  
  const data = await readPayments();
  let payments = data.payments || [];
  
  if (status) {
    payments = payments.filter((p: any) => p.status === status);
  }
  
  if (invoiceId) {
    payments = payments.filter((p: any) => p.invoiceId === invoiceId);
  }
  
  // Calculate stats
  const stats = {
    total: payments.length,
    completed: payments.filter((p: any) => p.status === 'completed').length,
    pending: payments.filter((p: any) => p.status === 'pending_payment').length,
    totalAmount: payments.filter((p: any) => p.status === 'completed').reduce((sum: number, p: any) => sum + p.amount, 0),
  };
  
  return NextResponse.json({ payments, stats });
}

// POST - Record payment (usually called when invoice is marked paid)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const data = await readPayments();
  
  const newPayment = {
    id: `pay-${Date.now()}`,
    paymentId: `PAY-${Date.now().toString(36).toUpperCase()}`,
    invoiceId: body.invoiceId || null,
    clientName: body.clientName || '',
    clientEmail: body.clientEmail || '',
    amount: body.amount || 0,
    status: body.status || 'completed',
    paymentMethod: body.paymentMethod || 'other',
    stripePaymentIntentId: body.stripePaymentIntentId || null,
    notes: body.notes || '',
    createdAt: new Date().toISOString(),
  };
  
  data.payments = data.payments || [];
  data.payments.push(newPayment);
  await writePayments(data);
  
  return NextResponse.json({ payment: newPayment, success: true });
}
