'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DatePicker, TimePicker } from '@/components/ui/date-picker';
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  MapPin,
  MessageSquare,
  PhoneCall,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Video,
  RefreshCw,
  Building2,
  Globe,
  Bot,
  ExternalLink,
  Pencil,
  Save,
} from 'lucide-react';

interface CustomFormData {
  custom_company_name?: { label: string; value: string };
  custom_phone_number?: { label: string; value: string };
  custom_website?: { label: string; value: string };
  custom_preferred_ai_provider?: { label: string; value: string };
}

interface LocationDetails {
  type: string;
  description?: string;
  online_platform_link?: string;
}

interface Appointment {
  id: number;
  hash: string;
  title: string;
  status: string;
  start_time: string;
  end_time: string;
  person_time_zone: string;
  slot_minutes: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  message: string;
  location_details: LocationDetails;
  custom_form_data: CustomFormData;
  reschedule_url: string;
  calendar_event?: {
    id: number;
    title: string;
    duration: string;
    location_settings: Array<{ type: string; title: string }>;
  };
  calendar?: {
    id: number;
    title: string;
  };
}

interface Event {
  id: number;
  title: string;
  duration: string;
  calendarId: string;
  settings: any;
}

interface AppointmentsListProps {
  onSendSms?: (phone: string, name: string) => void;
  onCall?: (phone: string, name: string) => void;
}

const AI_PROVIDERS = [
  'OpenAI - ChatGPT',
  'Anthropic - Claude',
  'Google - Gemini',
  'Meta - LLaMA',
  'Mistral AI',
  'Other',
  'Not Sure',
];

const MEETING_TYPES = [
  { value: 'in_person_guest', label: 'In Person (Attendee Address)' },
  { value: 'phone_guest', label: 'Attendee Phone Number' },
  { value: 'phone_organizer', label: 'Organizer Phone Number' },
  { value: 'zoom_meeting', label: 'Zoom Meeting' },
  { value: 'google_meet', label: 'Google Meet' },
];

export function AppointmentsList({ onSendSms, onCall }: AppointmentsListProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    companyName: '',
    companyWebsite: '',
    meetingPreference: '',
    preferredAiProvider: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  // Create form state
  const [createForm, setCreateForm] = useState({
    eventId: '',
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    companyName: '',
    companyWebsite: '',
    meetingPreference: 'zoom_meeting',
    preferredAiProvider: '',
    date: '',
    time: '',
    notes: '',
  });
  const [creating, setCreating] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, [activeTab, currentPage]);

  // Initialize edit form when entering edit mode
  const startEditing = (apt: Appointment) => {
    const customData = apt.custom_form_data || {};
    setEditForm({
      guestName: `${apt.first_name || ''} ${apt.last_name || ''}`.trim(),
      guestEmail: apt.email || '',
      guestPhone: customData.custom_phone_number?.value || apt.phone || '',
      companyName: customData.custom_company_name?.value || '',
      companyWebsite: customData.custom_website?.value || '',
      meetingPreference: apt.location_details?.type || 'zoom_meeting',
      preferredAiProvider: customData.custom_preferred_ai_provider?.value || '',
      notes: apt.message || '',
    });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditForm({
      guestName: '',
      guestEmail: '',
      guestPhone: '',
      companyName: '',
      companyWebsite: '',
      meetingPreference: '',
      preferredAiProvider: '',
      notes: '',
    });
  };

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: '10',
        period: activeTab,
      });

      const response = await fetch(`/api/appointments?${params.toString()}`);
      const data = await response.json();

      setAppointments(data.appointments || []);
      setEvents(data.events || []);
      setTotalPages(data.pagination?.lastPage || 1);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBooking = async () => {
    if (!selectedAppointment) return;

    setSaving(true);
    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          scheduleId: selectedAppointment.id,
          guestName: editForm.guestName,
          guestEmail: editForm.guestEmail,
          guestPhone: editForm.guestPhone,
          companyName: editForm.companyName,
          companyWebsite: editForm.companyWebsite,
          meetingPreference: editForm.meetingPreference,
          preferredAiProvider: editForm.preferredAiProvider,
          notes: editForm.notes,
        }),
      });

      if (response.ok) {
        setIsEditing(false);
        // Refresh the appointment data
        fetchAppointments();
        // Update the selected appointment locally
        const nameParts = editForm.guestName.trim().split(' ');
        setSelectedAppointment({
          ...selectedAppointment,
          first_name: nameParts[0] || '',
          last_name: nameParts.slice(1).join(' ') || '',
          email: editForm.guestEmail,
          phone: editForm.guestPhone,
          message: editForm.notes,
          location_details: { ...selectedAppointment.location_details, type: editForm.meetingPreference },
          custom_form_data: {
            ...selectedAppointment.custom_form_data,
            custom_company_name: { label: 'Company Name', value: editForm.companyName },
            custom_phone_number: { label: 'Phone Number', value: editForm.guestPhone },
            custom_website: { label: 'Company Website', value: editForm.companyWebsite },
            custom_preferred_ai_provider: { label: 'Preferred AI Provider', value: editForm.preferredAiProvider },
          },
        });
      }
    } catch (error) {
      console.error('Error updating booking:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateBooking = async () => {
    if (!createForm.eventId || !createForm.guestName || !createForm.guestEmail || !createForm.date || !createForm.time) {
      return;
    }

    setCreating(true);
    try {
      const event = events.find(e => e.id.toString() === createForm.eventId);
      const duration = parseInt(event?.duration || '30');
      
      const startTime = `${createForm.date} ${createForm.time}:00`;
      const startDate = new Date(`${createForm.date}T${createForm.time}:00`);
      const endDate = new Date(startDate.getTime() + duration * 60000);
      const endTime = `${createForm.date} ${endDate.toTimeString().slice(0, 5)}:00`;

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          eventId: createForm.eventId,
          calendarId: event?.calendarId || '1',
          guestName: createForm.guestName,
          guestEmail: createForm.guestEmail,
          guestPhone: createForm.guestPhone,
          companyName: createForm.companyName,
          companyWebsite: createForm.companyWebsite,
          meetingPreference: createForm.meetingPreference,
          preferredAiProvider: createForm.preferredAiProvider,
          startTime,
          endTime,
          timezone: 'America/Phoenix',
          notes: createForm.notes,
        }),
      });

      if (response.ok) {
        setShowCreateModal(false);
        setCreateForm({
          eventId: '',
          guestName: '',
          guestEmail: '',
          guestPhone: '',
          companyName: '',
          companyWebsite: '',
          meetingPreference: 'zoom_meeting',
          preferredAiProvider: '',
          date: '',
          time: '',
          notes: '',
        });
        fetchAppointments();
      }
    } catch (error) {
      console.error('Error creating booking:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleCancelBooking = async (appointmentId: number) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;

    setCancelling(true);
    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancel',
          scheduleId: appointmentId,
        }),
      });

      if (response.ok) {
        setSelectedAppointment(null);
        setIsEditing(false);
        fetchAppointments();
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
    } finally {
      setCancelling(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500/20 text-blue-400';
      case 'completed': return 'bg-green-500/20 text-green-400';
      case 'cancelled': return 'bg-red-500/20 text-red-400';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400';
      default: return 'bg-secondary text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return <Clock className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getLocationIcon = (type: string) => {
    if (type?.includes('zoom') || type?.includes('meet') || type?.includes('video')) {
      return <Video className="w-4 h-4" />;
    }
    if (type?.includes('phone')) {
      return <Phone className="w-4 h-4" />;
    }
    return <MapPin className="w-4 h-4" />;
  };

  const getLocationLabel = (type: string) => {
    const found = MEETING_TYPES.find(m => m.value === type);
    return found?.label || type?.replace(/_/g, ' ') || 'Not specified';
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      full: date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
    };
  };

  const getGuestPhone = (apt: Appointment) => {
    return apt.custom_form_data?.custom_phone_number?.value || apt.phone || '';
  };

  const getGuestName = (apt: Appointment) => {
    return `${apt.first_name || ''} ${apt.last_name || ''}`.trim() || 'Guest';
  };

  // Appointment Detail View (with Edit Mode)
  if (selectedAppointment) {
    const { date, time, full } = formatDateTime(selectedAppointment.start_time);
    const endTime = formatDateTime(selectedAppointment.end_time).time;
    const guestPhone = getGuestPhone(selectedAppointment);
    const guestName = getGuestName(selectedAppointment);
    const customData = selectedAppointment.custom_form_data || {};

    return (
      <div className="flex flex-col" style={{ height: '600px' }}>
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border shrink-0">
          <Button variant="ghost" size="icon" onClick={() => { setSelectedAppointment(null); setIsEditing(false); }}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h3 className="text-lg font-semibold text-foreground flex-1">
            {isEditing ? 'Edit Appointment' : 'Appointment Details'}
          </h3>
          {selectedAppointment.status === 'scheduled' && !isEditing && (
            <Button variant="outline" size="sm" onClick={() => startEditing(selectedAppointment)}>
              <Pencil className="w-4 h-4 mr-1" />
              Edit
            </Button>
          )}
        </div>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 pb-6">
            {/* Status & Event */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  {selectedAppointment.calendar_event?.title || 'Appointment'}
                </h2>
                <p className="text-muted-foreground">{selectedAppointment.slot_minutes} minutes</p>
              </div>
              <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${getStatusColor(selectedAppointment.status)}`}>
                {getStatusIcon(selectedAppointment.status)}
                {selectedAppointment.status}
              </span>
            </div>

            {/* Date & Time (not editable - use reschedule link) */}
            <div className="flex items-center gap-3 p-4 bg-brand/10 border border-brand/30 rounded-lg">
              <Calendar className="w-5 h-5 text-brand" />
              <div>
                <p className="text-foreground font-medium">{full}</p>
                <p className="text-muted-foreground text-sm">{time} - {endTime} ({selectedAppointment.person_time_zone})</p>
              </div>
            </div>

            {/* Guest Info - Edit Mode */}
            {isEditing ? (
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-muted-foreground">Guest Information</h4>
                
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Name</label>
                  <Input
                    value={editForm.guestName}
                    onChange={(e) => setEditForm({ ...editForm, guestName: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>

                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Email</label>
                  <Input
                    type="email"
                    value={editForm.guestEmail}
                    onChange={(e) => setEditForm({ ...editForm, guestEmail: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>

                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Phone</label>
                  <Input
                    type="tel"
                    value={editForm.guestPhone}
                    onChange={(e) => setEditForm({ ...editForm, guestPhone: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>

                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Company</label>
                  <Input
                    value={editForm.companyName}
                    onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>

                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Website</label>
                  <Input
                    type="url"
                    value={editForm.companyWebsite}
                    onChange={(e) => setEditForm({ ...editForm, companyWebsite: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>

                <h4 className="text-sm font-medium text-muted-foreground pt-2">Meeting Details</h4>

                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Meeting Preference</label>
                  <select
                    value={editForm.meetingPreference}
                    onChange={(e) => setEditForm({ ...editForm, meetingPreference: e.target.value })}
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground"
                  >
                    {MEETING_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Preferred AI Provider</label>
                  <select
                    value={editForm.preferredAiProvider}
                    onChange={(e) => setEditForm({ ...editForm, preferredAiProvider: e.target.value })}
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground"
                  >
                    <option value="">Not specified</option>
                    {AI_PROVIDERS.map((provider) => (
                      <option key={provider} value={provider}>
                        {provider}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Notes</label>
                  <Textarea
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    className="bg-secondary border-border resize-none"
                    rows={4}
                  />
                </div>

                {/* Edit Actions */}
                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={handleUpdateBooking}
                    disabled={saving}
                    className="flex-1 bg-brand hover:bg-brand/90"
                  >
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={cancelEditing} disabled={saving}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              /* Guest Info - View Mode */
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">Guest Information</h4>
                
                <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                  <User className="w-5 h-5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Name</p>
                    <p className="text-foreground">{guestName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                  <Mail className="w-5 h-5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-foreground truncate">{selectedAppointment.email}</p>
                  </div>
                </div>

                {guestPhone && (
                  <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                    <Phone className="w-5 h-5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="text-foreground">{guestPhone}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {onSendSms && (
                        <Button size="sm" variant="outline" onClick={() => onSendSms(guestPhone, guestName)}>
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                      )}
                      {onCall && (
                        <Button size="sm" variant="outline" onClick={() => onCall(guestPhone, guestName)}>
                          <PhoneCall className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {customData.custom_company_name?.value && (
                  <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                    <Building2 className="w-5 h-5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">Company</p>
                      <p className="text-foreground">{customData.custom_company_name.value}</p>
                    </div>
                  </div>
                )}

                {customData.custom_website?.value && (
                  <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                    <Globe className="w-5 h-5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">Website</p>
                      <a 
                        href={customData.custom_website.value} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline flex items-center gap-1"
                      >
                        {customData.custom_website.value}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Meeting Details - View Mode Only */}
            {!isEditing && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">Meeting Details</h4>
                
                <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                  {getLocationIcon(selectedAppointment.location_details?.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Meeting Type</p>
                    <p className="text-foreground">{getLocationLabel(selectedAppointment.location_details?.type)}</p>
                  </div>
                </div>

                {selectedAppointment.location_details?.online_platform_link && (
                  <div className="p-3 bg-secondary/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Meeting Link</p>
                    <a 
                      href={selectedAppointment.location_details.online_platform_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline text-sm flex items-center gap-1 break-all"
                    >
                      Join Meeting
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </div>
                )}

                {customData.custom_preferred_ai_provider?.value && (
                  <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                    <Bot className="w-5 h-5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">Preferred AI Provider</p>
                      <p className="text-foreground">{customData.custom_preferred_ai_provider.value}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Notes - View Mode Only */}
            {!isEditing && selectedAppointment.message && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Notes</h4>
                <p className="text-foreground bg-secondary/50 rounded-lg p-3 text-sm whitespace-pre-wrap">
                  {selectedAppointment.message}
                </p>
              </div>
            )}

            {/* Reschedule Link - View Mode Only */}
            {!isEditing && selectedAppointment.reschedule_url && selectedAppointment.status === 'scheduled' && (
              <a
                href={selectedAppointment.reschedule_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg hover:bg-blue-500/20 transition-colors"
              >
                <div className="flex items-center gap-2 text-blue-400">
                  <RefreshCw className="w-4 h-4" />
                  <span className="text-sm font-medium">Reschedule Appointment</span>
                  <ExternalLink className="w-3 h-3 ml-auto" />
                </div>
              </a>
            )}

            {/* Cancel Button - View Mode Only */}
            {!isEditing && selectedAppointment.status === 'scheduled' && (
              <Button
                variant="outline"
                className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10"
                onClick={() => handleCancelBooking(selectedAppointment.id)}
                disabled={cancelling}
              >
                {cancelling ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                Cancel Appointment
              </Button>
            )}
          </div>
        </ScrollArea>
      </div>
    );
  }

  // Create Modal
  if (showCreateModal) {
    return (
      <div className="flex flex-col" style={{ height: '600px' }}>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-border shrink-0">
          <h3 className="text-lg font-semibold text-foreground">New Appointment</h3>
          <Button variant="ghost" size="icon" onClick={() => setShowCreateModal(false)}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4 pb-6">
            {/* Event Type */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Event Type *</label>
              <select
                value={createForm.eventId}
                onChange={(e) => setCreateForm({ ...createForm, eventId: e.target.value })}
                className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground"
              >
                <option value="">Select event type...</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.title} ({event.duration} min)
                  </option>
                ))}
              </select>
            </div>

            {/* Guest Name */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Your Name *</label>
              <Input
                value={createForm.guestName}
                onChange={(e) => setCreateForm({ ...createForm, guestName: e.target.value })}
                placeholder="John Doe"
                className="bg-secondary border-border"
              />
            </div>

            {/* Company Name */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Company Name</label>
              <Input
                value={createForm.companyName}
                onChange={(e) => setCreateForm({ ...createForm, companyName: e.target.value })}
                placeholder="Acme Inc."
                className="bg-secondary border-border"
              />
            </div>

            {/* Guest Email */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Your Email *</label>
              <Input
                type="email"
                value={createForm.guestEmail}
                onChange={(e) => setCreateForm({ ...createForm, guestEmail: e.target.value })}
                placeholder="john@example.com"
                className="bg-secondary border-border"
              />
            </div>

            {/* Guest Phone */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Phone Number *</label>
              <Input
                type="tel"
                value={createForm.guestPhone}
                onChange={(e) => setCreateForm({ ...createForm, guestPhone: e.target.value })}
                placeholder="+1 (480) 555-1234"
                className="bg-secondary border-border"
              />
            </div>

            {/* Company Website */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Company Website</label>
              <Input
                type="url"
                value={createForm.companyWebsite}
                onChange={(e) => setCreateForm({ ...createForm, companyWebsite: e.target.value })}
                placeholder="https://example.com"
                className="bg-secondary border-border"
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Date *</label>
              <DatePicker
                value={createForm.date}
                onChange={(value) => setCreateForm({ ...createForm, date: value })}
                placeholder="Select date"
              />
            </div>

            {/* Time */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Time *</label>
              <TimePicker
                value={createForm.time}
                onChange={(value) => setCreateForm({ ...createForm, time: value })}
                placeholder="Select time"
              />
            </div>

            {/* Meeting Preference */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Meeting Preference *</label>
              <select
                value={createForm.meetingPreference}
                onChange={(e) => setCreateForm({ ...createForm, meetingPreference: e.target.value })}
                className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground"
              >
                {MEETING_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Preferred AI Provider */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Preferred AI Provider</label>
              <select
                value={createForm.preferredAiProvider}
                onChange={(e) => setCreateForm({ ...createForm, preferredAiProvider: e.target.value })}
                className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground"
              >
                <option value="">Please select...</option>
                {AI_PROVIDERS.map((provider) => (
                  <option key={provider} value={provider}>
                    {provider}
                  </option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                What would you like your AI Clone to do for you or your business?
              </label>
              <Textarea
                value={createForm.notes}
                onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                placeholder="Tell us about your goals and what you'd like to achieve..."
                className="bg-secondary border-border resize-none"
                rows={4}
              />
            </div>

            <Button
              onClick={handleCreateBooking}
              disabled={creating || !createForm.eventId || !createForm.guestName || !createForm.guestEmail || !createForm.guestPhone || !createForm.date || !createForm.time}
              className="w-full bg-brand hover:bg-brand/90"
            >
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Schedule Meeting
                </>
              )}
            </Button>
          </div>
        </ScrollArea>
      </div>
    );
  }

  // Main List View
  return (
    <div className="flex flex-col" style={{ height: '600px' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'upcoming' ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setActiveTab('upcoming'); setCurrentPage(1); }}
          >
            Upcoming
          </Button>
          <Button
            variant={activeTab === 'past' ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setActiveTab('past'); setCurrentPage(1); }}
          >
            Past
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={fetchAppointments}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button onClick={() => setShowCreateModal(true)} size="sm" className="bg-brand hover:bg-brand/90">
            <Plus className="w-4 h-4 mr-1" />
            New
          </Button>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : appointments.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <Calendar className="w-12 h-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No {activeTab} appointments</p>
          <Button onClick={() => setShowCreateModal(true)} variant="link" className="mt-2 text-brand">
            Create your first appointment
          </Button>
        </div>
      ) : (
        <>
          <ScrollArea className="flex-1">
            <div className="space-y-2 pr-4 pb-4">
              {appointments.map((apt) => {
                const { date, time } = formatDateTime(apt.start_time);
                const guestName = getGuestName(apt);
                const guestPhone = getGuestPhone(apt);
                const companyName = apt.custom_form_data?.custom_company_name?.value;
                
                return (
                  <button
                    key={apt.id}
                    onClick={() => setSelectedAppointment(apt)}
                    className="w-full flex items-center gap-4 p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors text-left"
                  >
                    <div className="flex flex-col items-center justify-center w-14 h-14 rounded-lg bg-brand/20 shrink-0">
                      <span className="text-brand text-xs font-medium">{date.split(' ')[1]}</span>
                      <span className="text-brand text-lg font-bold">{date.split(' ')[2]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground truncate">{guestName}</p>
                        <span className={`px-2 py-0.5 rounded text-xs shrink-0 ${getStatusColor(apt.status)}`}>
                          {apt.status}
                        </span>
                      </div>
                      {companyName && (
                        <p className="text-muted-foreground text-sm truncate">{companyName}</p>
                      )}
                      <p className="text-muted-foreground text-xs">{time} • {apt.slot_minutes} min</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {guestPhone && onSendSms && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={(e) => { e.stopPropagation(); onSendSms(guestPhone, guestName); }}
                        >
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                      )}
                      {guestPhone && onCall && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={(e) => { e.stopPropagation(); onCall(guestPhone, guestName); }}
                        >
                          <PhoneCall className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>

          {/* Pagination */}
          {totalPages > 1 && (
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
          )}
        </>
      )}
    </div>
  );
}
