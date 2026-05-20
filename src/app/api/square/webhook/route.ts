import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

const PAYMENTS_FILE = path.join(process.cwd(), 'data', 'payments.json');
const INVOICES_FILE = path.join(process.cwd(), 'data', 'invoices.json');

async function readJson(file: string) {
  try {
    const data = await fs.readFile(file, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

async function writeJson(file: string, data: any) {
  await fs.writeFile(file, JSON.stringify(data, null, 2));
}

// Verify Square webhook signature
function verifySignature(body: string, signature: string, webhookSignatureKey: string): boolean {
  if (!webhookSignatureKey) return true; // Skip if not configured
  
  const hmac = crypto.createHmac('sha256', webhookSignatureKey);
  hmac.update(body);
  const expectedSignature = hmac.digest('base64');
  
  return signature === expectedSignature;
}

// POST - Handle Square webhook events
export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('x-square-hmacsha256-signature') || '';
  const webhookSignatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE || '';
  
  // Verify signature if configured
  if (webhookSignatureKey && !verifySignature(body, signature, webhookSignatureKey)) {
    console.error('Square webhook signature verification failed');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }
  
  let event;
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  
  const eventType = event.type;
  const data = event.data?.object;
  
  console.log(`Square webhook received: ${eventType}`);
  
  try {
    switch (eventType) {
      case 'payment.completed':
        await handlePaymentCompleted(data?.payment);
        break;
        
      case 'payment.updated':
        await handlePaymentUpdated(data?.payment);
        break;
        
      case 'invoice.payment_made':
        await handleInvoicePayment(data?.invoice);
        break;
        
      case 'invoice.published':
      case 'invoice.scheduled_charge_failed':
      case 'invoice.canceled':
        await handleInvoiceUpdate(data?.invoice, eventType);
        break;
        
      default:
        console.log(`Unhandled Square event: ${eventType}`);
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing Square webhook:', error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}

async function handlePaymentCompleted(payment: any) {
  if (!payment) return;
  
  const paymentsData = await readJson(PAYMENTS_FILE);
  paymentsData.payments = paymentsData.payments || [];
  
  // Check if already recorded
  const existing = paymentsData.payments.find((p: any) => p.squarePaymentId === payment.id);
  if (existing) return;
  
  const newPayment = {
    id: `pay-${Date.now()}`,
    paymentId: `SQ-${payment.id.slice(-8).toUpperCase()}`,
    squarePaymentId: payment.id,
    invoiceId: payment.order_id || null,
    clientName: payment.buyer_email_address || 'Square Customer',
    clientEmail: payment.buyer_email_address || '',
    amount: (payment.amount_money?.amount || 0) / 100, // Convert cents to dollars
    currency: payment.amount_money?.currency || 'USD',
    status: 'completed',
    paymentMethod: payment.source_type || 'card',
    notes: `Square payment - ${payment.receipt_url || ''}`,
    createdAt: new Date().toISOString(),
  };
  
  paymentsData.payments.push(newPayment);
  await writeJson(PAYMENTS_FILE, paymentsData);
  
  console.log(`Recorded Square payment: ${newPayment.paymentId}`);
}

async function handlePaymentUpdated(payment: any) {
  if (!payment) return;
  
  const paymentsData = await readJson(PAYMENTS_FILE);
  paymentsData.payments = paymentsData.payments || [];
  
  const index = paymentsData.payments.findIndex((p: any) => p.squarePaymentId === payment.id);
  if (index === -1) return;
  
  // Update status based on Square status
  const statusMap: Record<string, string> = {
    'COMPLETED': 'completed',
    'APPROVED': 'completed',
    'PENDING': 'pending_payment',
    'FAILED': 'failed',
    'CANCELED': 'failed',
  };
  
  paymentsData.payments[index].status = statusMap[payment.status] || payment.status.toLowerCase();
  await writeJson(PAYMENTS_FILE, paymentsData);
}

async function handleInvoicePayment(invoice: any) {
  if (!invoice) return;
  
  const invoicesData = await readJson(INVOICES_FILE);
  invoicesData.invoices = invoicesData.invoices || [];
  
  // Find matching invoice by Square invoice ID
  const index = invoicesData.invoices.findIndex((i: any) => i.squareInvoiceId === invoice.id);
  if (index === -1) return;
  
  invoicesData.invoices[index].status = 'paid';
  invoicesData.invoices[index].paidDate = new Date().toISOString().split('T')[0];
  invoicesData.invoices[index].amountPaid = invoicesData.invoices[index].total;
  invoicesData.invoices[index].amountDue = 0;
  
  await writeJson(INVOICES_FILE, invoicesData);
  console.log(`Invoice marked paid via Square: ${invoicesData.invoices[index].invoiceNumber}`);
}

async function handleInvoiceUpdate(invoice: any, eventType: string) {
  if (!invoice) return;
  
  const invoicesData = await readJson(INVOICES_FILE);
  invoicesData.invoices = invoicesData.invoices || [];
  
  const index = invoicesData.invoices.findIndex((i: any) => i.squareInvoiceId === invoice.id);
  if (index === -1) return;
  
  switch (eventType) {
    case 'invoice.published':
      invoicesData.invoices[index].status = 'sent';
      invoicesData.invoices[index].sentAt = new Date().toISOString();
      break;
    case 'invoice.scheduled_charge_failed':
      invoicesData.invoices[index].status = 'overdue';
      break;
    case 'invoice.canceled':
      invoicesData.invoices[index].status = 'cancelled';
      break;
  }
  
  await writeJson(INVOICES_FILE, invoicesData);
}

// GET - Verify webhook is reachable (for testing)
export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    message: 'Square webhook endpoint ready',
    timestamp: new Date().toISOString(),
  });
}
