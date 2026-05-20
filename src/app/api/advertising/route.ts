import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'advertising.json');

async function readData(): Promise<{ items: any[] }> {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { items: [] };
  }
}

async function writeData(data: { items: any[] }): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

// Calculate auto fields
function calculateFields(item: any): any {
  const playsPerDay = item.playsPerDay || (item.spotsPerLoop && item.loopLength ? 
    Math.floor(86400 / (item.loopLength || 60)) * (item.spotsPerLoop || 1) : 0);
  const monthlyPlays = playsPerDay * 30;
  const monthlyImpressions = monthlyPlays * (item.avgDailyFootTraffic || 0) / 100;
  const costPerPlay = monthlyPlays > 0 ? (item.baseMonthlyRate || 0) / monthlyPlays : 0;
  const calculatedCpm = monthlyImpressions > 0 ? ((item.baseMonthlyRate || 0) / monthlyImpressions) * 1000 : 0;
  
  return {
    ...item,
    monthlyPlays,
    monthlyImpressions: Math.round(monthlyImpressions),
    costPerPlay: Math.round(costPerPlay * 100) / 100,
    calculatedCpm: Math.round(calculatedCpm * 100) / 100,
    totalInventoryPerDay: playsPerDay,
    remainingInventoryPercent: item.inventorySlotsRemaining || 100,
  };
}

// GET - List items by type or all
export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get('type');
  const publicOnly = req.nextUrl.searchParams.get('public') === 'true';
  const data = await readData();
  
  let items = type 
    ? data.items.filter(item => item.type === type)
    : data.items;
  
  // Recalculate fields for all items
  items = items.map(calculateFields);
  
  // For public listing, filter out internal notes and only show available
  if (publicOnly) {
    items = items
      .filter(item => item.status !== 'maintenance')
      .map(item => {
        const { internalNotes, ...publicItem } = item;
        return publicItem;
      });
  }
  
  return NextResponse.json({ items });
}

// POST - Create new item
export async function POST(req: NextRequest) {
  const body = await req.json();
  const data = await readData();
  
  const newItem = calculateFields({
    id: `ad-${Date.now()}`,
    ...body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  
  data.items.push(newItem);
  await writeData(data);
  
  return NextResponse.json({ success: true, item: newItem });
}

// PUT - Update item
export async function PUT(req: NextRequest) {
  const body = await req.json();
  const data = await readData();
  
  const index = data.items.findIndex(item => item.id === body.id);
  if (index === -1) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 });
  }
  
  data.items[index] = calculateFields({
    ...data.items[index],
    ...body,
    updatedAt: new Date().toISOString(),
  });
  
  await writeData(data);
  
  return NextResponse.json({ success: true, item: data.items[index] });
}

// DELETE - Remove item
export async function DELETE(req: NextRequest) {
  const body = await req.json();
  const data = await readData();
  
  const index = data.items.findIndex(item => item.id === body.id);
  if (index === -1) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 });
  }
  
  data.items.splice(index, 1);
  await writeData(data);
  
  return NextResponse.json({ success: true });
}
