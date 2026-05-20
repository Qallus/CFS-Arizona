'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal,
  Edit,
  Trash2,
  ExternalLink,
  Upload,
  Download,
  RefreshCw,
  Building2,
  MapPin,
  Phone,
  Mail,
  Linkedin,
  Tag,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LeadModal } from '@/components/leads/LeadModal';
import type { Lead } from '@/types';

const STATUS_COLORS = {
  new: 'bg-gray-500/20 text-gray-500',
  contacted: 'bg-blue-500/20 text-blue-500',
  qualified: 'bg-purple-500/20 text-purple-500',
  proposal: 'bg-yellow-500/20 text-yellow-500',
  negotiation: 'bg-brand/20 text-brand',
  won: 'bg-green-500/20 text-green-500',
  lost: 'bg-red-500/20 text-red-500',
};

const PRIORITY_COLORS = {
  high: 'bg-red-500/20 text-red-500',
  medium: 'bg-yellow-500/20 text-yellow-500',
  low: 'bg-green-500/20 text-green-500',
};

const LIFE_EVENT_ICONS: Record<string, string> = {
  relocation: '🏠',
  sold_business: '💰',
  business_growth: '📈',
  funding: '🚀',
  retirement: '🎯',
  recognition: '🏆',
  inheritance: '💎',
  new_job: '💼',
  other: '📌',
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [allTags, setAllTags] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<any>(null);

  useEffect(() => {
    fetchLeads();
    fetchSyncStatus();
  }, [statusFilter, priorityFilter, tagFilter]);

  const fetchLeads = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (priorityFilter) params.append('priority', priorityFilter);
      if (tagFilter) params.append('tag', tagFilter);
      if (searchQuery) params.append('search', searchQuery);

      const res = await fetch(`/api/leads?${params}`);
      const data = await res.json();
      setLeads(data.leads || []);
      setAllTags(data.tags || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSyncStatus = async () => {
    try {
      const res = await fetch('/api/leads/sync');
      const data = await res.json();
      setSyncStatus(data);
    } catch (error) {
      console.error('Error fetching sync status:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLeads();
  };

  const handleSyncAll = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/leads/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ syncAll: true }),
      });
      const data = await res.json();
      alert(data.message || 'Sync complete');
      fetchLeads();
      fetchSyncStatus();
    } catch (error) {
      console.error('Error syncing:', error);
      alert('Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateLead = () => {
    setEditingLead(null);
    setShowModal(true);
  };

  const handleEditLead = (lead: Lead) => {
    setEditingLead(lead);
    setShowModal(true);
    setActiveMenu(null);
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;
    
    try {
      await fetch(`/api/leads?id=${leadId}`, { method: 'DELETE' });
      fetchLeads();
    } catch (error) {
      console.error('Error deleting lead:', error);
    }
    setActiveMenu(null);
  };

  const handleSaveLead = async (leadData: Partial<Lead>) => {
    try {
      if (editingLead) {
        await fetch('/api/leads', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingLead.id, ...leadData }),
        });
      } else {
        await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(leadData),
        });
      }
      setShowModal(false);
      fetchLeads();
    } catch (error) {
      console.error('Error saving lead:', error);
    }
  };

  const stats = {
    total: leads.length,
    high: leads.filter(l => l.priority === 'high').length,
    synced: leads.filter(l => l.fluentCrmId).length,
    newLeads: leads.filter(l => l.status === 'new').length,
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-border">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Leads</h1>
            <p className="text-sm text-muted-foreground">Manage your sales leads and prospects</p>
          </div>
          <div className="flex items-center gap-3">
            {syncStatus?.configured && syncStatus?.pendingSync > 0 && (
              <button
                onClick={handleSyncAll}
                disabled={syncing}
                className="flex items-center gap-2 px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={cn('w-4 h-4', syncing && 'animate-spin')} />
                Sync to CRM ({syncStatus.pendingSync})
              </button>
            )}
            <button
              onClick={handleCreateLead}
              className="flex items-center gap-2 px-4 py-2 bg-brand text-brand-foreground rounded-lg hover:bg-brand/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Lead
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-card rounded-lg border border-border">
            <p className="text-sm text-muted-foreground">Total Leads</p>
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          </div>
          <div className="p-4 bg-card rounded-lg border border-border">
            <p className="text-sm text-muted-foreground">High Priority</p>
            <p className="text-2xl font-bold text-red-500">{stats.high}</p>
          </div>
          <div className="p-4 bg-card rounded-lg border border-border">
            <p className="text-sm text-muted-foreground">New Leads</p>
            <p className="text-2xl font-bold text-blue-500">{stats.newLeads}</p>
          </div>
          <div className="p-4 bg-card rounded-lg border border-border">
            <p className="text-sm text-muted-foreground">Synced to CRM</p>
            <p className="text-2xl font-bold text-green-500">{stats.synced}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <form onSubmit={handleSearch} className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </form>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
          >
            <option value="">All Status</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="proposal">Proposal</option>
            <option value="negotiation">Negotiation</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-4 py-2 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
          >
            <option value="">All Priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {allTags.length > 0 && (
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="px-4 py-2 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
            >
              <option value="">All Tags</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" />
          </div>
        ) : leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-muted-foreground mb-4">No leads found</p>
            <button
              onClick={handleCreateLead}
              className="flex items-center gap-2 px-4 py-2 bg-brand text-brand-foreground rounded-lg hover:bg-brand/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Your First Lead
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {leads.map((lead) => (
              <div key={lead.id} className="p-4 bg-card rounded-xl border border-border hover:border-brand/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-lg">{LIFE_EVENT_ICONS[lead.lifeEventType] || '📌'}</span>
                      <h3 className="text-lg font-semibold text-foreground">{lead.name}</h3>
                      <span className={cn('px-2 py-0.5 rounded text-xs font-medium', STATUS_COLORS[lead.status])}>
                        {lead.status.replace('_', ' ')}
                      </span>
                      <span className={cn('px-2 py-0.5 rounded text-xs font-medium', PRIORITY_COLORS[lead.priority])}>
                        {lead.priority}
                      </span>
                      {lead.fluentCrmId && (
                        <span className="px-2 py-0.5 bg-green-500/20 text-green-500 rounded text-xs">
                          CRM Synced
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                      {lead.company && (
                        <div className="flex items-center gap-1">
                          <Building2 className="w-4 h-4" />
                          {lead.company}
                        </div>
                      )}
                      {lead.title && <span>• {lead.title}</span>}
                      {lead.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {lead.location}
                        </div>
                      )}
                    </div>

                    <p className="text-sm text-brand mb-2">{lead.lifeEvent}</p>
                    
                    {lead.notes && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{lead.notes}</p>
                    )}

                    <div className="flex items-center gap-4">
                      {lead.email && (
                        <a href={`mailto:${lead.email}`} className="flex items-center gap-1 text-sm text-blue-500 hover:underline">
                          <Mail className="w-4 h-4" />
                          {lead.email}
                        </a>
                      )}
                      {lead.phone && (
                        <a href={`tel:${lead.phone}`} className="flex items-center gap-1 text-sm text-blue-500 hover:underline">
                          <Phone className="w-4 h-4" />
                          {lead.phone}
                        </a>
                      )}
                      {lead.linkedIn && (
                        <a href={lead.linkedIn} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-blue-500 hover:underline">
                          <Linkedin className="w-4 h-4" />
                          LinkedIn
                        </a>
                      )}
                    </div>

                    {lead.tags.length > 0 && (
                      <div className="flex items-center gap-2 mt-3">
                        <Tag className="w-4 h-4 text-muted-foreground" />
                        {lead.tags.map((tag) => (
                          <span key={tag} className="px-2 py-0.5 bg-secondary rounded text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <button
                      onClick={() => setActiveMenu(activeMenu === lead.id ? null : lead.id)}
                      className="p-2 hover:bg-secondary rounded-lg transition-colors"
                    >
                      <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
                    </button>
                    {activeMenu === lead.id && (
                      <div className="absolute right-0 top-full mt-1 w-40 bg-card border border-border rounded-lg shadow-lg z-10">
                        <button
                          onClick={() => handleEditLead(lead)}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </button>
                        {lead.website && (
                          <a
                            href={lead.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Visit Website
                          </a>
                        )}
                        <button
                          onClick={() => handleDeleteLead(lead.id)}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-500 hover:bg-secondary transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <LeadModal
          lead={editingLead}
          onSave={handleSaveLead}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
