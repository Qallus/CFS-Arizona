import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const ENV_FILE = path.join(process.cwd(), '.env.local');

// Credential groups for organization
const CREDENTIAL_GROUPS = {
  email: {
    name: 'Email (Hostinger)',
    description: 'IMAP/SMTP email configuration',
    fields: [
      { key: 'EMAIL_ADDRESS', label: 'Email Address', type: 'text', sensitive: false },
      { key: 'EMAIL_PASSWORD', label: 'Email Password', type: 'password', sensitive: true },
      { key: 'IMAP_HOST', label: 'IMAP Host', type: 'text', sensitive: false },
      { key: 'IMAP_PORT', label: 'IMAP Port', type: 'text', sensitive: false },
      { key: 'SMTP_HOST', label: 'SMTP Host', type: 'text', sensitive: false },
      { key: 'SMTP_PORT', label: 'SMTP Port', type: 'text', sensitive: false },
    ],
  },
  twilio: {
    name: 'Twilio',
    description: 'Voice and SMS configuration',
    fields: [
      { key: 'TWILIO_ACCOUNT_SID', label: 'Account SID', type: 'text', sensitive: false },
      { key: 'TWILIO_AUTH_TOKEN', label: 'Auth Token', type: 'password', sensitive: true },
      { key: 'TWILIO_PHONE_NUMBER', label: 'Voice Number', type: 'text', sensitive: false },
      { key: 'TWILIO_SMS_PHONE_NUMBER', label: 'SMS Number', type: 'text', sensitive: false },
      { key: 'TWILIO_TWIML_APP_SID', label: 'TwiML App SID', type: 'text', sensitive: false },
      { key: 'TWILIO_API_KEY_SID', label: 'API Key SID', type: 'text', sensitive: false },
      { key: 'TWILIO_API_KEY_SECRET', label: 'API Key Secret', type: 'password', sensitive: true },
    ],
  },
  wordpress: {
    name: 'WordPress / Fluent CRM',
    description: 'channelcast.io integration',
    fields: [
      { key: 'WP_SITE_URL', label: 'Site URL', type: 'text', sensitive: false },
      { key: 'WP_APPLICATION_USERNAME', label: 'App Username', type: 'text', sensitive: false },
      { key: 'WP_APPLICATION_PASSWORD', label: 'App Password', type: 'password', sensitive: true },
    ],
  },
  mailpurse: {
    name: 'MailPurse',
    description: 'Email campaigns (send.channelcast.io)',
    fields: [
      { key: 'MAILPURSE_URL', label: 'API URL', type: 'text', sensitive: false },
      { key: 'MAILPURSE_API_KEY', label: 'API Key', type: 'password', sensitive: true },
    ],
  },
  supabase: {
    name: 'Supabase',
    description: 'Database configuration',
    fields: [
      { key: 'SUPABASE_URL', label: 'URL', type: 'text', sensitive: false },
      { key: 'SUPABASE_ANON_KEY', label: 'Anon Key', type: 'password', sensitive: true },
      { key: 'SUPABASE_SERVICE_ROLE_KEY', label: 'Service Role Key', type: 'password', sensitive: true },
    ],
  },
  nocodb: {
    name: 'NocoDB',
    description: 'Database UI',
    fields: [
      { key: 'NOCODB_BASE_URL', label: 'Base URL', type: 'text', sensitive: false },
      { key: 'NOCODB_API_TOKEN', label: 'API Token', type: 'password', sensitive: true },
    ],
  },
  n8n: {
    name: 'n8n',
    description: 'Workflow automation',
    fields: [
      { key: 'N8N_BASE_URL', label: 'Base URL', type: 'text', sensitive: false },
      { key: 'N8N_API_KEY', label: 'API Key', type: 'password', sensitive: true },
    ],
  },
  directus: {
    name: 'Directus',
    description: 'Headless CMS',
    fields: [
      { key: 'DIRECTUS_BASE_URL', label: 'Base URL', type: 'text', sensitive: false },
      { key: 'DIRECTUS_ADMIN_TOKEN', label: 'Admin Token', type: 'password', sensitive: true },
    ],
  },
};

// Parse .env file
async function parseEnvFile(): Promise<Map<string, string>> {
  try {
    const content = await fs.readFile(ENV_FILE, 'utf-8');
    const env = new Map<string, string>();
    
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex > 0) {
        const key = trimmed.substring(0, eqIndex).trim();
        const value = trimmed.substring(eqIndex + 1).trim();
        env.set(key, value);
      }
    }
    
    return env;
  } catch (error) {
    console.error('Error reading env file:', error);
    return new Map();
  }
}

// Write updated env file
async function writeEnvFile(env: Map<string, string>): Promise<void> {
  // Read original file to preserve structure and comments
  let content = '';
  try {
    content = await fs.readFile(ENV_FILE, 'utf-8');
  } catch {
    content = '';
  }

  // Update values in place
  const lines = content.split('\n');
  const updatedKeys = new Set<string>();
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('#')) continue;
    
    const eqIndex = line.indexOf('=');
    if (eqIndex > 0) {
      const key = line.substring(0, eqIndex).trim();
      if (env.has(key)) {
        lines[i] = `${key}=${env.get(key)}`;
        updatedKeys.add(key);
      }
    }
  }

  // Add any new keys not in original file
  for (const [key, value] of env) {
    if (!updatedKeys.has(key)) {
      lines.push(`${key}=${value}`);
    }
  }

  await fs.writeFile(ENV_FILE, lines.join('\n'));
}

// Mask sensitive value for display
function maskValue(value: string, sensitive: boolean): string {
  if (!sensitive || !value) return value;
  if (value.length <= 8) return '••••••••';
  return value.substring(0, 4) + '••••••••' + value.substring(value.length - 4);
}

// Get all known keys from predefined groups
function getKnownKeys(): Set<string> {
  const keys = new Set<string>();
  for (const group of Object.values(CREDENTIAL_GROUPS)) {
    for (const field of group.fields) {
      keys.add(field.key);
    }
  }
  // Also add system keys that shouldn't be shown as custom
  keys.add('AUTH_SECRET');
  keys.add('AUTH_TRUST_HOST');
  keys.add('OPENCLAW_GATEWAY_URL');
  keys.add('OPENCLAW_GATEWAY_TOKEN');
  keys.add('OPENCLAW_WORKSPACE');
  keys.add('NEXT_PUBLIC_APP_URL');
  return keys;
}

// GET - Fetch current credentials (masked)
export async function GET(request: NextRequest) {
  try {
    const env = await parseEnvFile();
    const knownKeys = getKnownKeys();
    
    const groups: Record<string, any> = {};
    
    // Add predefined groups
    for (const [groupKey, group] of Object.entries(CREDENTIAL_GROUPS)) {
      groups[groupKey] = {
        name: group.name,
        description: group.description,
        fields: group.fields.map(field => ({
          key: field.key,
          label: field.label,
          type: field.type,
          sensitive: field.sensitive,
          value: maskValue(env.get(field.key) || '', field.sensitive),
          hasValue: !!env.get(field.key),
        })),
      };
    }
    
    // Find custom/unknown keys and add them to a "custom" group
    const customFields: any[] = [];
    for (const [key, value] of env) {
      if (!knownKeys.has(key) && key && !key.startsWith('#')) {
        // Determine if it looks sensitive (contains key, token, secret, password, etc.)
        const isSensitive = /key|token|secret|password|auth/i.test(key);
        customFields.push({
          key,
          label: key,
          type: isSensitive ? 'password' : 'text',
          sensitive: isSensitive,
          value: maskValue(value || '', isSensitive),
          hasValue: !!value,
          isCustom: true,
        });
      }
    }
    
    if (customFields.length > 0 || true) { // Always show custom group
      groups['custom'] = {
        name: 'Custom APIs',
        description: 'Custom API keys and configurations',
        fields: customFields,
        allowAdd: true,
      };
    }
    
    return NextResponse.json({ groups, schema: CREDENTIAL_GROUPS });
  } catch (error) {
    console.error('Error fetching credentials:', error);
    return NextResponse.json({ error: 'Failed to fetch credentials' }, { status: 500 });
  }
}

// POST - Update credentials
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { updates, restart } = body;
    
    if (!updates || typeof updates !== 'object') {
      return NextResponse.json({ error: 'Updates object required' }, { status: 400 });
    }

    const env = await parseEnvFile();
    
    // Apply updates
    for (const [key, value] of Object.entries(updates)) {
      if (typeof value === 'string' && value.trim()) {
        env.set(key, value);
      }
    }
    
    await writeEnvFile(env);
    
    // Optionally restart the app
    if (restart) {
      try {
        // Restart PM2 process
        await execAsync('pm2 restart sig360-dashboard');
      } catch (e) {
        console.error('Error restarting app:', e);
        // Don't fail the request if restart fails
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Credentials updated' + (restart ? ' and app restarting' : ''),
      updatedKeys: Object.keys(updates),
    });
  } catch (error) {
    console.error('Error updating credentials:', error);
    return NextResponse.json({ error: 'Failed to update credentials' }, { status: 500 });
  }
}

// DELETE - Remove a credential
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    
    if (!key) {
      return NextResponse.json({ error: 'Key required' }, { status: 400 });
    }

    const env = await parseEnvFile();
    env.delete(key);
    await writeEnvFile(env);
    
    return NextResponse.json({ success: true, message: `Removed ${key}` });
  } catch (error) {
    console.error('Error removing credential:', error);
    return NextResponse.json({ error: 'Failed to remove credential' }, { status: 500 });
  }
}
