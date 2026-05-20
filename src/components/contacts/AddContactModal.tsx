'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  X, 
  UserPlus,
  Upload,
  Globe,
  Loader2,
  FileSpreadsheet,
  Linkedin,
  Facebook,
  MapPin,
  Search,
  Link2,
  Database,
  Sparkles,
  Building2,
  Users,
  Camera,
  Trash2,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'manual' | 'upload' | 'scrape';
  onModeChange: (mode: 'manual' | 'upload' | 'scrape') => void;
  onContactCreated: () => void;
  defaultType: 'lead' | 'client' | 'company';
}

const SCRAPE_OPTIONS = [
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, description: 'Import contacts from LinkedIn profiles or searches', color: 'text-blue-500' },
  { id: 'facebook', name: 'Facebook Crawl', icon: Facebook, description: 'Extract contacts from Facebook pages or groups', color: 'text-blue-600' },
  { id: 'social', name: 'Social Crawl', icon: Users, description: 'Multi-platform social media contact discovery', color: 'text-purple-500' },
  { id: 'google_maps', name: 'Google Maps Crawl', icon: MapPin, description: 'Find businesses and contacts from Google Maps', color: 'text-green-500' },
  { id: 'enrichment', name: 'Data Enrichment', icon: Database, description: 'Enrich existing contacts with additional data', color: 'text-brand' },
  { id: 'url', name: 'Add Any URL Scrape', icon: Link2, description: 'Scrape contacts from any website (e.g., AIA, directories)', color: 'text-cyan-500' },
];

const AI_PROVIDERS = [
  'Anthropic - Claude',
  'OpenAI - ChatGPT',
  'Google - Gemini',
  'Meta - LLaMA',
  'Mistral AI',
  'Other',
  'Not Sure',
];

export function AddContactModal({ 
  isOpen, 
  onClose, 
  mode, 
  onModeChange, 
  onContactCreated,
  defaultType,
}: AddContactModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [selectedScrapeOption, setSelectedScrapeOption] = useState<string | null>(null);
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  
  // Photo upload state
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  // Manual form state
  const [manualForm, setManualForm] = useState({
    contact_type: defaultType,
    prefix: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company_name: '',
    company_website: '',
    preferred_ai_provider: '',
    ai_clone_goals: '',
  });

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('File is too large. Maximum size is 5MB.');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', defaultType);

      const response = await fetch('/api/uploads', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setPhotoUrl(data.url);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to upload photo');
        setPhotoPreview(null);
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Failed to upload photo');
      setPhotoPreview(null);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    setPhotoUrl(null);
    if (photoInputRef.current) {
      photoInputRef.current.value = '';
    }
  };

  const handleManualSubmit = async () => {
    if (!manualForm.email && !manualForm.phone) {
      alert('Please provide at least an email or phone number');
      return;
    }

    setSaving(true);
    try {
      const submitData: any = { ...manualForm };
      if (photoUrl) {
        submitData.photo = photoUrl;
      }

      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        onContactCreated();
        setManualForm({
          contact_type: defaultType,
          prefix: '',
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          company_name: '',
          company_website: '',
          preferred_ai_provider: '',
          ai_clone_goals: '',
        });
        setPhotoPreview(null);
        setPhotoUrl(null);
      }
    } catch (error) {
      console.error('Error creating contact:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async () => {
    if (!uploadedFile) return;

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('contact_type', defaultType);

      const response = await fetch('/api/contacts/import', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Successfully imported ${result.imported} contacts`);
        onContactCreated();
        setUploadedFile(null);
      }
    } catch (error) {
      console.error('Error importing contacts:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleScrape = async () => {
    if (!selectedScrapeOption) return;
    if (selectedScrapeOption === 'url' && !scrapeUrl) {
      alert('Please enter a URL to scrape');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/contacts/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedScrapeOption,
          url: scrapeUrl,
          contact_type: defaultType,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Scraping started. Job ID: ${result.jobId}`);
        onContactCreated();
      }
    } catch (error) {
      console.error('Error starting scrape:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            {mode === 'manual' && <UserPlus className="w-5 h-5 text-brand" />}
            {mode === 'upload' && <Upload className="w-5 h-5 text-brand" />}
            {mode === 'scrape' && <Globe className="w-5 h-5 text-brand" />}
            <h2 className="text-lg font-semibold text-foreground">
              {mode === 'manual' && 'Add Contact'}
              {mode === 'upload' && 'Import Contacts'}
              {mode === 'scrape' && 'Scrape Contacts'}
            </h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Mode Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => onModeChange('manual')}
            className={cn(
              'flex-1 py-3 text-sm font-medium transition-colors',
              mode === 'manual' 
                ? 'text-brand border-b-2 border-brand' 
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <UserPlus className="w-4 h-4 inline mr-2" />
            Manual
          </button>
          <button
            onClick={() => onModeChange('upload')}
            className={cn(
              'flex-1 py-3 text-sm font-medium transition-colors',
              mode === 'upload' 
                ? 'text-brand border-b-2 border-brand' 
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Upload className="w-4 h-4 inline mr-2" />
            Upload
          </button>
          <button
            onClick={() => onModeChange('scrape')}
            className={cn(
              'flex-1 py-3 text-sm font-medium transition-colors',
              mode === 'scrape' 
                ? 'text-brand border-b-2 border-brand' 
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Globe className="w-4 h-4 inline mr-2" />
            Scrape
          </button>
        </div>

        {/* Content */}
        <ScrollArea className="max-h-[60vh]">
          <div className="p-6">
            {/* Manual Mode */}
            {mode === 'manual' && (
              <div className="space-y-4">
                {/* Contact Type */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Contact Type</label>
                  <div className="flex gap-2">
                    {['lead', 'client', 'company'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setManualForm({ ...manualForm, contact_type: type as any })}
                        className={cn(
                          'px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize',
                          manualForm.contact_type === type
                            ? 'bg-brand text-brand-foreground'
                            : 'bg-secondary text-muted-foreground hover:text-foreground'
                        )}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Photo Upload */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Photo / Logo</label>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-dashed border-border bg-secondary flex items-center justify-center">
                        {photoPreview ? (
                          <img 
                            src={photoPreview} 
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-8 h-8 text-muted-foreground" />
                        )}
                      </div>
                      {uploadingPhoto && (
                        <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                          <Loader2 className="w-6 h-6 animate-spin text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <input
                        ref={photoInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        onChange={handlePhotoSelect}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => photoInputRef.current?.click()}
                        disabled={uploadingPhoto}
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        {photoPreview ? 'Change Photo' : 'Upload Photo'}
                      </Button>
                      {photoPreview && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleRemovePhoto}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remove
                        </Button>
                      )}
                      <p className="text-xs text-muted-foreground">
                        JPEG, PNG, GIF, or WebP. Max 5MB.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Name Fields */}
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">Prefix</label>
                    <select
                      value={manualForm.prefix}
                      onChange={(e) => setManualForm({ ...manualForm, prefix: e.target.value })}
                      className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground text-sm"
                    >
                      <option value="">-</option>
                      <option value="Mr">Mr</option>
                      <option value="Mrs">Mrs</option>
                      <option value="Ms">Ms</option>
                      <option value="Dr">Dr</option>
                    </select>
                  </div>
                  <div className="col-span-1">
                    <label className="block text-sm text-muted-foreground mb-1">First Name</label>
                    <Input
                      value={manualForm.first_name}
                      onChange={(e) => setManualForm({ ...manualForm, first_name: e.target.value })}
                      className="bg-secondary border-border"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm text-muted-foreground mb-1">Last Name</label>
                    <Input
                      value={manualForm.last_name}
                      onChange={(e) => setManualForm({ ...manualForm, last_name: e.target.value })}
                      className="bg-secondary border-border"
                    />
                  </div>
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">Email *</label>
                    <Input
                      type="email"
                      value={manualForm.email}
                      onChange={(e) => setManualForm({ ...manualForm, email: e.target.value })}
                      className="bg-secondary border-border"
                      placeholder="email@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">Phone</label>
                    <Input
                      type="tel"
                      value={manualForm.phone}
                      onChange={(e) => setManualForm({ ...manualForm, phone: e.target.value })}
                      className="bg-secondary border-border"
                      placeholder="+1 (480) 555-1234"
                    />
                  </div>
                </div>

                {/* Company Info */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">Company Name</label>
                    <Input
                      value={manualForm.company_name}
                      onChange={(e) => setManualForm({ ...manualForm, company_name: e.target.value })}
                      className="bg-secondary border-border"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">Company Website</label>
                    <Input
                      type="url"
                      value={manualForm.company_website}
                      onChange={(e) => setManualForm({ ...manualForm, company_website: e.target.value })}
                      className="bg-secondary border-border"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                {/* AI Details */}
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Preferred AI Provider</label>
                  <select
                    value={manualForm.preferred_ai_provider}
                    onChange={(e) => setManualForm({ ...manualForm, preferred_ai_provider: e.target.value })}
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground text-sm"
                  >
                    <option value="">Select...</option>
                    {AI_PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-muted-foreground mb-1">AI Clone Goals</label>
                  <Textarea
                    value={manualForm.ai_clone_goals}
                    onChange={(e) => setManualForm({ ...manualForm, ai_clone_goals: e.target.value })}
                    className="bg-secondary border-border resize-none"
                    rows={3}
                    placeholder="What would you like your AI Clone to do..."
                  />
                </div>

                <Button 
                  onClick={handleManualSubmit} 
                  disabled={saving} 
                  className="w-full bg-brand hover:bg-brand/90"
                >
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
                  Add Contact
                </Button>
              </div>
            )}

            {/* Upload Mode */}
            {mode === 'upload' && (
              <div className="space-y-4">
                <div 
                  className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-brand/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    className="hidden"
                    onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                  />
                  <FileSpreadsheet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  {uploadedFile ? (
                    <div>
                      <p className="text-foreground font-medium">{uploadedFile.name}</p>
                      <p className="text-muted-foreground text-sm mt-1">
                        {(uploadedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-foreground font-medium">Click to upload CSV or Excel file</p>
                      <p className="text-muted-foreground text-sm mt-1">
                        Supports .csv, .xlsx, .xls
                      </p>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-secondary/50 rounded-lg">
                  <p className="text-sm font-medium text-foreground mb-2">Expected Columns:</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    first_name, last_name, email, phone, company_name, company_website
                  </p>
                </div>

                <Button 
                  onClick={handleFileUpload} 
                  disabled={saving || !uploadedFile} 
                  className="w-full bg-brand hover:bg-brand/90"
                >
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                  Import Contacts
                </Button>
              </div>
            )}

            {/* Scrape Mode */}
            {mode === 'scrape' && (
              <div className="space-y-4">
                <p className="text-muted-foreground text-sm">
                  Select a scraping method to discover and import new contacts.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  {SCRAPE_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setSelectedScrapeOption(option.id)}
                      className={cn(
                        'p-4 rounded-lg border text-left transition-all',
                        selectedScrapeOption === option.id
                          ? 'border-brand bg-brand/10'
                          : 'border-border bg-secondary/30 hover:bg-secondary/50'
                      )}
                    >
                      <option.icon className={cn('w-6 h-6 mb-2', option.color)} />
                      <p className="font-medium text-foreground text-sm">{option.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
                    </button>
                  ))}
                </div>

                {selectedScrapeOption === 'url' && (
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">URL to Scrape</label>
                    <Input
                      type="url"
                      value={scrapeUrl}
                      onChange={(e) => setScrapeUrl(e.target.value)}
                      className="bg-secondary border-border"
                      placeholder="https://www.aia.org/members-directory"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Example: American Institute of Architects directory
                    </p>
                  </div>
                )}

                {selectedScrapeOption && selectedScrapeOption !== 'url' && (
                  <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <p className="text-sm text-blue-400">
                      {selectedScrapeOption === 'linkedin' && 'Connect your LinkedIn account to import connections and search results.'}
                      {selectedScrapeOption === 'facebook' && 'Provide Facebook page or group URLs to extract contact information.'}
                      {selectedScrapeOption === 'social' && 'Multi-platform discovery across Twitter, Instagram, and more.'}
                      {selectedScrapeOption === 'google_maps' && 'Search for businesses by category and location.'}
                      {selectedScrapeOption === 'enrichment' && 'Enhance existing contacts with additional data from various sources.'}
                    </p>
                  </div>
                )}

                <Button 
                  onClick={handleScrape} 
                  disabled={saving || !selectedScrapeOption} 
                  className="w-full bg-brand hover:bg-brand/90"
                >
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                  Start Scraping
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
