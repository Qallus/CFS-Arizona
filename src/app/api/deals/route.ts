import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'deals.json');

async function readDeals() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { deals: [] };
  }
}

async function writeDeals(data: any) {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

// GET - List deals with optional filters
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const stage = searchParams.get('stage');
  const search = searchParams.get('search');
  
  const data = await readDeals();
  let deals = data.deals || [];
  
  if (stage) {
    deals = deals.filter((d: any) => d.stage === stage);
  }
  
  if (search) {
    const q = search.toLowerCase();
    deals = deals.filter((d: any) => 
      d.name.toLowerCase().includes(q) ||
      d.description.toLowerCase().includes(q)
    );
  }
  
  // Calculate pipeline stats
  const stages = ['lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];
  const byStage = stages.map(s => ({
    stage: s,
    count: deals.filter((d: any) => d.stage === s).length,
    value: deals.filter((d: any) => d.stage === s).reduce((sum: number, d: any) => sum + d.value, 0),
  }));
  
  const openDeals = deals.filter((d: any) => !d.stage.startsWith('closed_'));
  const totalPipeline = openDeals.reduce((sum: number, d: any) => sum + d.value, 0);
  const weightedPipeline = openDeals.reduce((sum: number, d: any) => sum + (d.value * d.probability / 100), 0);
  const closedWon = deals.filter((d: any) => d.stage === 'closed_won').reduce((sum: number, d: any) => sum + d.value, 0);
  const closedLost = deals.filter((d: any) => d.stage === 'closed_lost').reduce((sum: number, d: any) => sum + d.value, 0);
  
  return NextResponse.json({
    deals,
    stats: {
      totalPipeline,
      weightedPipeline,
      closedWon,
      closedLost,
      byStage,
      count: deals.length,
      openCount: openDeals.length,
    }
  });
}

// POST - Create new deal
export async function POST(req: NextRequest) {
  const body = await req.json();
  const data = await readDeals();
  
  const newDeal = {
    id: `deal-${Date.now()}`,
    name: body.name || '',
    description: body.description || '',
    stage: body.stage || 'lead',
    value: body.value || 0,
    currency: body.currency || 'USD',
    probability: body.probability ?? getProbabilityForStage(body.stage || 'lead'),
    expectedCloseDate: body.expectedCloseDate || null,
    actualCloseDate: null,
    leadId: body.leadId || null,
    contactId: body.contactId || null,
    projectId: body.projectId || null,
    products: body.products || [],
    notes: body.notes || '',
    tags: body.tags || [],
    assignedTo: body.assignedTo || null,
    source: body.source || '',
    lostReason: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  data.deals = data.deals || [];
  data.deals.push(newDeal);
  await writeDeals(data);
  
  return NextResponse.json({ deal: newDeal, success: true });
}

// PUT - Update deal
export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, ...updates } = body;
  
  if (!id) {
    return NextResponse.json({ error: 'Deal ID required' }, { status: 400 });
  }
  
  const data = await readDeals();
  const index = data.deals.findIndex((d: any) => d.id === id);
  
  if (index === -1) {
    return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
  }
  
  // Update probability if stage changed and probability not explicitly set
  if (updates.stage && updates.probability === undefined) {
    updates.probability = getProbabilityForStage(updates.stage);
  }
  
  // Set actualCloseDate if moved to closed stage
  if (updates.stage?.startsWith('closed_') && !data.deals[index].actualCloseDate) {
    updates.actualCloseDate = new Date().toISOString().split('T')[0];
  }
  
  data.deals[index] = {
    ...data.deals[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  await writeDeals(data);
  return NextResponse.json({ deal: data.deals[index], success: true });
}

// DELETE - Delete deal
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  
  if (!id) {
    return NextResponse.json({ error: 'Deal ID required' }, { status: 400 });
  }
  
  const data = await readDeals();
  data.deals = data.deals.filter((d: any) => d.id !== id);
  await writeDeals(data);
  
  return NextResponse.json({ success: true });
}

function getProbabilityForStage(stage: string): number {
  const probabilities: Record<string, number> = {
    lead: 10,
    qualified: 25,
    proposal: 50,
    negotiation: 75,
    closed_won: 100,
    closed_lost: 0,
  };
  return probabilities[stage] ?? 10;
}
