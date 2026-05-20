'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar as CalendarIcon, Users, Clock, Link2 } from 'lucide-react';
import { AppointmentsList } from '@/components/appointments/AppointmentsList';
import { MiniCalendar } from '@/components/ui/calendar';

export default function AppointmentsPage() {
  const [smsContact, setSmsContact] = useState<{ phone: string; name: string } | null>(null);

  const handleSendSms = (phone: string, name: string) => {
    // Navigate to communications with the contact pre-selected
    window.location.href = `/communications?tab=sms&phone=${encodeURIComponent(phone)}&name=${encodeURIComponent(name)}`;
  };

  const handleCall = (phone: string, name: string) => {
    // Navigate to communications calls tab
    window.location.href = `/communications?tab=calls&phone=${encodeURIComponent(phone)}`;
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <CalendarIcon className="w-8 h-8 text-brand" />
          <h1 className="text-3xl font-bold text-foreground">Appointments</h1>
        </div>
        <p className="text-muted-foreground">Manage bookings from Fluent Booking Pro</p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Appointments List */}
        <div className="lg:col-span-2">
          <Card className="bg-card/50 border-border min-h-[700px]">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-brand" />
                Appointments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AppointmentsList
                onSendSms={handleSendSms}
                onCall={handleCall}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Mini Calendar */}
          <MiniCalendar 
            className="bg-card/50 border-border"
          />

          {/* Quick Info */}
          <Card className="bg-card/50 border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                Booking Info
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-secondary/50 rounded-lg">
                  <p className="text-muted-foreground text-sm">Connected to</p>
                  <p className="text-foreground text-lg">Fluent Booking Pro</p>
                  <p className="text-muted-foreground text-xs mt-1">channelcast.io</p>
                </div>
                
                <div className="p-4 bg-secondary/50 rounded-lg">
                  <p className="text-muted-foreground text-sm mb-2">Your Calendar</p>
                  <p className="text-foreground font-medium">Jeremy Waters</p>
                  <p className="text-muted-foreground text-xs">30-minute AI Clone Strategy Call</p>
                </div>

                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <p className="text-green-400 text-sm">✓ Two-Way Sync</p>
                  <p className="text-muted-foreground text-xs mt-1">
                    Changes here reflect in Fluent Booking Pro
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card className="bg-card/50 border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Link2 className="w-5 h-5 text-purple-500" />
                Quick Links
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <a
                  href="https://channelcast.io/?fluent-booking=calendar&host=jwaters-1755042506"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors"
                >
                  <p className="text-foreground text-sm font-medium">Public Booking Page</p>
                  <p className="text-muted-foreground text-xs">Share with clients</p>
                </a>
                
                <a
                  href="https://channelcast.io/wp-admin/admin.php?page=fluent-booking#/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors"
                >
                  <p className="text-foreground text-sm font-medium">Fluent Booking Admin</p>
                  <p className="text-muted-foreground text-xs">Full settings & reports</p>
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card className="bg-card/50 border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Users className="w-5 h-5 text-brand" />
                Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-muted-foreground text-sm space-y-2">
                <li>• Click an appointment to view details</li>
                <li>• Use SMS/Call buttons to contact guests</li>
                <li>• Create appointments for contacts directly</li>
                <li>• Cancel appointments with one click</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
