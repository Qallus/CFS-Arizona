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

// GET - Get single template with all its cards
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await readData();

  const template = data.templates.find((t: any) => t.id === id);
  if (!template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  const cards = data.cards.filter((c: any) => c.templateId === id);
  const history = data.history.filter((h: any) => h.templateId === id);

  // Calculate stats
  const stats = {
    totalCards: cards.length,
    activeCards: cards.filter((c: any) => c.status === 'active').length,
    completedCards: cards.filter((c: any) => c.status === 'completed').length,
    expiredCards: cards.filter((c: any) => c.status === 'expired').length,
    totalPunchesGiven: cards.reduce((sum: number, c: any) => sum + c.punchesUsed, 0),
    totalRedemptions: history.length,
  };

  return NextResponse.json({ template, cards, history, stats });
}
