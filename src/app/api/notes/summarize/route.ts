import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const NOTES_FILE = path.join(DATA_DIR, 'notes.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

async function readFile(filePath: string) {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

async function writeNotes(notes: any[]) {
  await fs.writeFile(NOTES_FILE, JSON.stringify(notes, null, 2));
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { noteId } = body;
  
  if (!noteId) {
    return NextResponse.json({ error: 'Note ID required' }, { status: 400 });
  }
  
  const notes = await readFile(NOTES_FILE) || [];
  const noteIndex = notes.findIndex((n: any) => n.id === noteId);
  
  if (noteIndex === -1) {
    return NextResponse.json({ error: 'Note not found' }, { status: 404 });
  }
  
  const note = notes[noteIndex];
  
  if (!note.transcription) {
    return NextResponse.json({ error: 'No transcription available' }, { status: 400 });
  }
  
  // Get API key from settings
  const settings = await readFile(SETTINGS_FILE) || {};
  const openaiKey = settings.openaiApiKey || process.env.OPENAI_API_KEY;
  
  if (!openaiKey) {
    return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 400 });
  }
  
  try {
    // Call OpenAI to generate summary
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a meeting summarizer. Given a meeting transcription, create a structured summary that includes:

1. **Meeting Overview** - A brief 1-2 sentence summary of what the meeting was about
2. **Key Discussion Points** - The main topics discussed (bullet points)
3. **Decisions Made** - Any decisions that were reached
4. **Action Items** - Tasks or follow-ups mentioned, with owners if specified
5. **Next Steps** - What happens after this meeting

Keep the summary concise but comprehensive. Format using markdown.`
          },
          {
            role: 'user',
            content: `Please summarize this meeting transcription:\n\n${note.transcription}`
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });
    
    if (!response.ok) {
      throw new Error('OpenAI API request failed');
    }
    
    const data = await response.json();
    const summary = data.choices[0]?.message?.content || 'Failed to generate summary';
    
    // Update note with AI summary
    notes[noteIndex].aiSummary = summary;
    notes[noteIndex].updatedAt = new Date().toISOString();
    
    await writeNotes(notes);
    
    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Summary generation error:', error);
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 });
  }
}
