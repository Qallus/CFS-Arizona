'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalendarProps {
  value?: Date | null;
  onChange?: (date: Date) => void;
  selectedDates?: Date[];
  onDateSelect?: (date: Date) => void;
  markedDates?: Date[];
  className?: string;
  minDate?: Date;
  maxDate?: Date;
}

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function Calendar({
  value,
  onChange,
  selectedDates = [],
  onDateSelect,
  markedDates = [],
  className,
  minDate,
  maxDate,
}: CalendarProps) {
  const [viewDate, setViewDate] = useState(() => {
    if (value) return new Date(value);
    return new Date();
  });

  const daysInMonth = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysCount = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days: (number | null)[] = [];

    // Empty cells before the first day
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }

    // Days of the month
    for (let i = 1; i <= daysCount; i++) {
      days.push(i);
    }

    return days;
  }, [viewDate]);

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleSelectDate = (day: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    
    // Check bounds
    if (minDate && newDate < minDate) return;
    if (maxDate && newDate > maxDate) return;
    
    onChange?.(newDate);
    onDateSelect?.(newDate);
  };

  const isSelected = (day: number) => {
    const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    
    // Check single value
    if (value) {
      const v = new Date(value);
      if (v.getDate() === day && v.getMonth() === viewDate.getMonth() && v.getFullYear() === viewDate.getFullYear()) {
        return true;
      }
    }
    
    // Check selected dates array
    return selectedDates.some(d => {
      const sd = new Date(d);
      return sd.getDate() === day && sd.getMonth() === viewDate.getMonth() && sd.getFullYear() === viewDate.getFullYear();
    });
  };

  const isMarked = (day: number) => {
    return markedDates.some(d => {
      const md = new Date(d);
      return md.getDate() === day && md.getMonth() === viewDate.getMonth() && md.getFullYear() === viewDate.getFullYear();
    });
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === viewDate.getMonth() &&
      today.getFullYear() === viewDate.getFullYear()
    );
  };

  const isDisabled = (day: number) => {
    const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  return (
    <div className={cn('p-4 bg-card border border-border rounded-xl shadow-sm', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="font-semibold text-foreground">
          {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
        </span>
        <button
          type="button"
          onClick={handleNextMonth}
          className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground"
        >
          <ChevronRight className="w-4 h-4" />
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
        {daysInMonth.map((day, index) => (
          <div key={index} className="aspect-square flex items-center justify-center">
            {day !== null && (
              <button
                type="button"
                onClick={() => handleSelectDate(day)}
                disabled={isDisabled(day)}
                className={cn(
                  'w-9 h-9 flex items-center justify-center rounded-full text-sm font-medium transition-all relative',
                  isSelected(day)
                    ? 'bg-brand text-brand-foreground shadow-md'
                    : isToday(day)
                    ? 'bg-brand/15 text-brand font-semibold'
                    : isDisabled(day)
                    ? 'text-muted-foreground/40 cursor-not-allowed'
                    : 'hover:bg-secondary text-foreground'
                )}
              >
                {day}
                {isMarked(day) && !isSelected(day) && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand" />
                )}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Mini Calendar variant for sidebars
export function MiniCalendar({
  value,
  onChange,
  markedDates = [],
  className,
}: CalendarProps) {
  return (
    <Calendar
      value={value}
      onChange={onChange}
      markedDates={markedDates}
      className={cn('p-3', className)}
    />
  );
}
