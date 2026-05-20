'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  UserPlus, 
  Building2, 
  Sparkles,
  Plus,
  Upload,
  Globe,
  Search,
  Contact,
  Filter,
} from 'lucide-react';
import { ContactsList } from '@/components/contacts/ContactsList';
import { ContactDetail } from '@/components/contacts/ContactDetail';
import { AddContactModal } from '@/components/contacts/AddContactModal';
import { EnrichPanel } from '@/components/contacts/EnrichPanel';
import { ScrapePanel } from '@/components/contacts/ScrapePanel';
import { DialpadModal } from '@/components/contacts/DialpadModal';
import { SmsModal } from '@/components/contacts/SmsModal';
import { EmailModal } from '@/components/contacts/EmailModal';
import { ContactFilters, ActiveFilters, FilterState } from '@/components/contacts/ContactFilters';

interface ContactData {
  id: string;
  prefix?: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  email: string;
  phone?: string;
  photo?: string;
  date_of_birth?: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  company_name?: string;
  company_website?: string;
  status?: string;
  tags?: any[];
  lists?: any[];
  avatar?: string;
  direction?: string;
  sms_timestamp?: string;
  incoming_sms_message?: string;
  preferred_ai_provider?: string;
  ai_clone_budget?: string;
  ai_clone_goals?: string;
  contact_type?: 'lead' | 'client' | 'company';
  created_at?: string;
  last_activity?: string;
}

export default function ContactsPage() {
  const [activeTab, setActiveTab] = useState('contacts');
  const [contacts, setContacts] = useState<ContactData[]>([]);
  const [selectedContact, setSelectedContact] = useState<ContactData | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addMode, setAddMode] = useState<'manual' | 'upload' | 'scrape'>('manual');
  const [loading, setLoading] = useState(true);
  
  // Communication modal states
  const [showDialpad, setShowDialpad] = useState(false);
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [commTarget, setCommTarget] = useState<{ phone?: string; email?: string; name: string }>({ name: '' });

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({ status: [], tags: [], lists: [] });
  const [availableTags, setAvailableTags] = useState<Array<{ id: string; title: string; count?: number }>>([]);
  const [availableLists, setAvailableLists] = useState<Array<{ id: string; title: string; count?: number }>>([]);

  useEffect(() => {
    if (['contacts', 'leads', 'clients', 'companies'].includes(activeTab)) {
      fetchContacts();
    }
  }, [activeTab, filters]);

  useEffect(() => {
    fetchTagsAndLists();
  }, []);

  const fetchTagsAndLists = async () => {
    try {
      const [tagsRes, listsRes] = await Promise.all([
        fetch('/api/contacts/tags'),
        fetch('/api/contacts/lists'),
      ]);
      const tagsData = await tagsRes.json();
      const listsData = await listsRes.json();
      setAvailableTags(tagsData.tags || []);
      setAvailableLists(listsData.lists || []);
    } catch (error) {
      console.error('Error fetching tags/lists:', error);
    }
  };

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        per_page: '500', // Load up to 500 contacts
      });
      
      // Only add type filter for specific tabs
      if (activeTab === 'leads') {
        params.append('type', 'lead');
      } else if (activeTab === 'clients') {
        params.append('type', 'client');
      } else if (activeTab === 'companies') {
        params.append('type', 'company');
      }

      // Add filter params
      if (filters.status.length > 0) {
        filters.status.forEach(s => params.append('status', s));
      }
      if (filters.tags.length > 0) {
        filters.tags.forEach(t => params.append('tag', t));
      }
      if (filters.lists.length > 0) {
        filters.lists.forEach(l => params.append('list', l));
      }
      
      const response = await fetch(`/api/contacts?${params.toString()}`);
      const data = await response.json();
      setContacts(data.contacts || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const handleRemoveFilter = (type: keyof FilterState, value: string) => {
    setFilters(prev => ({
      ...prev,
      [type]: prev[type].filter(v => v !== value)
    }));
  };

  const handleClearAllFilters = () => {
    setFilters({ status: [], tags: [], lists: [] });
  };

  const activeFilterCount = filters.status.length + filters.tags.length + filters.lists.length;

  const handleAddContact = (mode: 'manual' | 'upload' | 'scrape') => {
    setAddMode(mode);
    setShowAddModal(true);
  };

  const handleContactSelect = (contact: ContactData) => {
    setSelectedContact(contact);
  };

  const handleContactUpdate = async (updatedContact: ContactData) => {
    setContacts(prev => prev.map(c => c.id === updatedContact.id ? updatedContact : c));
    setSelectedContact(updatedContact);
  };

  const handleContactCreated = () => {
    setShowAddModal(false);
    fetchContacts();
  };

  const handleCall = (phone: string, name: string) => {
    setCommTarget({ phone, name });
    setShowDialpad(true);
  };

  const handleSendSms = (phone: string, name: string) => {
    setCommTarget({ phone, name });
    setShowSmsModal(true);
  };

  const handleEmail = (email: string, name: string) => {
    setCommTarget({ email, name });
    setShowEmailModal(true);
  };

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case 'contacts': return Users;
      case 'leads': return UserPlus;
      case 'clients': return Users;
      case 'companies': return Building2;
      case 'enrich': return Sparkles;
      case 'scrape': return Globe;
      default: return Users;
    }
  };

  const getDefaultType = () => {
    if (activeTab === 'companies') return 'company';
    if (activeTab === 'clients') return 'client';
    return 'lead';
  };

  // Render contact list section (shared by contacts, leads, clients, companies tabs)
  const renderContactsSection = (tabType: string) => {
    const Icon = getTabIcon(tabType);
    const title = tabType.charAt(0).toUpperCase() + tabType.slice(1);
    const iconColor = tabType === 'contacts' ? 'text-brand' : 
                      tabType === 'leads' ? 'text-blue-500' :
                      tabType === 'clients' ? 'text-green-500' : 'text-purple-500';

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="bg-card/50 border-border min-h-[700px]">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Icon className={`w-5 h-5 ${iconColor}`} />
                {tabType === 'contacts' ? 'Fluent CRM Contacts' : title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ContactsList 
                contacts={contacts}
                loading={loading}
                onSelect={handleContactSelect}
                selectedId={selectedContact?.id}
                contactType={tabType === 'contacts' ? 'all' : tabType as any}
                onCall={handleCall}
                onSendSms={handleSendSms}
                onEmail={handleEmail}
              />
            </CardContent>
          </Card>
        </div>
        <div>
          {selectedContact ? (
            <ContactDetail 
              contact={selectedContact} 
              onUpdate={handleContactUpdate}
              onClose={() => setSelectedContact(null)}
              onCall={handleCall}
              onSendSms={handleSendSms}
              onEmail={handleEmail}
            />
          ) : (
            <Card className="bg-card/50 border-border">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Icon className="w-12 h-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">Select a contact to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-brand" />
            <h1 className="text-3xl font-bold text-foreground">Contacts</h1>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowFilters(true)}
              className={activeFilterCount > 0 ? 'border-brand text-brand' : ''}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-brand text-brand-foreground text-xs rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleAddContact('upload')}>
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
            <Button size="sm" className="bg-brand hover:bg-brand/90" onClick={() => handleAddContact('manual')}>
              <Plus className="w-4 h-4 mr-2" />
              Add Contact
            </Button>
          </div>
        </div>
        <p className="text-muted-foreground">Manage contacts, leads, clients, companies, enrich and scrape lead/ contact data</p>
      </div>

      {/* Active Filters Display */}
      <ActiveFilters
        filters={filters}
        tags={availableTags}
        lists={availableLists}
        onRemove={handleRemoveFilter}
        onClearAll={handleClearAllFilters}
      />

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-secondary">
          <TabsTrigger value="contacts" className="data-[state=active]:bg-muted">
            <Users className="w-4 h-4 mr-2" />
            Contacts
          </TabsTrigger>
          <TabsTrigger value="leads" className="data-[state=active]:bg-muted">
            <UserPlus className="w-4 h-4 mr-2" />
            Leads
          </TabsTrigger>
          <TabsTrigger value="clients" className="data-[state=active]:bg-muted">
            <Users className="w-4 h-4 mr-2" />
            Clients
          </TabsTrigger>
          <TabsTrigger value="companies" className="data-[state=active]:bg-muted">
            <Building2 className="w-4 h-4 mr-2" />
            Companies
          </TabsTrigger>
          <TabsTrigger value="enrich" className="data-[state=active]:bg-muted">
            <Sparkles className="w-4 h-4 mr-2" />
            Enrich
          </TabsTrigger>
          <TabsTrigger value="scrape" className="data-[state=active]:bg-muted">
            <Globe className="w-4 h-4 mr-2" />
            Scrape
          </TabsTrigger>
        </TabsList>

        {/* Contacts Tab - All Contacts */}
        <TabsContent value="contacts" className="mt-0">
          {renderContactsSection('contacts')}
        </TabsContent>

        {/* Leads Tab */}
        <TabsContent value="leads" className="mt-0">
          {renderContactsSection('leads')}
        </TabsContent>

        {/* Clients Tab */}
        <TabsContent value="clients" className="mt-0">
          {renderContactsSection('clients')}
        </TabsContent>

        {/* Companies Tab */}
        <TabsContent value="companies" className="mt-0">
          {renderContactsSection('companies')}
        </TabsContent>

        {/* Enrich Tab */}
        <TabsContent value="enrich" className="mt-0">
          <EnrichPanel onContactsEnriched={fetchContacts} />
        </TabsContent>

        {/* Scrape Tab */}
        <TabsContent value="scrape" className="mt-0">
          <ScrapePanel onContactsScraped={fetchContacts} />
        </TabsContent>
      </Tabs>

      {/* Add Contact Modal */}
      <AddContactModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        mode={addMode}
        onModeChange={setAddMode}
        onContactCreated={handleContactCreated}
        defaultType={getDefaultType()}
      />

      {/* Communication Modals */}
      <DialpadModal
        isOpen={showDialpad}
        onClose={() => setShowDialpad(false)}
        initialPhone={commTarget.phone}
        contactName={commTarget.name}
      />
      <SmsModal
        isOpen={showSmsModal}
        onClose={() => setShowSmsModal(false)}
        initialPhone={commTarget.phone}
        contactName={commTarget.name}
      />
      <EmailModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        initialEmail={commTarget.email}
        contactName={commTarget.name}
      />

      {/* Filter Panel */}
      <ContactFilters
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={handleApplyFilters}
        currentFilters={filters}
      />
    </div>
  );
}
