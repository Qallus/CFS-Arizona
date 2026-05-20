import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

async function readSettings() {
  try {
    const data = await fs.readFile(SETTINGS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Get API key from settings or env
    const settings = await readSettings();
    const openaiKey = settings.openaiApiKey || process.env.OPENAI_API_KEY;
    
    if (!openaiKey) {
      return NextResponse.json({ 
        error: 'OpenAI API key not configured. Go to Settings to add your API key.' 
      }, { status: 400 });
    }

    // Convert File to buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Create a Blob for the API
    const blob = new Blob([buffer], { type: audioFile.type || 'audio/webm' });
    
    // Prepare form data for OpenAI Whisper API
    const whisperFormData = new FormData();
    whisperFormData.append('file', blob, 'audio.webm');
    whisperFormData.append('model', 'whisper-1');
    whisperFormData.append('response_format', 'text');
    
    // Call OpenAI Whisper API
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: whisperFormData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Whisper API error:', errorText);
      return NextResponse.json({ 
        error: 'Transcription failed. Check your OpenAI API key.' 
      }, { status: 500 });
    }
    
    const transcription = await response.text();
    
    return NextResponse.json({ text: transcription });
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json({ error: 'Transcription failed' }, { status: 500 });
  }
}
