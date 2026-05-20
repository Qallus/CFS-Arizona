'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  FileText,
  FileCheck,
  Clipboard,
  File,
  FolderOpen,
  MoreHorizontal,
  Edit,
  Trash2,
  Send,
  Eye,
  Briefcase,
  Filter,
  MapPin,
  DollarSign,
  Calendar,
  ExternalLink,
  Building2,
  Globe,
  Star,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Document {
  id: string;
  name: string;
  type: string;
  projectId: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface RFP {
  id: string;
  title: string;
  agency: string;
  level: 'federal' | 'state' | 'county' | 'city' | 'international';
  category: string;
  description: string;
  deadline: string;
  postedDate: string;
  budget?: string;
  location?: string;
  link: string;
  status: 'open' | 'closing_soon' | 'closed';
  saved?: boolean;
}

const DOC_TABS = [
  { key: 'all', label: 'All', icon: FileText },
  { key: 'contract', label: 'Contracts', icon: FileCheck },
  { key: 'sow', label: 'SOW', icon: Clipboard },
  { key: 'outline', label: 'Outlines', icon: FileText },
  { key: 'doc', label: 'Docs', icon: File },
  { key: 'note', label: 'Notes', icon: FolderOpen },
  { key: 'rfp', label: 'RFP', icon: Briefcase },
];

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-500/20 text-gray-500',
  sent: 'bg-blue-500/20 text-blue-500',
  viewed: 'bg-purple-500/20 text-purple-500',
  signed: 'bg-green-500/20 text-green-500',
  completed: 'bg-green-500/20 text-green-500',
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [docType, setDocType] = useState('all');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // RFP State
  const [rfps, setRfps] = useState<RFP[]>([]);
  const [rfpLoading, setRfpLoading] = useState(false);
  const [rfpSearch, setRfpSearch] = useState('');
  const [rfpLevel, setRfpLevel] = useState<string>('all');
  const [rfpCategory, setRfpCategory] = useState<string>('all');
  const [savedRfps, setSavedRfps] = useState<RFP[]>([]);
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  useEffect(() => {
    if (docType === 'rfp') {
      // Load saved RFPs from localStorage
      const saved = localStorage.getItem('savedRfps');
      if (saved) setSavedRfps(JSON.parse(saved));
    } else {
      fetchDocuments();
    }
  }, [docType]);

  const fetchDocuments = async () => {
    try {
      const params = new URLSearchParams();
      if (docType !== 'all') params.append('type', docType);
      
      const res = await fetch(`/api/documents?${params}`);
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    
    try {
      await fetch(`/api/documents?id=${docId}`, { method: 'DELETE' });
      fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
    }
    setActiveMenu(null);
  };

  const handleCreate = async (docData: any) => {
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(docData),
      });
      const data = await res.json();
      setShowCreateModal(false);
      // Redirect to the new document
      window.location.href = `/documents/${data.document.id}`;
    } catch (error) {
      console.error('Error creating document:', error);
    }
  };

  const filteredDocs = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTypeIcon = (type: string) => {
    const tab = DOC_TABS.find(t => t.key === type);
    return tab?.icon || FileText;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-border">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Documents</h1>
            <p className="text-sm text-muted-foreground">Contracts, SOWs, and project documents</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand text-brand-foreground rounded-lg hover:bg-brand/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Document
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 flex-wrap mb-4">
          {DOC_TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setDocType(tab.key)}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors',
                  docType === tab.key
                    ? 'bg-brand text-brand-foreground'
                    : 'bg-secondary text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {/* RFP Section */}
        {docType === 'rfp' ? (
          <RFPSection
            rfps={rfps}
            setRfps={setRfps}
            rfpLoading={rfpLoading}
            setRfpLoading={setRfpLoading}
            rfpSearch={rfpSearch}
            setRfpSearch={setRfpSearch}
            rfpLevel={rfpLevel}
            setRfpLevel={setRfpLevel}
            rfpCategory={rfpCategory}
            setRfpCategory={setRfpCategory}
            savedRfps={savedRfps}
            setSavedRfps={setSavedRfps}
            showSavedOnly={showSavedOnly}
            setShowSavedOnly={setShowSavedOnly}
          />
        ) : loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" />
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <FileText className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No documents found</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-brand text-brand-foreground rounded-lg hover:bg-brand/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Document
            </button>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredDocs.map((doc) => {
              const TypeIcon = getTypeIcon(doc.type);
              return (
                <div key={doc.id} className="flex items-center justify-between p-4 bg-card rounded-lg border border-border hover:border-brand/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                      <TypeIcon className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <Link href={`/documents/${doc.id}`} className="font-medium text-foreground hover:text-brand">
                        {doc.name}
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={cn('px-2 py-0.5 rounded text-xs font-medium', STATUS_COLORS[doc.status])}>
                          {doc.status}
                        </span>
                        <span className="text-xs text-muted-foreground capitalize">{doc.type}</span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(doc.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/documents/${doc.id}`}
                      className="p-2 hover:bg-secondary rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4 text-muted-foreground" />
                    </Link>
                    <div className="relative">
                      <button
                        onClick={() => setActiveMenu(activeMenu === doc.id ? null : doc.id)}
                        className="p-2 hover:bg-secondary rounded-lg transition-colors"
                      >
                        <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                      </button>
                      {activeMenu === doc.id && (
                        <div className="absolute right-0 top-full mt-1 w-40 bg-card border border-border rounded-lg shadow-lg z-10">
                          <Link
                            href={`/documents/${doc.id}`}
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-secondary"
                          >
                            <Eye className="w-4 h-4" /> View
                          </Link>
                          <button
                            onClick={() => handleDelete(doc.id)}
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-500 hover:bg-secondary"
                          >
                            <Trash2 className="w-4 h-4" /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateDocumentModal
          onSave={handleCreate}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}

// RFP Section Component
function RFPSection({
  rfps,
  setRfps,
  rfpLoading,
  setRfpLoading,
  rfpSearch,
  setRfpSearch,
  rfpLevel,
  setRfpLevel,
  rfpCategory,
  setRfpCategory,
  savedRfps,
  setSavedRfps,
  showSavedOnly,
  setShowSavedOnly,
}: {
  rfps: RFP[];
  setRfps: (rfps: RFP[]) => void;
  rfpLoading: boolean;
  setRfpLoading: (loading: boolean) => void;
  rfpSearch: string;
  setRfpSearch: (search: string) => void;
  rfpLevel: string;
  setRfpLevel: (level: string) => void;
  rfpCategory: string;
  setRfpCategory: (category: string) => void;
  savedRfps: RFP[];
  setSavedRfps: (rfps: RFP[]) => void;
  showSavedOnly: boolean;
  setShowSavedOnly: (show: boolean) => void;
}) {
  const RFP_LEVELS = [
    { key: 'all', label: 'All Levels' },
    { key: 'federal', label: 'Federal', icon: Building2 },
    { key: 'state', label: 'State', icon: MapPin },
    { key: 'county', label: 'County', icon: MapPin },
    { key: 'city', label: 'City/Local', icon: MapPin },
    { key: 'international', label: 'International', icon: Globe },
  ];

  const RFP_CATEGORIES = [
    { key: 'all', label: 'All Categories' },
    { key: 'technology', label: 'Technology & IT' },
    { key: 'construction', label: 'Construction' },
    { key: 'consulting', label: 'Consulting' },
    { key: 'marketing', label: 'Marketing & Media' },
    { key: 'healthcare', label: 'Healthcare' },
    { key: 'education', label: 'Education' },
    { key: 'transportation', label: 'Transportation' },
    { key: 'energy', label: 'Energy & Environment' },
    { key: 'grants', label: 'Grants & Funding' },
    { key: 'other', label: 'Other' },
  ];

  const searchRFPs = async () => {
    if (!rfpSearch.trim()) return;
    
    setRfpLoading(true);
    try {
      // This would typically call an API that aggregates RFP data
      // For now, we'll simulate with placeholder data
      const res = await fetch(`/api/documents/rfp?search=${encodeURIComponent(rfpSearch)}&level=${rfpLevel}&category=${rfpCategory}`);
      const data = await res.json();
      setRfps(data.rfps || []);
    } catch (error) {
      console.error('RFP search error:', error);
      // Show placeholder message
      setRfps([]);
    } finally {
      setRfpLoading(false);
    }
  };

  const toggleSave = (rfp: RFP) => {
    const isSaved = savedRfps.some(r => r.id === rfp.id);
    let updated: RFP[];
    
    if (isSaved) {
      updated = savedRfps.filter(r => r.id !== rfp.id);
    } else {
      updated = [...savedRfps, { ...rfp, saved: true }];
    }
    
    setSavedRfps(updated);
    localStorage.setItem('savedRfps', JSON.stringify(updated));
  };

  const isRfpSaved = (id: string) => savedRfps.some(r => r.id === id);

  const displayRfps = showSavedOnly ? savedRfps : rfps;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-500/20 text-green-500';
      case 'closing_soon': return 'bg-yellow-500/20 text-yellow-500';
      case 'closed': return 'bg-red-500/20 text-red-500';
      default: return 'bg-gray-500/20 text-gray-500';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'federal': return 'bg-blue-500/20 text-blue-500';
      case 'state': return 'bg-purple-500/20 text-purple-500';
      case 'county': return 'bg-brand/20 text-brand';
      case 'city': return 'bg-teal-500/20 text-teal-500';
      case 'international': return 'bg-pink-500/20 text-pink-500';
      default: return 'bg-gray-500/20 text-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Filters */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search RFPs, grants, contracts..."
              value={rfpSearch}
              onChange={(e) => setRfpSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchRFPs()}
              className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded-lg"
            />
          </div>
          <button
            onClick={searchRFPs}
            disabled={rfpLoading || !rfpSearch.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-brand text-brand-foreground rounded-lg hover:bg-brand/90 disabled:opacity-50"
          >
            {rfpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Search
          </button>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              value={rfpLevel}
              onChange={(e) => setRfpLevel(e.target.value)}
              className="px-3 py-1.5 bg-secondary border border-border rounded-lg text-sm"
            >
              {RFP_LEVELS.map((level) => (
                <option key={level.key} value={level.key}>{level.label}</option>
              ))}
            </select>
          </div>
          
          <select
            value={rfpCategory}
            onChange={(e) => setRfpCategory(e.target.value)}
            className="px-3 py-1.5 bg-secondary border border-border rounded-lg text-sm"
          >
            {RFP_CATEGORIES.map((cat) => (
              <option key={cat.key} value={cat.key}>{cat.label}</option>
            ))}
          </select>

          <button
            onClick={() => setShowSavedOnly(!showSavedOnly)}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors',
              showSavedOnly ? 'bg-brand text-brand-foreground' : 'bg-secondary text-muted-foreground'
            )}
          >
            <Star className={cn('w-4 h-4', showSavedOnly && 'fill-current')} />
            Saved ({savedRfps.length})
          </button>
        </div>
      </div>

      {/* Results Info */}
      {rfpSearch && !rfpLoading && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {showSavedOnly 
              ? `${savedRfps.length} saved RFP${savedRfps.length !== 1 ? 's' : ''}`
              : `${rfps.length} result${rfps.length !== 1 ? 's' : ''} for "${rfpSearch}"`
            }
          </span>
          {rfps.length > 0 && (
            <button
              onClick={searchRFPs}
              className="flex items-center gap-1 hover:text-foreground"
            >
              <RefreshCw className="w-3 h-3" />
              Refresh
            </button>
          )}
        </div>
      )}

      {/* Results */}
      {rfpLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : displayRfps.length === 0 ? (
        <div className="text-center py-16">
          <Briefcase className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            {showSavedOnly ? 'No Saved RFPs' : 'Search for RFPs'}
          </h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            {showSavedOnly 
              ? 'Save interesting RFPs to view them here later.'
              : 'Search for government RFPs, grants, and contracts from federal, state, county, and city sources.'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayRfps.map((rfp) => (
            <div
              key={rfp.id}
              className="bg-card border border-border rounded-lg p-4 hover:border-brand/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={cn('px-2 py-0.5 rounded text-xs font-medium capitalize', getLevelColor(rfp.level))}>
                      {rfp.level}
                    </span>
                    <span className={cn('px-2 py-0.5 rounded text-xs font-medium capitalize', getStatusColor(rfp.status))}>
                      {rfp.status.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-muted-foreground">{rfp.category}</span>
                  </div>
                  
                  <h4 className="font-semibold text-foreground mb-1">{rfp.title}</h4>
                  <p className="text-sm text-muted-foreground mb-2">{rfp.agency}</p>
                  
                  {rfp.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{rfp.description}</p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                    {rfp.budget && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        {rfp.budget}
                      </span>
                    )}
                    {rfp.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {rfp.location}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Due: {new Date(rfp.deadline).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => toggleSave(rfp)}
                    className={cn(
                      'p-2 rounded-lg transition-colors',
                      isRfpSaved(rfp.id) ? 'bg-brand text-brand-foreground' : 'bg-secondary hover:bg-secondary/80'
                    )}
                    title={isRfpSaved(rfp.id) ? 'Remove from saved' : 'Save RFP'}
                  >
                    <Star className={cn('w-4 h-4', isRfpSaved(rfp.id) && 'fill-current')} />
                  </button>
                  <a
                    href={rfp.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
                    title="View RFP"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Create Document Modal
function CreateDocumentModal({ onSave, onClose }: { onSave: (data: any) => void; onClose: () => void }) {
  const [templates, setTemplates] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    type: 'doc',
    templateId: '',
  });

  useEffect(() => {
    fetchTemplates();
  }, [formData.type]);

  const fetchTemplates = async () => {
    try {
      const res = await fetch(`/api/documents?templates=true&type=${formData.type}`);
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const template = templates.find(t => t.id === formData.templateId);
    onSave({
      name: formData.name || template?.name || 'Untitled Document',
      type: formData.type,
      templateId: formData.templateId || null,
      content: template?.content || '',
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl border border-border w-full max-w-md">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold">New Document</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Document Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value, templateId: '' })}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
            >
              <option value="contract">Contract</option>
              <option value="sow">Scope of Work</option>
              <option value="outline">Project Outline</option>
              <option value="doc">General Document</option>
              <option value="note">Note</option>
            </select>
          </div>

          {templates.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-1">Template (optional)</label>
              <select
                value={formData.templateId}
                onChange={(e) => setFormData({ ...formData, templateId: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
              >
                <option value="">Blank document</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium mb-1">Document Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
              placeholder="My Document"
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-muted-foreground hover:text-foreground">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-brand text-brand-foreground rounded-lg hover:bg-brand/90">
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
