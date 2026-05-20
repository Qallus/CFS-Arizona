import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

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
  status: 'active' | 'inactive' | 'error';
  location?: string;
  createdAt: string;
  updatedAt?: string;
}

async function loadDevices(): Promise<AudioDevice[]> {
  try {
    const data = await fs.readFile(DEVICES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function saveDevices(devices: AudioDevice[]): Promise<void> {
  await fs.writeFile(DEVICES_FILE, JSON.stringify(devices, null, 2));
}

// GET - List all devices
export async function GET() {
  try {
    const devices = await loadDevices();
    // Don't return passwords in the list
    const safeDevices = devices.map(({ password, ...device }) => ({
      ...device,
      hasPassword: !!password,
    }));
    return NextResponse.json({ devices: safeDevices });
  } catch (error) {
    console.error('Error loading devices:', error);
    return NextResponse.json({ error: 'Failed to load devices' }, { status: 500 });
  }
}

// POST - Create new device
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, host, username, password, authType, audioOutput, location } = body;

    if (!name || !type || !host || !username) {
      return NextResponse.json({ error: 'Name, type, host, and username are required' }, { status: 400 });
    }

    const devices = await loadDevices();
    
    const newDevice: AudioDevice = {
      id: `device-${Date.now()}`,
      name,
      type,
      host,
      username,
      password: password || undefined,
      authType: authType || (password ? 'password' : 'key'),
      audioOutput: audioOutput || undefined,
      status: 'active',
      location: location || undefined,
      createdAt: new Date().toISOString(),
    };

    devices.push(newDevice);
    await saveDevices(devices);

    // Don't return password
    const { password: _, ...safeDevice } = newDevice;
    return NextResponse.json({ success: true, device: { ...safeDevice, hasPassword: !!newDevice.password } });
  } catch (error) {
    console.error('Error creating device:', error);
    return NextResponse.json({ error: 'Failed to create device' }, { status: 500 });
  }
}

// PUT - Update device
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Device ID required' }, { status: 400 });
    }

    const devices = await loadDevices();
    const index = devices.findIndex(d => d.id === id);

    if (index === -1) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }

    // If password is empty string, keep existing password
    if (updates.password === '') {
      delete updates.password;
    }

    devices[index] = {
      ...devices[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await saveDevices(devices);

    const { password, ...safeDevice } = devices[index];
    return NextResponse.json({ success: true, device: { ...safeDevice, hasPassword: !!password } });
  } catch (error) {
    console.error('Error updating device:', error);
    return NextResponse.json({ error: 'Failed to update device' }, { status: 500 });
  }
}

// DELETE - Remove device
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Device ID required' }, { status: 400 });
    }

    const devices = await loadDevices();
    const filtered = devices.filter(d => d.id !== id);

    if (filtered.length === devices.length) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }

    await saveDevices(filtered);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting device:', error);
    return NextResponse.json({ error: 'Failed to delete device' }, { status: 500 });
  }
}
