'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Clock, 
  Users,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Project } from '@/types';

interface ProjectListProps {
  projects: Project[];
  onEdit: (project: Project) => void;
  onDelete: (projectId: string) => void;
}

const STATUS_COLORS = {
  planning: 'bg-gray-500/20 text-gray-500',
  active: 'bg-blue-500/20 text-blue-500',
  on_hold: 'bg-yellow-500/20 text-yellow-500',
  completed: 'bg-green-500/20 text-green-500',
  cancelled: 'bg-red-500/20 text-red-500',
};

const STATUS_LABELS = {
  planning: 'Planning',
  active: 'Active',
  on_hold: 'On Hold',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const PRIORITY_COLORS = {
  high: 'bg-red-500/20 text-red-500',
  medium: 'bg-yellow-500/20 text-yellow-500',
  low: 'bg-green-500/20 text-green-500',
};

type SortField = 'name' | 'status' | 'priority' | 'dueDate' | 'progress' | 'createdAt';
type SortDirection = 'asc' | 'desc';

export function ProjectList({ projects, onEdit, onDelete }: ProjectListProps) {
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedProjects = [...projects].sort((a, b) => {
    let comparison = 0;
    
    switch (sortField) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
      case 'priority':
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
        break;
      case 'dueDate':
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        break;
      case 'progress':
        comparison = a.progress - b.progress;
        break;
      case 'createdAt':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-foreground transition-colors"
    >
      {children}
      {sortField === field && (
        sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
      )}
    </button>
  );

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <table className="w-full">
        <thead className="bg-secondary/50">
          <tr className="text-left text-sm text-muted-foreground">
            <th className="px-4 py-3 font-medium">
              <SortHeader field="name">Project</SortHeader>
            </th>
            <th className="px-4 py-3 font-medium">
              <SortHeader field="status">Status</SortHeader>
            </th>
            <th className="px-4 py-3 font-medium">
              <SortHeader field="priority">Priority</SortHeader>
            </th>
            <th className="px-4 py-3 font-medium">
              <SortHeader field="progress">Progress</SortHeader>
            </th>
            <th className="px-4 py-3 font-medium">
              <SortHeader field="dueDate">Due Date</SortHeader>
            </th>
            <th className="px-4 py-3 font-medium">Team</th>
            <th className="px-4 py-3 font-medium w-10"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {sortedProjects.map((project) => (
            <tr key={project.id} className="hover:bg-secondary/30 transition-colors">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: project.color || '#00fc83' }} 
                  />
                  <div>
                    <Link 
                      href={`/projects/${project.id}`}
                      className="font-medium text-foreground hover:text-brand transition-colors"
                    >
                      {project.name}
                    </Link>
                    {project.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {project.description}
                      </p>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <span className={cn('px-2 py-1 rounded text-xs font-medium', STATUS_COLORS[project.status])}>
                  {STATUS_LABELS[project.status]}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className={cn('px-2 py-1 rounded text-xs font-medium capitalize', PRIORITY_COLORS[project.priority])}>
                  {project.priority}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-brand rounded-full"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-8">{project.progress}%</span>
                </div>
              </td>
              <td className="px-4 py-3">
                {project.dueDate ? (
                  <div className="flex items-center gap-1 text-sm">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className={cn(
                      new Date(project.dueDate) < new Date() && project.status !== 'completed'
                        ? 'text-red-500'
                        : 'text-foreground'
                    )}>
                      {new Date(project.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">-</span>
                )}
              </td>
              <td className="px-4 py-3">
                {project.team.length > 0 ? (
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">{project.team.length}</span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">-</span>
                )}
              </td>
              <td className="px-4 py-3">
                <div className="relative">
                  <button
                    onClick={() => setActiveMenu(activeMenu === project.id ? null : project.id)}
                    className="p-1 hover:bg-secondary rounded transition-colors"
                  >
                    <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                  </button>
                  {activeMenu === project.id && (
                    <div className="absolute right-0 top-full mt-1 w-32 bg-card border border-border rounded-lg shadow-lg z-10">
                      <Link
                        href={`/projects/${project.id}`}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                        Open
                      </Link>
                      <button
                        onClick={() => { onEdit(project); setActiveMenu(null); }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => { onDelete(project.id); setActiveMenu(null); }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 hover:bg-secondary transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </td>
            </tr>
          ))}
          {sortedProjects.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                No projects found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
