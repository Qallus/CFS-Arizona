'use client';

import { useState } from 'react';
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Clock, 
  Users,
  ArrowUpRight,
  GripVertical,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import type { Project } from '@/types';

interface KanbanBoardProps {
  projects: Project[];
  onEdit: (project: Project) => void;
  onDelete: (projectId: string) => void;
  onRefresh: () => void;
}

const STATUS_COLUMNS = [
  { key: 'planning', label: 'Planning', color: 'bg-gray-500' },
  { key: 'active', label: 'Active', color: 'bg-blue-500' },
  { key: 'on_hold', label: 'On Hold', color: 'bg-yellow-500' },
  { key: 'completed', label: 'Completed', color: 'bg-green-500' },
];

const PRIORITY_COLORS = {
  high: 'bg-red-500/20 text-red-500',
  medium: 'bg-yellow-500/20 text-yellow-500',
  low: 'bg-green-500/20 text-green-500',
};

export function KanbanBoard({ projects, onEdit, onDelete, onRefresh }: KanbanBoardProps) {
  const [draggedProject, setDraggedProject] = useState<Project | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, project: Project) => {
    setDraggedProject(project);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    if (!draggedProject || draggedProject.status === newStatus) {
      setDraggedProject(null);
      return;
    }

    try {
      await fetch('/api/projects', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: draggedProject.id, status: newStatus }),
      });
      onRefresh();
    } catch (error) {
      console.error('Error updating project status:', error);
    }
    setDraggedProject(null);
  };

  const getColumnProjects = (status: string) => 
    projects.filter(p => p.status === status);

  return (
    <div className="flex gap-4 h-full overflow-x-auto pb-4">
      {STATUS_COLUMNS.map((column) => (
        <div
          key={column.key}
          className="flex-shrink-0 w-80 flex flex-col bg-card/50 rounded-xl border border-border"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, column.key)}
        >
          {/* Column Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <div className={cn('w-3 h-3 rounded-full', column.color)} />
              <h3 className="font-semibold text-foreground">{column.label}</h3>
              <span className="px-2 py-0.5 bg-secondary rounded-full text-xs text-muted-foreground">
                {getColumnProjects(column.key).length}
              </span>
            </div>
          </div>

          {/* Column Content */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {getColumnProjects(column.key).map((project) => (
              <div
                key={project.id}
                draggable
                onDragStart={(e) => handleDragStart(e, project)}
                className={cn(
                  'p-4 bg-card rounded-lg border border-border cursor-grab active:cursor-grabbing transition-all hover:border-brand/50',
                  draggedProject?.id === project.id && 'opacity-50'
                )}
              >
                {/* Project Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: project.color || '#00fc83' }} 
                    />
                    <Link 
                      href={`/projects/${project.id}`}
                      className="font-medium text-foreground hover:text-brand transition-colors"
                    >
                      {project.name}
                    </Link>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setActiveMenu(activeMenu === project.id ? null : project.id)}
                      className="p-1 hover:bg-secondary rounded transition-colors"
                    >
                      <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                    </button>
                    {activeMenu === project.id && (
                      <div className="absolute right-0 top-full mt-1 w-32 bg-card border border-border rounded-lg shadow-lg z-10">
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
                </div>

                {/* Description */}
                {project.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {project.description}
                  </p>
                )}

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="text-foreground font-medium">{project.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-brand rounded-full transition-all"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <span className={cn('px-2 py-0.5 rounded text-xs font-medium', PRIORITY_COLORS[project.priority])}>
                    {project.priority}
                  </span>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {project.dueDate && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(project.dueDate).toLocaleDateString()}
                      </div>
                    )}
                    {project.team.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {project.team.length}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {getColumnProjects(column.key).length === 0 && (
              <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
                No projects
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
