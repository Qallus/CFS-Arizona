'use client';

import { useState, useEffect, use } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Calendar,
  ArrowRight,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'high' | 'medium' | 'low';
  dueDate: string | null;
}

interface Activity {
  id: string;
  message: string;
  createdAt: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  progress: number;
  startDate: string | null;
  endDate: string | null;
  dueDate: string | null;
  tasks: Task[];
  activityLog: Activity[];
  updatedAt: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  planning: { label: 'Planning', color: 'bg-gray-500' },
  active: { label: 'In Progress', color: 'bg-blue-500' },
  on_hold: { label: 'On Hold', color: 'bg-yellow-500' },
  completed: { label: 'Completed', color: 'bg-green-500' },
  cancelled: { label: 'Cancelled', color: 'bg-red-500' },
};

const TASK_STATUS_ICONS = {
  todo: Circle,
  in_progress: Clock,
  review: ArrowRight,
  done: CheckCircle2,
};

const TASK_STATUS_COLORS = {
  todo: 'text-gray-400',
  in_progress: 'text-blue-500',
  review: 'text-yellow-500',
  done: 'text-green-500',
};

export default function ClientPortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    fetchProject();
  }, [token]);

  const fetchProject = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/portal/${token}`);
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Failed to load project');
        setProject(null);
      } else {
        setProject(data.project);
        setLastRefresh(new Date());
      }
    } catch (err) {
      setError('Failed to load project');
      setProject(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Project Not Found</h1>
          <p className="text-muted-foreground mb-4">
            {error || 'This project link may be invalid or access has been revoked.'}
          </p>
          <p className="text-sm text-muted-foreground">
            If you believe this is an error, please contact the project owner.
          </p>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_LABELS[project.status] || STATUS_LABELS.planning;
  const tasksByStatus = {
    todo: project.tasks.filter(t => t.status === 'todo'),
    in_progress: project.tasks.filter(t => t.status === 'in_progress'),
    review: project.tasks.filter(t => t.status === 'review'),
    done: project.tasks.filter(t => t.status === 'done'),
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
                <span className={cn(
                  'px-2 py-1 rounded text-xs font-medium text-white',
                  statusConfig.color
                )}>
                  {statusConfig.label}
                </span>
              </div>
              {project.description && (
                <p className="text-muted-foreground max-w-2xl">{project.description}</p>
              )}
            </div>
            <button
              onClick={fetchProject}
              className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Progress & Dates */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Progress */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Progress</h3>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-4xl font-bold text-foreground">{project.progress}%</span>
              <span className="text-sm text-muted-foreground mb-1">complete</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-brand rounded-full transition-all"
                style={{ width: `${project.progress}%` }}
              />
            </div>
          </div>

          {/* Dates */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Timeline</h3>
            <div className="space-y-2">
              {project.startDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Started:</span>
                  <span className="text-foreground">{new Date(project.startDate).toLocaleDateString()}</span>
                </div>
              )}
              {project.dueDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Due:</span>
                  <span className="text-foreground font-medium">{new Date(project.dueDate).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Task Summary */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Tasks</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-center p-2 bg-secondary rounded-lg">
                <p className="text-2xl font-bold text-green-500">{tasksByStatus.done.length}</p>
                <p className="text-xs text-muted-foreground">Done</p>
              </div>
              <div className="text-center p-2 bg-secondary rounded-lg">
                <p className="text-2xl font-bold text-blue-500">{tasksByStatus.in_progress.length}</p>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </div>
              <div className="text-center p-2 bg-secondary rounded-lg">
                <p className="text-2xl font-bold text-yellow-500">{tasksByStatus.review.length}</p>
                <p className="text-xs text-muted-foreground">Review</p>
              </div>
              <div className="text-center p-2 bg-secondary rounded-lg">
                <p className="text-2xl font-bold text-gray-500">{tasksByStatus.todo.length}</p>
                <p className="text-xs text-muted-foreground">To Do</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tasks */}
        <div className="bg-card rounded-xl border border-border p-6 mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">Tasks</h2>
          
          {project.tasks.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No tasks yet</p>
          ) : (
            <div className="space-y-2">
              {project.tasks.map((task) => {
                const StatusIcon = TASK_STATUS_ICONS[task.status];
                return (
                  <div 
                    key={task.id} 
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border border-border',
                      task.status === 'done' && 'opacity-60'
                    )}
                  >
                    <StatusIcon className={cn('w-5 h-5 flex-shrink-0', TASK_STATUS_COLORS[task.status])} />
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'font-medium text-foreground',
                        task.status === 'done' && 'line-through'
                      )}>
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-sm text-muted-foreground truncate">{task.description}</p>
                      )}
                    </div>
                    {task.dueDate && (
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                    <span className={cn(
                      'px-2 py-0.5 rounded text-xs capitalize flex-shrink-0',
                      task.priority === 'high' && 'bg-red-500/20 text-red-500',
                      task.priority === 'medium' && 'bg-yellow-500/20 text-yellow-500',
                      task.priority === 'low' && 'bg-green-500/20 text-green-500',
                    )}>
                      {task.priority}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        {project.activityLog.length > 0 && (
          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {project.activityLog.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-brand mt-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-foreground">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-border text-center text-sm text-muted-foreground">
          <p>Last updated: {new Date(project.updatedAt).toLocaleString()}</p>
          <p className="mt-1">Powered by SIG360</p>
        </div>
      </main>
    </div>
  );
}
