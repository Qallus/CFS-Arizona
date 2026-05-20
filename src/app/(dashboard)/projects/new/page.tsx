'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Plus, 
  X, 
  Camera, 
  Upload, 
  Trash2,
  Calendar,
  DollarSign,
  Clock,
  MapPin,
  User,
  Phone,
  Mail,
  CheckSquare,
  Flag,
  Milestone as MilestoneIcon,
  Save,
  Image as ImageIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import type { Project, SubTask, SitePhoto, Milestone, ProjectLocation } from '@/types';

const COLORS = [
  '#00fc83', '#ef4444', '#eab308', '#22c55e', '#3b82f6', 
  '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6', '#64748b'
];

const PROJECT_TYPES = [
  'Residential',
  'Commercial', 
  'Industrial',
  'Renovation',
  'New Construction',
  'Maintenance',
  'Consulting',
  'Other'
];

export default function NewProjectPage() {
  const router = useRouter();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [leads, setLeads] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'planning' as Project['status'],
    priority: 'medium' as Project['priority'],
    projectType: '',
    startDate: '',
    endDate: '',
    dueDate: '',
    budget: '',
    estimatedHours: '',
    hourlyRate: '',
    color: '#00fc83',
    tags: [] as string[],
    leadIds: [] as string[],
    contactIds: [] as string[],
    // Client info
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    // Location
    location: {
      address: '',
      city: '',
      state: '',
      zip: '',
      country: 'USA',
    } as ProjectLocation,
    // Notes
    notes: '',
  });
  
  const [sitePhotos, setSitePhotos] = useState<SitePhoto[]>([]);
  const [subTasks, setSubTasks] = useState<SubTask[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [newTag, setNewTag] = useState('');
  const [newSubTask, setNewSubTask] = useState('');
  const [newMilestone, setNewMilestone] = useState({ title: '', dueDate: '' });

  useEffect(() => {
    fetchLeads();
    fetchContacts();
  }, []);

  const fetchLeads = async () => {
    try {
      const res = await fetch('/api/leads');
      const data = await res.json();
      setLeads(data.leads || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
    }
  };

  const fetchContacts = async () => {
    try {
      const res = await fetch('/api/contacts');
      const data = await res.json();
      setContacts(data.contacts || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('/api/uploads', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        
        if (data.url) {
          const newPhoto: SitePhoto = {
            id: crypto.randomUUID(),
            url: data.url,
            caption: '',
            uploadedAt: new Date().toISOString(),
          };
          setSitePhotos(prev => [...prev, newPhoto]);
        }
      } catch (error) {
        console.error('Photo upload error:', error);
        // Fallback to base64
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          if (result) {
            const newPhoto: SitePhoto = {
              id: crypto.randomUUID(),
              url: result,
              caption: '',
              uploadedAt: new Date().toISOString(),
            };
            setSitePhotos(prev => [...prev, newPhoto]);
          }
        };
        reader.readAsDataURL(file);
      }
    }
    
    if (photoInputRef.current) {
      photoInputRef.current.value = '';
    }
  };

  const removePhoto = (photoId: string) => {
    setSitePhotos(prev => prev.filter(p => p.id !== photoId));
  };

  const updatePhotoCaption = (photoId: string, caption: string) => {
    setSitePhotos(prev => prev.map(p => 
      p.id === photoId ? { ...p, caption } : p
    ));
  };

  const addSubTask = () => {
    if (!newSubTask.trim()) return;
    const task: SubTask = {
      id: crypto.randomUUID(),
      title: newSubTask.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
    };
    setSubTasks(prev => [...prev, task]);
    setNewSubTask('');
  };

  const removeSubTask = (taskId: string) => {
    setSubTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const toggleSubTask = (taskId: string) => {
    setSubTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, completed: !t.completed } : t
    ));
  };

  const addMilestone = () => {
    if (!newMilestone.title.trim()) return;
    const milestone: Milestone = {
      id: crypto.randomUUID(),
      title: newMilestone.title.trim(),
      dueDate: newMilestone.dueDate || undefined,
      completed: false,
    };
    setMilestones(prev => [...prev, milestone]);
    setNewMilestone({ title: '', dueDate: '' });
  };

  const removeMilestone = (milestoneId: string) => {
    setMilestones(prev => prev.filter(m => m.id !== milestoneId));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, newTag.trim()] });
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const projectData = {
        ...formData,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : null,
        hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : null,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
        dueDate: formData.dueDate || null,
        sitePhotos,
        subTasks,
        milestones,
        location: formData.location.address ? formData.location : null,
      };

      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/projects/${data.project.id}`);
      } else {
        throw new Error('Failed to create project');
      }
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Failed to create project. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-foreground">New Project</h1>
              <p className="text-sm text-muted-foreground">Create a new project with all details</p>
            </div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={saving || !formData.name.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-brand text-brand-foreground rounded-lg hover:bg-brand/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Creating...' : 'Create Project'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 max-w-6xl mx-auto space-y-8">
        {/* Basic Info */}
        <section className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Flag className="w-5 h-5 text-brand" />
            Basic Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-1">
                Project Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
                placeholder="Enter project name..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
              >
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Project Type</label>
              <select
                value={formData.projectType}
                onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
              >
                <option value="">Select type...</option>
                {PROJECT_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Color</label>
              <div className="flex gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={cn(
                      'w-8 h-8 rounded-full transition-all',
                      formData.color === color && 'ring-2 ring-offset-2 ring-offset-card'
                    )}
                    style={{ backgroundColor: color, '--tw-ring-color': color } as React.CSSProperties}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Description */}
        <section className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold mb-4">Description</h2>
          <RichTextEditor
            content={formData.description}
            onChange={(content) => setFormData({ ...formData, description: content })}
            placeholder="Describe the project in detail..."
            className="min-h-[300px]"
          />
        </section>

        {/* Site Photos */}
        <section className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Camera className="w-5 h-5 text-brand" />
            Site Photos
          </h2>
          
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoUpload}
            className="hidden"
          />
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {sitePhotos.map((photo) => (
              <div key={photo.id} className="relative group">
                <img
                  src={photo.url}
                  alt={photo.caption || 'Site photo'}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(photo.id)}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
                <input
                  type="text"
                  value={photo.caption || ''}
                  onChange={(e) => updatePhotoCaption(photo.id, e.target.value)}
                  placeholder="Add caption..."
                  className="w-full mt-2 px-2 py-1 text-xs bg-background border border-border rounded"
                />
              </div>
            ))}
            
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="h-32 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 hover:border-brand hover:bg-brand/5 transition-colors"
            >
              <Upload className="w-6 h-6 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Upload Photos</span>
            </button>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Upload photos of the project site. Supports JPG, PNG, and WEBP.
          </p>
        </section>

        {/* Dates & Budget */}
        <section className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-brand" />
            Schedule & Budget
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">End Date</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Due Date</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Budget
              </label>
              <input
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                <Clock className="w-4 h-4 inline mr-1" />
                Estimated Hours
              </label>
              <input
                type="number"
                value={formData.estimatedHours}
                onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Hourly Rate</label>
              <input
                type="number"
                value={formData.hourlyRate}
                onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
                placeholder="0.00"
              />
            </div>
          </div>
        </section>

        {/* Client Info */}
        <section className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-brand" />
            Client Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Client Name</label>
              <input
                type="text"
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                <Mail className="w-4 h-4 inline mr-1" />
                Email
              </label>
              <input
                type="email"
                value={formData.clientEmail}
                onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
                placeholder="client@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                <Phone className="w-4 h-4 inline mr-1" />
                Phone
              </label>
              <input
                type="tel"
                value={formData.clientPhone}
                onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
                placeholder="(555) 123-4567"
              />
            </div>
          </div>
        </section>

        {/* Location */}
        <section className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-brand" />
            Project Location
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-1">Street Address</label>
              <input
                type="text"
                value={formData.location.address}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  location: { ...formData.location, address: e.target.value }
                })}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
                placeholder="123 Main St"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">City</label>
              <input
                type="text"
                value={formData.location.city}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  location: { ...formData.location, city: e.target.value }
                })}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
                placeholder="Phoenix"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">State</label>
                <input
                  type="text"
                  value={formData.location.state}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    location: { ...formData.location, state: e.target.value }
                  })}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
                  placeholder="AZ"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">ZIP</label>
                <input
                  type="text"
                  value={formData.location.zip}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    location: { ...formData.location, zip: e.target.value }
                  })}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
                  placeholder="85001"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Sub-Tasks */}
        <section className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-brand" />
            Sub-Tasks
          </h2>
          
          <div className="space-y-3 mb-4">
            {subTasks.map((task) => (
              <div key={task.id} className="flex items-center gap-3 p-3 bg-background rounded-lg">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleSubTask(task.id)}
                  className="w-5 h-5 rounded border-border text-brand focus:ring-brand"
                />
                <span className={cn(
                  'flex-1',
                  task.completed && 'line-through text-muted-foreground'
                )}>
                  {task.title}
                </span>
                <button
                  type="button"
                  onClick={() => removeSubTask(task.id)}
                  className="p-1 text-muted-foreground hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          
          <div className="flex gap-2">
            <input
              type="text"
              value={newSubTask}
              onChange={(e) => setNewSubTask(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSubTask())}
              className="flex-1 px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
              placeholder="Add a sub-task..."
            />
            <button
              type="button"
              onClick={addSubTask}
              className="px-4 py-3 bg-brand text-brand-foreground rounded-lg hover:bg-brand/90 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </section>

        {/* Milestones */}
        <section className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MilestoneIcon className="w-5 h-5 text-brand" />
            Milestones
          </h2>
          
          <div className="space-y-3 mb-4">
            {milestones.map((milestone) => (
              <div key={milestone.id} className="flex items-center gap-3 p-3 bg-background rounded-lg">
                <div className="w-3 h-3 rounded-full bg-brand" />
                <span className="flex-1 font-medium">{milestone.title}</span>
                {milestone.dueDate && (
                  <span className="text-sm text-muted-foreground">
                    Due: {new Date(milestone.dueDate).toLocaleDateString()}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeMilestone(milestone.id)}
                  className="p-1 text-muted-foreground hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          
          <div className="flex gap-2">
            <input
              type="text"
              value={newMilestone.title}
              onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addMilestone())}
              className="flex-1 px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
              placeholder="Milestone name..."
            />
            <input
              type="date"
              value={newMilestone.dueDate}
              onChange={(e) => setNewMilestone({ ...newMilestone, dueDate: e.target.value })}
              className="px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
            />
            <button
              type="button"
              onClick={addMilestone}
              className="px-4 py-3 bg-brand text-brand-foreground rounded-lg hover:bg-brand/90 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </section>

        {/* Tags */}
        <section className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold mb-4">Tags</h2>
          
          <div className="flex gap-2 mb-4 flex-wrap">
            {formData.tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 px-3 py-1 bg-brand/20 text-brand rounded-full text-sm"
              >
                {tag}
                <button type="button" onClick={() => removeTag(tag)}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          
          <div className="flex gap-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              className="flex-1 px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
              placeholder="Add a tag..."
            />
            <button
              type="button"
              onClick={addTag}
              className="px-4 py-3 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </section>

        {/* Notes */}
        <section className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold mb-4">Additional Notes</h2>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={4}
            className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand resize-none"
            placeholder="Any additional notes or comments..."
          />
        </section>

        {/* Submit Button (Mobile) */}
        <div className="lg:hidden">
          <button
            type="submit"
            disabled={saving || !formData.name.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-brand text-brand-foreground rounded-lg hover:bg-brand/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Creating Project...' : 'Create Project'}
          </button>
        </div>
      </form>
    </div>
  );
}
