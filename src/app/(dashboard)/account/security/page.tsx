'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Shield,
  Key,
  Lock,
  Smartphone,
  Monitor,
  MapPin,
  Clock,
  AlertTriangle,
  Check,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  LogOut,
  Trash2,
  RefreshCw,
  Mail,
  QrCode,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Session {
  id: string;
  device: string;
  browser: string;
  location: string;
  ip: string;
  lastActive: string;
  isCurrent: boolean;
}

interface SecurityLog {
  id: string;
  action: string;
  ip: string;
  location: string;
  timestamp: string;
  success: boolean;
}

export default function SecurityPage() {
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Password change
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // 2FA
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showSetup2FA, setShowSetup2FA] = useState(false);
  
  // Sessions
  const [sessions] = useState<Session[]>([
    {
      id: '1',
      device: 'MacBook Pro',
      browser: 'Chrome 120',
      location: 'Phoenix, AZ',
      ip: '68.134.52.xxx',
      lastActive: 'Now',
      isCurrent: true,
    },
    {
      id: '2',
      device: 'iPhone 15 Pro',
      browser: 'Safari Mobile',
      location: 'Phoenix, AZ',
      ip: '68.134.52.xxx',
      lastActive: '2 hours ago',
      isCurrent: false,
    },
    {
      id: '3',
      device: 'Windows PC',
      browser: 'Firefox 121',
      location: 'Phoenix, AZ',
      ip: '68.134.52.xxx',
      lastActive: '3 days ago',
      isCurrent: false,
    },
  ]);
  
  // Security logs
  const [securityLogs] = useState<SecurityLog[]>([
    { id: '1', action: 'Login', ip: '68.134.52.xxx', location: 'Phoenix, AZ', timestamp: '2024-03-15 10:30:00', success: true },
    { id: '2', action: 'Password Changed', ip: '68.134.52.xxx', location: 'Phoenix, AZ', timestamp: '2024-03-10 14:22:00', success: true },
    { id: '3', action: 'Login Failed', ip: '192.168.1.xxx', location: 'Unknown', timestamp: '2024-03-08 03:45:00', success: false },
    { id: '4', action: 'Login', ip: '68.134.52.xxx', location: 'Phoenix, AZ', timestamp: '2024-03-07 09:15:00', success: true },
    { id: '5', action: '2FA Disabled', ip: '68.134.52.xxx', location: 'Phoenix, AZ', timestamp: '2024-03-01 16:00:00', success: true },
  ]);

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      setSaveMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    if (newPassword.length < 8) {
      setSaveMessage({ type: 'error', text: 'Password must be at least 8 characters' });
      return;
    }
    
    setSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaveMessage({ type: 'success', text: 'Password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setSaveMessage({ type: 'error', text: 'Failed to update password' });
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    // TODO: Implement session revocation
    console.log('Revoking session:', sessionId);
  };

  const handleRevokeAllSessions = async () => {
    // TODO: Implement revoking all sessions except current
    console.log('Revoking all other sessions');
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="w-6 h-6 text-brand" />
            Security
          </h1>
          <p className="text-muted-foreground">Manage your account security and active sessions</p>
        </div>
      </div>

      {/* Save Message */}
      {saveMessage && (
        <div className={cn(
          "mb-6 p-4 rounded-lg flex items-center gap-2",
          saveMessage.type === 'success' 
            ? "bg-green-500/10 border border-green-500/30 text-green-400"
            : "bg-red-500/10 border border-red-500/30 text-red-400"
        )}>
          {saveMessage.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {saveMessage.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Change Password */}
        <Card className="bg-card/50 border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Key className="w-5 h-5 text-muted-foreground" />
              Change Password
            </CardTitle>
            <CardDescription>Update your account password</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm text-muted-foreground">Current Password</Label>
              <div className="relative mt-1">
                <Input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="bg-secondary border-border pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">New Password</Label>
              <div className="relative mt-1">
                <Input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-secondary border-border pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Confirm New Password</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-secondary border-border mt-1"
              />
            </div>
            <Button
              onClick={handlePasswordChange}
              disabled={saving || !currentPassword || !newPassword || !confirmPassword}
              className="w-full bg-brand hover:bg-brand/90"
            >
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Key className="w-4 h-4 mr-2" />}
              Update Password
            </Button>
          </CardContent>
        </Card>

        {/* Two-Factor Authentication */}
        <Card className="bg-card/50 border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-muted-foreground" />
              Two-Factor Authentication
            </CardTitle>
            <CardDescription>Add an extra layer of security to your account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  twoFactorEnabled ? "bg-green-500/20" : "bg-yellow-500/20"
                )}>
                  <Lock className={cn(
                    "w-5 h-5",
                    twoFactorEnabled ? "text-green-500" : "text-yellow-500"
                  )} />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {twoFactorEnabled ? '2FA is enabled' : '2FA is disabled'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {twoFactorEnabled 
                      ? 'Your account is protected with 2FA'
                      : 'Enable 2FA for enhanced security'}
                  </p>
                </div>
              </div>
              <Badge variant={twoFactorEnabled ? 'default' : 'secondary'}>
                {twoFactorEnabled ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            {!twoFactorEnabled ? (
              <Button 
                onClick={() => setShowSetup2FA(true)}
                className="w-full bg-brand hover:bg-brand/90"
              >
                <QrCode className="w-4 h-4 mr-2" />
                Enable Two-Factor Authentication
              </Button>
            ) : (
              <div className="space-y-2">
                <Button variant="outline" className="w-full">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Regenerate Recovery Codes
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full text-red-500 hover:text-red-600 hover:border-red-500"
                  onClick={() => setTwoFactorEnabled(false)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Disable 2FA
                </Button>
              </div>
            )}

            {showSetup2FA && !twoFactorEnabled && (
              <div className="mt-4 p-4 bg-background rounded-lg border border-border">
                <h4 className="font-medium text-foreground mb-3">Setup Authenticator App</h4>
                <div className="flex justify-center mb-4">
                  <div className="w-40 h-40 bg-white rounded-lg flex items-center justify-center">
                    <QrCode className="w-32 h-32 text-gray-800" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground text-center mb-4">
                  Scan this QR code with your authenticator app
                </p>
                <div>
                  <Label className="text-sm text-muted-foreground">Enter Code from App</Label>
                  <Input
                    placeholder="000000"
                    maxLength={6}
                    className="bg-secondary border-border mt-1 text-center text-lg tracking-widest"
                  />
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" className="flex-1" onClick={() => setShowSetup2FA(false)}>
                    Cancel
                  </Button>
                  <Button 
                    className="flex-1 bg-brand hover:bg-brand/90"
                    onClick={() => {
                      setTwoFactorEnabled(true);
                      setShowSetup2FA(false);
                    }}
                  >
                    Verify & Enable
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Sessions */}
        <Card className="bg-card/50 border-border lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Monitor className="w-5 h-5 text-muted-foreground" />
                  Active Sessions
                </CardTitle>
                <CardDescription>Devices currently logged into your account</CardDescription>
              </div>
              <Button variant="outline" onClick={handleRevokeAllSessions}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out All Other Sessions
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sessions.map((session) => (
                <div 
                  key={session.id}
                  className="flex items-center justify-between p-4 bg-secondary rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center">
                      {session.device.includes('iPhone') || session.device.includes('Android') ? (
                        <Smartphone className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <Monitor className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">{session.device}</p>
                        {session.isCurrent && (
                          <Badge variant="outline" className="border-green-500 text-green-500">
                            Current
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {session.browser} • {session.location}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        IP: {session.ip} • Last active: {session.lastActive}
                      </p>
                    </div>
                  </div>
                  {!session.isCurrent && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleRevokeSession(session.id)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                    >
                      <LogOut className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Security Log */}
        <Card className="bg-card/50 border-border lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Clock className="w-5 h-5 text-muted-foreground" />
              Security Activity Log
            </CardTitle>
            <CardDescription>Recent security-related events on your account</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {securityLogs.map((log) => (
                <div 
                  key={log.id}
                  className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center",
                      log.success ? "bg-green-500/20" : "bg-red-500/20"
                    )}>
                      {log.success ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{log.action}</p>
                      <p className="text-xs text-muted-foreground">
                        {log.ip} • {log.location}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{log.timestamp}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Account Recovery */}
        <Card className="bg-card/50 border-border lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Mail className="w-5 h-5 text-muted-foreground" />
              Account Recovery
            </CardTitle>
            <CardDescription>Options to recover your account if you lose access</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-secondary rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-foreground">Recovery Email</p>
                  <Badge variant="outline" className="border-green-500 text-green-500">Verified</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">jw@channelcast.io</p>
                <Button variant="outline" size="sm">Change Email</Button>
              </div>
              <div className="p-4 bg-secondary rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-foreground">Recovery Phone</p>
                  <Badge variant="outline" className="border-yellow-500 text-yellow-500">Not Set</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">No phone number configured</p>
                <Button variant="outline" size="sm">Add Phone</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
