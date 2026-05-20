import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

const DATA_FILE = path.join(process.cwd(), 'data', 'projects.json');

async function readProjects() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { projects: [] };
  }
}

async function writeProjects(data: any) {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

// GET - Get portal status for project
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const data = await readProjects();
  const project = data.projects.find((p: any) => p.id === projectId);
  
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }
  
  return NextResponse.json({
    enabled: project.clientAccessEnabled || false,
    token: project.clientAccessToken || null,
    url: project.clientAccessToken 
      ? `${process.env.NEXT_PUBLIC_APP_URL || ''}/portal/${project.clientAccessToken}`
      : null,
  });
}

// POST - Enable/disable portal access or regenerate token
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const body = await req.json();
  const { action } = body; // 'enable', 'disable', 'regenerate'
  
  const data = await readProjects();
  const index = data.projects.findIndex((p: any) => p.id === projectId);
  
  if (index === -1) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }
  
  const project = data.projects[index];
  
  switch (action) {
    case 'enable':
      if (!project.clientAccessToken) {
        project.clientAccessToken = crypto.randomBytes(16).toString('hex');
      }
      project.clientAccessEnabled = true;
      break;
      
    case 'disable':
      project.clientAccessEnabled = false;
      break;
      
    case 'regenerate':
      project.clientAccessToken = crypto.randomBytes(16).toString('hex');
      project.clientAccessEnabled = true;
      break;
      
    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }
  
  project.updatedAt = new Date().toISOString();
  data.projects[index] = project;
  await writeProjects(data);
  
  return NextResponse.json({
    enabled: project.clientAccessEnabled,
    token: project.clientAccessToken,
    url: `${process.env.NEXT_PUBLIC_APP_URL || ''}/portal/${project.clientAccessToken}`,
  });
}
