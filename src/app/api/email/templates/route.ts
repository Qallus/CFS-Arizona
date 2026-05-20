import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// Store templates in a JSON file (in production, use a database)
const TEMPLATES_FILE = path.join(process.cwd(), 'data', 'email-templates.json');

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html: string;
  text?: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  variables?: string[];
}

// Ensure data directory exists
async function ensureDataDir() {
  const dataDir = path.join(process.cwd(), 'data');
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// Load templates from file
async function loadTemplates(): Promise<EmailTemplate[]> {
  await ensureDataDir();
  try {
    const data = await fs.readFile(TEMPLATES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    // Return default templates if file doesn't exist
    const defaults = getDefaultTemplates();
    await saveTemplates(defaults);
    return defaults;
  }
}

// Save templates to file
async function saveTemplates(templates: EmailTemplate[]) {
  await ensureDataDir();
  await fs.writeFile(TEMPLATES_FILE, JSON.stringify(templates, null, 2));
}

// Default email templates
function getDefaultTemplates(): EmailTemplate[] {
  return [
    {
      id: 'welcome',
      name: 'Welcome Email',
      subject: 'Welcome to {{company_name}}!',
      category: 'Onboarding',
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td style="padding: 40px 30px; text-align: center; background-color: #14532d;">
        <h1 style="color: #ecfdf5; margin: 0;">Welcome!</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 30px;">
        <h2 style="color: #333333; margin-top: 0;">Hi {{first_name}},</h2>
        <p style="color: #666666; line-height: 1.6;">
          Welcome to {{company_name}}! We're excited to have you on board.
        </p>
        <p style="color: #666666; line-height: 1.6;">
          If you have any questions, feel free to reply to this email.
        </p>
        <table cellpadding="0" cellspacing="0" style="margin: 30px 0;">
          <tr>
            <td style="background-color: #14532d; border-radius: 6px;">
              <a href="{{cta_url}}" style="display: inline-block; padding: 15px 30px; color: #ecfdf5; text-decoration: none; font-weight: bold;">
                Get Started
              </a>
            </td>
          </tr>
        </table>
        <p style="color: #666666; line-height: 1.6;">
          Best regards,<br>
          The {{company_name}} Team
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px 30px; background-color: #f8f8f8; text-align: center;">
        <p style="color: #999999; font-size: 12px; margin: 0;">
          © 2026 {{company_name}}. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`,
      text: 'Hi {{first_name}}, Welcome to {{company_name}}! We\'re excited to have you.',
      variables: ['first_name', 'company_name', 'cta_url'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'follow-up',
      name: 'Follow Up',
      subject: 'Following up on our conversation',
      category: 'Sales',
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td style="padding: 40px 30px;">
        <h2 style="color: #333333; margin-top: 0;">Hi {{first_name}},</h2>
        <p style="color: #666666; line-height: 1.6;">
          I wanted to follow up on our recent conversation about {{topic}}.
        </p>
        <p style="color: #666666; line-height: 1.6;">
          {{custom_message}}
        </p>
        <p style="color: #666666; line-height: 1.6;">
          Let me know if you have any questions or would like to schedule a call.
        </p>
        <p style="color: #666666; line-height: 1.6;">
          Best regards,<br>
          {{sender_name}}
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`,
      variables: ['first_name', 'topic', 'custom_message', 'sender_name'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'newsletter',
      name: 'Newsletter',
      subject: '{{newsletter_title}} - {{month}} Newsletter',
      category: 'Marketing',
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td style="padding: 40px 30px; text-align: center; background-color: #1a1a2e;">
        <h1 style="color: #ffffff; margin: 0;">{{newsletter_title}}</h1>
        <p style="color: #cccccc; margin-top: 10px;">{{month}} Edition</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 30px;">
        <h2 style="color: #333333;">{{headline}}</h2>
        <p style="color: #666666; line-height: 1.6;">
          {{content}}
        </p>
        <hr style="border: none; border-top: 1px solid #eeeeee; margin: 30px 0;">
        <p style="color: #999999; font-size: 12px; text-align: center;">
          <a href="{{unsubscribe_url}}" style="color: #999999;">Unsubscribe</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`,
      variables: ['newsletter_title', 'month', 'headline', 'content', 'unsubscribe_url'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}

// GET - List all templates or get single template
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const category = searchParams.get('category');

    const templates = await loadTemplates();

    if (id) {
      const template = templates.find(t => t.id === id);
      if (!template) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 });
      }
      return NextResponse.json({ template });
    }

    let filtered = templates;
    if (category) {
      filtered = templates.filter(t => t.category === category);
    }

    // Get unique categories
    const categories = [...new Set(templates.map(t => t.category))];

    return NextResponse.json({ 
      templates: filtered,
      categories,
      total: templates.length,
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

// POST - Create new template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, subject, html, text, category, variables } = body;

    if (!name || !subject || !html) {
      return NextResponse.json({ 
        error: 'Name, subject, and HTML content are required' 
      }, { status: 400 });
    }

    const templates = await loadTemplates();
    
    const newTemplate: EmailTemplate = {
      id: `template-${Date.now()}`,
      name,
      subject,
      html,
      text,
      category: category || 'Custom',
      variables: variables || extractVariables(html),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    templates.push(newTemplate);
    await saveTemplates(templates);

    return NextResponse.json({ success: true, template: newTemplate });
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
}

// PUT - Update template
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, subject, html, text, category, variables } = body;

    if (!id) {
      return NextResponse.json({ error: 'Template ID required' }, { status: 400 });
    }

    const templates = await loadTemplates();
    const index = templates.findIndex(t => t.id === id);

    if (index === -1) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    templates[index] = {
      ...templates[index],
      name: name || templates[index].name,
      subject: subject || templates[index].subject,
      html: html || templates[index].html,
      text: text !== undefined ? text : templates[index].text,
      category: category || templates[index].category,
      variables: variables || extractVariables(html || templates[index].html),
      updatedAt: new Date().toISOString(),
    };

    await saveTemplates(templates);

    return NextResponse.json({ success: true, template: templates[index] });
  } catch (error) {
    console.error('Error updating template:', error);
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
  }
}

// DELETE - Remove template
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Template ID required' }, { status: 400 });
    }

    const templates = await loadTemplates();
    const filtered = templates.filter(t => t.id !== id);

    if (filtered.length === templates.length) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    await saveTemplates(filtered);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
  }
}

// Extract variables from template ({{variable_name}})
function extractVariables(html: string): string[] {
  const matches = html.match(/\{\{(\w+)\}\}/g) || [];
  const variables = matches.map(m => m.replace(/\{\{|\}\}/g, ''));
  return [...new Set(variables)];
}
