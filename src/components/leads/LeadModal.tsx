'use client';

import { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import type { Lead } from '@/types';

interface LeadModalProps {
  lead: Lead | null;
  onSave: (data: Partial<Lead>) => void;
  onClose: () => void;
}

const LIFE_EVENT_TYPES = [
  { value: 'relocation', label: '🏠 Relocation' },
  { value: 'sold_business', label: '💰 Sold Business' },
  { value: 'business_growth', label: '📈 Business Growth' },
  { value: 'funding', label: '🚀 Got Funding' },
  { value: 'retirement', label: '🎯 Retirement' },
  { value: 'recognition', label: '🏆 Recognition/Award' },
  { value: 'inheritance', label: '💎 Inheritance' },
  { value: 'new_job', label: '💼 New Job' },
  { value: 'other', label: '📌 Other' },
];

export function LeadModal({ lead, onSave, onClose }: LeadModalProps) {
  const [formData, setFormData] = useState<{
    name: string;
    company: string;
    title: string;
    location: string;
    email: string;
    phone: string;
    companyPhone: string;
    companyEmail: string;
    linkedIn: string;
    website: string;
    netWorthIndicator: string;
    lifeEvent: string;
    lifeEventType: string;
    notes: string;
    source: string;
    tags: string[];
    status: Lead['status'];
    priority: Lead['priority'];
  }>({
    name: '',
    company: '',
    title: '',
    location: '',
    email: '',
    phone: '',
    companyPhone: '',
    companyEmail: '',
    linkedIn: '',
    website: '',
    netWorthIndicator: '',
    lifeEvent: '',
    lifeEventType: 'other',
    notes: '',
    source: '',
    tags: [],
    status: 'new',
    priority: 'medium',
  });
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (lead) {
      setFormData({
        name: lead.name || '',
        company: lead.company || '',
        title: lead.title || '',
        location: lead.location || '',
        email: lead.email || '',
        phone: lead.phone || '',
        companyPhone: lead.companyPhone || '',
        companyEmail: lead.companyEmail || '',
        linkedIn: lead.linkedIn || '',
        website: lead.website || '',
        netWorthIndicator: lead.netWorthIndicator || '',
        lifeEvent: lead.lifeEvent || '',
        lifeEventType: lead.lifeEventType || 'other',
        notes: lead.notes || '',
        source: lead.source || '',
        tags: lead.tags || [],
        status: lead.status || 'new',
        priority: lead.priority || 'medium',
      });
    }
  }, [lead]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      email: formData.email || null,
      phone: formData.phone || null,
      companyPhone: formData.companyPhone || null,
      companyEmail: formData.companyEmail || null,
      linkedIn: formData.linkedIn || null,
      website: formData.website || null,
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl border border-border w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            {lead ? 'Edit Lead' : 'Add Lead'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-130px)]">
          <div className="p-4 space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Company</label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
                  placeholder="City, State"
                />
              </div>
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">LinkedIn URL</label>
                <input
                  type="url"
                  value={formData.linkedIn}
                  onChange={(e) => setFormData({ ...formData, linkedIn: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
                  placeholder="https://linkedin.com/in/..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Website</label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
            </div>

            {/* Life Event */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Life Event Type</label>
              <select
                value={formData.lifeEventType}
                onChange={(e) => setFormData({ ...formData, lifeEventType: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
              >
                {LIFE_EVENT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Life Event Details</label>
              <input
                type="text"
                value={formData.lifeEvent}
                onChange={(e) => setFormData({ ...formData, lifeEvent: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
                placeholder="e.g., Just sold company for $10M, retiring..."
              />
            </div>

            {/* Qualification */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Net Worth Indicator</label>
              <input
                type="text"
                value={formData.netWorthIndicator}
                onChange={(e) => setFormData({ ...formData, netWorthIndicator: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
                placeholder="e.g., CEO of public company, sold business for $5M..."
              />
            </div>

            {/* Status & Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as Lead['status'] })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="proposal">Proposal</option>
                  <option value="negotiation">Negotiation</option>
                  <option value="won">Won</option>
                  <option value="lost">Lost</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as Lead['priority'] })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            {/* Source */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Source</label>
              <input
                type="text"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
                placeholder="e.g., AZ Big Media, LinkedIn, Referral..."
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand resize-none"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Tags</label>
              <div className="flex gap-2 mb-2 flex-wrap">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 px-2 py-1 bg-brand/20 text-brand rounded-lg text-sm"
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
              {lead ? 'Save Changes' : 'Add Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
