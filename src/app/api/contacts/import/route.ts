import { NextRequest, NextResponse } from 'next/server';

const WP_SITE_URL = process.env.WP_SITE_URL!;
const WP_APPLICATION_USERNAME = process.env.WP_APPLICATION_USERNAME!;
const WP_APPLICATION_PASSWORD = process.env.WP_APPLICATION_PASSWORD!;

const authHeader = 'Basic ' + Buffer.from(`${WP_APPLICATION_USERNAME}:${WP_APPLICATION_PASSWORD}`).toString('base64');

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const contactType = formData.get('contact_type') as string || 'lead';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Read and parse the file
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      return NextResponse.json({ error: 'File must have at least a header row and one data row' }, { status: 400 });
    }

    // Parse header
    const header = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
    const rows = lines.slice(1);

    // Map common column names
    const columnMap: Record<string, string> = {
      'first_name': 'first_name',
      'firstname': 'first_name',
      'first': 'first_name',
      'last_name': 'last_name',
      'lastname': 'last_name',
      'last': 'last_name',
      'email': 'email',
      'email_address': 'email',
      'phone': 'phone',
      'phone_number': 'phone',
      'mobile': 'phone',
      'company': 'company_name',
      'company_name': 'company_name',
      'organization': 'company_name',
      'website': 'company_website',
      'company_website': 'company_website',
      'url': 'company_website',
    };

    // Create index map for columns
    const colIndex: Record<string, number> = {};
    header.forEach((col, i) => {
      const mapped = columnMap[col] || col;
      colIndex[mapped] = i;
    });

    // Parse contacts
    const contacts: any[] = [];
    for (const row of rows) {
      // Handle CSV parsing with quoted fields
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (const char of row) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      const contact: any = {
        status: 'subscribed',
        custom_values: {},
      };

      // Map values to contact fields
      if (colIndex['first_name'] !== undefined) contact.first_name = values[colIndex['first_name']] || '';
      if (colIndex['last_name'] !== undefined) contact.last_name = values[colIndex['last_name']] || '';
      if (colIndex['email'] !== undefined) contact.email = values[colIndex['email']] || '';
      if (colIndex['phone'] !== undefined) contact.phone = values[colIndex['phone']] || '';
      if (colIndex['company_name'] !== undefined) contact.custom_values.custom_company_name = values[colIndex['company_name']] || '';
      if (colIndex['company_website'] !== undefined) contact.custom_values.custom_website = values[colIndex['company_website']] || '';

      // Skip if no email
      if (!contact.email) continue;

      // Add type tag
      const typeTagMap: Record<string, string> = {
        lead: 'Lead',
        client: 'Client',
        company: 'Company',
      };
      contact.tags = [typeTagMap[contactType] || 'Lead'];

      contacts.push(contact);
    }

    // Import contacts to Fluent CRM in batches
    let imported = 0;
    const batchSize = 10;

    for (let i = 0; i < contacts.length; i += batchSize) {
      const batch = contacts.slice(i, i + batchSize);
      
      for (const contact of batch) {
        try {
          const response = await fetch(
            `${WP_SITE_URL}/wp-json/fluent-crm/v2/subscribers`,
            {
              method: 'POST',
              headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(contact),
            }
          );

          if (response.ok) {
            imported++;
          }
        } catch (err) {
          console.error('Error importing contact:', err);
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      imported, 
      total: contacts.length,
      skipped: contacts.length - imported,
    });
  } catch (error) {
    console.error('Error importing contacts:', error);
    return NextResponse.json({ error: 'Failed to import contacts' }, { status: 500 });
  }
}
