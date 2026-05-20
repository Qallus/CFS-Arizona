import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'punch-cards.json');

async function readData() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { templates: [], cards: [], history: [] };
  }
}

async function writeData(data: any) {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

function generateUniqueCode(prefix: string): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${code}`;
}

// GET - List cards for a template
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');

  const data = await readData();
  const template = data.templates.find((t: any) => t.id === id);

  if (!template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  let cards = data.cards.filter((c: any) => c.templateId === id);

  if (status) {
    cards = cards.filter((c: any) => c.status === status);
  }

  // Add template info to each card for convenience
  cards = cards.map((card: any) => ({
    ...card,
    templateName: template.name,
    templateType: template.type,
  }));

  return NextResponse.json({ cards, template });
}

// POST - Issue new card to customer
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const data = await readData();

  const template = data.templates.find((t: any) => t.id === id);
  if (!template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  if (template.status !== 'active') {
    return NextResponse.json({ error: 'Cannot issue cards for inactive template' }, { status: 400 });
  }

  // Generate unique code with prefix based on type
  const prefix = template.type === 'value' ? 'VAL' : 'LYL';
  let uniqueCode = generateUniqueCode(prefix);
  
  // Ensure uniqueness
  while (data.cards.some((c: any) => c.uniqueCode === uniqueCode)) {
    uniqueCode = generateUniqueCode(prefix);
  }

  // Calculate expiration date
  const issuedAt = new Date();
  const expiresAt = template.restrictions.expirationDays
    ? new Date(issuedAt.getTime() + template.restrictions.expirationDays * 24 * 60 * 60 * 1000)
    : null;

  const newCard = {
    id: `card-${Date.now()}`,
    templateId: id,
    uniqueCode,
    customerName: body.customerName || 'Guest',
    customerEmail: body.customerEmail || null,
    customerPhone: body.customerPhone || null,
    punchesRemaining: template.totalPunches,
    punchesUsed: 0,
    status: 'active',
    issuedAt: issuedAt.toISOString(),
    expiresAt: expiresAt ? expiresAt.toISOString() : null,
  };

  data.cards.push(newCard);
  await writeData(data);

  // Generate QR code URL (customer page URL)
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const cardUrl = `${baseUrl}/card/${uniqueCode}`;

  return NextResponse.json({
    card: newCard,
    template,
    cardUrl,
    qrData: cardUrl,
    success: true,
  });
}
