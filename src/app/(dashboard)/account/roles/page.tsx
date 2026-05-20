'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users,
  Shield,
  Plus,
  Search,
  Edit,
  Trash2,
  Check,
  AlertCircle,
  Loader2,
  Crown,
  UserCheck,
  Eye,
  Settings,
  Mail,
  MoreVertical,
  X,
  Save,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Role {
  id: string;
  name: string;
  description: string;
  color: string;
  permissions: string[];
  userCount: number;
  isSystem: boolean;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  status: 'active' | 'invited' | 'inactive';
  lastActive?: string;
}

const AVAILABLE_PERMISSIONS = [
  { key: 'contacts.view', label: 'View Contacts', category: 'Contacts' },
  { key: 'contacts.edit', label: 'Edit Contacts', category: 'Contacts' },
  { key: 'contacts.delete', label: 'Delete Contacts', category: 'Contacts' },
  { key: 'leads.view', label: 'View Leads', category: 'Leads' },
  { key: 'leads.edit', label: 'Edit Leads', category: 'Leads' },
  { key: 'leads.delete', label: 'Delete Leads', category: 'Leads' },
  { key: 'pipeline.view', label: 'View Pipeline', category: 'Pipeline' },
  { key: 'pipeline.edit', label: 'Edit Deals', category: 'Pipeline' },
  { key: 'projects.view', label: 'View Projects', category: 'Projects' },
  { key: 'projects.edit', label: 'Edit Projects', category: 'Projects' },
  { key: 'projects.delete', label: 'Delete Projects', category: 'Projects' },
  { key: 'billing.view', label: 'View Billing', category: 'Billing' },
  { key: 'billing.edit', label: 'Manage Billing', category: 'Billing' },
  { key: 'settings.view', label: 'View Settings', category: 'Settings' },
  { key: 'settings.edit', label: 'Edit Settings', category: 'Settings' },
  { key: 'team.view', label: 'View Team', category: 'Team' },
  { key: 'team.manage', label: 'Manage Team', category: 'Team' },
];

export default function RolesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showAddRole, setShowAddRole] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  
  const [roles, setRoles] = useState<Role[]>([
    {
      id: 'owner',
      name: 'Owner',
      description: 'Full access to all features and settings',
      color: 'orange',
      permissions: AVAILABLE_PERMISSIONS.map(p => p.key),
      userCount: 1,
      isSystem: true,
    },
    {
      id: 'admin',
      name: 'Admin',
      description: 'Can manage team and most settings',
      color: 'blue',
      permissions: AVAILABLE_PERMISSIONS.filter(p => p.key !== 'settings.edit' && p.key !== 'team.manage').map(p => p.key),
      userCount: 0,
      isSystem: true,
    },
    {
      id: 'member',
      name: 'Member',
      description: 'Can view and edit assigned items',
      color: 'green',
      permissions: AVAILABLE_PERMISSIONS.filter(p => p.key.includes('view') || p.key.includes('edit')).map(p => p.key),
      userCount: 2,
      isSystem: true,
    },
    {
      id: 'viewer',
      name: 'Viewer',
      description: 'Read-only access',
      color: 'gray',
      permissions: AVAILABLE_PERMISSIONS.filter(p => p.key.includes('view')).map(p => p.key),
      userCount: 1,
      isSystem: true,
    },
  ]);

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    {
      id: '1',
      name: 'Jeremy Waters',
      email: 'jw@channelcast.io',
      role: 'owner',
      status: 'active',
      lastActive: 'Now',
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      email: 'sarah@channelcast.io',
      role: 'member',
      status: 'active',
      lastActive: '2 hours ago',
    },
    {
      id: '3',
      name: 'Mike Chen',
      email: 'mike@channelcast.io',
      role: 'member',
      status: 'invited',
    },
    {
      id: '4',
      name: 'Emma Davis',
      email: 'emma@channelcast.io',
      role: 'viewer',
      status: 'active',
      lastActive: '1 day ago',
    },
  ]);

  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    color: 'blue',
    permissions: [] as string[],
  });

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');

  const filteredMembers = teamMembers.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadgeColor = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (!role) return 'secondary';
    switch (role.color) {
      case 'orange': return 'border-brand text-brand';
      case 'blue': return 'border-blue-500 text-blue-500';
      case 'green': return 'border-green-500 text-green-500';
      case 'gray': return 'border-gray-500 text-gray-500';
      default: return 'secondary';
    }
  };

  const handleSaveRole = async () => {
    setSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (editingRole) {
        setRoles(prev => prev.map(r => r.id === editingRole.id ? { ...editingRole, ...newRole, id: editingRole.id } : r));
      } else {
        const role: Role = {
          id: newRole.name.toLowerCase().replace(/\s+/g, '-'),
          ...newRole,
          userCount: 0,
          isSystem: false,
        };
        setRoles(prev => [...prev, role]);
      }
      setSaveMessage({ type: 'success', text: editingRole ? 'Role updated!' : 'Role created!' });
      setShowAddRole(false);
      setEditingRole(null);
      setNewRole({ name: '', description: '', color: 'blue', permissions: [] });
    } catch (error) {
      setSaveMessage({ type: 'error', text: 'Failed to save role' });
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const handleInvite = async () => {
    setSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const newMember: TeamMember = {
        id: Date.now().toString(),
        name: inviteEmail.split('@')[0],
        email: inviteEmail,
        role: inviteRole,
        status: 'invited',
      };
      setTeamMembers(prev => [...prev, newMember]);
      setSaveMessage({ type: 'success', text: `Invitation sent to ${inviteEmail}` });
      setShowInvite(false);
      setInviteEmail('');
      setInviteRole('member');
    } catch (error) {
      setSaveMessage({ type: 'error', text: 'Failed to send invitation' });
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const togglePermission = (permKey: string) => {
    setNewRole(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permKey)
        ? prev.permissions.filter(p => p !== permKey)
        : [...prev.permissions, permKey],
    }));
  };

  const groupedPermissions = AVAILABLE_PERMISSIONS.reduce((acc, perm) => {
    if (!acc[perm.category]) acc[perm.category] = [];
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, typeof AVAILABLE_PERMISSIONS>);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-6 h-6 text-brand" />
            Roles & Permissions
          </h1>
          <p className="text-muted-foreground">Manage team access and permissions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowAddRole(true)}>
            <Shield className="w-4 h-4 mr-2" />
            New Role
          </Button>
          <Button className="bg-brand hover:bg-brand/90" onClick={() => setShowInvite(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Invite Member
          </Button>
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

      {/* Roles Section */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-foreground mb-4">Roles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {roles.map((role) => (
            <Card key={role.id} className="bg-card/50 border-border">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center",
                      role.color === 'orange' && "bg-brand/20",
                      role.color === 'blue' && "bg-blue-500/20",
                      role.color === 'green' && "bg-green-500/20",
                      role.color === 'gray' && "bg-gray-500/20",
                    )}>
                      {role.id === 'owner' ? (
                        <Crown className={cn("w-4 h-4", `text-${role.color}-500`)} />
                      ) : (
                        <Shield className={cn("w-4 h-4", `text-${role.color}-500`)} />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{role.name}</p>
                      <p className="text-xs text-muted-foreground">{role.userCount} users</p>
                    </div>
                  </div>
                  {!role.isSystem && (
                    <button
                      onClick={() => {
                        setEditingRole(role);
                        setNewRole({
                          name: role.name,
                          description: role.description,
                          color: role.color,
                          permissions: role.permissions,
                        });
                        setShowAddRole(true);
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{role.description}</p>
                <div className="mt-3 flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-xs">
                    {role.permissions.length} permissions
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Team Members Section */}
      <Card className="bg-card/50 border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-foreground">Team Members</CardTitle>
              <CardDescription>Manage your team and their access levels</CardDescription>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search members..."
                className="pl-9 bg-secondary border-border w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredMembers.map((member) => (
              <div 
                key={member.id}
                className="flex items-center justify-between p-4 bg-secondary rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback className="bg-brand/20 text-brand">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">{member.name}</p>
                      {member.status === 'invited' && (
                        <Badge variant="outline" className="border-yellow-500 text-yellow-500 text-xs">
                          Pending
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                    {member.lastActive && (
                      <p className="text-xs text-muted-foreground">Last active: {member.lastActive}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className={getRoleBadgeColor(member.role)}>
                    {roles.find(r => r.id === member.role)?.name || member.role}
                  </Badge>
                  <select
                    value={member.role}
                    onChange={(e) => {
                      setTeamMembers(prev => prev.map(m => 
                        m.id === member.id ? { ...m, role: e.target.value } : m
                      ));
                    }}
                    disabled={member.role === 'owner'}
                    className="h-8 px-2 bg-background border border-border rounded-md text-sm text-foreground disabled:opacity-50"
                  >
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                  {member.role !== 'owner' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Role Modal */}
      {showAddRole && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-foreground">
                  {editingRole ? 'Edit Role' : 'Create New Role'}
                </CardTitle>
                <button onClick={() => { setShowAddRole(false); setEditingRole(null); }}>
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Role Name</Label>
                  <Input
                    value={newRole.name}
                    onChange={(e) => setNewRole(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Sales Manager"
                    className="bg-secondary border-border mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Color</Label>
                  <div className="flex gap-2 mt-2">
                    {['orange', 'blue', 'green', 'gray', 'purple', 'red'].map((color) => (
                      <button
                        key={color}
                        onClick={() => setNewRole(prev => ({ ...prev, color }))}
                        className={cn(
                          "w-8 h-8 rounded-full border-2 transition-all",
                          newRole.color === color ? "scale-110 border-white" : "border-transparent",
                          color === 'orange' && "bg-brand",
                          color === 'blue' && "bg-blue-500",
                          color === 'green' && "bg-green-500",
                          color === 'gray' && "bg-gray-500",
                          color === 'purple' && "bg-purple-500",
                          color === 'red' && "bg-red-500",
                        )}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Description</Label>
                <Input
                  value={newRole.description}
                  onChange={(e) => setNewRole(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of this role"
                  className="bg-secondary border-border mt-1"
                />
              </div>
              
              <div>
                <Label className="text-sm text-muted-foreground mb-3 block">Permissions</Label>
                <div className="space-y-4">
                  {Object.entries(groupedPermissions).map(([category, perms]) => (
                    <div key={category} className="p-4 bg-secondary rounded-lg">
                      <p className="font-medium text-foreground mb-3">{category}</p>
                      <div className="grid grid-cols-2 gap-3">
                        {perms.map((perm) => (
                          <label 
                            key={perm.key}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={newRole.permissions.includes(perm.key)}
                              onChange={() => togglePermission(perm.key)}
                              className="rounded"
                            />
                            <span className="text-sm text-foreground">{perm.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <Button variant="outline" onClick={() => { setShowAddRole(false); setEditingRole(null); }}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveRole}
                  disabled={saving || !newRole.name}
                  className="bg-brand hover:bg-brand/90"
                >
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  {editingRole ? 'Update Role' : 'Create Role'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-card border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-foreground">Invite Team Member</CardTitle>
                <button onClick={() => setShowInvite(false)}>
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              <CardDescription>Send an invitation to join your team</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm text-muted-foreground">Email Address</Label>
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  className="bg-secondary border-border mt-1"
                />
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Role</Label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full h-10 px-3 mt-1 bg-secondary border border-border rounded-md text-foreground"
                >
                  {roles.filter(r => r.id !== 'owner').map(role => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowInvite(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleInvite}
                  disabled={saving || !inviteEmail}
                  className="bg-brand hover:bg-brand/90"
                >
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
                  Send Invitation
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
