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

// GET - Public customer card view (no auth needed)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const data = await readData();

  // Find card by unique code
  const card = data.cards.find((c: any) => c.uniqueCode === code);

  if (!card) {
    return NextResponse.json({ error: 'Card not found' }, { status: 404 });
  }

  // Get template
  const template = data.templates.find((t: any) => t.id === card.templateId);

  if (!template) {
    return NextResponse.json({ error: 'Card template not found' }, { status: 404 });
  }

  // Check and update expiration status
  if (card.status === 'active' && card.expiresAt && new Date(card.expiresAt) < new Date()) {
    card.status = 'expired';
    // Note: We won't write this back to avoid race conditions on a public endpoint
    // The status will be corrected on next redemption attempt
  }

  // Get punch history for this card
  const history = data.history
    .filter((h: any) => h.cardId === card.id)
    .sort((a: any, b: any) => new Date(b.redeemedAt).getTime() - new Date(a.redeemedAt).getTime());

  // Return public card info (safe data only)
  return NextResponse.json({
    card: {
      uniqueCode: card.uniqueCode,
      customerName: card.customerName,
      punchesRemaining: card.punchesRemaining,
      punchesUsed: card.punchesUsed,
      totalPunches: template.totalPunches,
      status: card.status,
      issuedAt: card.issuedAt,
      expiresAt: card.expiresAt,
    },
    template: {
      name: template.name,
      type: template.type,
      totalPunches: template.totalPunches,
      valuePerPunch: template.valuePerPunch,
      reward: template.reward,
      styling: template.styling,
      restrictions: {
        terms: template.restrictions.terms,
      },
      contactInfo: template.contactInfo,
    },
    history: history.map((h: any) => ({
      punchesDeducted: h.punchesDeducted,
      note: h.note,
      redeemedAt: h.redeemedAt,
    })),
  });
}
