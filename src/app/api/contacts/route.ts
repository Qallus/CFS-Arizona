import { NextRequest, NextResponse } from 'next/server';

const WP_SITE_URL = process.env.WP_SITE_URL!;
const WP_APPLICATION_USERNAME = process.env.WP_APPLICATION_USERNAME!;
const WP_APPLICATION_PASSWORD = process.env.WP_APPLICATION_PASSWORD!;

const authHeader = 'Basic ' + Buffer.from(`${WP_APPLICATION_USERNAME}:${WP_APPLICATION_PASSWORD}`).toString('base64');

// Map contact type to Fluent CRM tags
const TYPE_TAG_MAP: Record<string, string> = {
  lead: 'Lead',
  client: 'Client',
  company: 'Company',
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const perPage = searchParams.get('per_page') || '50';
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const tag = searchParams.get('tag') || '';
    const list = searchParams.get('list') || '';
    const type = searchParams.get('type') || ''; // lead, client, company

    // Build query params
    const params = new URLSearchParams({
      page,
      per_page: perPage,
    });

    if (search) params.append('search', search);
    if (status) params.append('status', status);
    if (tag) params.append('tags[]', tag);
    if (list) params.append('lists[]', list);
    
    // Filter by type tag if specified
    if (type && TYPE_TAG_MAP[type]) {
      params.append('tags[]', TYPE_TAG_MAP[type]);
    }

    const response = await fetch(
      `${WP_SITE_URL}/wp-json/fluent-crm/v2/subscribers?${params.toString()}`,
      {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      throw new Error(`Fluent CRM API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform contacts - preserve backward compatibility with Communications page
    const contacts = (data.subscribers?.data || []).map((sub: any) => {
      const firstName = sub.first_name || '';
      const lastName = sub.last_name || '';
      const fullName = `${firstName} ${lastName}`.trim() || sub.email || 'Unknown';
      const phone = sub.phone || sub.custom_values?.custom_phone_number || '';
      
      // Get avatar URL - Fluent CRM uses 'photo' field
      const photo = sub.photo || sub.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=f97316&color=fff`;
      
      return {
        // Original fields for Communications page compatibility
        id: sub.id,
        first_name: firstName,
        last_name: lastName,
        full_name: fullName,
        email: sub.email || '',
        phone: phone || null,
        status: sub.status || 'subscribed',
        contact_type: sub.contact_type || 'subscriber',
        photo: photo,
        avatar: photo, // Alias for new Contacts page
        city: sub.city || null,
        state: sub.state || null,
        tags: sub.tags || [],
        lists: sub.lists || [],
        companies: sub.companies || [],
        created_at: sub.created_at,
        
        // Extended fields for new Contacts page
        prefix: sub.prefix || '',
        date_of_birth: sub.date_of_birth || '',
        address_line_1: sub.address_line_1 || '',
        address_line_2: sub.address_line_2 || '',
        zip_code: sub.postal_code || '',
        country: sub.country || '',
        company_name: sub.company_id ? sub.company?.name : (sub.custom_values?.custom_company_name || ''),
        company_website: sub.custom_values?.custom_website || '',
        direction: sub.custom_values?.direction || '',
        sms_timestamp: sub.custom_values?.sms_timestamp || '',
        incoming_sms_message: sub.custom_values?.incoming_sms_message || '',
        preferred_ai_provider: sub.custom_values?.custom_preferred_ai_provider || '',
        ai_clone_budget: sub.custom_values?.ai_clone_budget || '',
        ai_clone_goals: sub.custom_values?.ai_clone_goals || sub.custom_values?.['What would you like your AI Clone to do for you or your business or brand?'] || '',
        last_activity: sub.last_activity,
      };
    });
    
    return NextResponse.json({
      contacts,
      pagination: {
        total: data.subscribers?.total || 0,
        perPage: data.subscribers?.per_page || 50,
        currentPage: data.subscribers?.current_page || 1,
        lastPage: data.subscribers?.last_page || 1,
      },
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json({ error: 'Failed to fetch contacts', contacts: [] }, { status: 500 });
  }
}

// Create new contact
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, contactId } = body;

    // Legacy action: get single contact
    if (action === 'get') {
      const response = await fetch(
        `${WP_SITE_URL}/wp-json/fluent-crm/v2/subscribers/${contactId}`,
        {
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Fluent CRM API error: ${response.status}`);
      }

      const data = await response.json();
      return NextResponse.json({ contact: data.subscriber });
    }

    // Create new contact
    const {
      contact_type,
      prefix,
      first_name,
      last_name,
      email,
      phone,
      photo,
      company_name,
      company_website,
      preferred_ai_provider,
      ai_clone_goals,
      address_line_1,
      address_line_2,
      city,
      state,
      zip_code,
      country,
    } = body;

    // Prepare subscriber data for Fluent CRM
    const subscriberData: any = {
      email,
      first_name,
      last_name,
      prefix,
      phone,
      address_line_1,
      address_line_2,
      city,
      state,
      postal_code: zip_code,
      country,
      status: 'subscribed',
      custom_values: {
        custom_company_name: company_name,
        custom_website: company_website,
        custom_preferred_ai_provider: preferred_ai_provider,
        ai_clone_goals,
      },
    };

    // Add photo if provided
    if (photo) {
      // Make the photo URL absolute if it's a relative path
      subscriberData.photo = photo.startsWith('/') 
        ? `${process.env.NEXT_PUBLIC_APP_URL || ''}${photo}`
        : photo;
    }

    // Add type tag
    if (contact_type && TYPE_TAG_MAP[contact_type]) {
      subscriberData.tags = [TYPE_TAG_MAP[contact_type]];
    }

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

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Fluent CRM create error:', errorText);
      throw new Error(`Fluent CRM API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json({ success: true, contact: data.subscriber || data });
  } catch (error) {
    console.error('Error creating contact:', error);
    return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 });
  }
}

// Update existing contact
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Contact ID required' }, { status: 400 });
    }

    // Prepare update data for Fluent CRM
    const subscriberData: any = {
      first_name: updateData.first_name,
      last_name: updateData.last_name,
      prefix: updateData.prefix,
      email: updateData.email,
      phone: updateData.phone,
      date_of_birth: updateData.date_of_birth,
      address_line_1: updateData.address_line_1,
      address_line_2: updateData.address_line_2,
      city: updateData.city,
      state: updateData.state,
      postal_code: updateData.zip_code,
      country: updateData.country,
      status: updateData.status,
      custom_values: {
        custom_company_name: updateData.company_name,
        custom_website: updateData.company_website,
        direction: updateData.direction,
        sms_timestamp: updateData.sms_timestamp,
        incoming_sms_message: updateData.incoming_sms_message,
        custom_preferred_ai_provider: updateData.preferred_ai_provider,
        ai_clone_budget: updateData.ai_clone_budget,
        ai_clone_goals: updateData.ai_clone_goals,
      },
    };

    // Add photo if provided
    if (updateData.photo) {
      subscriberData.photo = updateData.photo.startsWith('/') 
        ? `${process.env.NEXT_PUBLIC_APP_URL || ''}${updateData.photo}`
        : updateData.photo;
    }

    const response = await fetch(
      `${WP_SITE_URL}/wp-json/fluent-crm/v2/subscribers/${id}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscriberData),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Fluent CRM update error:', errorText);
      throw new Error(`Fluent CRM API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json({ success: true, contact: data.subscriber || data });
  } catch (error) {
    console.error('Error updating contact:', error);
    return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 });
  }
}
