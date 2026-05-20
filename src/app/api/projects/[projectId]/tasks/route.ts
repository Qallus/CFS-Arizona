import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'projects.json');

interface Task {
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

interface Project {
  id: string;
  tasks: Task[];
  activityLog: any[];
  [key: string]: any;
}

function readProjects(): Project[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    return [];
  }
}

function writeProjects(projects: Project[]): void {
  fs.writeFileSync(DATA_FILE, JSON.stringify(projects, null, 2));
}

// GET - List tasks for a project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const projects = readProjects();
    const project = projects.find(p => p.id === projectId);

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    let tasks = project.tasks || [];

    if (status) {
      tasks = tasks.filter(t => t.status === status);
    }

    // Group by status for Kanban view
    const tasksByStatus = {
      todo: tasks.filter(t => t.status === 'todo').sort((a, b) => a.order - b.order),
      in_progress: tasks.filter(t => t.status === 'in_progress').sort((a, b) => a.order - b.order),
      review: tasks.filter(t => t.status === 'review').sort((a, b) => a.order - b.order),
      done: tasks.filter(t => t.status === 'done').sort((a, b) => a.order - b.order),
    };

    return NextResponse.json({
      tasks,
      tasksByStatus,
      total: tasks.length,
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

// POST - Create new task
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const body = await request.json();

    const projects = readProjects();
    const projectIndex = projects.findIndex(p => p.id === projectId);

    if (projectIndex === -1) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const project = projects[projectIndex];
    const maxOrder = project.tasks.length > 0 
      ? Math.max(...project.tasks.filter(t => t.status === (body.status || 'todo')).map(t => t.order)) 
      : 0;

    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: body.title || 'Untitled Task',
      description: body.description || '',
      status: body.status || 'todo',
      priority: body.priority || 'medium',
      assignedTo: body.assignedTo || [],
      dueDate: body.dueDate || null,
      startDate: body.startDate || null,
      completedAt: null,
      estimatedHours: body.estimatedHours || null,
      actualHours: null,
      tags: body.tags || [],
      attachments: body.attachments || [],
      checklist: body.checklist || [],
      order: maxOrder + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    project.tasks.push(newTask);
    project.activityLog.push({
      id: `act-${Date.now()}`,
      type: 'task_created',
      message: `Task "${newTask.title}" created`,
      userId: body.createdBy || 'user-1',
      userName: body.createdByName || 'System',
      taskId: newTask.id,
      createdAt: new Date().toISOString(),
    });
    project.updatedAt = new Date().toISOString();

    projects[projectIndex] = project;
    writeProjects(projects);

    return NextResponse.json({ success: true, task: newTask });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}

// PUT - Update task (including status/order changes for Kanban)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const body = await request.json();
    const { taskId, ...updateData } = body;

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID required' }, { status: 400 });
    }

    const projects = readProjects();
    const projectIndex = projects.findIndex(p => p.id === projectId);

    if (projectIndex === -1) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const project = projects[projectIndex];
    const taskIndex = project.tasks.findIndex(t => t.id === taskId);

    if (taskIndex === -1) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const oldTask = project.tasks[taskIndex];
    const updatedTask: Task = {
      ...oldTask,
      ...updateData,
      completedAt: updateData.status === 'done' && oldTask.status !== 'done' 
        ? new Date().toISOString() 
        : oldTask.completedAt,
      updatedAt: new Date().toISOString(),
    };

    // Log status change
    if (updateData.status && updateData.status !== oldTask.status) {
      project.activityLog.push({
        id: `act-${Date.now()}`,
        type: updateData.status === 'done' ? 'task_completed' : 'status_changed',
        message: `Task "${updatedTask.title}" moved from ${oldTask.status} to ${updateData.status}`,
        userId: updateData.updatedBy || 'user-1',
        userName: updateData.updatedByName || 'System',
        taskId: taskId,
        createdAt: new Date().toISOString(),
      });
    }

    project.tasks[taskIndex] = updatedTask;
    project.updatedAt = new Date().toISOString();

    projects[projectIndex] = project;
    writeProjects(projects);

    return NextResponse.json({ success: true, task: updatedTask });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

// DELETE - Remove task
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID required' }, { status: 400 });
    }

    const projects = readProjects();
    const projectIndex = projects.findIndex(p => p.id === projectId);

    if (projectIndex === -1) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const project = projects[projectIndex];
    const taskToDelete = project.tasks.find(t => t.id === taskId);
    project.tasks = project.tasks.filter(t => t.id !== taskId);

    if (taskToDelete) {
      project.activityLog.push({
        id: `act-${Date.now()}`,
        type: 'task_updated',
        message: `Task "${taskToDelete.title}" deleted`,
        userId: 'user-1',
        userName: 'System',
        taskId: taskId,
        createdAt: new Date().toISOString(),
      });
    }

    project.updatedAt = new Date().toISOString();
    projects[projectIndex] = project;
    writeProjects(projects);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
