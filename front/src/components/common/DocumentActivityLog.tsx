import React from "react";
import { Activity, Clock, Edit3, Info, Package } from "lucide-react";

import { Log } from "../../types/types";
import { formatLogLines, formatRelativeLogTime, parseLogTimestamp } from "../../utils/logs";
import { DocumentCard } from "./DocumentUI";

interface DocumentActivityLogProps {
  logs: Log[];
  isLoading: boolean;
  onViewAll?: () => void;
  title?: string;
  description?: string;
}

const logTone = (action: string) => {
  if (/created/i.test(action)) {
    return {
      dot: "bg-emerald-500",
      icon: <Package className="h-2.5 w-2.5 text-white" />,
    };
  }

  if (/updated|amended|posted|cancelled|submitted/i.test(action)) {
    return {
      dot: "bg-blue-500",
      icon: <Edit3 className="h-2.5 w-2.5 text-white" />,
    };
  }

  return {
    dot: "bg-slate-400",
    icon: <Info className="h-2.5 w-2.5 text-white" />,
  };
};

export const DocumentActivityLog: React.FC<DocumentActivityLogProps> = ({
  logs,
  isLoading,
  onViewAll,
  title = "Activity Log",
  description = "Recent changes made only to this document.",
}) => (
  <DocumentCard
    title={title}
    description={description}
    accent="slate"
    action={
      onViewAll ? (
        <button
          type="button"
          onClick={onViewAll}
          className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-600 dark:text-emerald-400"
        >
          Full History
        </button>
      ) : undefined
    }
    contentClassName="space-y-5"
  >
    {isLoading ? (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center dark:border-slate-800 dark:bg-slate-800/30">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
          Loading activity...
        </p>
      </div>
    ) : logs.length > 0 ? (
      logs.map((log, index) => {
        const when = parseLogTimestamp(log.timestamp);
        const tone = logTone(log.action);

        return (
          <div key={log.log_id} className="relative pl-8">
            {index < logs.length - 1 && (
              <div className="absolute bottom-0 left-[11px] top-7 w-px bg-slate-200 dark:bg-slate-800" />
            )}
            <div
              className={`absolute left-0 top-1.5 flex h-6 w-6 items-center justify-center rounded-full border-4 border-white shadow-sm dark:border-slate-900 ${tone.dot}`}
            >
              {tone.icon}
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/30">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Activity className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-800 dark:text-slate-100">
                    {log.action}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{formatRelativeLogTime(log.timestamp)}</span>
                </div>
              </div>
              <div className="space-y-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {formatLogLines(log).map((line, lineIndex) => (
                  <p key={`${log.log_id}-${lineIndex}`}>{line}</p>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-3 dark:border-slate-700">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                  {log.username || `User #${log.user_id}`}
                </p>
                <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                  {when ? when.toLocaleString() : log.timestamp}
                </p>
              </div>
            </div>
          </div>
        );
      })
    ) : (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center dark:border-slate-800 dark:bg-slate-800/30">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
          No activity found for this document
        </p>
      </div>
    )}
  </DocumentCard>
);

export default DocumentActivityLog;
