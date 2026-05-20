import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const DEVICES_FILE = path.join(process.cwd(), 'data', 'audio-devices.json');

interface AudioDevice {
  id: string;
  name: string;
  type: 'linux' | 'windows' | 'macos';
  host: string;
  username: string;
  password?: string;
  authType: 'key' | 'password';
  audioOutput?: string;
}

async function loadDevices(): Promise<AudioDevice[]> {
  try {
    const data = await fs.readFile(DEVICES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// POST - Test audio on device
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deviceId, message } = body;

    if (!deviceId || !message) {
      return NextResponse.json({ error: 'Device ID and message required' }, { status: 400 });
    }

    const devices = await loadDevices();
    const device = devices.find(d => d.id === deviceId);

    if (!device) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }

    let command: string;

    if (device.type === 'linux') {
      // Linux with espeak
      if (device.authType === 'key') {
        command = `ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 ${device.username}@${device.host} "espeak -s 130 '${message.replace(/'/g, "'\\''")}'"`; 
      } else {
        command = `sshpass -p '${device.password}' ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 ${device.username}@${device.host} "espeak -s 130 '${message.replace(/'/g, "'\\''")}'"`; 
      }
    } else if (device.type === 'windows') {
      // Windows with PowerShell TTS
      const psCommand = `Add-Type -AssemblyName System.Speech; (New-Object System.Speech.Synthesis.SpeechSynthesizer).Speak('${message.replace(/'/g, "''")}')`;
      if (device.authType === 'key') {
        command = `ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 ${device.username}@${device.host} "powershell -Command \\"${psCommand}\\""`; 
      } else {
        command = `sshpass -p '${device.password}' ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 ${device.username}@${device.host} "powershell -Command \\"${psCommand}\\""`; 
      }
    } else {
      return NextResponse.json({ error: 'Unsupported device type' }, { status: 400 });
    }

    try {
      await execAsync(command, { timeout: 30000 });
      return NextResponse.json({ success: true, message: 'Audio played successfully' });
    } catch (execError: any) {
      console.error('Audio playback error:', execError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to play audio',
        details: execError.message || execError.stderr 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error testing audio:', error);
    return NextResponse.json({ error: 'Failed to test audio' }, { status: 500 });
  }
}
