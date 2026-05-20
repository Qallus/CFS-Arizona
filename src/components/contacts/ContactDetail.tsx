'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  Globe,
  MapPin,
  Calendar,
  MessageSquare,
  PhoneCall,
  X,
  Pencil,
  Save,
  Loader2,
  Bot,
  Tag,
  List,
  Clock,
  ArrowDownLeft,
  DollarSign,
  Camera,
  Upload,
  Trash2,
} from 'lucide-react';

interface Contact {
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

interface ContactDetailProps {
  contact: Contact;
  onUpdate: (contact: Contact) => void;
  onClose: () => void;
  onCall?: (phone: string, name: string) => void;
  onSendSms?: (phone: string, name: string) => void;
  onEmail?: (email: string, name: string) => void;
}

const PREFIXES = ['Mr', 'Mrs', 'Ms', 'Dr', 'Prof', ''];
const AI_PROVIDERS = [
  'Anthropic - Claude',
  'OpenAI - ChatGPT',
  'Google - Gemini',
  'Meta - LLaMA',
  'Mistral AI',
  'Other',
  'Not Sure',
];
const COUNTRIES = ['United States (US)', 'Canada', 'United Kingdom', 'Australia', 'Germany', 'France', 'Other'];

export function ContactDetail({ contact, onUpdate, onClose, onCall, onSendSms, onEmail }: ContactDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [newPhotoUrl, setNewPhotoUrl] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [editForm, setEditForm] = useState({
    prefix: contact.prefix || '',
    first_name: contact.first_name || '',
    last_name: contact.last_name || '',
    email: contact.email || '',
    phone: contact.phone || '',
    date_of_birth: contact.date_of_birth || '',
    address_line_1: contact.address_line_1 || '',
    address_line_2: contact.address_line_2 || '',
    city: contact.city || '',
    state: contact.state || '',
    zip_code: contact.zip_code || '',
    country: contact.country || '',
    company_name: contact.company_name || '',
    company_website: contact.company_website || '',
    direction: contact.direction || '',
    status: contact.status || '',
    sms_timestamp: contact.sms_timestamp || '',
    incoming_sms_message: contact.incoming_sms_message || '',
    preferred_ai_provider: contact.preferred_ai_provider || '',
    ai_clone_budget: contact.ai_clone_budget || '',
    ai_clone_goals: contact.ai_clone_goals || '',
  });

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
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
      formData.append('contactId', contact.id);
      formData.append('type', contact.contact_type || 'contact');

      const response = await fetch('/api/uploads', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setNewPhotoUrl(data.url);
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
    setNewPhotoUrl(null);
    if (photoInputRef.current) {
      photoInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updateData: any = {
        id: contact.id,
        ...editForm,
      };

      // Include new photo URL if uploaded
      if (newPhotoUrl) {
        updateData.photo = newPhotoUrl;
      }

      const response = await fetch('/api/contacts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const updated = await response.json();
        onUpdate({ ...contact, ...editForm, photo: newPhotoUrl || contact.photo });
        setIsEditing(false);
        setPhotoPreview(null);
        setNewPhotoUrl(null);
      }
    } catch (error) {
      console.error('Error updating contact:', error);
    } finally {
      setSaving(false);
    }
  };

  const getInitials = () => {
    const first = contact.first_name?.[0] || '';
    const last = contact.last_name?.[0] || '';
    return (first + last).toUpperCase() || contact.email?.[0]?.toUpperCase() || 'NA';
  };

  const getContactName = () => {
    return contact.full_name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || contact.email || 'Contact';
  };

  const getAvatarUrl = () => {
    if (contact.photo && contact.photo !== 'null' && !contact.photo.includes('undefined')) {
      return contact.photo;
    }
    if (contact.avatar && contact.avatar !== 'null' && !contact.avatar.includes('undefined')) {
      return contact.avatar;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(getContactName())}&background=f97316&color=fff`;
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'subscribed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'unsubscribed': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-secondary text-muted-foreground border-border';
    }
  };

  return (
    <Card className="bg-card/50 border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-foreground flex items-center gap-2">
            <User className="w-5 h-5 text-brand" />
            Contact Details
          </CardTitle>
          <div className="flex gap-2">
            {!isEditing ? (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Pencil className="w-4 h-4 mr-1" />
                Edit
              </Button>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={() => setIsEditing(false)} disabled={saving}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saving} className="bg-brand hover:bg-brand/90">
                  {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                  Save
                </Button>
              </>
            )}
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-6">
            {/* Header with Avatar */}
            <div className="flex items-center gap-4 pb-4 border-b border-border">
              <div className="relative">
                <div className="w-20 h-20 rounded-full overflow-hidden shrink-0 border-2 border-border">
                  <img 
                    src={photoPreview || getAvatarUrl()} 
                    alt={getContactName()}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(getContactName())}&background=f97316&color=fff`;
                    }}
                  />
                </div>
                {isEditing && (
                  <div className="absolute -bottom-1 -right-1 flex gap-1">
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="w-8 h-8 rounded-full bg-card border-border"
                      onClick={() => photoInputRef.current?.click()}
                      disabled={uploadingPhoto}
                    >
                      {uploadingPhoto ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Camera className="w-4 h-4" />
                      )}
                    </Button>
                    {(photoPreview || contact.photo) && (
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="w-8 h-8 rounded-full bg-card border-red-500/50 hover:bg-red-500/10"
                        onClick={handleRemovePhoto}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {contact.prefix && `${contact.prefix} `}{contact.first_name} {contact.last_name}
                </h3>
                <p className="text-muted-foreground text-sm">{contact.email}</p>
                {isEditing && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Click camera to upload photo (max 5MB)
                  </p>
                )}
                {!isEditing && (
                  <div className="flex gap-2 mt-2">
                    {contact.status && (
                      <span className={`px-2 py-0.5 rounded text-xs border ${getStatusColor(contact.status)}`}>
                        {contact.status}
                      </span>
                    )}
                    {contact.contact_type && (
                      <span className="px-2 py-0.5 rounded text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        {contact.contact_type}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Lists & Tags */}
            {(contact.lists?.length || contact.tags?.length) ? (
              <div className="grid grid-cols-2 gap-4">
                {contact.lists && contact.lists.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <List className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Lists</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {contact.lists.map((list: any, i: number) => (
                        <span key={i} className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                          {typeof list === 'string' ? list : (list.title || list.name || '')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {contact.tags && contact.tags.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Tag className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Tags</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {contact.tags.map((tag: any, i: number) => (
                        <span key={i} className="px-2 py-1 bg-brand/20 text-brand/90 rounded text-xs">
                          {typeof tag === 'string' ? tag : (tag.title || tag.name || '')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {/* Basic Information */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-500" />
                Basic Information
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Prefix</label>
                  {isEditing ? (
                    <select
                      value={editForm.prefix}
                      onChange={(e) => setEditForm({ ...editForm, prefix: e.target.value })}
                      className="w-full mt-1 px-3 py-2 bg-secondary border border-border rounded-lg text-foreground text-sm"
                    >
                      {PREFIXES.map(p => <option key={p} value={p}>{p || 'None'}</option>)}
                    </select>
                  ) : (
                    <p className="text-foreground text-sm mt-1">{contact.prefix || '-'}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">First Name</label>
                  {isEditing ? (
                    <Input
                      value={editForm.first_name}
                      onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                      className="mt-1 bg-secondary border-border"
                    />
                  ) : (
                    <p className="text-foreground text-sm mt-1">{contact.first_name}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Last Name</label>
                  {isEditing ? (
                    <Input
                      value={editForm.last_name}
                      onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                      className="mt-1 bg-secondary border-border"
                    />
                  ) : (
                    <p className="text-foreground text-sm mt-1">{contact.last_name}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Mail className="w-3 h-3" /> Email Address
                  </label>
                  {isEditing ? (
                    <Input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="mt-1 bg-secondary border-border"
                    />
                  ) : (
                    <p className="text-foreground text-sm mt-1">{contact.email}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Phone className="w-3 h-3" /> Phone/Mobile
                  </label>
                  {isEditing ? (
                    <Input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="mt-1 bg-secondary border-border"
                    />
                  ) : (
                    <p className="text-foreground text-sm mt-1">{contact.phone || '-'}</p>
                  )}
                </div>
              </div>

              <div className="mt-3">
                <label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Date of Birth
                </label>
                {isEditing ? (
                  <Input
                    type="date"
                    value={editForm.date_of_birth}
                    onChange={(e) => setEditForm({ ...editForm, date_of_birth: e.target.value })}
                    className="mt-1 bg-secondary border-border w-48"
                  />
                ) : (
                  <p className="text-foreground text-sm mt-1">{contact.date_of_birth || '-'}</p>
                )}
              </div>
            </div>

            {/* Address Information */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-green-500" />
                Address Information
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground">Address Line 1</label>
                  {isEditing ? (
                    <Input
                      value={editForm.address_line_1}
                      onChange={(e) => setEditForm({ ...editForm, address_line_1: e.target.value })}
                      className="mt-1 bg-secondary border-border"
                    />
                  ) : (
                    <p className="text-foreground text-sm mt-1">{contact.address_line_1 || '-'}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Address Line 2</label>
                  {isEditing ? (
                    <Input
                      value={editForm.address_line_2}
                      onChange={(e) => setEditForm({ ...editForm, address_line_2: e.target.value })}
                      className="mt-1 bg-secondary border-border"
                    />
                  ) : (
                    <p className="text-foreground text-sm mt-1">{contact.address_line_2 || '-'}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground">City</label>
                    {isEditing ? (
                      <Input
                        value={editForm.city}
                        onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                        className="mt-1 bg-secondary border-border"
                      />
                    ) : (
                      <p className="text-foreground text-sm mt-1">{contact.city || '-'}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">State</label>
                    {isEditing ? (
                      <Input
                        value={editForm.state}
                        onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                        className="mt-1 bg-secondary border-border"
                      />
                    ) : (
                      <p className="text-foreground text-sm mt-1">{contact.state || '-'}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground">ZIP Code</label>
                    {isEditing ? (
                      <Input
                        value={editForm.zip_code}
                        onChange={(e) => setEditForm({ ...editForm, zip_code: e.target.value })}
                        className="mt-1 bg-secondary border-border"
                      />
                    ) : (
                      <p className="text-foreground text-sm mt-1">{contact.zip_code || '-'}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Country</label>
                    {isEditing ? (
                      <select
                        value={editForm.country}
                        onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                        className="w-full mt-1 px-3 py-2 bg-secondary border border-border rounded-lg text-foreground text-sm"
                      >
                        <option value="">Select...</option>
                        {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    ) : (
                      <p className="text-foreground text-sm mt-1">{contact.country || '-'}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Custom Profile Data (PING WP) */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-purple-500" />
                Custom Profile Data
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground flex items-center gap-1">
                    <ArrowDownLeft className="w-3 h-3" /> Direction
                  </label>
                  {isEditing ? (
                    <select
                      value={editForm.direction}
                      onChange={(e) => setEditForm({ ...editForm, direction: e.target.value })}
                      className="w-full mt-1 px-3 py-2 bg-secondary border border-border rounded-lg text-foreground text-sm"
                    >
                      <option value="">Select...</option>
                      <option value="Incoming">Incoming</option>
                      <option value="Outgoing">Outgoing</option>
                    </select>
                  ) : (
                    <p className="text-foreground text-sm mt-1">{contact.direction || '-'}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Status</label>
                  {isEditing ? (
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      className="w-full mt-1 px-3 py-2 bg-secondary border border-border rounded-lg text-foreground text-sm"
                    >
                      <option value="">Select...</option>
                      <option value="subscribed">Subscribed</option>
                      <option value="unsubscribed">Unsubscribed</option>
                      <option value="pending">Pending</option>
                      <option value="bounced">Bounced</option>
                    </select>
                  ) : (
                    <p className="text-foreground text-sm mt-1">{contact.status || '-'}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" /> SMS Timestamp
                  </label>
                  {isEditing ? (
                    <Input
                      value={editForm.sms_timestamp}
                      onChange={(e) => setEditForm({ ...editForm, sms_timestamp: e.target.value })}
                      className="mt-1 bg-secondary border-border"
                    />
                  ) : (
                    <p className="text-foreground text-sm mt-1">{contact.sms_timestamp || '-'}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Phone className="w-3 h-3" /> Phone Number
                  </label>
                  <p className="text-foreground text-sm mt-1">{contact.phone || '-'}</p>
                </div>
              </div>

              <div className="mt-3">
                <label className="text-xs text-muted-foreground">Incoming SMS Message</label>
                {isEditing ? (
                  <Textarea
                    value={editForm.incoming_sms_message}
                    onChange={(e) => setEditForm({ ...editForm, incoming_sms_message: e.target.value })}
                    className="mt-1 bg-secondary border-border resize-none"
                    rows={2}
                  />
                ) : (
                  <p className="text-foreground text-sm mt-1 bg-secondary/50 p-2 rounded">
                    {contact.incoming_sms_message || '-'}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Building2 className="w-3 h-3" /> Company Name
                  </label>
                  {isEditing ? (
                    <Input
                      value={editForm.company_name}
                      onChange={(e) => setEditForm({ ...editForm, company_name: e.target.value })}
                      className="mt-1 bg-secondary border-border"
                    />
                  ) : (
                    <p className="text-foreground text-sm mt-1">{contact.company_name || '-'}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Globe className="w-3 h-3" /> Company Website
                  </label>
                  {isEditing ? (
                    <Input
                      type="url"
                      value={editForm.company_website}
                      onChange={(e) => setEditForm({ ...editForm, company_website: e.target.value })}
                      className="mt-1 bg-secondary border-border"
                    />
                  ) : (
                    <p className="text-foreground text-sm mt-1">
                      {contact.company_website ? (
                        <a href={contact.company_website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                          {contact.company_website}
                        </a>
                      ) : '-'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* AI Clone Goals */}
            <div>
              <label className="text-xs text-muted-foreground">
                What would you like your AI Clone to do for you or your business or brand?
              </label>
              {isEditing ? (
                <Textarea
                  value={editForm.ai_clone_goals}
                  onChange={(e) => setEditForm({ ...editForm, ai_clone_goals: e.target.value })}
                  className="mt-1 bg-secondary border-border resize-none"
                  rows={4}
                  placeholder="Build a multi-channel communication platform, AI voice agents..."
                />
              ) : (
                <p className="text-foreground text-sm mt-1 bg-secondary/50 p-3 rounded whitespace-pre-wrap">
                  {contact.ai_clone_goals || '-'}
                </p>
              )}
            </div>

            {/* AI Details */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Bot className="w-4 h-4 text-brand" />
                AI Details
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Preferred AI Provider</label>
                  {isEditing ? (
                    <select
                      value={editForm.preferred_ai_provider}
                      onChange={(e) => setEditForm({ ...editForm, preferred_ai_provider: e.target.value })}
                      className="w-full mt-1 px-3 py-2 bg-secondary border border-border rounded-lg text-foreground text-sm"
                    >
                      <option value="">Select...</option>
                      {AI_PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  ) : (
                    <p className="text-foreground text-sm mt-1">{contact.preferred_ai_provider || '-'}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-muted-foreground flex items-center gap-1">
                    <DollarSign className="w-3 h-3" /> AI Clone Budget
                  </label>
                  {isEditing ? (
                    <Input
                      value={editForm.ai_clone_budget}
                      onChange={(e) => setEditForm({ ...editForm, ai_clone_budget: e.target.value })}
                      className="mt-1 bg-secondary border-border"
                      placeholder="e.g., $500/month"
                    />
                  ) : (
                    <p className="text-foreground text-sm mt-1">{contact.ai_clone_budget || '-'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            {(contact.phone || contact.email) && (
              <div className="flex gap-2 pt-4 border-t border-border">
                {contact.phone && onCall && (
                  <Button 
                    variant="outline" 
                    className="flex-1 hover:bg-green-500/20 hover:text-green-500 hover:border-green-500/50"
                    onClick={() => onCall(contact.phone!, getContactName())}
                  >
                    <PhoneCall className="w-4 h-4 mr-2" />
                    Call
                  </Button>
                )}
                {contact.phone && onSendSms && (
                  <Button 
                    variant="outline" 
                    className="flex-1 hover:bg-blue-500/20 hover:text-blue-500 hover:border-blue-500/50"
                    onClick={() => onSendSms(contact.phone!, getContactName())}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    SMS
                  </Button>
                )}
                {contact.email && onEmail && (
                  <Button 
                    variant="outline" 
                    className="flex-1 hover:bg-purple-500/20 hover:text-purple-500 hover:border-purple-500/50"
                    onClick={() => onEmail(contact.email!, getContactName())}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Email
                  </Button>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
