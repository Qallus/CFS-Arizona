'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Project } from '@/types';

interface ProjectCalendarProps {
  projects: Project[];
  onEdit: (project: Project) => void;
}

export function ProjectCalendar({ projects, onEdit }: ProjectCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startingDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getProjectsForDate = (day: number) => {
    const date = new Date(year, month, day);
    const dateStr = date.toISOString().split('T')[0];
    
    return projects.filter(p => {
      if (p.dueDate && p.dueDate.startsWith(dateStr)) return true;
      if (p.startDate && p.startDate.startsWith(dateStr)) return true;
      if (p.endDate && p.endDate.startsWith(dateStr)) return true;
      return false;
    });
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Build calendar grid
  const calendarDays = [];
  
  // Empty cells before first day
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  
  // Days of month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-foreground">
            {monthName} {year}
          </h2>
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
          >
            Today
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Week Days Header */}
      <div className="grid grid-cols-7 border-b border-border">
        {weekDays.map((day) => (
          <div key={day} className="p-3 text-center text-sm font-medium text-muted-foreground">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {calendarDays.map((day, index) => {
          const dayProjects = day ? getProjectsForDate(day) : [];
          
          return (
            <div
              key={index}
              className={cn(
                'min-h-[120px] p-2 border-b border-r border-border last:border-r-0',
                !day && 'bg-secondary/30',
                day && isToday(day) && 'bg-brand/10'
              )}
            >
              {day && (
                <>
                  <div className={cn(
                    'text-sm font-medium mb-1',
                    isToday(day) ? 'text-brand' : 'text-foreground'
                  )}>
                    {day}
                  </div>
                  <div className="space-y-1">
                    {dayProjects.slice(0, 3).map((project) => (
                      <button
                        key={project.id}
                        onClick={() => onEdit(project)}
                        className="w-full text-left px-2 py-1 rounded text-xs truncate hover:opacity-80 transition-opacity"
                        style={{ backgroundColor: `${project.color}20`, color: project.color }}
                      >
                        {project.name}
                      </button>
                    ))}
                    {dayProjects.length > 3 && (
                      <div className="text-xs text-muted-foreground px-2">
                        +{dayProjects.length - 3} more
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 p-4 border-t border-border text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-brand" />
          <span>Due Date</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span>Start Date</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>End Date</span>
        </div>
      </div>
    </div>
  );
}
