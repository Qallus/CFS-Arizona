'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Project } from '@/types';

interface ProjectModalProps {
  project: Project | null;
  onSave: (data: Partial<Project>) => void;
  onClose: () => void;
}

const COLORS = [
  '#00fc83', '#ef4444', '#eab308', '#22c55e', '#3b82f6', 
  '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6', '#64748b'
];

export function ProjectModal({ project, onSave, onClose }: ProjectModalProps) {
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
    priority: 'high' | 'medium' | 'low';
    startDate: string;
    endDate: string;
    dueDate: string;
    budget: string;
    leadIds: string[];
    contactIds: string[];
    tags: string[];
    color: string;
  }>({
    name: '',
    description: '',
    status: 'planning',
    priority: 'medium',
    startDate: '',
    endDate: '',
    dueDate: '',
    budget: '',
    leadIds: [],
    contactIds: [],
    tags: [],
    color: '#00fc83',
  });
  const [newTag, setNewTag] = useState('');
  const [leads, setLeads] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [showLeadSearch, setShowLeadSearch] = useState(false);
  const [showContactSearch, setShowContactSearch] = useState(false);
  const [leadSearch, setLeadSearch] = useState('');
  const [contactSearch, setContactSearch] = useState('');

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        description: project.description,
        status: project.status,
        priority: project.priority,
        startDate: project.startDate?.split('T')[0] || '',
        endDate: project.endDate?.split('T')[0] || '',
        dueDate: project.dueDate?.split('T')[0] || '',
        budget: project.budget?.toString() || '',
        leadIds: project.leadIds || [],
        contactIds: project.contactIds || [],
        tags: project.tags || [],
        color: project.color || '#00fc83',
      });
    }
    fetchLeads();
    fetchContacts();
  }, [project]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      budget: formData.budget ? parseFloat(formData.budget) : null,
      startDate: formData.startDate || null,
      endDate: formData.endDate || null,
      dueDate: formData.dueDate || null,
    });
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

  const toggleLead = (leadId: string) => {
    if (formData.leadIds.includes(leadId)) {
      setFormData({ ...formData, leadIds: formData.leadIds.filter(id => id !== leadId) });
    } else {
      setFormData({ ...formData, leadIds: [...formData.leadIds, leadId] });
    }
  };

  const toggleContact = (contactId: string) => {
    if (formData.contactIds.includes(contactId)) {
      setFormData({ ...formData, contactIds: formData.contactIds.filter(id => id !== contactId) });
    } else {
      setFormData({ ...formData, contactIds: [...formData.contactIds, contactId] });
    }
  };

  const filteredLeads = leads.filter(l => 
    l.name.toLowerCase().includes(leadSearch.toLowerCase()) ||
    l.company.toLowerCase().includes(leadSearch.toLowerCase())
  );

  const filteredContacts = contacts.filter(c => 
    c.full_name?.toLowerCase().includes(contactSearch.toLowerCase()) ||
    c.email?.toLowerCase().includes(contactSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl border border-border w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            {project ? 'Edit Project' : 'Create Project'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-130px)]">
          <div className="p-4 space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Project Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand resize-none"
              />
            </div>

            {/* Status & Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
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
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Start Date</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">End Date</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Due Date</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
            </div>

            {/* Budget */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Budget ($)</label>
              <input
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
                placeholder="0.00"
              />
            </div>

            {/* Color */}
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

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Tags</label>
              <div className="flex gap-2 mb-2 flex-wrap">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 px-2 py-1 bg-secondary rounded-lg text-sm"
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
                  className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
                  placeholder="Add tag..."
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-3 py-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Linked Leads */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Linked Leads</label>
              <div className="flex gap-2 mb-2 flex-wrap">
                {formData.leadIds.map((id) => {
                  const lead = leads.find(l => l.id === id);
                  return lead ? (
                    <span key={id} className="flex items-center gap-1 px-2 py-1 bg-brand/20 text-brand rounded-lg text-sm">
                      {lead.name}
                      <button type="button" onClick={() => toggleLead(id)}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ) : null;
                })}
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={leadSearch}
                  onChange={(e) => { setLeadSearch(e.target.value); setShowLeadSearch(true); }}
                  onFocus={() => setShowLeadSearch(true)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
                  placeholder="Search leads..."
                />
                {showLeadSearch && filteredLeads.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg max-h-40 overflow-y-auto z-10">
                    {filteredLeads.slice(0, 5).map((lead) => (
                      <button
                        key={lead.id}
                        type="button"
                        onClick={() => { toggleLead(lead.id); setShowLeadSearch(false); setLeadSearch(''); }}
                        className={cn(
                          'w-full text-left px-3 py-2 hover:bg-secondary transition-colors text-sm',
                          formData.leadIds.includes(lead.id) && 'bg-brand/10'
                        )}
                      >
                        <div className="font-medium">{lead.name}</div>
                        <div className="text-xs text-muted-foreground">{lead.company}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Linked Contacts */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Linked Contacts</label>
              <div className="flex gap-2 mb-2 flex-wrap">
                {formData.contactIds.map((id) => {
                  const contact = contacts.find(c => c.id === id);
                  return contact ? (
                    <span key={id} className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-500 rounded-lg text-sm">
                      {contact.full_name}
                      <button type="button" onClick={() => toggleContact(id)}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ) : null;
                })}
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={contactSearch}
                  onChange={(e) => { setContactSearch(e.target.value); setShowContactSearch(true); }}
                  onFocus={() => setShowContactSearch(true)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
                  placeholder="Search contacts..."
                />
                {showContactSearch && filteredContacts.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg max-h-40 overflow-y-auto z-10">
                    {filteredContacts.slice(0, 5).map((contact) => (
                      <button
                        key={contact.id}
                        type="button"
                        onClick={() => { toggleContact(contact.id); setShowContactSearch(false); setContactSearch(''); }}
                        className={cn(
                          'w-full text-left px-3 py-2 hover:bg-secondary transition-colors text-sm',
                          formData.contactIds.includes(contact.id) && 'bg-blue-500/10'
                        )}
                      >
                        <div className="font-medium">{contact.full_name}</div>
                        <div className="text-xs text-muted-foreground">{contact.email}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-brand text-brand-foreground rounded-lg hover:bg-brand/90 transition-colors"
            >
              {project ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
