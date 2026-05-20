import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'scratch-cards.json');

interface Prize {
  id: string;
  name: string;
  description: string;
  value?: string;
  odds: number; // percentage chance (all prizes should add up to 100)
  quantity?: number; // -1 for unlimited
  claimed: number;
  color: string;
}

interface Symbol {
  id: string;
  name: string;
  emoji?: string;
  image?: string;
  isWinner: boolean;
}

interface ScratchCampaign {
  id: string;
  name: string;
  description: string;
  prizes: Prize[];
  status: 'draft' | 'active' | 'paused' | 'ended';
  startDate: string;
  endDate?: string;
  maxScratches?: number;
  scratchesPerUser?: number;
  requireEmail: boolean;
  terms?: string;
  createdAt: string;
  updatedAt: string;
  stats: {
    totalScratches: number;
    uniqueUsers: number;
    prizesWon: number;
    prizesClaimed: number;
  };
  // Game type
  gameType: 'single' | 'multizone';
  // Design settings
  cardTitle?: string;
  cardSubtitle?: string;
  cardLogo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  textColor?: string;
  titleColor?: string;
  descriptionColor?: string;
  descriptionBgColor?: string;
  font?: string;
  backgroundImage?: string;
  revealThreshold?: number;
  scratchLayerColor?: string;
  // Multi-zone settings
  gridRows?: number;
  gridCols?: number;
  matchToWin?: number;
  showNumbers?: boolean;
  zoneShape?: 'square' | 'rounded' | 'circle';
  zoneBgColor?: string;
  symbols?: {
    winners: Symbol[];
    losers: Symbol[];
  };
  // Settings
  allowSharing?: boolean;
  allowGifting?: boolean;
  generateWinnerCodes?: boolean;
  sendWinnerSms?: boolean;
  sendWinnerEmail?: boolean;
  // Fundraiser
  isFundraiser?: boolean;
  cardPrice?: number;
}

interface Scratch {
  id: string;
  campaignId: string;
  visitorId: string;
  email?: string;
  prizeId?: string;
  prizeName?: string;
  won: boolean;
  claimed: boolean;
  claimedAt?: string;
  scratchedAt: string;
  userAgent?: string;
  ip?: string;
}

interface DataStore {
  campaigns: ScratchCampaign[];
  scratches: Scratch[];
}

async function getData(): Promise<DataStore> {
  try {
    const content = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    return { campaigns: [], scratches: [] };
  }
}

async function saveData(data: DataStore): Promise<void> {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

// GET - List campaigns or get single campaign
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const includeScratches = searchParams.get('includeScratches') === 'true';
    
    const data = await getData();
    
    if (id) {
      const campaign = data.campaigns.find(c => c.id === id);
      if (!campaign) {
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
      }
      
      const result: any = { campaign };
      if (includeScratches) {
        result.scratches = data.scratches.filter(s => s.campaignId === id);
      }
      return NextResponse.json(result);
    }
    
    // Calculate stats
    const stats = {
      totalCampaigns: data.campaigns.length,
      activeCampaigns: data.campaigns.filter(c => c.status === 'active').length,
      totalScratches: data.scratches.length,
      totalPrizesWon: data.scratches.filter(s => s.won).length,
    };
    
    return NextResponse.json({ 
      campaigns: data.campaigns,
      stats,
    });
  } catch (error) {
    console.error('Error fetching scratch cards:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

// POST - Create campaign or record scratch
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;
    
    const data = await getData();
    
    if (action === 'create-campaign') {
      const campaign: ScratchCampaign = {
        id: `sc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: body.name,
        description: body.description || '',
        prizes: body.prizes || [],
        status: body.status || 'draft',
        startDate: body.startDate || new Date().toISOString(),
        endDate: body.endDate,
        maxScratches: body.maxTotalScratches || -1,
        scratchesPerUser: body.scratchesPerUser || 1,
        requireEmail: body.requireEmail || false,
        terms: body.terms,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        stats: {
          totalScratches: 0,
          uniqueUsers: 0,
          prizesWon: 0,
          prizesClaimed: 0,
        },
        // Game type
        gameType: body.gameType || 'single',
        // Design settings
        cardTitle: body.cardTitle || 'SCRATCH & WIN!',
        cardSubtitle: body.cardSubtitle || 'Reveal your prize',
        cardLogo: body.cardLogo || '',
        primaryColor: body.primaryColor || '#667eea',
        secondaryColor: body.secondaryColor || '#764ba2',
        textColor: body.textColor || '#ffffff',
        titleColor: body.titleColor || '#ffffff',
        descriptionColor: body.descriptionColor || '#cccccc',
        descriptionBgColor: body.descriptionBgColor || '',
        font: body.font || 'system-ui',
        backgroundImage: body.backgroundImage || '',
        revealThreshold: body.revealThreshold || 50,
        scratchLayerColor: body.scratchLayerColor || '#667eea',
        // Multi-zone settings
        gridRows: body.gridRows || 3,
        gridCols: body.gridCols || 5,
        matchToWin: body.matchToWin || 3,
        showNumbers: body.showNumbers !== false,
        zoneShape: body.zoneShape || 'rounded',
        zoneBgColor: body.zoneBgColor || '#ffffff',
        symbols: body.symbols || null,
        // Settings
        allowSharing: body.allowSharing !== false,
        allowGifting: body.allowGifting || false,
        generateWinnerCodes: body.generateWinnerCodes || false,
        sendWinnerSms: body.sendWinnerSms || false,
        sendWinnerEmail: body.sendWinnerEmail || false,
        // Fundraiser
        isFundraiser: body.isFundraiser || false,
        cardPrice: body.cardPrice || 0,
      };
      
      data.campaigns.push(campaign);
      await saveData(data);
      
      return NextResponse.json({ success: true, campaign });
    }
    
    if (action === 'scratch') {
      const { campaignId, visitorId, email } = body;
      
      const campaign = data.campaigns.find(c => c.id === campaignId);
      if (!campaign) {
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
      }
      
      if (campaign.status !== 'active') {
        return NextResponse.json({ error: 'Campaign is not active' }, { status: 400 });
      }
      
      // Check if user has exceeded scratch limit
      const userScratches = data.scratches.filter(
        s => s.campaignId === campaignId && s.visitorId === visitorId
      );
      
      if (campaign.scratchesPerUser && campaign.scratchesPerUser > 0 && 
          userScratches.length >= campaign.scratchesPerUser) {
        return NextResponse.json({ 
          error: 'You have reached the maximum number of scratches for this campaign',
          alreadyScratched: true,
          previousResult: userScratches[0],
        }, { status: 400 });
      }
      
      // Determine prize using weighted random
      let wonPrize: Prize | null = null;
      const random = Math.random() * 100;
      let cumulative = 0;
      
      for (const prize of campaign.prizes) {
        cumulative += prize.odds;
        if (random <= cumulative) {
          // Check if prize still has quantity
          if (prize.quantity === -1 || prize.claimed < (prize.quantity || 0)) {
            wonPrize = prize;
          }
          break;
        }
      }
      
      const scratch: Scratch = {
        id: `scratch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        campaignId,
        visitorId,
        email,
        prizeId: wonPrize?.id,
        prizeName: wonPrize?.name,
        won: !!wonPrize,
        claimed: false,
        scratchedAt: new Date().toISOString(),
      };
      
      data.scratches.push(scratch);
      
      // Update campaign stats
      const campaignIndex = data.campaigns.findIndex(c => c.id === campaignId);
      if (campaignIndex !== -1) {
        data.campaigns[campaignIndex].stats.totalScratches++;
        if (wonPrize) {
          data.campaigns[campaignIndex].stats.prizesWon++;
          // Update prize claimed count
          const prizeIndex = data.campaigns[campaignIndex].prizes.findIndex(p => p.id === wonPrize!.id);
          if (prizeIndex !== -1) {
            data.campaigns[campaignIndex].prizes[prizeIndex].claimed++;
          }
        }
        // Count unique users
        const uniqueVisitors = new Set(
          data.scratches.filter(s => s.campaignId === campaignId).map(s => s.visitorId)
        );
        data.campaigns[campaignIndex].stats.uniqueUsers = uniqueVisitors.size;
      }
      
      await saveData(data);
      
      return NextResponse.json({ 
        success: true, 
        scratch,
        prize: wonPrize ? {
          id: wonPrize.id,
          name: wonPrize.name,
          description: wonPrize.description,
          value: wonPrize.value,
          color: wonPrize.color,
        } : null,
      });
    }
    
    if (action === 'claim') {
      const { scratchId, email } = body;
      
      const scratchIndex = data.scratches.findIndex(s => s.id === scratchId);
      if (scratchIndex === -1) {
        return NextResponse.json({ error: 'Scratch not found' }, { status: 404 });
      }
      
      if (!data.scratches[scratchIndex].won) {
        return NextResponse.json({ error: 'No prize to claim' }, { status: 400 });
      }
      
      if (data.scratches[scratchIndex].claimed) {
        return NextResponse.json({ error: 'Prize already claimed' }, { status: 400 });
      }
      
      data.scratches[scratchIndex].claimed = true;
      data.scratches[scratchIndex].claimedAt = new Date().toISOString();
      if (email) {
        data.scratches[scratchIndex].email = email;
      }
      
      // Update campaign claimed count
      const campaign = data.campaigns.find(c => c.id === data.scratches[scratchIndex].campaignId);
      if (campaign) {
        campaign.stats.prizesClaimed++;
      }
      
      await saveData(data);
      
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error processing scratch card action:', error);
    return NextResponse.json({ error: 'Failed to process action' }, { status: 500 });
  }
}

// PUT - Update campaign
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'Campaign ID required' }, { status: 400 });
    }
    
    const data = await getData();
    const index = data.campaigns.findIndex(c => c.id === id);
    
    if (index === -1) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }
    
    data.campaigns[index] = {
      ...data.campaigns[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    await saveData(data);
    
    return NextResponse.json({ success: true, campaign: data.campaigns[index] });
  } catch (error) {
    console.error('Error updating campaign:', error);
    return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 });
  }
}

// DELETE - Delete campaign
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Campaign ID required' }, { status: 400 });
    }
    
    const data = await getData();
    data.campaigns = data.campaigns.filter(c => c.id !== id);
    data.scratches = data.scratches.filter(s => s.campaignId !== id);
    
    await saveData(data);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    return NextResponse.json({ error: 'Failed to delete campaign' }, { status: 500 });
  }
}
