import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const PAYMENTS_FILE = path.join(process.cwd(), 'data', 'payments.json');

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

// POST - Sync historical payments from Square
export async function POST(req: NextRequest) {
  const accessToken = process.env.SQUARE_ACCESS_TOKEN;
  const locationId = process.env.SQUARE_LOCATION_ID;
  
  if (!accessToken) {
    return NextResponse.json({ error: 'Square access token not configured' }, { status: 400 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const year = body.year || new Date().getFullYear();
    
    // Fetch payments from Square API
    const startDate = `${year}-01-01T00:00:00Z`;
    const endDate = `${year}-12-31T23:59:59Z`;
    
    let allPayments: any[] = [];
    let cursor: string | undefined;
    
    do {
      const params = new URLSearchParams({
        begin_time: startDate,
        end_time: endDate,
        sort_order: 'DESC',
        limit: '100',
      });
      
      if (locationId) {
        params.append('location_id', locationId);
      }
      
      if (cursor) {
        params.append('cursor', cursor);
      }
      
      const response = await fetch(
        `https://connect.squareup.com/v2/payments?${params}`,
        {
          headers: {
            'Square-Version': '2024-01-18',
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!response.ok) {
        const error = await response.json();
        console.error('Square API error:', error);
        return NextResponse.json({ error: 'Failed to fetch payments from Square', details: error }, { status: 500 });
      }
      
      const data = await response.json();
      allPayments = allPayments.concat(data.payments || []);
      cursor = data.cursor;
      
    } while (cursor);
    
    // Load existing payments
    const paymentsData = await readJson(PAYMENTS_FILE);
    paymentsData.payments = paymentsData.payments || [];
    
    let imported = 0;
    let skipped = 0;
    
    for (const payment of allPayments) {
      // Skip if already exists
      const exists = paymentsData.payments.some(
        (p: any) => p.squarePaymentId === payment.id
      );
      
      if (exists) {
        skipped++;
        continue;
      }
      
      // Only import completed payments
      if (payment.status !== 'COMPLETED') {
        continue;
      }
      
      const newPayment = {
        id: `pay-${Date.now()}-${imported}`,
        paymentId: `SQ-${payment.id.slice(-8).toUpperCase()}`,
        squarePaymentId: payment.id,
        invoiceId: payment.order_id || null,
        clientName: payment.buyer_email_address || payment.note || 'Square Customer',
        clientEmail: payment.buyer_email_address || '',
        amount: (payment.amount_money?.amount || 0) / 100,
        currency: payment.amount_money?.currency || 'USD',
        status: 'completed',
        paymentMethod: payment.source_type?.toLowerCase() || 'card',
        cardBrand: payment.card_details?.card?.card_brand || null,
        lastFour: payment.card_details?.card?.last_4 || null,
        notes: payment.note || (payment.receipt_url ? `Receipt: ${payment.receipt_url}` : ''),
        receiptUrl: payment.receipt_url || null,
        createdAt: payment.created_at,
      };
      
      paymentsData.payments.push(newPayment);
      imported++;
    }
    
    // Sort by date descending
    paymentsData.payments.sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    await writeJson(PAYMENTS_FILE, paymentsData);
    
    return NextResponse.json({
      success: true,
      year,
      totalFromSquare: allPayments.length,
      imported,
      skipped,
      totalInSystem: paymentsData.payments.length,
    });
    
  } catch (error) {
    console.error('Error syncing Square payments:', error);
    return NextResponse.json({ error: 'Failed to sync payments' }, { status: 500 });
  }
}

// GET - Check sync status
export async function GET() {
  const paymentsData = await readJson(PAYMENTS_FILE);
  const squarePayments = (paymentsData.payments || []).filter(
    (p: any) => p.squarePaymentId
  );
  
  return NextResponse.json({
    status: 'ready',
    squarePaymentsInSystem: squarePayments.length,
    configured: !!process.env.SQUARE_ACCESS_TOKEN,
  });
}
