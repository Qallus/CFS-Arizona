'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function DatePicker({ value, onChange, placeholder = 'Select date', className }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    if (value) {
      return new Date(value);
    }
    return new Date();
  });
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedDate = value ? new Date(value) : null;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days: (number | null)[] = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return days;
  };

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleSelectDate = (day: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const formattedDate = newDate.toISOString().split('T')[0];
    onChange(formattedDate);
    setIsOpen(false);
  };

  const handleToday = () => {
    const today = new Date();
    setViewDate(today);
    const formattedDate = today.toISOString().split('T')[0];
    onChange(formattedDate);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange('');
    setIsOpen(false);
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === viewDate.getMonth() &&
      selectedDate.getFullYear() === viewDate.getFullYear()
    );
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === viewDate.getMonth() &&
      today.getFullYear() === viewDate.getFullYear()
    );
  };

  const formatDisplayValue = () => {
    if (!value) return '';
    const date = new Date(value);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const days = getDaysInMonth(viewDate);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Input */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 bg-secondary border border-border rounded-lg text-left hover:border-brand/50 transition-colors"
      >
        <span className={value ? 'text-foreground' : 'text-muted-foreground'}>
          {value ? formatDisplayValue() : placeholder}
        </span>
        <Calendar className="w-4 h-4 text-muted-foreground" />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-2 p-4 bg-card border border-border rounded-xl shadow-xl min-w-[280px]">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-secondary rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-semibold text-foreground">
              {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-secondary rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map((day) => (
              <div key={day} className="text-center text-xs text-muted-foreground font-medium py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => (
              <div key={index} className="aspect-square flex items-center justify-center">
                {day !== null && (
                  <button
                    type="button"
                    onClick={() => handleSelectDate(day)}
                    className={cn(
                      'w-9 h-9 flex items-center justify-center rounded-full text-sm font-medium transition-all',
                      isSelected(day)
                        ? 'bg-brand text-brand-foreground shadow-md'
                        : isToday(day)
                        ? 'bg-brand/15 text-brand font-semibold'
                        : 'hover:bg-secondary text-foreground'
                    )}
                  >
                    {day}
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
            <button
              type="button"
              onClick={handleClear}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="text-sm text-brand hover:text-brand/90 font-medium transition-colors"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Time Picker Component
interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  use24Hour?: boolean;
}

export function TimePicker({ value, onChange, placeholder = 'Select time', className, use24Hour = false }: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Parse the value (HH:MM format)
  const parseTime = (timeStr: string) => {
    if (!timeStr) return { hour: 12, minute: 0, period: 'AM' as const };
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (use24Hour) {
      return { hour: hours, minute: minutes || 0, period: 'AM' as const };
    }
    const period: 'AM' | 'PM' = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return { hour: hour12, minute: minutes || 0, period };
  };
  
  const { hour, minute, period } = parseTime(value);
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleTimeChange = (newHour: number, newMinute: number, newPeriod: 'AM' | 'PM') => {
    let hour24 = newHour;
    if (!use24Hour) {
      if (newPeriod === 'PM' && newHour !== 12) hour24 = newHour + 12;
      if (newPeriod === 'AM' && newHour === 12) hour24 = 0;
    }
    const timeStr = `${hour24.toString().padStart(2, '0')}:${newMinute.toString().padStart(2, '0')}`;
    onChange(timeStr);
  };
  
  const formatDisplayValue = () => {
    if (!value) return '';
    if (use24Hour) {
      return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    }
    return `${hour}:${minute.toString().padStart(2, '0')} ${period}`;
  };
  
  const hours = use24Hour 
    ? Array.from({ length: 24 }, (_, i) => i)
    : Array.from({ length: 12 }, (_, i) => i === 0 ? 12 : i);
  
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5); // 5-minute intervals

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Input */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 bg-secondary border border-border rounded-lg text-left hover:border-brand/50 transition-colors"
      >
        <span className={value ? 'text-foreground' : 'text-muted-foreground'}>
          {value ? formatDisplayValue() : placeholder}
        </span>
        <Clock className="w-4 h-4 text-muted-foreground" />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-2 p-3 bg-card border border-border rounded-xl shadow-xl min-w-[200px]">
          <div className="flex gap-2">
            {/* Hours */}
            <div className="flex-1">
              <div className="text-xs text-muted-foreground text-center mb-2 font-medium">Hour</div>
              <div className="h-[180px] overflow-y-auto scrollbar-thin">
                {hours.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => handleTimeChange(h, minute, period)}
                    className={cn(
                      'w-full py-2 px-3 text-center rounded-lg text-sm font-medium transition-all',
                      (use24Hour ? hour === h : hour === h)
                        ? 'bg-brand text-brand-foreground'
                        : 'hover:bg-secondary text-foreground'
                    )}
                  >
                    {use24Hour ? h.toString().padStart(2, '0') : h}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Minutes */}
            <div className="flex-1">
              <div className="text-xs text-muted-foreground text-center mb-2 font-medium">Min</div>
              <div className="h-[180px] overflow-y-auto scrollbar-thin">
                {minutes.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleTimeChange(hour, m, period)}
                    className={cn(
                      'w-full py-2 px-3 text-center rounded-lg text-sm font-medium transition-all',
                      minute === m
                        ? 'bg-brand text-brand-foreground'
                        : 'hover:bg-secondary text-foreground'
                    )}
                  >
                    {m.toString().padStart(2, '0')}
                  </button>
                ))}
              </div>
            </div>
            
            {/* AM/PM (only for 12-hour) */}
            {!use24Hour && (
              <div className="w-14">
                <div className="text-xs text-muted-foreground text-center mb-2 font-medium">&nbsp;</div>
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => handleTimeChange(hour, minute, 'AM')}
                    className={cn(
                      'w-full py-2 px-2 text-center rounded-lg text-sm font-medium transition-all',
                      period === 'AM'
                        ? 'bg-brand text-brand-foreground'
                        : 'hover:bg-secondary text-foreground'
                    )}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTimeChange(hour, minute, 'PM')}
                    className={cn(
                      'w-full py-2 px-2 text-center rounded-lg text-sm font-medium transition-all',
                      period === 'PM'
                        ? 'bg-brand text-brand-foreground'
                        : 'hover:bg-secondary text-foreground'
                    )}
                  >
                    PM
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
            <button
              type="button"
              onClick={() => { onChange(''); setIsOpen(false); }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-sm text-brand hover:text-brand/90 font-medium transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
