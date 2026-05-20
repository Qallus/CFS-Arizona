import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'projects.json');

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'high' | 'medium' | 'low';
  assignedTo: string[];
  dueDate: string | null;
  startDate: string | null;
  completedAt: string | null;
  estimatedHours: number | null;
  actualHours: number | null;
  tags: string[];
  attachments: string[];
  checklist: { id: string; text: string; completed: boolean }[];
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: 'owner' | 'manager' | 'member' | 'viewer';
  avatar: string | null;
}

export interface ActivityLog {
  id: string;
  type: 'task_created' | 'task_updated' | 'task_completed' | 'comment' | 'notification_sent' | 'file_uploaded' | 'status_changed' | 'member_added';
  message: string;
  userId: string;
  userName: string;
  taskId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: 'sms' | 'email' | 'call';
  recipient: string;
  recipientName: string;
  subject: string;
  message: string;
  status: 'pending' | 'sent' | 'failed';
  sentAt: string | null;
  createdAt: string;
  relatedTaskId?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  priority: 'high' | 'medium' | 'low';
  startDate: string | null;
  endDate: string | null;
  dueDate: string | null;
  budget: number | null;
  progress: number; // 0-100
  
  // Linked entities
  leadIds: string[];
  contactIds: string[];
  
  // Team
  team: TeamMember[];
  ownerId: string;
  
  // Tasks
  tasks: Task[];
  
  // Activity & Notifications
  activityLog: ActivityLog[];
  notifications: Notification[];
  
  // Metadata
  tags: string[];
  color: string;
  createdAt: string;
  updatedAt: string;
}

function readProjects(): Project[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error reading projects:', error);
    return [];
  }
}

function writeProjects(projects: Project[]): void {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(projects, null, 2));
  } catch (error) {
    console.error('Error writing projects:', error);
    throw error;
  }
}

function calculateProgress(tasks: Task[]): number {
  if (tasks.length === 0) return 0;
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  return Math.round((completedTasks / tasks.length) * 100);
}

// GET - List all projects with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const search = searchParams.get('search');
    const leadId = searchParams.get('leadId');
    const contactId = searchParams.get('contactId');

    let projects = readProjects();

    // Apply filters
    if (status) {
      projects = projects.filter(p => p.status === status);
    }
    if (priority) {
      projects = projects.filter(p => p.priority === priority);
    }
    if (leadId) {
      projects = projects.filter(p => p.leadIds.includes(leadId));
    }
    if (contactId) {
      projects = projects.filter(p => p.contactIds.includes(contactId));
    }
    if (search) {
      const searchLower = search.toLowerCase();
      projects = projects.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower)
      );
    }

    // Recalculate progress for each project
    projects = projects.map(p => ({
      ...p,
      progress: calculateProgress(p.tasks),
    }));

    return NextResponse.json({
      projects,
      total: projects.length,
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

// POST - Create new project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const projects = readProjects();

    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name: body.name || 'Untitled Project',
      description: body.description || '',
      status: body.status || 'planning',
      priority: body.priority || 'medium',
      startDate: body.startDate || null,
      endDate: body.endDate || null,
      dueDate: body.dueDate || null,
      budget: body.budget || null,
      progress: 0,
      leadIds: body.leadIds || [],
      contactIds: body.contactIds || [],
      team: body.team || [],
      ownerId: body.ownerId || 'user-1',
      tasks: [],
      activityLog: [{
        id: `act-${Date.now()}`,
        type: 'task_created',
        message: 'Project created',
        userId: body.ownerId || 'user-1',
        userName: body.ownerName || 'System',
        createdAt: new Date().toISOString(),
      }],
      notifications: [],
      tags: body.tags || [],
      color: body.color || '#00fc83',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    projects.push(newProject);
    writeProjects(projects);

    return NextResponse.json({ success: true, project: newProject });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}

// PUT - Update project
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }

    const projects = readProjects();
    const index = projects.findIndex(p => p.id === id);

    if (index === -1) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Log status change
    if (updateData.status && updateData.status !== projects[index].status) {
      projects[index].activityLog.push({
        id: `act-${Date.now()}`,
        type: 'status_changed',
        message: `Status changed from ${projects[index].status} to ${updateData.status}`,
        userId: updateData.updatedBy || 'user-1',
        userName: updateData.updatedByName || 'System',
        createdAt: new Date().toISOString(),
      });
    }

    const updatedProject: Project = {
      ...projects[index],
      ...updateData,
      progress: updateData.tasks ? calculateProgress(updateData.tasks) : projects[index].progress,
      updatedAt: new Date().toISOString(),
    };

    projects[index] = updatedProject;
    writeProjects(projects);

    return NextResponse.json({ success: true, project: updatedProject });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

// DELETE - Remove project
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }

    const projects = readProjects();
    const filteredProjects = projects.filter(p => p.id !== id);

    if (filteredProjects.length === projects.length) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    writeProjects(filteredProjects);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
