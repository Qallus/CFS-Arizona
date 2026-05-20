'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search,
  Loader2,
  User,
  Phone,
  Mail,
  Building2,
  Tag,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  PhoneCall,
} from 'lucide-react';

interface Contact {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string | null;
  status: string;
  contact_type: string;
  photo: string;
  city: string | null;
  state: string | null;
  tags: Array<{ id: number; title: string; slug: string }>;
  lists: Array<{ id: number; title: string; slug: string }>;
  companies: Array<{ id: number; name: string; logo: string | null }>;
  created_at: string;
}

interface ContactsListProps {
  onSendSms?: (phone: string, contactName: string) => void;
  onCall?: (phone: string, contactName: string) => void;
}

export function ContactsList({ onSendSms, onCall }: ContactsListProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchDebounce, setSearchDebounce] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounce(search);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch contacts
  useEffect(() => {
    fetchContacts();
  }, [currentPage, searchDebounce]);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: '15',
      });
      if (searchDebounce) params.append('search', searchDebounce);

      const response = await fetch(`/api/contacts?${params.toString()}`);
      const data = await response.json();

      setContacts(data.contacts || []);
      setTotalPages(data.pagination?.lastPage || 1);
      setTotal(data.pagination?.total || 0);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'subscribed': return 'bg-green-500/20 text-green-400';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400';
      case 'unsubscribed': return 'bg-red-500/20 text-red-400';
      default: return 'bg-secondary text-muted-foreground';
    }
  };

  // Contact Detail View
  if (selectedContact) {
    return (
      <div className="flex flex-col" style={{ height: '650px' }}>
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedContact(null)}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h3 className="text-lg font-semibold text-foreground">Contact Details</h3>
        </div>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 pb-6">
            {/* Header */}
            <div className="flex items-center gap-4">
              <img
                src={selectedContact.photo}
                alt={selectedContact.full_name}
                className="w-16 h-16 rounded-full object-cover shrink-0"
              />
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-foreground truncate">{selectedContact.full_name}</h2>
                <p className="text-muted-foreground">{selectedContact.contact_type}</p>
                <span className={`inline-block px-2 py-0.5 rounded text-xs mt-1 ${getStatusColor(selectedContact.status)}`}>
                  {selectedContact.status}
                </span>
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                <Mail className="w-5 h-5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-foreground truncate">{selectedContact.email}</p>
                </div>
              </div>

              {selectedContact.phone && (
                <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                  <Phone className="w-5 h-5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="text-foreground">{selectedContact.phone}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {onSendSms && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onSendSms(selectedContact.phone!, selectedContact.full_name)}
                        title="Send SMS"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                    )}
                    {onCall && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onCall(selectedContact.phone!, selectedContact.full_name)}
                        title="Call"
                      >
                        <PhoneCall className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {(selectedContact.city || selectedContact.state) && (
                <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                  <Building2 className="w-5 h-5 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Location</p>
                    <p className="text-foreground">
                      {[selectedContact.city, selectedContact.state].filter(Boolean).join(', ')}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Companies */}
            {selectedContact.companies.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Companies</h4>
                <div className="space-y-2">
                  {selectedContact.companies.map((company) => (
                    <div key={company.id} className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                      {company.logo ? (
                        <img src={company.logo} alt={company.name} className="w-8 h-8 rounded object-cover shrink-0" />
                      ) : (
                        <Building2 className="w-8 h-8 text-muted-foreground shrink-0" />
                      )}
                      <span className="text-foreground truncate">{company.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {selectedContact.tags.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedContact.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="px-3 py-1 bg-brand/20 text-brand/90 rounded-full text-sm"
                    >
                      {tag.title}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Lists */}
            {selectedContact.lists.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Lists</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedContact.lists.map((list) => (
                    <span
                      key={list.id}
                      className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm"
                    >
                      {list.title}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    );
  }

  // Contact List View
  return (
    <div className="flex flex-col" style={{ height: '650px' }}>
      {/* Search */}
      <div className="flex items-center gap-2 mb-4 shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-secondary border-border text-foreground"
          />
        </div>
        <div className="text-sm text-muted-foreground whitespace-nowrap">
          {total} contacts
        </div>
      </div>

      {/* Contact List */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : contacts.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <User className="w-12 h-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No contacts found</p>
        </div>
      ) : (
        <>
          <ScrollArea className="flex-1">
            <div className="space-y-1 pr-4 pb-4">
              {contacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => setSelectedContact(contact)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors text-left"
                >
                  <img
                    src={contact.photo}
                    alt={contact.full_name}
                    className="w-10 h-10 rounded-full object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-foreground truncate">
                        {contact.full_name}
                      </p>
                      <span className={`px-2 py-0.5 rounded text-xs shrink-0 ${getStatusColor(contact.status)}`}>
                        {contact.status}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-sm truncate">{contact.email}</p>
                    {contact.phone && (
                      <p className="text-muted-foreground text-xs">{contact.phone}</p>
                    )}
                  </div>
                  {contact.tags.length > 0 && (
                    <div className="flex items-center gap-1 shrink-0">
                      <Tag className="w-3 h-3 text-brand/90" />
                      <span className="text-xs text-muted-foreground">{contact.tags.length}</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </ScrollArea>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-4 border-t border-border shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Prev
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
