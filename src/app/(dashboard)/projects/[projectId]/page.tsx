'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Plus, 
  Clock, 
  Users, 
  Calendar,
  Edit,
  Trash2,
  MoreHorizontal,
  CheckCircle2,
  Circle,
  MessageSquare,
  Mail,
  Phone,
  Bell,
  ChevronRight,
  GripVertical,
  Share2,
  Eye,
  ExternalLink,
  Copy,
  FileText,
  FolderOpen,
  File,
  FileCheck,
  Clipboard,
  RefreshCw,
  X,
  Image,
  Upload,
  DollarSign,
  Building,
  User,
  UserPlus,
  Link2,
  Hash,
  Save,
  Camera,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'high' | 'medium' | 'low';
  assignedTo: string[];
  dueDate: string | null;
  completedAt: string | null;
  order: number;
  createdAt: string;
}

interface Notification {
  id: string;
  type: 'sms' | 'email' | 'call';
  recipient: string;
  recipientName: string;
  subject: string;
  message: string;
  status: 'pending' | 'sent' | 'failed';
  sentAt: string | null;
  createdAt: string;
}

interface ActivityLog {
  id: string;
  type: string;
  message: string;
  userName: string;
  createdAt: string;
}

interface Document {
  id: string;
  name: string;
  type: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface Photo {
  id: string;
  url: string;
  name: string;
  caption?: string;
  uploadedAt: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  priority: string;
  startDate: string | null;
  endDate: string | null;
  dueDate: string | null;
  progress: number;
  budget?: number;
  spent?: number;
  hourlyRate?: number;
  hoursEstimated?: number;
  hoursLogged?: number;
  leadIds: string[];
  contactIds: (string | number)[];
  team: any[];
  tasks: Task[];
  activityLog: ActivityLog[];
  notifications: Notification[];
  photos?: Photo[];
  tags: string[];
  color: string;
  notes?: string;
  clientAccessEnabled?: boolean;
  clientAccessToken?: string;
}

const STATUS_COLUMNS = [
  { key: 'todo', label: 'To Do', color: 'bg-gray-500' },
  { key: 'in_progress', label: 'In Progress', color: 'bg-blue-500' },
  { key: 'review', label: 'Review', color: 'bg-yellow-500' },
  { key: 'done', label: 'Done', color: 'bg-green-500' },
];

const PRIORITY_COLORS = {
  high: 'bg-red-500/20 text-red-500',
  medium: 'bg-yellow-500/20 text-yellow-500',
  low: 'bg-green-500/20 text-green-500',
};

const DOC_TABS = [
  { key: 'contract', label: 'Contracts', icon: FileCheck },
  { key: 'sow', label: 'SOW', icon: Clipboard },
  { key: 'outline', label: 'Outlines', icon: FileText },
  { key: 'doc', label: 'Docs', icon: File },
  { key: 'note', label: 'Notes', icon: FolderOpen },
];

const TAB_LIST = [
  { key: 'overview', label: 'Overview' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'people', label: 'People' },
  { key: 'photos', label: 'Photos' },
  { key: 'documents', label: 'Documents' },
  { key: 'activity', label: 'Activity' },
  { key: 'notifications', label: 'Notifications' },
];

export default function ProjectDetailPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState<'contact' | 'lead' | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [docType, setDocType] = useState('contract');
  const [portalStatus, setPortalStatus] = useState<{ enabled: boolean; token: string | null; url: string | null } | null>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [editedProject, setEditedProject] = useState<Partial<Project>>({});

  useEffect(() => {
    fetchProject();
    fetchPortalStatus();
    fetchContacts();
    fetchLeads();
  }, [projectId]);

  useEffect(() => {
    if (activeTab === 'documents') {
      fetchDocuments();
    }
  }, [activeTab, docType]);

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      const data = await res.json();
      setProject(data.project || null);
      setEditedProject(data.project || {});
    } catch (error) {
      console.error('Error fetching project:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPortalStatus = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/portal`);
      const data = await res.json();
      setPortalStatus(data);
    } catch (error) {
      console.error('Error fetching portal status:', error);
    }
  };

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`/api/documents?projectId=${projectId}&type=${docType}`);
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const fetchContacts = async () => {
    try {
      const res = await fetch('/api/contacts?per_page=100');
      const data = await res.json();
      setContacts(data.contacts || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  };

  const fetchLeads = async () => {
    try {
      const res = await fetch('/api/leads');
      const data = await res.json();
      setLeads(data.leads || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
    }
  };

  const handleSaveProject = async () => {
    setSaving(true);
    try {
      await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedProject),
      });
      setProject({ ...project, ...editedProject } as Project);
      setEditMode(false);
    } catch (error) {
      console.error('Error saving project:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleLinkItem = async (type: 'contact' | 'lead', itemId: string | number) => {
    try {
      const field = type === 'contact' ? 'contactIds' : 'leadIds';
      const currentIds = project?.[field] || [];
      if (!currentIds.includes(itemId)) {
        const newIds = [...currentIds, itemId];
        await fetch(`/api/projects/${projectId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [field]: newIds }),
        });
        fetchProject();
      }
      setShowLinkModal(null);
    } catch (error) {
      console.error('Error linking item:', error);
    }
  };

  const handleUnlinkItem = async (type: 'contact' | 'lead', itemId: string | number) => {
    try {
      const field = type === 'contact' ? 'contactIds' : 'leadIds';
      const currentIds = project?.[field] || [];
      const newIds = currentIds.filter(id => id !== itemId);
      await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: newIds }),
      });
      fetchProject();
    } catch (error) {
      console.error('Error unlinking item:', error);
    }
  };

  const handlePhotoUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectId', projectId);
    
    try {
      const res = await fetch(`/api/projects/${projectId}/photos`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        fetchProject();
        setShowPhotoModal(false);
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('Delete this photo?')) return;
    try {
      await fetch(`/api/projects/${projectId}/photos?photoId=${photoId}`, { method: 'DELETE' });
      fetchProject();
    } catch (error) {
      console.error('Error deleting photo:', error);
    }
  };

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    if (!draggedTask || !project || draggedTask.status === newStatus) {
      setDraggedTask(null);
      return;
    }

    try {
      await fetch(`/api/projects/${projectId}/tasks`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: draggedTask.id, status: newStatus }),
      });
      fetchProject();
    } catch (error) {
      console.error('Error updating task:', error);
    }
    setDraggedTask(null);
  };

  const handleCreateTask = async (taskData: Partial<Task>) => {
    try {
      await fetch(`/api/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      });
      setShowTaskModal(false);
      fetchProject();
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
      await fetch(`/api/projects/${projectId}/tasks?taskId=${taskId}`, { method: 'DELETE' });
      fetchProject();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleSendNotification = async (data: { type: string; recipient: string; recipientName: string; message: string; subject?: string }) => {
    try {
      await fetch(`/api/projects/${projectId}/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      setShowNotificationModal(false);
      fetchProject();
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  const handlePortalAction = async (action: 'enable' | 'disable' | 'regenerate') => {
    try {
      const res = await fetch(`/api/projects/${projectId}/portal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      setPortalStatus(data);
    } catch (error) {
      console.error('Error updating portal:', error);
    }
  };

  const copyPortalLink = () => {
    if (portalStatus?.url) {
      navigator.clipboard.writeText(portalStatus.url);
      alert('Link copied to clipboard!');
    }
  };

  const handleCreateDocument = async (docData: any) => {
    try {
      await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...docData, projectId }),
      });
      setShowDocumentModal(false);
      fetchDocuments();
    } catch (error) {
      console.error('Error creating document:', error);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await fetch(`/api/documents?id=${docId}`, { method: 'DELETE' });
      fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  // Get linked contacts and leads
  const linkedContacts = contacts.filter(c => project?.contactIds?.includes(c.id));
  const linkedLeads = leads.filter(l => project?.leadIds?.includes(l.id));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-muted-foreground mb-4">Project not found</p>
        <Link href="/projects" className="text-brand hover:underline">
          Back to Projects
        </Link>
      </div>
    );
  }

  const getColumnTasks = (status: string) => 
    project.tasks.filter(t => t.status === status).sort((a, b) => a.order - b.order);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Link 
              href="/projects"
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: project.color }} 
              />
              <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-2 px-3 py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
            {portalStatus?.enabled && portalStatus?.url && (
              <a
                href={portalStatus.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Eye className="w-4 h-4" />
                Preview
              </a>
            )}
          </div>
        </div>

        {/* Project Stats Bar */}
        <div className="flex items-center gap-6 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {project.dueDate ? `Due ${new Date(project.dueDate).toLocaleDateString()}` : 'No due date'}
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {project.progress}% complete
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            {linkedContacts.length + linkedLeads.length} people
          </div>
          {project.budget && (
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              ${project.budget.toLocaleString()} budget
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 flex-wrap">
          {TAB_LIST.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                activeTab === tab.key
                  ? 'bg-brand text-brand-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6 max-w-4xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Project Details</h2>
              {!editMode ? (
                <button
                  onClick={() => setEditMode(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-secondary text-foreground rounded-lg text-sm hover:bg-secondary/80"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => { setEditMode(false); setEditedProject(project); }}
                    className="px-3 py-1.5 text-muted-foreground hover:text-foreground text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProject}
                    disabled={saving}
                    className="flex items-center gap-2 px-3 py-1.5 bg-brand text-brand-foreground rounded-lg text-sm hover:bg-brand/90 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="bg-card border border-border rounded-lg p-4">
              <label className="block text-sm font-medium text-muted-foreground mb-2">Description</label>
              {editMode ? (
                <textarea
                  value={editedProject.description || ''}
                  onChange={(e) => setEditedProject({ ...editedProject, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand resize-none"
                />
              ) : (
                <p className="text-foreground whitespace-pre-wrap">{project.description || 'No description'}</p>
              )}
            </div>

            {/* Numbers Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-card border border-border rounded-lg p-4">
                <label className="block text-sm font-medium text-muted-foreground mb-1">Budget</label>
                {editMode ? (
                  <input
                    type="number"
                    value={editedProject.budget || ''}
                    onChange={(e) => setEditedProject({ ...editedProject, budget: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                    placeholder="0"
                  />
                ) : (
                  <p className="text-xl font-bold text-foreground">${(project.budget || 0).toLocaleString()}</p>
                )}
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <label className="block text-sm font-medium text-muted-foreground mb-1">Spent</label>
                {editMode ? (
                  <input
                    type="number"
                    value={editedProject.spent || ''}
                    onChange={(e) => setEditedProject({ ...editedProject, spent: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                    placeholder="0"
                  />
                ) : (
                  <p className="text-xl font-bold text-foreground">${(project.spent || 0).toLocaleString()}</p>
                )}
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <label className="block text-sm font-medium text-muted-foreground mb-1">Hourly Rate</label>
                {editMode ? (
                  <input
                    type="number"
                    value={editedProject.hourlyRate || ''}
                    onChange={(e) => setEditedProject({ ...editedProject, hourlyRate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                    placeholder="0"
                  />
                ) : (
                  <p className="text-xl font-bold text-foreground">${(project.hourlyRate || 0)}/hr</p>
                )}
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <label className="block text-sm font-medium text-muted-foreground mb-1">Hours Logged</label>
                {editMode ? (
                  <input
                    type="number"
                    value={editedProject.hoursLogged || ''}
                    onChange={(e) => setEditedProject({ ...editedProject, hoursLogged: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                    placeholder="0"
                  />
                ) : (
                  <p className="text-xl font-bold text-foreground">{project.hoursLogged || 0} hrs</p>
                )}
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-card border border-border rounded-lg p-4">
                <label className="block text-sm font-medium text-muted-foreground mb-1">Start Date</label>
                {editMode ? (
                  <input
                    type="date"
                    value={editedProject.startDate || ''}
                    onChange={(e) => setEditedProject({ ...editedProject, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                ) : (
                  <p className="text-foreground">{project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Not set'}</p>
                )}
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <label className="block text-sm font-medium text-muted-foreground mb-1">End Date</label>
                {editMode ? (
                  <input
                    type="date"
                    value={editedProject.endDate || ''}
                    onChange={(e) => setEditedProject({ ...editedProject, endDate: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                ) : (
                  <p className="text-foreground">{project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Not set'}</p>
                )}
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <label className="block text-sm font-medium text-muted-foreground mb-1">Due Date</label>
                {editMode ? (
                  <input
                    type="date"
                    value={editedProject.dueDate || ''}
                    onChange={(e) => setEditedProject({ ...editedProject, dueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                ) : (
                  <p className="text-foreground">{project.dueDate ? new Date(project.dueDate).toLocaleDateString() : 'Not set'}</p>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="bg-card border border-border rounded-lg p-4">
              <label className="block text-sm font-medium text-muted-foreground mb-2">Internal Notes</label>
              {editMode ? (
                <textarea
                  value={editedProject.notes || ''}
                  onChange={(e) => setEditedProject({ ...editedProject, notes: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand resize-none"
                  placeholder="Add private notes about this project..."
                />
              ) : (
                <p className="text-foreground whitespace-pre-wrap">{project.notes || 'No notes'}</p>
              )}
            </div>
          </div>
        )}

        {/* People Tab */}
        {activeTab === 'people' && (
          <div className="space-y-6">
            {/* Linked Contacts */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Contacts</h2>
                <button
                  onClick={() => setShowLinkModal('contact')}
                  className="flex items-center gap-2 px-3 py-1.5 bg-brand text-brand-foreground rounded-lg text-sm hover:bg-brand/90"
                >
                  <UserPlus className="w-4 h-4" />
                  Link Contact
                </button>
              </div>
              {linkedContacts.length === 0 ? (
                <p className="text-muted-foreground text-sm">No contacts linked to this project</p>
              ) : (
                <div className="grid gap-3">
                  {linkedContacts.map((contact) => (
                    <div key={contact.id} className="flex items-center justify-between p-4 bg-card border border-border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{contact.first_name} {contact.last_name}</p>
                          <p className="text-sm text-muted-foreground">{contact.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {contact.phone && (
                          <a href={`tel:${contact.phone}`} className="p-2 hover:bg-secondary rounded-lg">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                          </a>
                        )}
                        {contact.email && (
                          <a href={`mailto:${contact.email}`} className="p-2 hover:bg-secondary rounded-lg">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                          </a>
                        )}
                        <button
                          onClick={() => handleUnlinkItem('contact', contact.id)}
                          className="p-2 hover:bg-secondary rounded-lg text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Linked Leads */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Leads</h2>
                <button
                  onClick={() => setShowLinkModal('lead')}
                  className="flex items-center gap-2 px-3 py-1.5 bg-brand text-brand-foreground rounded-lg text-sm hover:bg-brand/90"
                >
                  <UserPlus className="w-4 h-4" />
                  Link Lead
                </button>
              </div>
              {linkedLeads.length === 0 ? (
                <p className="text-muted-foreground text-sm">No leads linked to this project</p>
              ) : (
                <div className="grid gap-3">
                  {linkedLeads.map((lead) => (
                    <div key={lead.id} className="flex items-center justify-between p-4 bg-card border border-border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                          <Building className="w-5 h-5 text-green-500" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{lead.name}</p>
                          <p className="text-sm text-muted-foreground">{lead.company || lead.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link href="/leads" className="p-2 hover:bg-secondary rounded-lg">
                          <ExternalLink className="w-4 h-4 text-muted-foreground" />
                        </Link>
                        <button
                          onClick={() => handleUnlinkItem('lead', lead.id)}
                          className="p-2 hover:bg-secondary rounded-lg text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Team Members */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Team</h2>
                <button className="flex items-center gap-2 px-3 py-1.5 bg-secondary text-foreground rounded-lg text-sm hover:bg-secondary/80">
                  <Plus className="w-4 h-4" />
                  Add Team Member
                </button>
              </div>
              {project.team.length === 0 ? (
                <p className="text-muted-foreground text-sm">No team members assigned</p>
              ) : (
                <div className="grid gap-3">
                  {project.team.map((member, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-card border border-border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                          <User className="w-5 h-5 text-purple-500" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{member.name || member}</p>
                          <p className="text-sm text-muted-foreground">{member.role || 'Team Member'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Photos Tab */}
        {activeTab === 'photos' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Photos</h2>
              <button
                onClick={() => setShowPhotoModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-brand text-brand-foreground rounded-lg text-sm hover:bg-brand/90"
              >
                <Upload className="w-4 h-4" />
                Upload Photo
              </button>
            </div>

            {(!project.photos || project.photos.length === 0) ? (
              <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-border rounded-lg">
                <Camera className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No photos yet</p>
                <button
                  onClick={() => setShowPhotoModal(true)}
                  className="mt-4 text-brand hover:text-brand/90"
                >
                  Upload your first photo
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {project.photos.map((photo) => (
                  <div key={photo.id} className="relative group aspect-square rounded-lg overflow-hidden bg-secondary">
                    <img
                      src={photo.url}
                      alt={photo.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <a
                        href={photo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-white/20 rounded-lg hover:bg-white/30"
                      >
                        <Eye className="w-5 h-5 text-white" />
                      </a>
                      <button
                        onClick={() => handleDeletePhoto(photo.id)}
                        className="p-2 bg-white/20 rounded-lg hover:bg-red-500/50"
                      >
                        <Trash2 className="w-5 h-5 text-white" />
                      </button>
                    </div>
                    {photo.caption && (
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/50">
                        <p className="text-xs text-white truncate">{photo.caption}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Tasks</h2>
              <button
                onClick={() => { setEditingTask(null); setShowTaskModal(true); }}
                className="flex items-center gap-2 px-3 py-1.5 bg-brand text-brand-foreground rounded-lg text-sm hover:bg-brand/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Task
              </button>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4">
              {STATUS_COLUMNS.map((column) => (
                <div
                  key={column.key}
                  className="flex-shrink-0 w-72 flex flex-col bg-card/50 rounded-xl border border-border"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, column.key)}
                >
                  <div className="flex items-center justify-between p-3 border-b border-border">
                    <div className="flex items-center gap-2">
                      <div className={cn('w-2 h-2 rounded-full', column.color)} />
                      <h3 className="font-medium text-sm text-foreground">{column.label}</h3>
                      <span className="px-1.5 py-0.5 bg-secondary rounded text-xs">
                        {getColumnTasks(column.key).length}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 p-2 space-y-2 min-h-[200px]">
                    {getColumnTasks(column.key).map((task) => (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task)}
                        className={cn(
                          'p-3 bg-card rounded-lg border border-border cursor-grab active:cursor-grabbing',
                          draggedTask?.id === task.id && 'opacity-50'
                        )}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <p className="font-medium text-sm text-foreground">{task.title}</p>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-red-500"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        {task.description && (
                          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <span className={cn('px-1.5 py-0.5 rounded text-xs', PRIORITY_COLORS[task.priority])}>
                            {task.priority}
                          </span>
                          {task.dueDate && (
                            <span className="text-xs text-muted-foreground">
                              {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Documents</h2>
              <button
                onClick={() => setShowDocumentModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-brand text-brand-foreground rounded-lg text-sm hover:bg-brand/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Document
              </button>
            </div>

            <div className="flex gap-2 flex-wrap">
              {DOC_TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setDocType(tab.key)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors',
                      docType === tab.key
                        ? 'bg-brand/20 text-brand border border-brand/50'
                        : 'bg-secondary text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {documents.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No {DOC_TABS.find(t => t.key === docType)?.label.toLowerCase()} yet</p>
                <button
                  onClick={() => setShowDocumentModal(true)}
                  className="mt-4 text-brand hover:text-brand/90"
                >
                  Create your first document
                </button>
              </div>
            ) : (
              <div className="grid gap-3">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 bg-card rounded-lg border border-border hover:border-brand/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <Link href={`/documents/${doc.id}`} className="font-medium text-foreground hover:text-brand">
                          {doc.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {doc.status} • {new Date(doc.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/documents/${doc.id}`}
                        className="p-2 hover:bg-secondary rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4 text-muted-foreground" />
                      </Link>
                      <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="p-2 hover:bg-secondary rounded-lg transition-colors text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Activity Log</h2>
            <div className="space-y-3">
              {project.activityLog.length === 0 ? (
                <p className="text-muted-foreground">No activity yet</p>
              ) : (
                project.activityLog.slice().reverse().map((log) => (
                  <div key={log.id} className="flex items-start gap-3 p-3 bg-card rounded-lg border border-border">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-foreground">{log.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {log.userName} • {new Date(log.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Notifications</h2>
              <button
                onClick={() => setShowNotificationModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-brand text-brand-foreground rounded-lg text-sm hover:bg-brand/90 transition-colors"
              >
                <Bell className="w-4 h-4" />
                Send Notification
              </button>
            </div>
            <div className="space-y-3">
              {project.notifications.length === 0 ? (
                <p className="text-muted-foreground">No notifications sent yet</p>
              ) : (
                project.notifications.slice().reverse().map((notif) => (
                  <div key={notif.id} className="flex items-start gap-3 p-3 bg-card rounded-lg border border-border">
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center',
                      notif.type === 'sms' ? 'bg-blue-500/20' : notif.type === 'email' ? 'bg-green-500/20' : 'bg-purple-500/20'
                    )}>
                      {notif.type === 'sms' ? <MessageSquare className="w-4 h-4 text-blue-500" /> :
                       notif.type === 'email' ? <Mail className="w-4 h-4 text-green-500" /> :
                       <Phone className="w-4 h-4 text-purple-500" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">{notif.recipientName}</p>
                        <span className={cn(
                          'px-1.5 py-0.5 rounded text-xs',
                          notif.status === 'sent' ? 'bg-green-500/20 text-green-500' :
                          notif.status === 'failed' ? 'bg-red-500/20 text-red-500' :
                          'bg-yellow-500/20 text-yellow-500'
                        )}>
                          {notif.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{notif.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(notif.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showTaskModal && (
        <TaskModal onSave={handleCreateTask} onClose={() => setShowTaskModal(false)} />
      )}

      {showNotificationModal && (
        <NotificationModal onSend={handleSendNotification} onClose={() => setShowNotificationModal(false)} />
      )}

      {showShareModal && (
        <ShareModal portalStatus={portalStatus} onAction={handlePortalAction} onCopy={copyPortalLink} onClose={() => setShowShareModal(false)} />
      )}

      {showDocumentModal && (
        <DocumentModal type={docType} onSave={handleCreateDocument} onClose={() => setShowDocumentModal(false)} />
      )}

      {showLinkModal && (
        <LinkModal
          type={showLinkModal}
          items={showLinkModal === 'contact' ? contacts : leads}
          linkedIds={showLinkModal === 'contact' ? project.contactIds : project.leadIds}
          onLink={(id) => handleLinkItem(showLinkModal, id)}
          onClose={() => setShowLinkModal(null)}
        />
      )}

      {showPhotoModal && (
        <PhotoUploadModal onUpload={handlePhotoUpload} onClose={() => setShowPhotoModal(false)} />
      )}
    </div>
  );
}

// Task Modal Component
function TaskModal({ onSave, onClose }: { onSave: (data: any) => void; onClose: () => void }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    dueDate: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl border border-border w-full max-w-md">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold">Add Task</h2>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Due Date</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-muted-foreground hover:text-foreground">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-brand text-brand-foreground rounded-lg hover:bg-brand/90">Add Task</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Notification Modal Component
function NotificationModal({ onSend, onClose }: { onSend: (data: any) => void; onClose: () => void }) {
  const [formData, setFormData] = useState({
    type: 'sms',
    recipient: '',
    recipientName: '',
    subject: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSend(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl border border-border w-full max-w-md">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold">Send Notification</h2>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
            >
              <option value="sms">SMS</option>
              <option value="email">Email</option>
              <option value="call">Call</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Recipient Name *</label>
            <input
              type="text"
              value={formData.recipientName}
              onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              {formData.type === 'email' ? 'Email Address' : 'Phone Number'} *
            </label>
            <input
              type={formData.type === 'email' ? 'email' : 'tel'}
              value={formData.recipient}
              onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
              required
            />
          </div>
          {formData.type === 'email' && (
            <div>
              <label className="block text-sm font-medium mb-1">Subject</label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Message *</label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand resize-none"
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-muted-foreground hover:text-foreground">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-brand text-brand-foreground rounded-lg hover:bg-brand/90">Send</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Share Modal Component
function ShareModal({ portalStatus, onAction, onCopy, onClose }: { portalStatus: any; onAction: (action: 'enable' | 'disable' | 'regenerate') => void; onCopy: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl border border-border w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Share with Client</h2>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            Create a shareable link so your client can view project progress, tasks, and activity in real-time.
          </p>
          
          {portalStatus?.enabled ? (
            <>
              <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <div className="flex items-center gap-2 text-green-500 mb-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="font-medium">Client access enabled</span>
                </div>
                <div className="flex items-center gap-2">
                  <input type="text" value={portalStatus.url || ''} readOnly className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
                  <button onClick={onCopy} className="p-2 bg-secondary hover:bg-secondary/80 rounded-lg"><Copy className="w-4 h-4" /></button>
                  <a href={portalStatus.url} target="_blank" rel="noopener noreferrer" className="p-2 bg-secondary hover:bg-secondary/80 rounded-lg"><ExternalLink className="w-4 h-4" /></a>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => onAction('regenerate')} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80"><RefreshCw className="w-4 h-4" />Regenerate</button>
                <button onClick={() => onAction('disable')} className="flex-1 px-4 py-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/30">Disable</button>
              </div>
            </>
          ) : (
            <button onClick={() => onAction('enable')} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand text-brand-foreground rounded-lg hover:bg-brand/90">
              <Share2 className="w-5 h-5" />Enable Client Access
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Document Modal Component
function DocumentModal({ type, onSave, onClose }: { type: string; onSave: (data: any) => void; onClose: () => void }) {
  const [formData, setFormData] = useState({ name: '', type: type, content: '' });
  const typeLabels: Record<string, string> = { contract: 'Contract', sow: 'Scope of Work', outline: 'Project Outline', doc: 'Document', note: 'Note' };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl border border-border w-full max-w-lg">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">New {typeLabels[type] || 'Document'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Document Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
              placeholder={`My ${typeLabels[type] || 'Document'}`}
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-muted-foreground hover:text-foreground">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-brand text-brand-foreground rounded-lg hover:bg-brand/90">Create</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Link Contact/Lead Modal
function LinkModal({ type, items, linkedIds, onLink, onClose }: { type: 'contact' | 'lead'; items: any[]; linkedIds: (string | number)[]; onLink: (id: string | number) => void; onClose: () => void }) {
  const [search, setSearch] = useState('');
  const availableItems = items.filter(item => !linkedIds.includes(item.id));
  const filteredItems = availableItems.filter(item => {
    const name = type === 'contact' ? `${item.first_name} ${item.last_name}` : item.name;
    return name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl border border-border w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Link {type === 'contact' ? 'Contact' : 'Lead'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>
        <div className="flex-1 overflow-auto p-4 pt-0 space-y-2">
          {filteredItems.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">No {type}s available to link</p>
          ) : (
            filteredItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onLink(item.id)}
                className="w-full flex items-center gap-3 p-3 bg-secondary/50 hover:bg-secondary rounded-lg text-left"
              >
                <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', type === 'contact' ? 'bg-blue-500/20' : 'bg-green-500/20')}>
                  {type === 'contact' ? <User className="w-4 h-4 text-blue-500" /> : <Building className="w-4 h-4 text-green-500" />}
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">
                    {type === 'contact' ? `${item.first_name} ${item.last_name}` : item.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{item.email || item.company || ''}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// Photo Upload Modal
function PhotoUploadModal({ onUpload, onClose }: { onUpload: (file: File) => void; onClose: () => void }) {
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      onUpload(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl border border-border w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Upload Photo</h2>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={cn(
              'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
              dragOver ? 'border-brand bg-brand/10' : 'border-border'
            )}
          >
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-foreground mb-2">Drag and drop an image here</p>
            <p className="text-sm text-muted-foreground mb-4">or</p>
            <label className="px-4 py-2 bg-brand text-brand-foreground rounded-lg hover:bg-brand/90 cursor-pointer">
              Choose File
              <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
