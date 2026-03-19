import { useState, useRef, useEffect, MouseEvent, FC } from 'react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  eachDayOfInterval,
  isToday,
  startOfDay
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ChevronDown } from 'lucide-react';

interface CalendarProps {
  selectedDate?: Date;
  onDateSelect: (date: Date) => void;
  className?: string;
}

const Calendar: FC<CalendarProps> = ({
  selectedDate,
  onDateSelect,
  className = "",
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const nextMonth = (e: MouseEvent) => {
    e.stopPropagation();
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const prevMonth = (e: MouseEvent) => {
    e.stopPropagation();
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const allDays = eachDayOfInterval({ start: startDate, end: endDate });

  return (
    <div className={`w-[260px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xl shadow-black/10 dark:shadow-black/50 overflow-hidden ${className}`}>
      <header className="flex items-center justify-between mb-3">
        <div className="flex flex-col">
          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] leading-none mb-1">
            {format(currentMonth, "yyyy")}
          </span>
          <h3 className="text-[13px] font-bold text-slate-900 dark:text-white tracking-tight leading-none">
            {format(currentMonth, "MMMM")}
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={nextMonth}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
          <div key={day} className="h-7 flex items-center justify-center">
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">
              {day}
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {allDays.map((date, i) => {
          const isCurrentMonth = isSameMonth(date, monthStart);
          const isSelected = selectedDate && isSameDay(date, selectedDate);
          const isCurrentDay = isToday(date);

          return (
            <button
              key={i}
              onClick={() => onDateSelect(startOfDay(date))}
              className={`
                relative h-8 w-8 flex items-center justify-center rounded-lg text-[11px] font-medium transition-all group
                ${!isCurrentMonth ? "text-slate-300 dark:text-slate-700" : "text-slate-700 dark:text-slate-300"}
                ${isSelected ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 scale-95 z-10" : "hover:bg-slate-100 dark:hover:bg-slate-800"}
                ${isCurrentDay && !isSelected ? "text-indigo-600 dark:text-indigo-400 ring-1 ring-inset ring-indigo-500/30" : ""}
              `}
            >
              <span className={isSelected ? "text-white" : ""}>
                {format(date, "d")}
              </span>
              {isSelected && (
                <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-white dark:bg-slate-900 border-2 border-indigo-600" />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
        <button
          onClick={() => onDateSelect(new Date())}
          className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors"
        >
          Today
        </button>
        {selectedDate && (
          <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">
            {format(selectedDate, "MMM d, yyyy")}
          </span>
        )}
      </div>
    </div>
  );
};

interface DatePickerProps {
  value?: string;
  onChange: (date: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  disabled?: boolean;
}

export const DatePicker: FC<DatePickerProps> = ({
  value,
  onChange,
  label,
  placeholder,
  className = "",
  triggerClassName = "",
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedDate = value ? new Date(value) : undefined;

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: globalThis.MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDateSelect = (date: Date) => {
    onChange(format(date, "yyyy-MM-dd"));
    setIsOpen(false);
  };

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] mb-1.5 ml-1">
          {label}
        </label>
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500/30 dark:focus:ring-indigo-500/50 hover:border-slate-300 dark:hover:border-slate-700 transition-all group disabled:opacity-50 disabled:cursor-not-allowed ${triggerClassName}`}
      >
        <div className="flex items-center space-x-2.5 overflow-hidden">
          <CalendarIcon className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
          <span
            className={`text-[13px] font-medium truncate ${value ? "text-slate-900 dark:text-slate-200" : "text-slate-400 dark:text-slate-600"}`}
          >
            {value
              ? format(new Date(value), "MMM do, yyyy")
              : placeholder || "Select Date"}
          </span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-300 dark:text-slate-700 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && !disabled && (
        <div
          className="absolute top-full left-0 mt-2 z-50 origin-top-left"
        >
          <Calendar
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
          />
        </div>
      )}
    </div>
  );
};

export default DatePicker;
