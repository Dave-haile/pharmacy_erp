import React, { useState, useRef, useEffect } from "react";

interface SelectOption {
  value: string;
  label: string;
  subtitle?: string;
}

interface SearchableSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  onSearch?: (search: string) => void;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  onCreateNew?: () => void;
  createNewText?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  onSearch,
  placeholder = "Search...",
  className = "",
  triggerClassName = "",
  onCreateNew,
  createNewText = "Create new",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isUserTyping, setIsUserTyping] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  // Keep last non-empty options so we never flash empty list while parent refetches
  const stableOptionsRef = useRef<SelectOption[]>(options);
  if (options.length > 0) {
    stableOptionsRef.current = options;
  }
  const displayOptions = options.length > 0 ? options : stableOptionsRef.current;

  const selectedOption = React.useMemo(
    () => displayOptions.find((opt) => String(opt.value) === String(value)),
    [displayOptions, value]
  );

  useEffect(() => {
    if (!isUserTyping) {
      const newLabel = selectedOption?.label || "";

      setInputValue((prev) => {
        if (prev !== newLabel) return newLabel;
        return prev;
      });
    }
  }, [selectedOption, isUserTyping]);

  const filteredOptions = React.useMemo(() => {
    const lower = inputValue.toLowerCase();

    return displayOptions.filter(
      (option) =>
        option.label.toLowerCase().includes(lower) ||
        (option.subtitle &&
          option.subtitle.toLowerCase().includes(lower))
    );
  }, [displayOptions, inputValue]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className} ${isOpen ? 'z-100' : 'z-0'}`} ref={dropdownRef}>
      {/* Main Input Field */}
      <div className="relative group">
        <input
          type="text"
          value={inputValue}
          placeholder={placeholder}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            const newValue = e.target.value;
            setInputValue(newValue);
            setIsOpen(true);
            setIsUserTyping(true);

            if (newValue === "" && value !== "") {
              onChange("");
            }

            if (onSearch) {
              onSearch(newValue);
            }
          }}
          onBlur={() => {
            setTimeout(() => setIsUserTyping(false), 100);
          }}
          className={`w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-medium outline-none text-slate-900 dark:text-slate-100 shadow-sm focus:border-emerald-500 transition-all placeholder:text-slate-400 ${triggerClassName}`}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Dropdown: stays mounted when open so list content only swaps in place (no unmount flash) */}
      {isOpen && (
        <div className="min-w-[230px] custom-scrollbar absolute z-100 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-1 space-y-0.5">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setInputValue(option.label);
                    setIsOpen(false);
                    setIsUserTyping(false);
                  }}
                  className={`px-3 py-2 rounded-lg cursor-pointer transition-all group ${value === option.value
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent'
                    }`}
                >
                  <div className={`text-[12px] font-bold tracking-tight ${value === option.value ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white'
                    }`}>
                    {option.label}
                  </div>
                  {option.subtitle && (
                    <div className="text-[9px] font-medium text-slate-400 dark:text-slate-500 mt-0.5 group-hover:text-slate-500 dark:group-hover:text-slate-400 truncate">
                      {option.subtitle}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="px-3 py-4 text-center">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">No results found</p>
              </div>
            )}
          </div>

          {onCreateNew && (
            <div
              onClick={() => {
                onCreateNew();
                setIsOpen(false);
              }}
              className="p-1.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/50 cursor-pointer"
            >
              <div className="w-full py-1.5 px-3 rounded-lg bg-emerald-600/5 hover:bg-emerald-600/10 text-emerald-600 dark:text-emerald-500 text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center space-x-2 border border-emerald-500/10">
                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" />
                </svg>
                <span>{createNewText} {inputValue ? `'${inputValue}'` : ""}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
