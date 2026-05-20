import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const WORKSPACE_PATH = process.env.HERMES_WORKSPACE || '/hermes/workspace';

export async function GET() {
  try {
    // Read MEMORY.md
    let memory = '';
    try {
      memory = await fs.readFile(path.join(WORKSPACE_PATH, 'MEMORY.md'), 'utf-8');
    } catch {
      memory = '';
    }

    // Read daily memory files
    const dailyFiles: { name: string; content: string }[] = [];
    try {
      const memoryDir = path.join(WORKSPACE_PATH, 'memory');
      const files = await fs.readdir(memoryDir);
      
      for (const file of files.filter(f => f.endsWith('.md')).sort().reverse()) {
        try {
          const content = await fs.readFile(path.join(memoryDir, file), 'utf-8');
          dailyFiles.push({ name: file, content });
        } catch {
          // Skip files that can't be read
        }
      }
    } catch {
      // memory directory doesn't exist
    }

    return NextResponse.json({ memory, dailyFiles });
  } catch (error) {
    console.error('Error reading memory:', error);
    return NextResponse.json({ error: 'Failed to read memory' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { filename, content } = await request.json();
    
    if (!filename || typeof content !== 'string') {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    let filePath: string;
    if (filename === 'MEMORY.md') {
      filePath = path.join(WORKSPACE_PATH, filename);
    } else {
      filePath = path.join(WORKSPACE_PATH, 'memory', filename);
    }
    
    await fs.writeFile(filePath, content, 'utf-8');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error writing memory:', error);
    return NextResponse.json({ error: 'Failed to write memory' }, { status: 500 });
  }
}
