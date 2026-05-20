import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const WORKSPACE_PATH = process.env.HERMES_WORKSPACE || '/hermes/workspace';
const SKILLS_DIR = path.join(WORKSPACE_PATH, 'skills');

async function getLocalSkills(): Promise<{ name: string; description: string; location: string }[]> {
  const skills: { name: string; description: string; location: string }[] = [];
  
  try {
    await fs.access(SKILLS_DIR);
    const dirs = await fs.readdir(SKILLS_DIR);
    
    for (const dir of dirs) {
      const skillPath = path.join(SKILLS_DIR, dir, 'SKILL.md');
      try {
        const content = await fs.readFile(skillPath, 'utf-8');
        // Extract description from first paragraph after title
        const lines = content.split('\n');
        let description = '';
        for (let i = 1; i < lines.length; i++) {
          if (lines[i].trim() && !lines[i].startsWith('#')) {
            description = lines[i].trim();
            break;
          }
        }
        skills.push({
          name: dir,
          description: description || 'Custom skill',
          location: skillPath,
        });
      } catch {
        // Skip directories without SKILL.md
      }
    }
  } catch {
    // Skills directory doesn't exist
  }
  
  return skills;
}

export async function GET() {
  try {
    // Read TOOLS.md
    let tools = '';
    try {
      tools = await fs.readFile(path.join(WORKSPACE_PATH, 'TOOLS.md'), 'utf-8');
    } catch {
      tools = '';
    }

    // Get local skills
    const localSkills = await getLocalSkills();

    return NextResponse.json({
      skills: localSkills,
      tools,
    });
  } catch (error) {
    console.error('Error loading skills:', error);
    return NextResponse.json({ skills: [], tools: '' });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, skill, content } = body;

    if (action === 'add' && skill) {
      // Create skill directory and SKILL.md
      const skillDir = path.join(SKILLS_DIR, skill.name);
      await fs.mkdir(skillDir, { recursive: true });
      
      const skillContent = skill.content || `# ${skill.name}\n\n${skill.description || 'Custom skill'}\n`;
      await fs.writeFile(path.join(skillDir, 'SKILL.md'), skillContent, 'utf-8');
      
      return NextResponse.json({ success: true });
    }

    if (action === 'saveTools' && typeof content === 'string') {
      await fs.writeFile(path.join(WORKSPACE_PATH, 'TOOLS.md'), content, 'utf-8');
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in skills POST:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
