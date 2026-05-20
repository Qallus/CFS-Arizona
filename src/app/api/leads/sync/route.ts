import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'leads.json');

const WP_SITE_URL = process.env.WP_SITE_URL;
const WP_APPLICATION_USERNAME = process.env.WP_APPLICATION_USERNAME;
const WP_APPLICATION_PASSWORD = process.env.WP_APPLICATION_PASSWORD;

const getAuthHeader = () => {
  if (WP_APPLICATION_USERNAME && WP_APPLICATION_PASSWORD) {
    return 'Basic ' + Buffer.from(`${WP_APPLICATION_USERNAME}:${WP_APPLICATION_PASSWORD}`).toString('base64');
  }
  return null;
};

interface Lead {
  id: string;
  name: string;
  company: string;
  title: string;
  email: string | null;
  phone: string | null;
  companyPhone: string | null;
  tags: string[];
  status: string;
  priority: string;
  fluentCrmId?: number;
  [key: string]: any;
}

function readLeads(): Lead[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    return [];
  }
}

function writeLeads(leads: Lead[]): void {
  fs.writeFileSync(DATA_FILE, JSON.stringify(leads, null, 2));
}

// POST - Bulk sync leads to FluentCRM
export async function POST(request: NextRequest) {
  const authHeader = getAuthHeader();
  
  if (!authHeader || !WP_SITE_URL) {
    return NextResponse.json({ 
      error: 'FluentCRM not configured. Set WP_SITE_URL, WP_APPLICATION_USERNAME, and WP_APPLICATION_PASSWORD in .env.local' 
    }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { leadIds, syncAll = false } = body;

    let leads = readLeads();
    let leadsToSync: Lead[];

    if (syncAll) {
      // Sync all leads that don't have a FluentCRM ID
      leadsToSync = leads.filter(l => !l.fluentCrmId);
    } else if (leadIds && Array.isArray(leadIds)) {
      leadsToSync = leads.filter(l => leadIds.includes(l.id));
    } else {
      return NextResponse.json({ error: 'Provide leadIds array or set syncAll: true' }, { status: 400 });
    }

    const results = {
      synced: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const lead of leadsToSync) {
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
          const fluentCrmId = data.subscriber?.id;
          
          if (fluentCrmId) {
            // Update local lead with FluentCRM ID
            const leadIndex = leads.findIndex(l => l.id === lead.id);
            if (leadIndex !== -1) {
              leads[leadIndex].fluentCrmId = fluentCrmId;
              leads[leadIndex].updatedAt = new Date().toISOString();
            }
            results.synced++;
          }
        } else {
          const errorText = await response.text();
          results.failed++;
          results.errors.push(`${lead.name}: ${errorText}`);
        }
      } catch (error) {
        results.failed++;
        results.errors.push(`${lead.name}: ${error}`);
      }
    }

    // Save updated leads with FluentCRM IDs
    writeLeads(leads);

    return NextResponse.json({
      success: true,
      results,
      message: `Synced ${results.synced} leads to FluentCRM. ${results.failed} failed.`,
    });
  } catch (error) {
    console.error('Error syncing leads:', error);
    return NextResponse.json({ error: 'Failed to sync leads' }, { status: 500 });
  }
}

// GET - Check sync status
export async function GET() {
  const authHeader = getAuthHeader();
  const leads = readLeads();
  
  const syncedCount = leads.filter(l => l.fluentCrmId).length;
  const unsyncedCount = leads.filter(l => !l.fluentCrmId).length;

  return NextResponse.json({
    configured: !!(authHeader && WP_SITE_URL),
    totalLeads: leads.length,
    syncedToFluentCRM: syncedCount,
    pendingSync: unsyncedCount,
  });
}
