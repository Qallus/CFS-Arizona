import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'campaigns.json');
const DEVICES_FILE = path.join(process.cwd(), 'data', 'audio-devices.json');

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  
  // Client/Advertiser
  clientId?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  
  // Status
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed';
  
  // Dates
  startDate?: string;
  endDate?: string;
  
  // Budget
  budget?: number;
  spent?: number;
  pricingModel?: 'per_play' | 'cpm' | 'flat' | 'duration';
  pricePerUnit?: number;
  
  // Media
  mediaIds: string[];
  
  // Target
  targetType: 'devices' | 'groups' | 'all';
  deviceIds?: string[];
  groupIds?: string[];
  
  // Schedule
  schedule: {
    enabled: boolean;
    timezone?: string;
    startTime?: string;       // HH:mm
    endTime?: string;         // HH:mm
    daysOfWeek?: number[];    // 0=Sun, 1=Mon, etc.
    spotsPerHour?: number;
    spotsPerDay?: number;
    priority?: number;        // Higher = more frequent
  };
  
  // Stats
  totalPlays?: number;
  totalImpressions?: number;
  
  createdAt: string;
  updatedAt: string;
}

export interface DeviceGroup {
  id: string;
  name: string;
  description?: string;
  region?: string;
  deviceIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  notes?: string;
  createdAt: string;
}

async function readData(): Promise<{ campaigns: Campaign[]; deviceGroups: DeviceGroup[]; clients: Client[] }> {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { campaigns: [], deviceGroups: [], clients: [] };
  }
}

async function writeData(data: any): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

async function readDevices() {
  try {
    const data = await fs.readFile(DEVICES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { devices: [] };
  }
}

async function writeDevices(data: any) {
  await fs.writeFile(DEVICES_FILE, JSON.stringify(data, null, 2));
}

// GET - List campaigns, groups, or clients
export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get('type') || 'campaigns';
  const status = req.nextUrl.searchParams.get('status');
  const clientId = req.nextUrl.searchParams.get('clientId');
  
  const data = await readData();
  
  if (type === 'groups') {
    return NextResponse.json({ groups: data.deviceGroups || [] });
  }
  
  if (type === 'clients') {
    return NextResponse.json({ clients: data.clients || [] });
  }
  
  let campaigns = data.campaigns || [];
  
  if (status) {
    campaigns = campaigns.filter(c => c.status === status);
  }
  if (clientId) {
    campaigns = campaigns.filter(c => c.clientId === clientId);
  }
  
  // Auto-update campaign status based on dates
  const now = new Date();
  campaigns = campaigns.map(campaign => {
    if (campaign.status === 'scheduled' && campaign.startDate) {
      if (new Date(campaign.startDate) <= now) {
        return { ...campaign, status: 'active' as const };
      }
    }
    if (campaign.status === 'active' && campaign.endDate) {
      if (new Date(campaign.endDate) < now) {
        return { ...campaign, status: 'completed' as const };
      }
    }
    return campaign;
  });
  
  // Stats
  const stats = {
    total: campaigns.length,
    active: campaigns.filter(c => c.status === 'active').length,
    scheduled: campaigns.filter(c => c.status === 'scheduled').length,
    totalBudget: campaigns.reduce((sum, c) => sum + (c.budget || 0), 0),
    totalSpent: campaigns.reduce((sum, c) => sum + (c.spent || 0), 0),
  };
  
  return NextResponse.json({ 
    campaigns, 
    groups: data.deviceGroups || [],
    clients: data.clients || [],
    stats 
  });
}

// POST - Create campaign, group, or client
export async function POST(req: NextRequest) {
  const body = await req.json();
  const type = body.type || 'campaign';
  const data = await readData();
  
  if (type === 'group') {
    const newGroup: DeviceGroup = {
      id: `grp-${Date.now()}`,
      name: body.name || 'New Group',
      description: body.description,
      region: body.region,
      deviceIds: body.deviceIds || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    data.deviceGroups = data.deviceGroups || [];
    data.deviceGroups.push(newGroup);
    await writeData(data);
    return NextResponse.json({ success: true, group: newGroup });
  }
  
  if (type === 'client') {
    const newClient: Client = {
      id: `client-${Date.now()}`,
      name: body.name || 'New Client',
      email: body.email,
      phone: body.phone,
      company: body.company,
      address: body.address,
      notes: body.notes,
      createdAt: new Date().toISOString(),
    };
    data.clients = data.clients || [];
    data.clients.push(newClient);
    await writeData(data);
    return NextResponse.json({ success: true, client: newClient });
  }
  
  // Create campaign
  const newCampaign: Campaign = {
    id: `camp-${Date.now()}`,
    name: body.name || 'New Campaign',
    description: body.description,
    clientId: body.clientId,
    clientName: body.clientName,
    clientEmail: body.clientEmail,
    clientPhone: body.clientPhone,
    status: body.status || 'draft',
    startDate: body.startDate,
    endDate: body.endDate,
    budget: body.budget,
    spent: 0,
    pricingModel: body.pricingModel,
    pricePerUnit: body.pricePerUnit,
    mediaIds: body.mediaIds || [],
    targetType: body.targetType || 'devices',
    deviceIds: body.deviceIds || [],
    groupIds: body.groupIds || [],
    schedule: body.schedule || {
      enabled: true,
      startTime: '06:00',
      endTime: '22:00',
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      spotsPerHour: 4,
      priority: 1,
    },
    totalPlays: 0,
    totalImpressions: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  data.campaigns = data.campaigns || [];
  data.campaigns.push(newCampaign);
  await writeData(data);
  
  return NextResponse.json({ success: true, campaign: newCampaign });
}

// PUT - Update campaign, group, or client
export async function PUT(req: NextRequest) {
  const body = await req.json();
  const type = body.type || 'campaign';
  const data = await readData();
  
  if (type === 'group') {
    const index = data.deviceGroups?.findIndex(g => g.id === body.id) ?? -1;
    if (index === -1) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }
    data.deviceGroups[index] = {
      ...data.deviceGroups[index],
      ...body,
      updatedAt: new Date().toISOString(),
    };
    await writeData(data);
    return NextResponse.json({ success: true, group: data.deviceGroups[index] });
  }
  
  if (type === 'client') {
    const index = data.clients?.findIndex(c => c.id === body.id) ?? -1;
    if (index === -1) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    data.clients[index] = { ...data.clients[index], ...body };
    await writeData(data);
    return NextResponse.json({ success: true, client: data.clients[index] });
  }
  
  // Update campaign
  const index = data.campaigns?.findIndex(c => c.id === body.id) ?? -1;
  if (index === -1) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  }
  
  data.campaigns[index] = {
    ...data.campaigns[index],
    ...body,
    updatedAt: new Date().toISOString(),
  };
  
  await writeData(data);
  return NextResponse.json({ success: true, campaign: data.campaigns[index] });
}

// DELETE
export async function DELETE(req: NextRequest) {
  const body = await req.json();
  const type = body.type || 'campaign';
  const data = await readData();
  
  if (type === 'group') {
    data.deviceGroups = data.deviceGroups?.filter(g => g.id !== body.id) || [];
    await writeData(data);
    return NextResponse.json({ success: true });
  }
  
  if (type === 'client') {
    data.clients = data.clients?.filter(c => c.id !== body.id) || [];
    await writeData(data);
    return NextResponse.json({ success: true });
  }
  
  data.campaigns = data.campaigns?.filter(c => c.id !== body.id) || [];
  await writeData(data);
  return NextResponse.json({ success: true });
}

// PATCH - Special actions (deploy, pause, activate)
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const action = body.action;
  const campaignId = body.campaignId;
  
  const data = await readData();
  const campaign = data.campaigns?.find(c => c.id === campaignId);
  
  if (!campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  }
  
  switch (action) {
    case 'deploy': {
      // Get target devices
      let targetDeviceIds: string[] = [];
      
      if (campaign.targetType === 'all') {
        const devicesData = await readDevices();
        targetDeviceIds = devicesData.devices.map((d: any) => d.id);
      } else if (campaign.targetType === 'groups') {
        const groups = data.deviceGroups?.filter(g => campaign.groupIds?.includes(g.id)) || [];
        targetDeviceIds = groups.flatMap(g => g.deviceIds);
      } else {
        targetDeviceIds = campaign.deviceIds || [];
      }
      
      // Deduplicate
      targetDeviceIds = [...new Set(targetDeviceIds)];
      
      // Update devices with campaign media and schedule
      const devicesData = await readDevices();
      let deployedCount = 0;
      
      for (const deviceId of targetDeviceIds) {
        const deviceIndex = devicesData.devices.findIndex((d: any) => d.id === deviceId);
        if (deviceIndex !== -1) {
          // Merge media IDs (don't replace, add to existing)
          const existingMedia = devicesData.devices[deviceIndex].assignedMediaIds || [];
          const newMedia = [...new Set([...existingMedia, ...campaign.mediaIds])];
          
          devicesData.devices[deviceIndex] = {
            ...devicesData.devices[deviceIndex],
            assignedMediaIds: newMedia,
            schedule: campaign.schedule,
            activeCampaignId: campaign.id,
            updatedAt: new Date().toISOString(),
          };
          deployedCount++;
        }
      }
      
      await writeDevices(devicesData);
      
      // Update campaign status
      const campaignIndex = data.campaigns.findIndex(c => c.id === campaignId);
      data.campaigns[campaignIndex].status = 'active';
      data.campaigns[campaignIndex].updatedAt = new Date().toISOString();
      await writeData(data);
      
      return NextResponse.json({ 
        success: true, 
        deployedDevices: deployedCount,
        message: `Campaign deployed to ${deployedCount} devices`
      });
    }
    
    case 'pause': {
      const index = data.campaigns.findIndex(c => c.id === campaignId);
      data.campaigns[index].status = 'paused';
      data.campaigns[index].updatedAt = new Date().toISOString();
      await writeData(data);
      return NextResponse.json({ success: true, message: 'Campaign paused' });
    }
    
    case 'activate': {
      const index = data.campaigns.findIndex(c => c.id === campaignId);
      data.campaigns[index].status = 'active';
      data.campaigns[index].updatedAt = new Date().toISOString();
      await writeData(data);
      return NextResponse.json({ success: true, message: 'Campaign activated' });
    }
    
    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }
}
