'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, Play, Trash2, RefreshCw, Plus, AlertCircle, X, Calendar, Repeat } from "lucide-react";

interface CronJob {
  id: string;
  name: string;
  enabled: boolean;
  schedule: {
    kind: 'at' | 'every' | 'cron';
    atMs?: number;
    everyMs?: number;
    expr?: string;
  };
  payload: {
    kind: string;
    text?: string;
  };
  state?: {
    nextRunAtMs?: number;
    lastRunAtMs?: number;
  };
}

export default function CronPage() {
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newJob, setNewJob] = useState({
    name: '',
    scheduleType: 'at' as 'at' | 'every' | 'cron',
    dateTime: '',
    intervalMinutes: '60',
    cronExpr: '',
    message: ''
  });

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/cron');
      const data = await response.json();
      setJobs(data.jobs || []);
    } catch (error) {
      console.error('Error loading cron jobs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addJob = async () => {
    if (!newJob.name.trim() || !newJob.message.trim()) return;

    let schedule: CronJob['schedule'];
    
    if (newJob.scheduleType === 'at') {
      if (!newJob.dateTime) return;
      schedule = { kind: 'at', atMs: new Date(newJob.dateTime).getTime() };
    } else if (newJob.scheduleType === 'every') {
      const ms = parseInt(newJob.intervalMinutes) * 60 * 1000;
      schedule = { kind: 'every', everyMs: ms };
    } else {
      if (!newJob.cronExpr) return;
      schedule = { kind: 'cron', expr: newJob.cronExpr };
    }

    const job = {
      name: newJob.name,
      schedule,
      payload: { kind: 'systemEvent', text: newJob.message },
      sessionTarget: 'main',
      enabled: true
    };

    try {
      const response = await fetch('/api/cron', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', job }),
      });
      
      if (response.ok) {
        loadJobs();
        setNewJob({
          name: '',
          scheduleType: 'at',
          dateTime: '',
          intervalMinutes: '60',
          cronExpr: '',
          message: ''
        });
        setShowForm(false);
      }
    } catch (error) {
      console.error('Error adding job:', error);
    }
  };

  const runJob = async (jobId: string) => {
    try {
      await fetch('/api/cron', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run', jobId }),
      });
      loadJobs();
    } catch (error) {
      console.error('Error running job:', error);
    }
  };

  const deleteJob = async (jobId: string) => {
    if (!confirm('Delete this scheduled job?')) return;
    try {
      await fetch('/api/cron', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', jobId }),
      });
      loadJobs();
    } catch (error) {
      console.error('Error deleting job:', error);
    }
  };

  const formatSchedule = (schedule: CronJob['schedule']) => {
    if (schedule.kind === 'at' && schedule.atMs) {
      return `One-time: ${new Date(schedule.atMs).toLocaleString()}`;
    }
    if (schedule.kind === 'every' && schedule.everyMs) {
      const hours = Math.floor(schedule.everyMs / 3600000);
      const mins = Math.floor((schedule.everyMs % 3600000) / 60000);
      if (hours > 0) return `Every ${hours}h ${mins > 0 ? mins + 'm' : ''}`;
      return `Every ${mins}m`;
    }
    if (schedule.kind === 'cron' && schedule.expr) {
      return `Cron: ${schedule.expr}`;
    }
    return 'Unknown';
  };

  const formatNextRun = (nextRunAtMs?: number) => {
    if (!nextRunAtMs) return 'Not scheduled';
    const date = new Date(nextRunAtMs);
    const now = new Date();
    const diff = nextRunAtMs - now.getTime();
    
    if (diff < 0) return 'Past due';
    if (diff < 60000) return 'Less than a minute';
    if (diff < 3600000) return `In ${Math.floor(diff / 60000)} minutes`;
    if (diff < 86400000) return `In ${Math.floor(diff / 3600000)} hours`;
    return date.toLocaleDateString();
  };

  const scheduleTypeIcons = {
    at: <Calendar className="w-4 h-4" />,
    every: <Repeat className="w-4 h-4" />,
    cron: <Clock className="w-4 h-4" />,
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Clock className="w-6 h-6 text-brand" />
            Scheduled Jobs
          </h1>
          <p className="text-muted-foreground">Cron jobs, reminders, and scheduled tasks</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={loadJobs}
            disabled={isLoading}
            className="border-border text-muted-foreground hover:bg-secondary"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button 
            onClick={() => setShowForm(!showForm)}
            className="bg-brand hover:bg-brand/90 text-white"
          >
            {showForm ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            {showForm ? 'Cancel' : 'New Job'}
          </Button>
        </div>
      </div>

      {/* Add Job Form */}
      {showForm && (
        <Card className="mb-6 bg-card/50 border-border border-brand/30">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Plus className="w-5 h-5 text-brand" />
              Create Scheduled Job
            </CardTitle>
            <CardDescription>Set up a reminder or recurring task</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground block mb-2">Job Name *</label>
              <Input
                placeholder="e.g., Daily standup reminder"
                value={newJob.name}
                onChange={(e) => setNewJob({ ...newJob, name: e.target.value })}
                className="bg-secondary border-border text-foreground"
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground block mb-2">Schedule Type</label>
              <div className="flex gap-2">
                {(['at', 'every', 'cron'] as const).map((type) => (
                  <Button
                    key={type}
                    variant="outline"
                    onClick={() => setNewJob({ ...newJob, scheduleType: type })}
                    className={`flex-1 capitalize ${
                      newJob.scheduleType === type 
                        ? 'bg-brand/20 border-brand text-brand' 
                        : 'border-border text-muted-foreground'
                    }`}
                  >
                    {scheduleTypeIcons[type]}
                    <span className="ml-2">
                      {type === 'at' ? 'One-time' : type === 'every' ? 'Recurring' : 'Cron'}
                    </span>
                  </Button>
                ))}
              </div>
            </div>

            {newJob.scheduleType === 'at' && (
              <div>
                <label className="text-sm text-muted-foreground block mb-2">Date & Time *</label>
                <Input
                  type="datetime-local"
                  value={newJob.dateTime}
                  onChange={(e) => setNewJob({ ...newJob, dateTime: e.target.value })}
                  className="bg-secondary border-border text-foreground"
                />
              </div>
            )}

            {newJob.scheduleType === 'every' && (
              <div>
                <label className="text-sm text-muted-foreground block mb-2">Interval (minutes)</label>
                <Input
                  type="number"
                  placeholder="60"
                  value={newJob.intervalMinutes}
                  onChange={(e) => setNewJob({ ...newJob, intervalMinutes: e.target.value })}
                  className="bg-secondary border-border text-foreground"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Common: 30 (half hour), 60 (hourly), 1440 (daily)
                </p>
              </div>
            )}

            {newJob.scheduleType === 'cron' && (
              <div>
                <label className="text-sm text-muted-foreground block mb-2">Cron Expression *</label>
                <Input
                  placeholder="0 9 * * 1-5"
                  value={newJob.cronExpr}
                  onChange={(e) => setNewJob({ ...newJob, cronExpr: e.target.value })}
                  className="bg-secondary border-border text-foreground font-mono"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Examples: "0 9 * * *" (9am daily), "0 9 * * 1-5" (9am weekdays), "*/30 * * * *" (every 30min)
                </p>
              </div>
            )}
            
            <div>
              <label className="text-sm text-muted-foreground block mb-2">Message / Reminder Text *</label>
              <Textarea
                placeholder="What should I remind you about?"
                value={newJob.message}
                onChange={(e) => setNewJob({ ...newJob, message: e.target.value })}
                className="bg-secondary border-border text-foreground min-h-[100px]"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={addJob} className="bg-brand hover:bg-brand/90">
                <Plus className="w-4 h-4 mr-2" />
                Create Job
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)} className="border-border text-muted-foreground">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Jobs List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Loading...
        </div>
      ) : jobs.length === 0 ? (
        <Card className="bg-card/50 border-border">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">No Scheduled Jobs</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Create a scheduled job to set up reminders or recurring tasks.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[calc(100vh-280px)]">
          <div className="space-y-4">
            {jobs.map((job) => (
              <Card key={job.id} className="bg-card/50 border-border hover:border-border transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="text-lg font-medium text-foreground">
                          {job.name || 'Unnamed Job'}
                        </h3>
                        <Badge
                          variant="outline"
                          className={job.enabled 
                            ? 'border-green-500 text-green-500' 
                            : 'border-zinc-500 text-muted-foreground'
                          }
                        >
                          {job.enabled ? 'Active' : 'Disabled'}
                        </Badge>
                        <Badge variant="outline" className="border-border text-muted-foreground">
                          {scheduleTypeIcons[job.schedule.kind]}
                          <span className="ml-1">{job.schedule.kind}</span>
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-muted-foreground">Schedule:</span>
                          <span className="text-muted-foreground ml-2">{formatSchedule(job.schedule)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Next Run:</span>
                          <span className="text-muted-foreground ml-2">
                            {formatNextRun(job.state?.nextRunAtMs)}
                          </span>
                        </div>
                      </div>
                      
                      {job.payload.text && (
                        <div className="p-3 bg-secondary rounded-lg">
                          <p className="text-sm text-muted-foreground">{job.payload.text}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => runJob(job.id)}
                        className="border-border text-muted-foreground hover:bg-secondary"
                        title="Run Now"
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteJob(job.id)}
                        className="border-red-800 text-red-500 hover:bg-red-900/20"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
