import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'projects.json');

async function readProjects() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { projects: [] };
  }
}

// GET - Get project by client access token (public)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  
  if (!token) {
    return NextResponse.json({ error: 'Token required' }, { status: 400 });
  }
  
  const data = await readProjects();
  const project = data.projects.find((p: any) => 
    p.clientAccessToken === token && p.clientAccessEnabled === true
  );
  
  if (!project) {
    return NextResponse.json({ error: 'Project not found or access disabled' }, { status: 404 });
  }
  
  // Return sanitized project data for client view
  const clientProject = {
    id: project.id,
    name: project.name,
    description: project.description,
    status: project.status,
    progress: project.progress,
    startDate: project.startDate,
    endDate: project.endDate,
    dueDate: project.dueDate,
    tasks: (project.tasks || []).map((task: any) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
    })),
    activityLog: (project.activityLog || []).slice(-10).map((log: any) => ({
      id: log.id,
      message: log.message,
      createdAt: log.createdAt,
    })),
    updatedAt: project.updatedAt,
  };
  
  return NextResponse.json({ project: clientProject });
}
