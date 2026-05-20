'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Filter, 
  X, 
  Tag, 
  List, 
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Search,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterOption {
  id: string;
  title: string;
  slug?: string;
  count?: number;
}

interface ContactFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: FilterState) => void;
  currentFilters: FilterState;
}

export interface FilterState {
  status: string[];
  tags: string[];
  lists: string[];
}

const STATUS_OPTIONS = [
  { id: 'subscribed', title: 'Subscribed', color: 'bg-green-500' },
  { id: 'unsubscribed', title: 'Unsubscribed', color: 'bg-red-500' },
  { id: 'pending', title: 'Pending', color: 'bg-yellow-500' },
  { id: 'bounced', title: 'Bounced', color: 'bg-brand' },
];

export function ContactFilters({ isOpen, onClose, onApply, currentFilters }: ContactFiltersProps) {
  const [filters, setFilters] = useState<FilterState>(currentFilters);
  const [tags, setTags] = useState<FilterOption[]>([]);
  const [lists, setLists] = useState<FilterOption[]>([]);
  const [loadingTags, setLoadingTags] = useState(false);
  const [loadingLists, setLoadingLists] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    status: true,
    tags: true,
    lists: true,
  });
  const [tagSearch, setTagSearch] = useState('');
  const [listSearch, setListSearch] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchTags();
      fetchLists();
    }
  }, [isOpen]);

  useEffect(() => {
    setFilters(currentFilters);
  }, [currentFilters]);

  const fetchTags = async () => {
    setLoadingTags(true);
    try {
      const response = await fetch('/api/contacts/tags');
      const data = await response.json();
      setTags(data.tags || []);
    } catch (error) {
      console.error('Error fetching tags:', error);
    } finally {
      setLoadingTags(false);
    }
  };

  const fetchLists = async () => {
    setLoadingLists(true);
    try {
      const response = await fetch('/api/contacts/lists');
      const data = await response.json();
      setLists(data.lists || []);
    } catch (error) {
      console.error('Error fetching lists:', error);
    } finally {
      setLoadingLists(false);
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleFilter = (type: keyof FilterState, value: string) => {
    setFilters(prev => ({
      ...prev,
      [type]: prev[type].includes(value)
        ? prev[type].filter(v => v !== value)
        : [...prev[type], value]
    }));
  };

  const clearFilters = () => {
    setFilters({ status: [], tags: [], lists: [] });
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const activeFilterCount = filters.status.length + filters.tags.length + filters.lists.length;

  const filteredTags = tags.filter(tag => 
    tag.title.toLowerCase().includes(tagSearch.toLowerCase())
  );

  const filteredLists = lists.filter(list => 
    list.title.toLowerCase().includes(listSearch.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      {/* Panel */}
      <div className="relative w-80 bg-card border-l border-border h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-brand" />
            <h2 className="font-semibold text-foreground">Filters</h2>
            {activeFilterCount > 0 && (
              <span className="px-2 py-0.5 bg-brand text-brand-foreground text-xs rounded-full">
                {activeFilterCount}
              </span>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Filter Sections */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {/* Status Filter */}
            <div className="border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection('status')}
                className="w-full flex items-center justify-between p-3 bg-secondary/30 hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="font-medium text-foreground text-sm">Status</span>
                  {filters.status.length > 0 && (
                    <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">
                      {filters.status.length}
                    </span>
                  )}
                </div>
                {expandedSections.status ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
              {expandedSections.status && (
                <div className="p-3 space-y-2">
                  {STATUS_OPTIONS.map((status) => (
                    <label
                      key={status.id}
                      className="flex items-center gap-3 cursor-pointer hover:bg-secondary/30 p-2 rounded-lg transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={filters.status.includes(status.id)}
                        onChange={() => toggleFilter('status', status.id)}
                        className="w-4 h-4 rounded border-border text-brand focus:ring-brand"
                      />
                      <div className={cn('w-2 h-2 rounded-full', status.color)} />
                      <span className="text-sm text-foreground">{status.title}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Tags Filter */}
            <div className="border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection('tags')}
                className="w-full flex items-center justify-between p-3 bg-secondary/30 hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-brand" />
                  <span className="font-medium text-foreground text-sm">Tags</span>
                  {filters.tags.length > 0 && (
                    <span className="px-1.5 py-0.5 bg-brand/20 text-brand/90 text-xs rounded">
                      {filters.tags.length}
                    </span>
                  )}
                </div>
                {expandedSections.tags ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
              {expandedSections.tags && (
                <div className="p-3 space-y-2">
                  {loadingTags ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : tags.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-2">No tags found</p>
                  ) : (
                    <>
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                        <Input
                          placeholder="Search tags..."
                          value={tagSearch}
                          onChange={(e) => setTagSearch(e.target.value)}
                          className="pl-7 h-8 text-sm bg-secondary border-border"
                        />
                      </div>
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {filteredTags.map((tag) => (
                          <label
                            key={tag.id}
                            className="flex items-center gap-3 cursor-pointer hover:bg-secondary/30 p-2 rounded-lg transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={filters.tags.includes(tag.id)}
                              onChange={() => toggleFilter('tags', tag.id)}
                              className="w-4 h-4 rounded border-border text-brand focus:ring-brand"
                            />
                            <span className="text-sm text-foreground flex-1 truncate">{tag.title}</span>
                            {tag.count !== undefined && (
                              <span className="text-xs text-muted-foreground">{tag.count}</span>
                            )}
                          </label>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Lists Filter */}
            <div className="border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection('lists')}
                className="w-full flex items-center justify-between p-3 bg-secondary/30 hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <List className="w-4 h-4 text-blue-500" />
                  <span className="font-medium text-foreground text-sm">Lists</span>
                  {filters.lists.length > 0 && (
                    <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded">
                      {filters.lists.length}
                    </span>
                  )}
                </div>
                {expandedSections.lists ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
              {expandedSections.lists && (
                <div className="p-3 space-y-2">
                  {loadingLists ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : lists.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-2">No lists found</p>
                  ) : (
                    <>
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                        <Input
                          placeholder="Search lists..."
                          value={listSearch}
                          onChange={(e) => setListSearch(e.target.value)}
                          className="pl-7 h-8 text-sm bg-secondary border-border"
                        />
                      </div>
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {filteredLists.map((list) => (
                          <label
                            key={list.id}
                            className="flex items-center gap-3 cursor-pointer hover:bg-secondary/30 p-2 rounded-lg transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={filters.lists.includes(list.id)}
                              onChange={() => toggleFilter('lists', list.id)}
                              className="w-4 h-4 rounded border-border text-brand focus:ring-brand"
                            />
                            <span className="text-sm text-foreground flex-1 truncate">{list.title}</span>
                            {list.count !== undefined && (
                              <span className="text-xs text-muted-foreground">{list.count}</span>
                            )}
                          </label>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 border-t border-border space-y-2">
          {activeFilterCount > 0 && (
            <Button variant="outline" className="w-full" onClick={clearFilters}>
              Clear All Filters
            </Button>
          )}
          <Button className="w-full bg-brand hover:bg-brand/90" onClick={handleApply}>
            Apply Filters
          </Button>
        </div>
      </div>
    </div>
  );
}

// Active Filters Display Component
export function ActiveFilters({ 
  filters, 
  tags,
  lists,
  onRemove, 
  onClearAll 
}: { 
  filters: FilterState;
  tags: FilterOption[];
  lists: FilterOption[];
  onRemove: (type: keyof FilterState, value: string) => void;
  onClearAll: () => void;
}) {
  const activeCount = filters.status.length + filters.tags.length + filters.lists.length;
  
  if (activeCount === 0) return null;

  const getTagName = (id: string) => tags.find(t => t.id === id)?.title || id;
  const getListName = (id: string) => lists.find(l => l.id === id)?.title || id;
  const getStatusName = (id: string) => STATUS_OPTIONS.find(s => s.id === id)?.title || id;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <span className="text-sm text-muted-foreground">Active filters:</span>
      
      {filters.status.map(status => (
        <span
          key={`status-${status}`}
          className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs"
        >
          {getStatusName(status)}
          <button onClick={() => onRemove('status', status)} className="hover:text-green-300">
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      
      {filters.tags.map(tag => (
        <span
          key={`tag-${tag}`}
          className="inline-flex items-center gap-1 px-2 py-1 bg-brand/20 text-brand/90 rounded text-xs"
        >
          <Tag className="w-3 h-3" />
          {getTagName(tag)}
          <button onClick={() => onRemove('tags', tag)} className="hover:text-brand/70">
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      
      {filters.lists.map(list => (
        <span
          key={`list-${list}`}
          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs"
        >
          <List className="w-3 h-3" />
          {getListName(list)}
          <button onClick={() => onRemove('lists', list)} className="hover:text-blue-300">
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      
      <button
        onClick={onClearAll}
        className="text-xs text-muted-foreground hover:text-foreground underline"
      >
        Clear all
      </button>
    </div>
  );
}
