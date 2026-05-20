import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'punch-cards.json');

export interface PunchCardTemplate {
  id: string;
  name: string;
  type: 'value' | 'loyalty';
  totalPunches: number;
  valuePerPunch: string | null;
  price: number | null;
  reward: string | null;
  styling: {
    title: string;
    backgroundColor: string;
    backgroundImage: string | null;
    textColor: string;
    logo: string | null;
  };
  restrictions: {
    expirationDays: number;
    terms: string;
  };
  contactInfo: {
    business: string;
    phone: string;
    email: string;
    address: string;
  };
  status: 'active' | 'draft' | 'archived';
  createdAt: string;
}

export interface CustomerCard {
  id: string;
  templateId: string;
  uniqueCode: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  punchesRemaining: number;
  punchesUsed: number;
  status: 'active' | 'completed' | 'expired';
  issuedAt: string;
  expiresAt: string | null;
}

export interface PunchHistory {
  id: string;
  cardId: string;
  templateId: string;
  punchesDeducted: number;
  note: string;
  redeemedBy: string;
  redeemedAt: string;
}

export interface PunchCardData {
  templates: PunchCardTemplate[];
  cards: CustomerCard[];
  history: PunchHistory[];
}

async function readData(): Promise<PunchCardData> {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { templates: [], cards: [], history: [] };
  }
}

async function writeData(data: PunchCardData) {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

// GET - List templates with stats
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const type = searchParams.get('type');
  const id = searchParams.get('id');

  const data = await readData();
  let templates = data.templates || [];

  // Return single template if ID provided
  if (id) {
    const template = templates.find((t) => t.id === id);
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }
    const templateCards = data.cards.filter((c) => c.templateId === id);
    return NextResponse.json({ template, cards: templateCards });
  }

  // Filter by status
  if (status) {
    templates = templates.filter((t) => t.status === status);
  }

  // Filter by type
  if (type) {
    templates = templates.filter((t) => t.type === type);
  }

  // Calculate stats for each template
  const templatesWithStats = templates.map((template) => {
    const templateCards = data.cards.filter((c) => c.templateId === template.id);
    const activeCards = templateCards.filter((c) => c.status === 'active').length;
    const completedCards = templateCards.filter((c) => c.status === 'completed').length;
    const expiredCards = templateCards.filter((c) => c.status === 'expired').length;
    const totalPunchesGiven = templateCards.reduce((sum, c) => sum + c.punchesUsed, 0);

    return {
      ...template,
      stats: {
        totalCards: templateCards.length,
        activeCards,
        completedCards,
        expiredCards,
        totalPunchesGiven,
      },
    };
  });

  // Overall stats
  const allCards = data.cards;
  const stats = {
    totalTemplates: templates.length,
    activeTemplates: templates.filter((t) => t.status === 'active').length,
    totalCards: allCards.length,
    activeCards: allCards.filter((c) => c.status === 'active').length,
    completedCards: allCards.filter((c) => c.status === 'completed').length,
    totalPunchesGiven: allCards.reduce((sum, c) => sum + c.punchesUsed, 0),
  };

  return NextResponse.json({ templates: templatesWithStats, stats });
}

// POST - Create new template
export async function POST(req: NextRequest) {
  const body = await req.json();
  const data = await readData();

  const newTemplate: PunchCardTemplate = {
    id: `tpl-${Date.now()}`,
    name: body.name || 'New Punch Card',
    type: body.type || 'loyalty',
    totalPunches: body.totalPunches || 10,
    valuePerPunch: body.valuePerPunch || null,
    price: body.price || null,
    reward: body.reward || null,
    styling: {
      title: body.styling?.title || body.name || 'Punch Card',
      backgroundColor: body.styling?.backgroundColor || '#1e40af',
      backgroundImage: body.styling?.backgroundImage || null,
      textColor: body.styling?.textColor || '#ffffff',
      logo: body.styling?.logo || null,
    },
    restrictions: {
      expirationDays: body.restrictions?.expirationDays || 365,
      terms: body.restrictions?.terms || 'No cash value. Non-transferable.',
    },
    contactInfo: {
      business: body.contactInfo?.business || '',
      phone: body.contactInfo?.phone || '',
      email: body.contactInfo?.email || '',
      address: body.contactInfo?.address || '',
    },
    status: body.status || 'active',
    createdAt: new Date().toISOString(),
  };

  data.templates.push(newTemplate);
  await writeData(data);

  return NextResponse.json({ template: newTemplate, success: true });
}

// PUT - Update template
export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: 'Template ID required' }, { status: 400 });
  }

  const data = await readData();
  const index = data.templates.findIndex((t) => t.id === id);

  if (index === -1) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  // Merge updates with existing data
  data.templates[index] = {
    ...data.templates[index],
    ...updates,
    styling: {
      ...data.templates[index].styling,
      ...(updates.styling || {}),
    },
    restrictions: {
      ...data.templates[index].restrictions,
      ...(updates.restrictions || {}),
    },
    contactInfo: {
      ...data.templates[index].contactInfo,
      ...(updates.contactInfo || {}),
    },
  };

  await writeData(data);
  return NextResponse.json({ template: data.templates[index], success: true });
}

// DELETE - Delete template
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Template ID required' }, { status: 400 });
  }

  const data = await readData();
  
  // Check if there are active cards
  const activeCards = data.cards.filter((c) => c.templateId === id && c.status === 'active');
  if (activeCards.length > 0) {
    return NextResponse.json(
      { error: `Cannot delete template with ${activeCards.length} active cards` },
      { status: 400 }
    );
  }

  data.templates = data.templates.filter((t) => t.id !== id);
  // Also clean up any associated cards and history
  data.cards = data.cards.filter((c) => c.templateId !== id);
  data.history = data.history.filter((h) => h.templateId !== id);
  
  await writeData(data);
  return NextResponse.json({ success: true });
}
