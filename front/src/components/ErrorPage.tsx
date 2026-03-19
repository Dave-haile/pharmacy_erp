import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorPageProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

const ErrorPage: React.FC<ErrorPageProps> = ({
  title = "Something went wrong",
  message = "An unexpected error occurred. Please try again.",
  onRetry,
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-rose-50 px-4 py-10 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-[0_24px_80px_rgba(2,6,23,0.55)] lg:grid-cols-[1.05fr_0.95fr]">
          <section className="relative overflow-hidden bg-gradient-to-br from-rose-100 via-white to-amber-50 p-8 sm:p-10 dark:from-rose-950/30 dark:via-slate-900 dark:to-amber-950/20">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(244,63,94,0.18),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.18),transparent_30%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(244,63,94,0.14),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.12),transparent_30%)]" />
            <div className="relative max-w-md">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-rose-200 bg-white text-rose-600 shadow-sm dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300">
                <AlertTriangle className="h-8 w-8" />
              </div>
              <p className="mt-8 text-[11px] font-black uppercase tracking-[0.32em] text-rose-600 dark:text-rose-300">
                System Exception
              </p>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                {title}
              </h1>
              <p className="mt-4 max-w-lg text-sm leading-7 text-slate-600 dark:text-slate-300">
                {message}
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
                    Status
                  </p>
                  <p className="mt-2 text-sm font-bold text-slate-900 dark:text-white">
                    Action required
                  </p>
                </div>
                <div className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
                    Recovery
                  </p>
                  <p className="mt-2 text-sm font-bold text-slate-900 dark:text-white">
                    Retry or return safely
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="flex items-center bg-white p-8 sm:p-10 dark:bg-slate-900">
            <div className="w-full rounded-3xl border border-slate-200 bg-slate-50/80 p-6 shadow-inner dark:border-slate-800 dark:bg-slate-950/60 sm:p-8">
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400 dark:text-slate-500">
                Suggested Action
              </p>
              <h2 className="mt-3 text-xl font-black tracking-tight text-slate-950 dark:text-white">
                Stabilize the page state
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                If this was caused by a temporary request or loading problem,
                retrying usually restores the current workflow without losing
                context.
              </p>

              {onRetry ? (
                <button
                  onClick={onRetry}
                  className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3.5 text-sm font-black uppercase tracking-[0.22em] text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-500"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </button>
              ) : (
                <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-4 text-sm font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                  No retry action is available for this screen.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;
