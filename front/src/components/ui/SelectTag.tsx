import { useState, useRef, useEffect } from "react";

type Option = {
  label: string;
  value: string;
};

type SelectProps = {
  options: Option[];
  value: string;
  placeholder?: string;
  allowEmpty?: boolean;
  emptyLabel?: string;
  onChange: (value: string) => void;
  triggerClassName?: string;
};

export default function Select({
  options,
  value,
  placeholder = "Select...",
  allowEmpty = false,
  emptyLabel = "None",
  onChange,
  triggerClassName = "",
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative w-full text-[11px] font-mono font-bold">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-emerald-500/30 ${triggerClassName}`}
      >
        <span
          className={
            selected ? "text-slate-800 dark:text-white" : "text-gray-400"
          }
        >
          {selected ? selected.label : placeholder}
        </span>

        <svg
          className="h-4 w-4 text-slate-400"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg overflow-hidden">
          {/* Empty Option */}
          {allowEmpty && (
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className={`w-full h-8 text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 ${
                value === "" ? "text-emerald-600" : "text-gray-500"
              }`}
            >
              {emptyLabel}
            </button>
          )}

          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 ${
                value === option.value
                  ? "text-emerald-600"
                  : "text-slate-700 dark:text-slate-200"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
