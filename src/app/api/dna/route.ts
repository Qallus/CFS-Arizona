import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const WORKSPACE_PATH = process.env.HERMES_WORKSPACE || '/hermes/workspace';

const DNA_FILES = {
  soul: 'SOUL.md',
  identity: 'IDENTITY.md',
  user: 'USER.md',
  agents: 'AGENTS.md',
  tools: 'TOOLS.md',
};

export async function GET() {
  try {
    const files: Record<string, string> = {};
    
    for (const [key, filename] of Object.entries(DNA_FILES)) {
      try {
        const filePath = path.join(WORKSPACE_PATH, filename);
        const content = await fs.readFile(filePath, 'utf-8');
        files[key] = content;
      } catch {
        files[key] = '';
      }
    }

    return NextResponse.json({ files });
  } catch (error) {
    console.error('Error reading DNA files:', error);
    return NextResponse.json({ error: 'Failed to read files' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { filename, content } = await request.json();
    
    if (!filename || typeof content !== 'string') {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const filePath = path.join(WORKSPACE_PATH, filename);
    await fs.writeFile(filePath, content, 'utf-8');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error writing DNA file:', error);
    return NextResponse.json({ error: 'Failed to write file' }, { status: 500 });
  }
}
