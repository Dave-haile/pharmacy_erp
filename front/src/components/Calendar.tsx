import {
  useState,
  useRef,
  useEffect,
  MouseEvent,
  FC,
  ChangeEvent,
} from "react";
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
  startOfDay,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  ChevronDown,
} from "lucide-react";

interface CalendarProps {
  selectedDate?: Date;
  onDateSelect: (date: Date) => void;
  className?: string;
}

type ViewMode = "days" | "months" | "years";

const Calendar: FC<CalendarProps> = ({
  selectedDate,
  onDateSelect,
  className = "",
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("days");

  const next = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (viewMode === "days") {
      setCurrentMonth(addMonths(currentMonth, 1));
    } else if (viewMode === "months") {
      setCurrentMonth(
        new Date(currentMonth.getFullYear() + 1, currentMonth.getMonth()),
      );
    } else {
      setCurrentMonth(
        new Date(currentMonth.getFullYear() + 10, currentMonth.getMonth()),
      );
    }
  };

  const prev = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (viewMode === "days") {
      setCurrentMonth(subMonths(currentMonth, 1));
    } else if (viewMode === "months") {
      setCurrentMonth(
        new Date(currentMonth.getFullYear() - 1, currentMonth.getMonth()),
      );
    } else {
      setCurrentMonth(
        new Date(currentMonth.getFullYear() - 10, currentMonth.getMonth()),
      );
    }
  };

  const handleMonthSelect = (monthIndex: number) => {
    const newDate = new Date(currentMonth.getFullYear(), monthIndex, 1);
    setCurrentMonth(newDate);
    setViewMode("days");
  };

  const handleYearSelect = (year: number) => {
    const newDate = new Date(year, currentMonth.getMonth(), 1);
    setCurrentMonth(newDate);
    setViewMode("months");
  };

  const renderDaysView = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const allDays = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
            <div key={day} className="h-7 flex items-center justify-center">
              <span className="text-[9px] font-bold text-[#94a3b8] dark:text-[#64748b] uppercase tracking-widest">
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
                type="button"
                key={i}
                onClick={() => onDateSelect(startOfDay(date))}
                className={`
                  relative h-8 w-8 flex items-center justify-center rounded-lg text-[11px] font-medium transition-all group
                  ${!isCurrentMonth ? "opacity-30" : "text-[#0f172a] dark:text-[#f8fafc]"}
                  ${isSelected ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 scale-95 z-10" : "hover:bg-slate-100 dark:hover:bg-slate-800"}
                  ${isCurrentDay && !isSelected ? "text-indigo-600 dark:text-indigo-400 ring-1 ring-inset ring-indigo-500/30" : ""}
                `}
              >
                <span className={isSelected ? "text-white" : ""}>
                  {format(date, "d")}
                </span>
                {isSelected && (
                  <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[#ffffff] dark:bg-[#1e293b] border-2 border-indigo-600" />
                )}
              </button>
            );
          })}
        </div>
      </>
    );
  };

  const renderMonthsView = () => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return (
      <div className="grid grid-cols-3 gap-2 py-2">
        {months.map((month, index) => {
          const isSelected = currentMonth.getMonth() === index;
          return (
            <button
              type="button"
              key={month}
              onClick={() => handleMonthSelect(index)}
              className={`
                h-10 flex items-center justify-center rounded-xl text-[12px] font-medium transition-all
                ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                    : "text-[#0f172a] dark:text-[#f8fafc] hover:bg-slate-100 dark:hover:bg-slate-800"
                }
              `}
            >
              {month}
            </button>
          );
        })}
      </div>
    );
  };

  const renderYearsView = () => {
    const currentYear = currentMonth.getFullYear();
    const startYear = Math.floor(currentYear / 10) * 10;
    const years = Array.from({ length: 12 }, (_, i) => startYear - 1 + i);

    return (
      <div className="grid grid-cols-3 gap-2 py-2">
        {years.map((year) => {
          const isSelected = currentMonth.getFullYear() === year;
          const isOutOfRange = year < startYear || year > startYear + 9;
          return (
            <button
              type="button"
              key={year}
              onClick={() => handleYearSelect(year)}
              className={`
                h-10 flex items-center justify-center rounded-xl text-[12px] font-medium transition-all
                ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                    : "text-[#0f172a] dark:text-[#f8fafc] hover:bg-slate-100 dark:hover:bg-slate-800"
                }
                ${isOutOfRange ? "opacity-30" : ""}
              `}
            >
              {year}
            </button>
          );
        })}
      </div>
    );
  };

  const getHeaderLabel = () => {
    if (viewMode === "days") {
      return (
        <div
          className="flex flex-col cursor-pointer group"
          onClick={() => setViewMode("months")}
        >
          <span
            className="text-[9px] font-bold text-[#64748b] dark:text-[#94a3b8] uppercase tracking-[0.2em] leading-none mb-1 group-hover:text-indigo-600 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setViewMode("years");
            }}
          >
            {format(currentMonth, "yyyy")}
          </span>
          <h3 className="text-[13px] font-bold text-[#0f172a] dark:text-[#f8fafc] tracking-tight leading-none group-hover:text-indigo-600 transition-colors">
            {format(currentMonth, "MMMM")}
          </h3>
        </div>
      );
    } else if (viewMode === "months") {
      return (
        <div
          className="flex flex-col cursor-pointer group"
          onClick={() => setViewMode("years")}
        >
          <h3 className="text-[13px] font-bold text-[#0f172a] dark:text-[#f8fafc] tracking-tight leading-none group-hover:text-indigo-600 transition-colors">
            {currentMonth.getFullYear()}
          </h3>
        </div>
      );
    } else {
      const startYear = Math.floor(currentMonth.getFullYear() / 10) * 10;
      return (
        <div className="flex flex-col">
          <h3 className="text-[13px] font-bold text-[#0f172a] dark:text-[#f8fafc] tracking-tight leading-none">
            {startYear} - {startYear + 9}
          </h3>
        </div>
      );
    }
  };

  return (
    <div
      className={`w-[260px] bg-[#ffffff] dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#1e293b] rounded-2xl p-4 shadow-2xl shadow-black/10 dark:shadow-black/50 overflow-hidden ${className}`}
    >
      <header className="flex items-center justify-between mb-3">
        {getHeaderLabel()}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={prev}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-[#64748b] dark:text-[#94a3b8] hover:text-[#0f172a] dark:hover:text-[#f8fafc] transition-colors border border-transparent hover:border-[#e2e8f0] dark:hover:border-[#1e293b]"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={next}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-[#64748b] dark:text-[#94a3b8] hover:text-[#0f172a] dark:hover:text-[#f8fafc] transition-colors border border-transparent hover:border-[#e2e8f0] dark:hover:border-[#1e293b]"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      <div key={viewMode + currentMonth.getTime()}>
        {viewMode === "days" && renderDaysView()}
        {viewMode === "months" && renderMonthsView()}
        {viewMode === "years" && renderYearsView()}
      </div>

      {viewMode === "days" && (
        <div className="mt-4 pt-3 border-t border-[#e2e8f0] dark:border-[#1e293b] flex justify-between items-center">
          <button
            type="button"
            onClick={() => onDateSelect(new Date())}
            className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors"
          >
            Today
          </button>
          {selectedDate && (
            <span className="text-[8px] font-bold text-[#64748b] dark:text-[#94a3b8] uppercase tracking-tighter">
              {format(selectedDate, "MMM d, yyyy")}
            </span>
          )}
        </div>
      )}
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
  const [inputValue, setInputValue] = useState(
    value ? format(new Date(value), "MM/dd/yyyy") : "",
  );
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedDate = value ? new Date(value) : undefined;

  // Sync inputValue when value prop changes externally
  useEffect(() => {
    if (value) {
      const formatted = format(new Date(value), "MM/dd/yyyy");
      setInputValue(formatted);
      setError(null);
    } else {
      setInputValue("");
    }
  }, [value]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: globalThis.MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDateSelect = (date: Date) => {
    const formatted = format(date, "yyyy-MM-dd");
    onChange(formatted);
    setIsOpen(false);
    setError(null);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const isDeleting = input.length < inputValue.length;

    if (isDeleting) {
      setInputValue(input);
      setError(null);
      return;
    }

    // Allow only digits and slashes
    let val = input.replace(/[^0-9/]/g, "");

    // Auto-formatting: add slash after MM and DD if not present
    if (val.length === 2 && !val.includes("/")) {
      val += "/";
    } else if (
      val.length === 5 &&
      val.split("/").length === 2 &&
      !val.endsWith("/")
    ) {
      val += "/";
    }

    const finalVal = val.slice(0, 10);
    setInputValue(finalVal);

    // Validation logic
    const parts = finalVal.split("/");
    if (parts.length === 3 && parts[2].length === 4) {
      const monthInput = parseInt(parts[0]);
      const dayInput = parseInt(parts[1]);
      const yearInput = parseInt(parts[2]);

      if (isNaN(monthInput) || monthInput < 1 || monthInput > 12) {
        setError("Invalid month (01-12)");
        return;
      }

      const date = new Date(yearInput, monthInput - 1, dayInput);
      const isValid =
        !isNaN(date.getTime()) &&
        date.getFullYear() === yearInput &&
        date.getMonth() === monthInput - 1 &&
        date.getDate() === dayInput;

      if (!isValid) {
        if (dayInput < 1 || dayInput > 31) {
          setError("Invalid day (01-31)");
        } else {
          setError("Invalid date for this month");
        }
      } else if (yearInput < 1900 || yearInput > 2100) {
        setError("Year must be 1900-2100");
      } else {
        onChange(format(date, "yyyy-MM-dd"));
        setError(null);
      }
    } else {
      setError(null);
    }
  };

  const handleBlur = () => {
    // If input is invalid or incomplete, revert to current value
    if (error || (inputValue.length > 0 && inputValue.length < 10)) {
      if (value) {
        setInputValue(format(new Date(value), "MM/dd/yyyy"));
      } else {
        setInputValue("");
      }
      setError(null);
    }
  };

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-[10px] font-bold text-[#64748b] dark:text-[#94a3b8] uppercase tracking-[0.2em] mb-1.5 ml-1">
          {label}
        </label>
      )}
      <div
        className={`
          w-full flex items-center justify-between px-3 py-2 bg-[#f8fafc] dark:bg-[#0f172a] border rounded-xl transition-all group
          ${
            error
              ? "border-red-500 ring-2 ring-red-500/20"
              : "border-[#e2e8f0] dark:border-[#1e293b] focus-within:ring-2 focus-within:ring-indigo-500/30 dark:focus-within:ring-indigo-500/50 hover:border-slate-300 dark:hover:border-slate-700"
          }
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          ${triggerClassName}
        `}
      >
        <div className="flex items-center space-x-2.5 flex-1 overflow-hidden">
          <CalendarIcon
            className={`w-4 h-4 transition-colors cursor-pointer ${error ? "text-red-400" : "text-[#64748b] dark:text-[#94a3b8] group-hover:text-indigo-600 dark:group-hover:text-indigo-400"}`}
            onClick={() => !disabled && setIsOpen(!isOpen)}
          />
          <input
            type="text"
            disabled={disabled}
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleBlur}
            onFocus={() => !disabled && setIsOpen(true)}
            placeholder={placeholder || "MM/DD/YYYY"}
            className="bg-transparent text-[13px] font-medium text-[#0f172a] dark:text-[#f8fafc] placeholder:text-[#94a3b8] dark:placeholder:text-[#64748b] focus:outline-none w-full"
          />
        </div>
        <ChevronDown
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`w-3.5 h-3.5 transition-transform duration-300 cursor-pointer ${isOpen ? "rotate-180" : ""} ${error ? "text-red-300" : "text-slate-300 dark:text-slate-700"}`}
        />
      </div>

      {error && (
        <div className="overflow-hidden">
          <p className="text-[10px] font-bold text-red-500 mt-1.5 ml-1 uppercase tracking-wider">
            {error}
          </p>
        </div>
      )}

      {isOpen && !disabled && (
        <div className="absolute top-full left-0 mt-2 z-50 origin-top-left">
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
