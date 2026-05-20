import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'rfp-listings.json');

interface RFP {
  id: string;
  title: string;
  agency: string;
  level: 'federal' | 'state' | 'county' | 'city' | 'international';
  category: string;
  description: string;
  deadline: string;
  postedDate: string;
  budget?: string;
  location?: string;
  link: string;
  status: 'open' | 'closing_soon' | 'closed';
  searchTerms?: string[];
  createdAt: string;
}

async function readData(): Promise<{ rfps: RFP[] }> {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { rfps: [] };
  }
}

async function writeData(data: { rfps: RFP[] }): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

// GET - Search and filter RFPs
export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams.get('search')?.toLowerCase() || '';
  const level = req.nextUrl.searchParams.get('level') || 'all';
  const category = req.nextUrl.searchParams.get('category') || 'all';
  
  const data = await readData();
  let rfps = data.rfps;
  
  // Update status based on deadline
  const now = new Date();
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  
  rfps = rfps.map(rfp => {
    const deadline = new Date(rfp.deadline);
    let status: RFP['status'] = 'open';
    
    if (deadline < now) {
      status = 'closed';
    } else if (deadline < threeDaysFromNow) {
      status = 'closing_soon';
    }
    
    return { ...rfp, status };
  });
  
  // Filter by search
  if (search) {
    rfps = rfps.filter(rfp => 
      rfp.title.toLowerCase().includes(search) ||
      rfp.agency.toLowerCase().includes(search) ||
      rfp.description?.toLowerCase().includes(search) ||
      rfp.category.toLowerCase().includes(search) ||
      rfp.searchTerms?.some(term => term.toLowerCase().includes(search))
    );
  }
  
  // Filter by level
  if (level && level !== 'all') {
    rfps = rfps.filter(rfp => rfp.level === level);
  }
  
  // Filter by category
  if (category && category !== 'all') {
    rfps = rfps.filter(rfp => rfp.category.toLowerCase() === category.toLowerCase());
  }
  
  // Sort by deadline (soonest first), then by posted date
  rfps = rfps.sort((a, b) => {
    // Closed RFPs go to the end
    if (a.status === 'closed' && b.status !== 'closed') return 1;
    if (a.status !== 'closed' && b.status === 'closed') return -1;
    
    // Sort by deadline
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  });
  
  return NextResponse.json({ 
    rfps,
    total: rfps.length,
    filters: { search, level, category }
  });
}

// POST - Add new RFP (for admin/automated ingestion)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const data = await readData();
  
  const newRfp: RFP = {
    id: `rfp-${Date.now()}`,
    title: body.title,
    agency: body.agency,
    level: body.level || 'federal',
    category: body.category || 'other',
    description: body.description || '',
    deadline: body.deadline,
    postedDate: body.postedDate || new Date().toISOString(),
    budget: body.budget,
    location: body.location,
    link: body.link,
    status: 'open',
    searchTerms: body.searchTerms || [],
    createdAt: new Date().toISOString(),
  };
  
  data.rfps.push(newRfp);
  await writeData(data);
  
  return NextResponse.json({ success: true, rfp: newRfp });
}

// PUT - Update RFP
export async function PUT(req: NextRequest) {
  const body = await req.json();
  const data = await readData();
  
  const index = data.rfps.findIndex(r => r.id === body.id);
  if (index === -1) {
    return NextResponse.json({ error: 'RFP not found' }, { status: 404 });
  }
  
  data.rfps[index] = { ...data.rfps[index], ...body };
  await writeData(data);
  
  return NextResponse.json({ success: true, rfp: data.rfps[index] });
}

// DELETE - Remove RFP
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'ID required' }, { status: 400 });
  }
  
  const data = await readData();
  data.rfps = data.rfps.filter(r => r.id !== id);
  await writeData(data);
  
  return NextResponse.json({ success: true });
}
