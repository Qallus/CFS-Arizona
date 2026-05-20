'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  DollarSign, 
  TrendingUp, 
  Target,
  MoreHorizontal,
  Edit,
  Trash2,
  ArrowRight,
  Calendar,
  User,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Deal } from '@/types';

const STAGES = [
  { key: 'lead', label: 'Lead', color: 'bg-gray-500', probability: 10 },
  { key: 'qualified', label: 'Qualified', color: 'bg-blue-500', probability: 25 },
  { key: 'proposal', label: 'Proposal', color: 'bg-yellow-500', probability: 50 },
  { key: 'negotiation', label: 'Negotiation', color: 'bg-brand', probability: 75 },
  { key: 'closed_won', label: 'Won', color: 'bg-green-500', probability: 100 },
  { key: 'closed_lost', label: 'Lost', color: 'bg-red-500', probability: 0 },
];

export default function PipelinePage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [draggedDeal, setDraggedDeal] = useState<Deal | null>(null);

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    try {
      const res = await fetch('/api/deals');
      const data = await res.json();
      setDeals(data.deals || []);
      setStats(data.stats || {});
    } catch (error) {
      console.error('Error fetching deals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, deal: Deal) => {
    setDraggedDeal(deal);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, newStage: string) => {
    e.preventDefault();
    if (!draggedDeal || draggedDeal.stage === newStage) {
      setDraggedDeal(null);
      return;
    }

    try {
      await fetch('/api/deals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: draggedDeal.id, stage: newStage }),
      });
      fetchDeals();
    } catch (error) {
      console.error('Error updating deal:', error);
    }
    setDraggedDeal(null);
  };

  const handleSaveDeal = async (dealData: Partial<Deal>) => {
    try {
      if (editingDeal) {
        await fetch('/api/deals', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingDeal.id, ...dealData }),
        });
      } else {
        await fetch('/api/deals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dealData),
        });
      }
      setShowModal(false);
      setEditingDeal(null);
      fetchDeals();
    } catch (error) {
      console.error('Error saving deal:', error);
    }
  };

  const handleDeleteDeal = async (dealId: string) => {
    if (!confirm('Are you sure you want to delete this deal?')) return;
    
    try {
      await fetch(`/api/deals?id=${dealId}`, { method: 'DELETE' });
      fetchDeals();
    } catch (error) {
      console.error('Error deleting deal:', error);
    }
    setActiveMenu(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getStageDeals = (stageKey: string) => {
    return deals.filter(d => d.stage === stageKey);
  };

  const openStages = STAGES.filter(s => !s.key.startsWith('closed_'));
  const closedStages = STAGES.filter(s => s.key.startsWith('closed_'));

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-border">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Pipeline</h1>
            <p className="text-sm text-muted-foreground">Track deals and forecast revenue</p>
          </div>
          <button
            onClick={() => { setEditingDeal(null); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-brand text-brand-foreground rounded-lg hover:bg-brand/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Deal
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-4 gap-4">
            <div className="p-4 bg-card rounded-lg border border-border">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <DollarSign className="w-4 h-4" />
                <span className="text-sm">Total Pipeline</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.totalPipeline || 0)}</p>
            </div>
            <div className="p-4 bg-card rounded-lg border border-border">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Target className="w-4 h-4" />
                <span className="text-sm">Weighted Pipeline</span>
              </div>
              <p className="text-2xl font-bold text-blue-500">{formatCurrency(stats.weightedPipeline || 0)}</p>
            </div>
            <div className="p-4 bg-card rounded-lg border border-border">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">Closed Won</span>
              </div>
              <p className="text-2xl font-bold text-green-500">{formatCurrency(stats.closedWon || 0)}</p>
            </div>
            <div className="p-4 bg-card rounded-lg border border-border">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <DollarSign className="w-4 h-4" />
                <span className="text-sm">Open Deals</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{stats.openCount || 0}</p>
            </div>
          </div>
        )}
      </div>

      {/* Pipeline Board */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" />
          </div>
        ) : (
          <div className="flex gap-4 min-h-full">
            {/* Open Stages */}
            {openStages.map((stage) => {
              const stageDeals = getStageDeals(stage.key);
              const stageValue = stageDeals.reduce((sum, d) => sum + d.value, 0);
              
              return (
                <div
                  key={stage.key}
                  className="flex-shrink-0 w-72 flex flex-col bg-card/50 rounded-xl border border-border"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, stage.key)}
                >
                  <div className="p-3 border-b border-border">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className={cn('w-2 h-2 rounded-full', stage.color)} />
                        <h3 className="font-medium text-sm text-foreground">{stage.label}</h3>
                        <span className="px-1.5 py-0.5 bg-secondary rounded text-xs">
                          {stageDeals.length}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">{stage.probability}%</span>
                    </div>
                    <p className="text-sm font-semibold text-foreground">{formatCurrency(stageValue)}</p>
                  </div>

                  <div className="flex-1 p-2 space-y-2 min-h-[200px] overflow-auto">
                    {stageDeals.map((deal) => (
                      <DealCard
                        key={deal.id}
                        deal={deal}
                        onEdit={() => { setEditingDeal(deal); setShowModal(true); }}
                        onDelete={() => handleDeleteDeal(deal.id)}
                        onDragStart={(e) => handleDragStart(e, deal)}
                        isDragging={draggedDeal?.id === deal.id}
                        formatCurrency={formatCurrency}
                      />
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Closed Stages */}
            <div className="flex-shrink-0 w-72 flex flex-col gap-4">
              {closedStages.map((stage) => {
                const stageDeals = getStageDeals(stage.key);
                const stageValue = stageDeals.reduce((sum, d) => sum + d.value, 0);
                
                return (
                  <div
                    key={stage.key}
                    className="flex flex-col bg-card/50 rounded-xl border border-border"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, stage.key)}
                  >
                    <div className="p-3 border-b border-border">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className={cn('w-2 h-2 rounded-full', stage.color)} />
                          <h3 className="font-medium text-sm text-foreground">{stage.label}</h3>
                          <span className="px-1.5 py-0.5 bg-secondary rounded text-xs">
                            {stageDeals.length}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-foreground">{formatCurrency(stageValue)}</p>
                    </div>

                    <div className="p-2 space-y-2 max-h-40 overflow-auto">
                      {stageDeals.slice(0, 3).map((deal) => (
                        <div key={deal.id} className="p-2 bg-card rounded-lg border border-border">
                          <p className="text-sm font-medium text-foreground truncate">{deal.name}</p>
                          <p className="text-xs text-muted-foreground">{formatCurrency(deal.value)}</p>
                        </div>
                      ))}
                      {stageDeals.length > 3 && (
                        <p className="text-xs text-muted-foreground text-center">
                          +{stageDeals.length - 3} more
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Deal Modal */}
      {showModal && (
        <DealModal
          deal={editingDeal}
          onSave={handleSaveDeal}
          onClose={() => { setShowModal(false); setEditingDeal(null); }}
        />
      )}
    </div>
  );
}

// Deal Card Component
function DealCard({ 
  deal, 
  onEdit, 
  onDelete, 
  onDragStart, 
  isDragging,
  formatCurrency 
}: { 
  deal: Deal; 
  onEdit: () => void; 
  onDelete: () => void;
  onDragStart: (e: React.DragEvent) => void;
  isDragging: boolean;
  formatCurrency: (value: number) => string;
}) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className={cn(
        'p-3 bg-card rounded-lg border border-border cursor-grab active:cursor-grabbing hover:border-brand/50 transition-colors',
        isDragging && 'opacity-50'
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-sm text-foreground line-clamp-1">{deal.name}</h4>
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
            className="p-1 hover:bg-secondary rounded transition-colors"
          >
            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-32 bg-card border border-border rounded-lg shadow-lg z-10">
              <button
                onClick={() => { onEdit(); setShowMenu(false); }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-secondary"
              >
                <Edit className="w-3 h-3" /> Edit
              </button>
              <button
                onClick={() => { onDelete(); setShowMenu(false); }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 hover:bg-secondary"
              >
                <Trash2 className="w-3 h-3" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>
      
      <p className="text-lg font-bold text-foreground mb-2">{formatCurrency(deal.value)}</p>
      
      {deal.description && (
        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{deal.description}</p>
      )}
      
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {deal.expectedCloseDate 
            ? new Date(deal.expectedCloseDate).toLocaleDateString()
            : 'No date'}
        </div>
        <span className="px-1.5 py-0.5 bg-secondary rounded">{deal.probability}%</span>
      </div>
    </div>
  );
}

// Deal Modal Component
function DealModal({ 
  deal, 
  onSave, 
  onClose 
}: { 
  deal: Deal | null; 
  onSave: (data: Partial<Deal>) => void; 
  onClose: () => void;
}) {
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    stage: Deal['stage'];
    value: string;
    probability: string;
    expectedCloseDate: string;
    source: string;
    notes: string;
  }>({
    name: deal?.name || '',
    description: deal?.description || '',
    stage: deal?.stage || 'lead',
    value: deal?.value?.toString() || '',
    probability: deal?.probability?.toString() || '10',
    expectedCloseDate: deal?.expectedCloseDate || '',
    source: deal?.source || '',
    notes: deal?.notes || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      value: parseFloat(formData.value) || 0,
      probability: parseInt(formData.probability) || 10,
      expectedCloseDate: formData.expectedCloseDate || null,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl border border-border w-full max-w-lg">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold">{deal ? 'Edit Deal' : 'Add Deal'}</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Deal Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Value ($)</label>
              <input
                type="number"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Stage</label>
              <select
                value={formData.stage}
                onChange={(e) => setFormData({ ...formData, stage: e.target.value as Deal['stage'] })}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
              >
                {STAGES.map(s => (
                  <option key={s.key} value={s.key}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Probability (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.probability}
                onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Expected Close</label>
              <input
                type="date"
                value={formData.expectedCloseDate}
                onChange={(e) => setFormData({ ...formData, expectedCloseDate: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Source</label>
            <input
              type="text"
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
              placeholder="e.g., Website, Referral, LinkedIn"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand resize-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand resize-none"
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-muted-foreground hover:text-foreground">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-brand text-brand-foreground rounded-lg hover:bg-brand/90">
              {deal ? 'Save' : 'Create Deal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
