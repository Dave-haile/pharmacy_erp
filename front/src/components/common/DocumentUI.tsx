import React, { ReactNode } from "react";

type AccentTone = "emerald" | "blue" | "amber" | "slate";

const accentClassMap: Record<AccentTone, string> = {
  emerald: "from-emerald-500/90 via-emerald-500/70 to-emerald-400/60",
  blue: "from-sky-500/90 via-blue-500/70 to-cyan-400/60",
  amber: "from-amber-500/90 via-orange-500/70 to-yellow-400/60",
  slate: "from-slate-500/90 via-slate-400/70 to-slate-300/60",
};

const summaryToneMap: Record<AccentTone, string> = {
  emerald:
    "border-emerald-200/70 bg-emerald-50/80 dark:border-emerald-900/50 dark:bg-emerald-950/20",
  blue: "border-sky-200/70 bg-sky-50/80 dark:border-sky-900/50 dark:bg-sky-950/20",
  amber:
    "border-amber-200/70 bg-amber-50/80 dark:border-amber-900/50 dark:bg-amber-950/20",
  slate:
    "border-slate-200/80 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-950/40",
};

export const documentInputClassName =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none shadow-sm transition-all placeholder:text-slate-400 focus:border-emerald-500/70 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-600 dark:focus:bg-slate-950";
export const documentSearchInputClassName =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none shadow-sm transition-all placeholder:text-slate-400 focus:border-emerald-500/70 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-600 dark:focus:bg-slate-950";

export const documentTextareaClassName = `${documentInputClassName} min-h-[112px] resize-y font-medium`;

export const documentSelectTriggerClassName =
  "rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold shadow-sm dark:bg-slate-950";

export const documentSecondaryButtonClassName =
  "inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-slate-600 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800";

export const documentPrimaryButtonClassName =
  "inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-2.5 text-[11px] font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50";

interface DocumentPageProps {
  children: ReactNode;
}

export const DocumentPage: React.FC<DocumentPageProps> = ({ children }) => (
  <div className="space-y-6 animate-in fade-in duration-500 pb-16">
    {children}
  </div>
);

interface DocumentHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  onBack?: () => void;
  meta?: ReactNode;
  actions?: ReactNode;
}

export const DocumentHeader: React.FC<DocumentHeaderProps> = ({
  eyebrow,
  title,
  description,
  onBack,
  meta,
  actions,
}) => (
  <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
    <div className="flex items-start gap-3">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="mt-1 rounded-xl border border-slate-200 bg-white p-2 text-slate-500 shadow-sm transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
        </button>
      )}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.28em] text-emerald-700 dark:text-emerald-400">
            {eyebrow}
          </span>
          {meta}
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white md:text-3xl">
            {title}
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-500 dark:text-slate-400">
            {description}
          </p>
        </div>
      </div>
    </div>
    {actions && (
      <div className="flex flex-wrap items-center gap-3">{actions}</div>
    )}
  </header>
);

interface DocumentCardProps {
  title?: string;
  description?: string;
  action?: ReactNode;
  accent?: AccentTone;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  title,
  description,
  action,
  accent = "slate",
  children,
  className = "",
  contentClassName = "",
}) => (
  <section
    className={`relative overflow-visible rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`.trim()}
  >
    <div className={`h-1 w-full bg-gradient-to-r ${accentClassMap[accent]}`} />
    {(title || description || action) && (
      <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800 md:flex-row md:items-start md:justify-between md:px-6">
        <div>
          {title && (
            <h2 className="text-sm font-black text-slate-900 dark:text-white">
              {title}
            </h2>
          )}
          {description && (
            <p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
              {description}
            </p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    )}
    <div className={`p-5 md:p-6 ${contentClassName}`.trim()}>{children}</div>
  </section>
);

interface DocumentFieldProps {
  label: string;
  hint?: string;
  children: ReactNode;
}

export const DocumentField: React.FC<DocumentFieldProps> = ({
  label,
  hint,
  children,
}) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between gap-3">
      <label className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
        {label}
      </label>
      {hint && (
        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
          {hint}
        </span>
      )}
    </div>
    {children}
  </div>
);

interface DocumentSummaryCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: AccentTone;
  valueClassName?: string;
}

export const DocumentSummaryCard: React.FC<DocumentSummaryCardProps> = ({
  label,
  value,
  hint,
  tone = "slate",
  valueClassName = "",
}) => (
  <div
    className={`rounded-2xl border p-5 shadow-sm ${summaryToneMap[tone]}`.trim()}
  >
    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
      {label}
    </p>
    <div
      className={`mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-white ${valueClassName}`.trim()}
    >
      {value}
    </div>
    {hint && (
      <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
        {hint}
      </p>
    )}
  </div>
);
