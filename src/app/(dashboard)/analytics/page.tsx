'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown,
  Users, 
  DollarSign, 
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Mail,
  MessageSquare,
  FolderKanban,
  Target,
  CheckCircle2,
  Clock,
  BarChart3,
  Bell,
  Voicemail,
  Calendar,
  ListTodo,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface AnalyticsData {
  leadConversion: any;
  projectVelocity: any;
  revenue: any;
  invoiceStats: any;
  summary: any;
}

interface CallAnalytics {
  totalCalls: number;
  inboundCalls: number;
  outboundCalls: number;
  missedCalls: number;
  completedCalls: number;
  totalTalkTime: number;
  avgCallDuration: number;
  totalCost: number;
  costBreakdown: {
    outboundCost: number;
    inboundCost: number;
    recordingCost: number;
  };
  callsByDay: Array<{ date: string; inbound: number; outbound: number; missed: number }>;
}

interface NotificationsData {
  voicemails: number;
  unreadEmails: number;
  unreadSms: number;
  pendingReminders: number;
  upcomingAppointments: number;
  overdueTasks: number;
  newDeals: number;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [callAnalytics, setCallAnalytics] = useState<CallAnalytics | null>(null);
  const [notifications, setNotifications] = useState<NotificationsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
    fetchCallAnalytics();
    fetchNotifications();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/analytics');
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCallAnalytics = async () => {
    try {
      const res = await fetch('/api/calls/analytics?days=30');
      const json = await res.json();
      if (!json.error) {
        setCallAnalytics(json);
      }
    } catch (error) {
      console.error('Error fetching call analytics:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/analytics/notifications');
      const json = await res.json();
      if (!json.error) {
        setNotifications(json);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Set defaults if API fails
      setNotifications({
        voicemails: 0,
        unreadEmails: 0,
        unreadSms: 0,
        pendingReminders: 0,
        upcomingAppointments: 0,
        overdueTasks: 0,
        newDeals: 0,
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Failed to load analytics</p>
      </div>
    );
  }

  return (
    <div className="p-6 overflow-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground">Track performance across your business</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        <StatCard
          label="Total Contacts"
          value={data.summary.totalContacts}
          icon={Users}
        />
        <StatCard
          label="Total Leads"
          value={data.summary.totalLeads}
          icon={Target}
        />
        <StatCard
          label="Open Deals"
          value={data.summary.openDeals}
          icon={DollarSign}
        />
        <StatCard
          label="Active Projects"
          value={data.summary.activeProjects}
          icon={FolderKanban}
        />
        <StatCard
          label="Pipeline Value"
          value={formatCurrency(data.summary.pipelineValue)}
          icon={TrendingUp}
        />
        <StatCard
          label="Weighted Pipeline"
          value={formatCurrency(data.summary.weightedPipeline)}
          icon={BarChart3}
        />
      </div>

      {/* Call Statistics - Full Width */}
      {callAnalytics && (
        <div className="bg-card rounded-xl border border-border p-6 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Phone className="w-5 h-5 text-blue-500" />
            Call Statistics (Last 30 Days)
          </h2>
          
          {/* Main Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="p-4 bg-blue-500/10 rounded-lg text-center">
              <Phone className="w-5 h-5 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{callAnalytics.totalCalls}</p>
              <p className="text-sm text-muted-foreground">Total Calls</p>
            </div>
            <div className="p-4 bg-green-500/10 rounded-lg text-center">
              <PhoneIncoming className="w-5 h-5 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-500">{callAnalytics.inboundCalls}</p>
              <p className="text-sm text-muted-foreground">Inbound</p>
            </div>
            <div className="p-4 bg-purple-500/10 rounded-lg text-center">
              <PhoneOutgoing className="w-5 h-5 text-purple-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-500">{callAnalytics.outboundCalls}</p>
              <p className="text-sm text-muted-foreground">Outbound</p>
            </div>
            <div className="p-4 bg-red-500/10 rounded-lg text-center">
              <PhoneMissed className="w-5 h-5 text-red-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-red-500">{callAnalytics.missedCalls}</p>
              <p className="text-sm text-muted-foreground">Missed</p>
            </div>
            <div className="p-4 bg-brand/10 rounded-lg text-center">
              <Clock className="w-5 h-5 text-brand mx-auto mb-2" />
              <p className="text-2xl font-bold text-brand">{formatDuration(callAnalytics.totalTalkTime)}</p>
              <p className="text-sm text-muted-foreground">Talk Time</p>
            </div>
          </div>

          {/* Cost Breakdown & Chart */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Estimated Twilio Costs
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-secondary/50 rounded">
                  <span className="text-sm text-muted-foreground">Outbound Calls</span>
                  <span className="text-sm font-medium text-foreground">${callAnalytics.costBreakdown.outboundCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-secondary/50 rounded">
                  <span className="text-sm text-muted-foreground">Inbound Calls</span>
                  <span className="text-sm font-medium text-foreground">${callAnalytics.costBreakdown.inboundCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-secondary/50 rounded">
                  <span className="text-sm text-muted-foreground">Recording Storage</span>
                  <span className="text-sm font-medium text-foreground">${callAnalytics.costBreakdown.recordingCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-brand/10 rounded border border-brand/30">
                  <span className="text-sm font-medium text-foreground">Total Cost</span>
                  <span className="text-lg font-bold text-brand">${callAnalytics.totalCost.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Daily Call Activity</h3>
              <div className="flex items-end gap-1 h-32">
                {callAnalytics.callsByDay.slice(-14).map((day, i) => {
                  const total = day.inbound + day.outbound;
                  const maxTotal = Math.max(...callAnalytics.callsByDay.slice(-14).map(d => d.inbound + d.outbound), 1);
                  const height = (total / maxTotal) * 100;
                  const missedHeight = day.missed > 0 ? (day.missed / maxTotal) * 100 : 0;
                  
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex flex-col-reverse" style={{ height: '100px' }}>
                        <div 
                          className="w-full bg-blue-500 rounded-t transition-all"
                          style={{ height: `${height}%`, minHeight: total > 0 ? '4px' : '0' }}
                          title={`${day.date}: ${day.inbound} in, ${day.outbound} out`}
                        />
                        {day.missed > 0 && (
                          <div 
                            className="w-full bg-red-500 rounded-t"
                            style={{ height: `${missedHeight}%`, minHeight: '2px' }}
                          />
                        )}
                      </div>
                      {i % 2 === 0 && (
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(day.date).getDate()}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-center gap-4 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-500 rounded" /> Calls
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-500 rounded" /> Missed
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-sm">
            <div className="text-muted-foreground">
              Avg Call Duration: <span className="text-foreground font-medium">{formatDuration(callAnalytics.avgCallDuration)}</span>
            </div>
            <div className="text-muted-foreground">
              Completed: <span className="text-green-500 font-medium">{callAnalytics.completedCalls}</span> / {callAnalytics.totalCalls}
            </div>
          </div>
        </div>
      )}

      {/* Invoice Summary - Full Width */}
      <div className="bg-card rounded-xl border border-border p-6 mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Invoice Summary</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-secondary rounded-lg text-center">
            <p className="text-sm text-muted-foreground mb-1">Total Invoiced</p>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(data.invoiceStats.totalInvoiced)}</p>
          </div>
          <div className="p-4 bg-green-500/10 rounded-lg text-center">
            <p className="text-sm text-muted-foreground mb-1">Collected</p>
            <p className="text-2xl font-bold text-green-500">{formatCurrency(data.invoiceStats.totalCollected)}</p>
          </div>
          <div className="p-4 bg-yellow-500/10 rounded-lg text-center">
            <p className="text-sm text-muted-foreground mb-1">Outstanding</p>
            <p className="text-2xl font-bold text-yellow-500">{formatCurrency(data.invoiceStats.outstanding)}</p>
          </div>
          <div className="p-4 bg-secondary rounded-lg text-center">
            <p className="text-sm text-muted-foreground mb-1">Avg Invoice</p>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(data.invoiceStats.avgInvoiceValue)}</p>
          </div>
        </div>
      </div>

      {/* Project Velocity & Revenue Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Project Velocity */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Project Velocity</h2>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-500">{data.projectVelocity.active}</p>
              <p className="text-sm text-muted-foreground">Active</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-500">{data.projectVelocity.completed}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-foreground">{data.projectVelocity.avgDaysToComplete}</p>
              <p className="text-sm text-muted-foreground">Avg Days</p>
            </div>
          </div>
          
          <h3 className="text-sm font-medium text-muted-foreground mb-3">By Status</h3>
          <div className="space-y-2">
            {data.projectVelocity.byStatus.map((status: any) => {
              const total = data.projectVelocity.byStatus.reduce((sum: number, s: any) => sum + s.count, 0);
              return (
                <div key={status.status} className="flex items-center gap-3">
                  <span className="w-24 text-sm text-muted-foreground capitalize">{status.status.replace('_', ' ')}</span>
                  <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${total > 0 ? (status.count / total) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="w-8 text-sm text-foreground text-right">{status.count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Revenue Pipeline */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Revenue Pipeline</h2>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-green-500/10 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-sm text-muted-foreground">Won</span>
              </div>
              <p className="text-2xl font-bold text-green-500">{formatCurrency(data.revenue.closedWon)}</p>
            </div>
            <div className="p-4 bg-red-500/10 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="w-4 h-4 text-red-500" />
                <span className="text-sm text-muted-foreground">Lost</span>
              </div>
              <p className="text-2xl font-bold text-red-500">{formatCurrency(data.revenue.closedLost)}</p>
            </div>
          </div>
          
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Pipeline by Stage</h3>
          <div className="space-y-2">
            {data.revenue.byStage.filter((s: any) => !s.stage.startsWith('closed_')).map((stage: any) => (
              <div key={stage.stage} className="flex items-center gap-3">
                <span className="w-24 text-sm text-muted-foreground capitalize">{stage.stage}</span>
                <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-brand rounded-full transition-all"
                    style={{ width: `${data.revenue.totalPipeline > 0 ? (stage.value / data.revenue.totalPipeline) * 100 : 0}%` }}
                  />
                </div>
                <span className="w-20 text-sm text-foreground text-right">{formatCurrency(stage.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lead Conversion & Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Conversion */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Lead Conversion</h2>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-foreground">{data.leadConversion.total}</p>
              <p className="text-sm text-muted-foreground">Total Leads</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-500">{data.leadConversion.converted}</p>
              <p className="text-sm text-muted-foreground">Converted</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-brand">{data.leadConversion.conversionRate}%</p>
              <p className="text-sm text-muted-foreground">Conversion Rate</p>
            </div>
          </div>
          
          <h3 className="text-sm font-medium text-muted-foreground mb-3">By Stage</h3>
          <div className="space-y-2">
            {data.leadConversion.byStage.map((stage: any) => (
              <div key={stage.stage} className="flex items-center gap-3">
                <span className="w-24 text-sm text-muted-foreground capitalize">{stage.stage}</span>
                <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-brand rounded-full transition-all"
                    style={{ width: `${data.leadConversion.total > 0 ? (stage.count / data.leadConversion.total) * 100 : 0}%` }}
                  />
                </div>
                <span className="w-8 text-sm text-foreground text-right">{stage.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Notifications & Reminders */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-brand" />
            Notifications
          </h2>
          
          <div className="space-y-3">
            <NotificationRow
              icon={Voicemail}
              label="Voicemails"
              count={notifications?.voicemails || 0}
              href="/communications?tab=voicemail"
              color="text-purple-500"
              bgColor="bg-purple-500/10"
            />
            <NotificationRow
              icon={Mail}
              label="Emails"
              count={notifications?.unreadEmails || 0}
              href="/communications?tab=email"
              color="text-blue-500"
              bgColor="bg-blue-500/10"
            />
            <NotificationRow
              icon={MessageSquare}
              label="SMS"
              count={notifications?.unreadSms || 0}
              href="/communications?tab=sms"
              color="text-green-500"
              bgColor="bg-green-500/10"
            />
            <NotificationRow
              icon={Clock}
              label="Reminders"
              count={notifications?.pendingReminders || 0}
              href="/cron"
              color="text-yellow-500"
              bgColor="bg-yellow-500/10"
            />
            <NotificationRow
              icon={Calendar}
              label="Calendar"
              count={notifications?.upcomingAppointments || 0}
              href="/appointments"
              color="text-brand"
              bgColor="bg-brand/10"
            />
            <NotificationRow
              icon={ListTodo}
              label="Tasks"
              count={notifications?.overdueTasks || 0}
              href="/todos"
              color="text-red-500"
              bgColor="bg-red-500/10"
              alert={notifications?.overdueTasks ? notifications.overdueTasks > 0 : false}
            />
            <NotificationRow
              icon={DollarSign}
              label="Deals"
              count={notifications?.newDeals || 0}
              href="/pipeline"
              color="text-emerald-500"
              bgColor="bg-emerald-500/10"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ 
  label, 
  value, 
  icon: Icon, 
  className 
}: { 
  label: string; 
  value: string | number; 
  icon: any;
  className?: string;
}) {
  return (
    <div className={cn('p-4 bg-card rounded-lg border border-border', className)}>
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        <Icon className="w-4 h-4" />
        <span className="text-sm">{label}</span>
      </div>
      <p className="text-xl font-bold text-foreground">{value}</p>
    </div>
  );
}

// Notification Row Component
function NotificationRow({
  icon: Icon,
  label,
  count,
  href,
  color,
  bgColor,
  alert = false,
}: {
  icon: any;
  label: string;
  count: number;
  href: string;
  color: string;
  bgColor: string;
  alert?: boolean;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 transition-colors group"
    >
      <div className="flex items-center gap-3">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', bgColor)}>
          <Icon className={cn('w-5 h-5', color)} />
        </div>
        <span className="text-foreground font-medium">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {alert && count > 0 && (
          <AlertCircle className="w-4 h-4 text-red-500" />
        )}
        <span className={cn(
          'text-lg font-bold',
          count > 0 ? color : 'text-muted-foreground'
        )}>
          {count}
        </span>
      </div>
    </Link>
  );
}
