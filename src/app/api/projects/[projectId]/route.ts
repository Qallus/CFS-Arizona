import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const PROJECTS_FILE = path.join(process.cwd(), 'data', 'projects.json');

async function readProjects() {
  try {
    const data = await fs.readFile(PROJECTS_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : (parsed.projects || []);
  } catch {
    return [];
  }
}

async function writeProjects(projects: any[]) {
  await fs.writeFile(PROJECTS_FILE, JSON.stringify(projects, null, 2));
}

// GET - Fetch single project
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const projects = await readProjects();
  const project = projects.find((p: any) => p.id === projectId);
  
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }
  
  return NextResponse.json({ project });
}

// PUT - Update project
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const body = await req.json();
  const projects = await readProjects();
  
  const index = projects.findIndex((p: any) => p.id === projectId);
  if (index === -1) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }
  
  // Update project fields
  projects[index] = {
    ...projects[index],
    ...body,
    updatedAt: new Date().toISOString(),
  };
  
  // Add activity log entry
  if (!projects[index].activityLog) {
    projects[index].activityLog = [];
  }
  projects[index].activityLog.push({
    id: `act-${Date.now()}`,
    type: 'project_updated',
    message: 'Project details updated',
    userId: 'user-1',
    userName: 'System',
    createdAt: new Date().toISOString(),
  });
  
  await writeProjects(projects);
  
  return NextResponse.json({ project: projects[index] });
}

// DELETE - Delete project
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const projects = await readProjects();
  
  const index = projects.findIndex((p: any) => p.id === projectId);
  if (index === -1) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }
  
  projects.splice(index, 1);
  await writeProjects(projects);
  
  return NextResponse.json({ success: true });
}
