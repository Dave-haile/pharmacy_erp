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
    contentClassName="space-y-3"
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
          <div key={log.log_id} className="relative pl-7">
            {index < logs.length - 1 && (
              <div className="absolute bottom-0 left-[9px] top-6 w-px bg-slate-200 dark:bg-slate-800" />
            )}
            <div
              className={`absolute left-0 top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white shadow-sm dark:border-slate-900 ${tone.dot}`}
            >
              {tone.icon}
            </div>
            <div className="max-w-3xl rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-800/20">
              <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Activity className="h-3 w-3 text-slate-400" />
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-800 dark:text-slate-100">
                    {log.action}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
                  <Clock className="h-3 w-3" />
                  <span>{formatRelativeLogTime(log.timestamp)}</span>
                </div>
              </div>
              <div className="space-y-1 text-[13px] leading-5 text-slate-600 dark:text-slate-300">
                {formatLogLines(log).map((line, lineIndex) => (
                  <p key={`${log.log_id}-${lineIndex}`}>{line}</p>
                ))}
              </div>
              <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-slate-200/80 pt-2 dark:border-slate-700">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                  {log.username || `User #${log.user_id}`}
                </p>
                <span className="text-[10px] text-slate-300 dark:text-slate-600">•</span>
                <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
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
