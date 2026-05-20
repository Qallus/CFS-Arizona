import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'leads.json');

// FluentCRM configuration (optional - for sync)
const WP_SITE_URL = process.env.WP_SITE_URL;
const WP_APPLICATION_USERNAME = process.env.WP_APPLICATION_USERNAME;
const WP_APPLICATION_PASSWORD = process.env.WP_APPLICATION_PASSWORD;

const getAuthHeader = () => {
  if (WP_APPLICATION_USERNAME && WP_APPLICATION_PASSWORD) {
    return 'Basic ' + Buffer.from(`${WP_APPLICATION_USERNAME}:${WP_APPLICATION_PASSWORD}`).toString('base64');
  }
  return null;
};

export interface Lead {
  id: string;
  name: string;
  company: string;
  title: string;
  location: string;
  email: string | null;
  phone: string | null;
  companyPhone: string | null;
  companyEmail: string | null;
  linkedIn: string | null;
  website: string | null;
  address?: string | null;
  netWorthIndicator: string;
  lifeEvent: string;
  lifeEventType: 'relocation' | 'sold_business' | 'business_growth' | 'funding' | 'retirement' | 'recognition' | 'inheritance' | 'new_job' | 'other';
  notes: string;
  source: string;
  tags: string[];
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
  priority: 'high' | 'medium' | 'low';
  assignedTo?: string;
  fluentCrmId?: number;
  createdAt: string;
  updatedAt?: string;
}

function readLeads(): Lead[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error reading leads:', error);
    return [];
  }
}

function writeLeads(leads: Lead[]): void {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(leads, null, 2));
  } catch (error) {
    console.error('Error writing leads:', error);
    throw error;
  }
}

// Sync lead to FluentCRM
async function syncToFluentCRM(lead: Lead): Promise<number | null> {
  const authHeader = getAuthHeader();
  if (!authHeader || !WP_SITE_URL) {
    console.log('FluentCRM not configured, skipping sync');
    return null;
  }

  try {
    const subscriberData = {
      email: lead.email || `lead-${lead.id}@placeholder.local`,
      first_name: lead.name.split(' ')[0] || '',
      last_name: lead.name.split(' ').slice(1).join(' ') || '',
      phone: lead.phone || lead.companyPhone || '',
      status: 'subscribed',
      tags: ['Lead', ...lead.tags],
      custom_values: {
        custom_company_name: lead.company,
        custom_title: lead.title,
        custom_location: lead.location,
        custom_website: lead.website,
        custom_linkedin: lead.linkedIn,
        custom_net_worth_indicator: lead.netWorthIndicator,
        custom_life_event: lead.lifeEvent,
        custom_life_event_type: lead.lifeEventType,
        custom_source: lead.source,
        custom_lead_status: lead.status,
        custom_priority: lead.priority,
        custom_notes: lead.notes,
      },
    };

    const response = await fetch(
      `${WP_SITE_URL}/wp-json/fluent-crm/v2/subscribers`,
      {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscriberData),
      }
    );

    if (response.ok) {
      const data = await response.json();
      return data.subscriber?.id || null;
    } else {
      console.error('FluentCRM sync failed:', await response.text());
      return null;
    }
  } catch (error) {
    console.error('Error syncing to FluentCRM:', error);
    return null;
  }
}

// GET - List all leads with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const tag = searchParams.get('tag');
    const search = searchParams.get('search');
    const lifeEventType = searchParams.get('lifeEventType');

    let leads = readLeads();

    // Apply filters
    if (status) {
      leads = leads.filter(l => l.status === status);
    }
    if (priority) {
      leads = leads.filter(l => l.priority === priority);
    }
    if (tag) {
      leads = leads.filter(l => l.tags.includes(tag));
    }
    if (lifeEventType) {
      leads = leads.filter(l => l.lifeEventType === lifeEventType);
    }
    if (search) {
      const searchLower = search.toLowerCase();
      leads = leads.filter(l => 
        l.name.toLowerCase().includes(searchLower) ||
        l.company.toLowerCase().includes(searchLower) ||
        l.email?.toLowerCase().includes(searchLower) ||
        l.notes.toLowerCase().includes(searchLower)
      );
    }

    // Get unique tags for filtering
    const allLeads = readLeads();
    const allTags = [...new Set(allLeads.flatMap(l => l.tags))];

    return NextResponse.json({
      leads,
      total: leads.length,
      tags: allTags,
    });
  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
  }
}

// POST - Create new lead
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { syncToFluentCrm = false, ...leadData } = body;

    const leads = readLeads();
    
    const newLead: Lead = {
      id: `lead-${Date.now()}`,
      name: leadData.name || '',
      company: leadData.company || '',
      title: leadData.title || '',
      location: leadData.location || '',
      email: leadData.email || null,
      phone: leadData.phone || null,
      companyPhone: leadData.companyPhone || null,
      companyEmail: leadData.companyEmail || null,
      linkedIn: leadData.linkedIn || null,
      website: leadData.website || null,
      address: leadData.address || null,
      netWorthIndicator: leadData.netWorthIndicator || '',
      lifeEvent: leadData.lifeEvent || '',
      lifeEventType: leadData.lifeEventType || 'other',
      notes: leadData.notes || '',
      source: leadData.source || '',
      tags: leadData.tags || [],
      status: leadData.status || 'new',
      priority: leadData.priority || 'medium',
      assignedTo: leadData.assignedTo,
      createdAt: new Date().toISOString(),
    };

    // Sync to FluentCRM if requested
    if (syncToFluentCrm) {
      const fluentCrmId = await syncToFluentCRM(newLead);
      if (fluentCrmId) {
        newLead.fluentCrmId = fluentCrmId;
      }
    }

    leads.push(newLead);
    writeLeads(leads);

    return NextResponse.json({ success: true, lead: newLead });
  } catch (error) {
    console.error('Error creating lead:', error);
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 });
  }
}

// PUT - Update existing lead
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, syncToFluentCrm = false, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Lead ID required' }, { status: 400 });
    }

    const leads = readLeads();
    const index = leads.findIndex(l => l.id === id);

    if (index === -1) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const updatedLead: Lead = {
      ...leads[index],
      ...updateData,
      updatedAt: new Date().toISOString(),
    };

    // Sync to FluentCRM if requested
    if (syncToFluentCrm && !updatedLead.fluentCrmId) {
      const fluentCrmId = await syncToFluentCRM(updatedLead);
      if (fluentCrmId) {
        updatedLead.fluentCrmId = fluentCrmId;
      }
    }

    leads[index] = updatedLead;
    writeLeads(leads);

    return NextResponse.json({ success: true, lead: updatedLead });
  } catch (error) {
    console.error('Error updating lead:', error);
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 });
  }
}

// DELETE - Remove lead
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Lead ID required' }, { status: 400 });
    }

    const leads = readLeads();
    const filteredLeads = leads.filter(l => l.id !== id);

    if (filteredLeads.length === leads.length) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    writeLeads(filteredLeads);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting lead:', error);
    return NextResponse.json({ error: 'Failed to delete lead' }, { status: 500 });
  }
}
