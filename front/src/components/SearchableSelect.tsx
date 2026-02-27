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
  onCreateNew,
  createNewText = "Create new",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isUserTyping, setIsUserTyping] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    if (!isUserTyping) {
      if (selectedOption) {
        setInputValue(selectedOption.label);
      } else {
        setInputValue("");
      }
    }
  }, [value, selectedOption, isUserTyping]);

  const filteredOptions = options.filter(
    (option) =>
      option.label.toLowerCase().includes(inputValue.toLowerCase()) ||
      (option.subtitle &&
        option.subtitle.toLowerCase().includes(inputValue.toLowerCase())),
  );

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
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Main Input Field */}
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

          // If input is cleared, call onChange with empty value
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
        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-medium outline-none text-slate-900 dark:text-slate-100 shadow-sm focus:border-emerald-500 transition-all"
      />

      {/* Dropdown */}
      {isOpen && (
        <div className="custom-scrollbar absolute z-100 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl max-h-60 overflow-y-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <div
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setInputValue(option.label);
                  setIsOpen(false);
                }}
                className="px-3 py-2 text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <div className="font-semibold">{option.label}</div>
                {option.subtitle && (
                  <div className="text-[10px] text-slate-400">
                    {option.subtitle}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="px-3 py-4 text-center text-xs text-slate-400">
              No results found
            </div>
          )}

          {onCreateNew && (
            <div
              onClick={() => {
                onCreateNew();
                setIsOpen(false);
              }}
              className="px-3 py-2 border-t border-slate-200 dark:border-slate-800 cursor-pointer text-emerald-600 text-xs hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              {createNewText} {inputValue ? `'${inputValue}'` : ""}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
