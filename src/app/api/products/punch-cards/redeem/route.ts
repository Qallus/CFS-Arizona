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

// POST - Punch/redeem a card
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { uniqueCode, cardId, punches = 1, note = '', redeemedBy = 'staff' } = body;

  if (!uniqueCode && !cardId) {
    return NextResponse.json(
      { error: 'Either uniqueCode or cardId is required' },
      { status: 400 }
    );
  }

  const data = await readData();

  // Find card by uniqueCode or cardId
  const cardIndex = data.cards.findIndex((c: any) =>
    uniqueCode ? c.uniqueCode === uniqueCode : c.id === cardId
  );

  if (cardIndex === -1) {
    return NextResponse.json({ error: 'Card not found' }, { status: 404 });
  }

  const card = data.cards[cardIndex];

  // Check card status
  if (card.status === 'completed') {
    return NextResponse.json({ error: 'Card is already completed' }, { status: 400 });
  }

  if (card.status === 'expired') {
    return NextResponse.json({ error: 'Card has expired' }, { status: 400 });
  }

  // Check expiration
  if (card.expiresAt && new Date(card.expiresAt) < new Date()) {
    card.status = 'expired';
    data.cards[cardIndex] = card;
    await writeData(data);
    return NextResponse.json({ error: 'Card has expired' }, { status: 400 });
  }

  // Check if enough punches remaining
  if (punches > card.punchesRemaining) {
    return NextResponse.json(
      {
        error: `Only ${card.punchesRemaining} punches remaining`,
        punchesRemaining: card.punchesRemaining,
      },
      { status: 400 }
    );
  }

  // Get template for additional info
  const template = data.templates.find((t: any) => t.id === card.templateId);

  // Apply punches
  card.punchesUsed += punches;
  card.punchesRemaining -= punches;

  // Check if completed
  if (card.punchesRemaining === 0) {
    card.status = 'completed';
  }

  data.cards[cardIndex] = card;

  // Record history
  const historyEntry = {
    id: `hist-${Date.now()}`,
    cardId: card.id,
    templateId: card.templateId,
    punchesDeducted: punches,
    note,
    redeemedBy,
    redeemedAt: new Date().toISOString(),
  };

  data.history.push(historyEntry);
  await writeData(data);

  return NextResponse.json({
    success: true,
    card,
    template,
    history: historyEntry,
    message:
      card.status === 'completed'
        ? `Card completed! ${template?.type === 'loyalty' ? `Reward: ${template.reward}` : 'All punches used.'}`
        : `${punches} punch(es) applied. ${card.punchesRemaining} remaining.`,
  });
}
