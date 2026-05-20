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

// GET - Get single item by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await readData();
  
  const item = data.items.find(item => item.id === id);
  
  if (!item) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 });
  }
  
  return NextResponse.json({ item: calculateFields(item) });
}
