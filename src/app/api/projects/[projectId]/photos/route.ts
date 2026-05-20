import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const PROJECTS_FILE = path.join(process.cwd(), 'data', 'projects.json');
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads', 'projects');

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

// POST - Upload photo
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const caption = formData.get('caption') as string || '';
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    // Ensure upload directory exists
    const projectUploadsDir = path.join(UPLOADS_DIR, projectId);
    await fs.mkdir(projectUploadsDir, { recursive: true });
    
    // Generate unique filename
    const ext = path.extname(file.name) || '.jpg';
    const filename = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${ext}`;
    const filepath = path.join(projectUploadsDir, filename);
    
    // Save file
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filepath, buffer);
    
    // Update project with photo reference
    const projects = await readProjects();
    const index = projects.findIndex((p: any) => p.id === projectId);
    
    if (index === -1) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    if (!projects[index].photos) {
      projects[index].photos = [];
    }
    
    const photo = {
      id: `photo-${Date.now()}`,
      url: `/uploads/projects/${projectId}/${filename}`,
      name: file.name,
      caption,
      uploadedAt: new Date().toISOString(),
    };
    
    projects[index].photos.push(photo);
    
    // Add activity log
    if (!projects[index].activityLog) {
      projects[index].activityLog = [];
    }
    projects[index].activityLog.push({
      id: `act-${Date.now()}`,
      type: 'photo_uploaded',
      message: `Photo uploaded: ${file.name}`,
      userId: 'user-1',
      userName: 'System',
      createdAt: new Date().toISOString(),
    });
    
    projects[index].updatedAt = new Date().toISOString();
    await writeProjects(projects);
    
    return NextResponse.json({ photo });
  } catch (error) {
    console.error('Error uploading photo:', error);
    return NextResponse.json({ error: 'Failed to upload photo' }, { status: 500 });
  }
}

// DELETE - Delete photo
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const photoId = req.nextUrl.searchParams.get('photoId');
  
  if (!photoId) {
    return NextResponse.json({ error: 'Photo ID required' }, { status: 400 });
  }
  
  try {
    const projects = await readProjects();
    const index = projects.findIndex((p: any) => p.id === projectId);
    
    if (index === -1) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    const photos = projects[index].photos || [];
    const photoIndex = photos.findIndex((p: any) => p.id === photoId);
    
    if (photoIndex === -1) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }
    
    const photo = photos[photoIndex];
    
    // Delete file from disk
    try {
      const filepath = path.join(process.cwd(), 'public', photo.url);
      await fs.unlink(filepath);
    } catch (e) {
      // File may not exist, continue
    }
    
    // Remove from project
    photos.splice(photoIndex, 1);
    projects[index].photos = photos;
    
    // Add activity log
    if (!projects[index].activityLog) {
      projects[index].activityLog = [];
    }
    projects[index].activityLog.push({
      id: `act-${Date.now()}`,
      type: 'photo_deleted',
      message: `Photo deleted: ${photo.name}`,
      userId: 'user-1',
      userName: 'System',
      createdAt: new Date().toISOString(),
    });
    
    projects[index].updatedAt = new Date().toISOString();
    await writeProjects(projects);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting photo:', error);
    return NextResponse.json({ error: 'Failed to delete photo' }, { status: 500 });
  }
}
