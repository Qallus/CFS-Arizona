'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  User, 
  Building2, 
  Mail, 
  Phone,
  MessageSquare,
  PhoneCall,
  Loader2,
  Filter,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Contact {
  id: string;
  prefix?: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  email: string;
  phone?: string;
  company_name?: string;
  status?: string;
  tags?: any[];
  avatar?: string;
  photo?: string;
  contact_type?: 'lead' | 'client' | 'company';
  last_activity?: string;
}

interface ContactsListProps {
  contacts: Contact[];
  loading: boolean;
  onSelect: (contact: Contact) => void;
  selectedId?: string;
  contactType: 'lead' | 'client' | 'company' | 'all';
  onSendSms?: (phone: string, name: string) => void;
  onCall?: (phone: string, name: string) => void;
  onEmail?: (email: string, name: string) => void;
}

export function ContactsList({ 
  contacts, 
  loading, 
  onSelect, 
  selectedId,
  contactType,
  onSendSms,
  onCall,
  onEmail,
}: ContactsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const filteredContacts = contacts.filter(contact => {
    const fullName = `${contact.first_name} ${contact.last_name}`.toLowerCase();
    const matchesSearch = 
      fullName.includes(searchTerm.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.phone?.includes(searchTerm) ||
      contact.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || contact.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'subscribed': return 'bg-green-500/20 text-green-400';
      case 'unsubscribed': return 'bg-red-500/20 text-red-400';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400';
      case 'bounced': return 'bg-brand/20 text-brand/90';
      default: return 'bg-secondary text-muted-foreground';
    }
  };

  const getContactName = (contact: Contact) => {
    if (contactType === 'company') {
      return contact.company_name || 'Unnamed Company';
    }
    return contact.full_name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || contact.email || 'Unnamed Contact';
  };

  const getInitials = (contact: Contact) => {
    if (contactType === 'company') {
      return contact.company_name?.substring(0, 2).toUpperCase() || 'CO';
    }
    const first = contact.first_name?.[0] || '';
    const last = contact.last_name?.[0] || '';
    return (first + last).toUpperCase() || contact.email?.[0]?.toUpperCase() || 'NA';
  };

  const getAvatarUrl = (contact: Contact) => {
    // Try photo first (Fluent CRM), then avatar, then generate one
    if (contact.photo && contact.photo !== 'null' && !contact.photo.includes('undefined')) {
      return contact.photo;
    }
    if (contact.avatar && contact.avatar !== 'null' && !contact.avatar.includes('undefined')) {
      return contact.avatar;
    }
    const name = getContactName(contact);
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=f97316&color=fff`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search & Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-secondary border-border"
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="w-4 h-4" />
        </Button>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        {filteredContacts.length} {contactType === 'company' ? 'companies' : 'contacts'}
      </p>

      {/* Contact List */}
      {filteredContacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          {contactType === 'company' ? (
            <Building2 className="w-12 h-12 text-muted-foreground/30 mb-4" />
          ) : (
            <User className="w-12 h-12 text-muted-foreground/30 mb-4" />
          )}
          <p className="text-muted-foreground">
            {searchTerm ? 'No contacts match your search' : `No ${contactType}s found`}
          </p>
        </div>
      ) : (
        <ScrollArea className="h-[550px]">
          <div className="space-y-2 pr-4">
            {filteredContacts.map((contact) => (
              <button
                key={contact.id}
                onClick={() => onSelect(contact)}
                className={cn(
                  'w-full flex items-center gap-4 p-4 rounded-lg transition-colors text-left',
                  selectedId === contact.id
                    ? 'bg-brand/20 border border-brand/50'
                    : 'bg-secondary/30 hover:bg-secondary/50'
                )}
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full shrink-0 overflow-hidden">
                  <img 
                    src={getAvatarUrl(contact)} 
                    alt={getContactName(contact)}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to initials avatar if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(getContactName(contact))}&background=f97316&color=fff`;
                    }}
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground truncate">
                      {getContactName(contact)}
                    </p>
                    {contact.status && (
                      <span className={cn('px-2 py-0.5 rounded text-xs', getStatusColor(contact.status))}>
                        {contact.status}
                      </span>
                    )}
                  </div>
                  {contactType !== 'company' && contact.company_name && (
                    <p className="text-sm text-muted-foreground truncate">{contact.company_name}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1">
                    {contact.email && (
                      <span className="text-xs text-muted-foreground truncate flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {contact.email}
                      </span>
                    )}
                  </div>
                  {contact.tags && contact.tags.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {contact.tags.slice(0, 3).map((tag, i) => (
                        <span key={i} className="px-2 py-0.5 bg-secondary rounded text-xs text-muted-foreground">
                          {typeof tag === 'string' ? tag : (tag.title || tag.name || '')}
                        </span>
                      ))}
                      {contact.tags.length > 3 && (
                        <span className="text-xs text-muted-foreground">+{contact.tags.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                {(contact.phone || contact.email) && (
                  <div className="flex gap-1 shrink-0">
                    {contact.phone && onCall && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 hover:bg-green-500/20 hover:text-green-500"
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          onCall(contact.phone!, getContactName(contact)); 
                        }}
                        title="Call"
                      >
                        <PhoneCall className="w-4 h-4" />
                      </Button>
                    )}
                    {contact.phone && onSendSms && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 hover:bg-blue-500/20 hover:text-blue-500"
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          onSendSms(contact.phone!, getContactName(contact)); 
                        }}
                        title="Send SMS"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                    )}
                    {contact.email && onEmail && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 hover:bg-purple-500/20 hover:text-purple-500"
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          onEmail(contact.email!, getContactName(contact)); 
                        }}
                        title="Send Email"
                      >
                        <Mail className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
              </button>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
