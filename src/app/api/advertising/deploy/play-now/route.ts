import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const DEVICES_FILE = path.join(process.cwd(), 'data', 'advertising-devices.json');
const LEGACY_DEVICES_FILE = path.join(process.cwd(), 'data', 'audio-devices.json');

interface PlayRequest {
  deviceId: string;
  mediaIds: string[];
  device?: {
    id: string;
    name: string;
    ipAddress?: string;
    sshUser?: string;
    sshEnabled?: boolean;
  };
  mediaItems?: Array<{
    id: string;
    name: string;
    storageUrl: string;
    storagePath?: string;
    durationSeconds: number;
  }>;
}

async function getLegacyDevice(ip: string) {
  try {
    const data = JSON.parse(await fs.readFile(LEGACY_DEVICES_FILE, 'utf-8'));
    return data.find((d: any) => d.host === ip);
  } catch {
    return null;
  }
}

async function getDevice(id: string) {
  try {
    const data = JSON.parse(await fs.readFile(DEVICES_FILE, 'utf-8'));
    return data.devices?.find((d: any) => d.id === id);
  } catch {
    return null;
  }
}

// Execute SSH command with proper escaping
async function sshExec(user: string, host: string, command: string): Promise<{ success: boolean; output?: string; error?: string }> {
  try {
    const sshCmd = `ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 ${user}@${host} ${JSON.stringify(command)}`;
    const { stdout, stderr } = await execAsync(sshCmd, { timeout: 30000 });
    return { success: true, output: stdout };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// Fire and forget SSH command (for background playback)
function sshExecBackground(user: string, host: string, command: string): void {
  const sshCmd = `ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 ${user}@${host} ${JSON.stringify(command)}`;
  exec(sshCmd, (error) => {
    if (error) {
      console.error(`[Play Now] Background command error:`, error.message);
    }
  });
}

export async function POST(req: NextRequest) {
  try {
    const body: PlayRequest = await req.json();
    const { deviceId, mediaIds, device, mediaItems } = body;

    if (!deviceId || !mediaIds?.length) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing deviceId or mediaIds' 
      }, { status: 400 });
    }

    const deviceInfo = device || await getDevice(deviceId);
    if (!deviceInfo) {
      return NextResponse.json({ 
        success: false, 
        error: 'Device not found' 
      }, { status: 404 });
    }

    const ipAddress = deviceInfo.ipAddress;
    if (!ipAddress) {
      return NextResponse.json({ 
        success: false, 
        error: 'Device has no IP address configured' 
      }, { status: 400 });
    }

    const legacyDevice = await getLegacyDevice(ipAddress);
    const sshUser = deviceInfo.sshUser || legacyDevice?.username;
    
    if (!sshUser) {
      return NextResponse.json({ 
        success: false, 
        error: 'No SSH credentials configured for device' 
      }, { status: 400 });
    }

    const firstMedia = mediaItems?.[0];
    if (!firstMedia) {
      return NextResponse.json({ 
        success: false, 
        error: 'No media files provided' 
      }, { status: 400 });
    }

    const isWindows = legacyDevice?.type === 'windows';
    const dashboardUrl = process.env.DASHBOARD_URL || 'http://100.74.135.39:3000';
    const audioUrl = `${dashboardUrl}${firstMedia.storageUrl}`;
    const duration = Math.ceil((firstMedia.durationSeconds || 30) + 5);

    console.log(`[Play Now] Triggering playback on ${deviceInfo.name} (${ipAddress})`);
    console.log(`[Play Now] Audio: ${firstMedia.name} (${duration}s)`);
    console.log(`[Play Now] URL: ${audioUrl}`);

    let success = false;
    let playbackResult = '';

    if (isWindows) {
      // Windows: Use permanent player script with scheduled task
      const musicDir = `C:\\Users\\${sshUser}\\Music`;
      const audioFile = `${musicDir}\\channelcast.mp3`;
      const playerScript = `${musicDir}\\player.ps1`;
      
      // 1. Ensure player script exists (create if not)
      console.log(`[Play Now] Step 1: Checking player script...`);
      const checkScript = await sshExec(sshUser, ipAddress, `if exist "${playerScript}" (echo exists) else (echo missing)`);
      if (checkScript.output?.includes('missing')) {
        console.log(`[Play Now] Creating player script...`);
        await sshExec(sshUser, ipAddress, `cmd /c "echo param([string]^$audioPath, [int]^$duration = 60) > ${playerScript}"`);
        await sshExec(sshUser, ipAddress, `cmd /c "echo ^$wmp = New-Object -ComObject WMPlayer.OCX >> ${playerScript}"`);
        await sshExec(sshUser, ipAddress, `cmd /c "echo ^$wmp.URL = ^$audioPath >> ${playerScript}"`);
        await sshExec(sshUser, ipAddress, `cmd /c "echo ^$wmp.settings.volume = 100 >> ${playerScript}"`);
        await sshExec(sshUser, ipAddress, `cmd /c "echo ^$wmp.controls.play() >> ${playerScript}"`);
        await sshExec(sshUser, ipAddress, `cmd /c "echo Start-Sleep ^$duration >> ${playerScript}"`);
      }
      
      // 2. Download the audio file
      console.log(`[Play Now] Step 2: Downloading audio file...`);
      const downloadCmd = `curl -s -o "${audioFile}" "${audioUrl}"`;
      const downloadResult = await sshExec(sshUser, ipAddress, downloadCmd);
      
      if (!downloadResult.success) {
        console.error(`[Play Now] Download failed:`, downloadResult.error);
        return NextResponse.json({ 
          success: false, 
          error: `Failed to download audio: ${downloadResult.error}` 
        });
      }
      console.log(`[Play Now] Download complete`);

      // 3. Create and run scheduled task
      console.log(`[Play Now] Step 3: Creating scheduled task...`);
      await sshExec(sshUser, ipAddress, `schtasks /delete /tn "ChannelCastPlay" /f 2>nul`);
      
      const taskCmd = `schtasks /create /tn "ChannelCastPlay" /tr "powershell -WindowStyle Hidden -ExecutionPolicy Bypass -File ${playerScript} -audioPath ${audioFile} -duration ${duration}" /sc once /st 00:00 /f /ru ${sshUser} /it`;
      const taskResult = await sshExec(sshUser, ipAddress, taskCmd);
      
      if (!taskResult.success) {
        console.error(`[Play Now] Task creation failed:`, taskResult.error);
        return NextResponse.json({ 
          success: false, 
          error: `Failed to create task: ${taskResult.error}` 
        });
      }
      console.log(`[Play Now] Task created`);

      // 4. Run the task
      console.log(`[Play Now] Step 4: Running scheduled task...`);
      const runTaskCmd = `schtasks /run /tn "ChannelCastPlay"`;
      const runResult = await sshExec(sshUser, ipAddress, runTaskCmd);
      
      if (!runResult.success) {
        console.error(`[Play Now] Task run failed:`, runResult.error);
        return NextResponse.json({ 
          success: false, 
          error: `Failed to run task: ${runResult.error}` 
        });
      }
      
      console.log(`[Play Now] Playback started on ${deviceInfo.name}`);
      success = true;
      playbackResult = `Playing "${firstMedia.name}" on ${deviceInfo.name}`;
      
    } else {
      // Linux: Use mpv or ffplay
      const playCmd = `mpv --no-video '${audioUrl}' 2>/dev/null || ffplay -nodisp -autoexit '${audioUrl}' 2>/dev/null &`;
      sshExecBackground(sshUser, ipAddress, playCmd);
      success = true;
      playbackResult = `Playing "${firstMedia.name}" on ${deviceInfo.name}`;
    }

    // Log the play event
    try {
      const logsFile = path.join(process.cwd(), 'data', 'playback-logs.json');
      let logs: any[] = [];
      try {
        logs = JSON.parse(await fs.readFile(logsFile, 'utf-8'));
        if (!Array.isArray(logs)) logs = [];
      } catch { logs = []; }
      
      logs.push({
        id: `play-${Date.now()}`,
        deviceId: deviceInfo.id,
        deviceName: deviceInfo.name,
        mediaId: firstMedia.id,
        mediaName: firstMedia.name,
        type: 'play_now',
        status: success ? 'playing' : 'failed',
        timestamp: new Date().toISOString(),
      });
      
      if (logs.length > 1000) logs = logs.slice(-1000);
      await fs.writeFile(logsFile, JSON.stringify(logs, null, 2));
    } catch (logErr) {
      console.error('Error saving playback log:', logErr);
    }

    return NextResponse.json({ 
      success,
      message: playbackResult,
      device: {
        id: deviceInfo.id,
        name: deviceInfo.name,
        ip: ipAddress,
      },
      media: {
        id: firstMedia.id,
        name: firstMedia.name,
        duration: firstMedia.durationSeconds,
      }
    });

  } catch (error: any) {
    console.error('[Play Now] Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Unknown error' 
    }, { status: 500 });
  }
}
