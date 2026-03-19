import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type ConfirmVariant = "default" | "danger";
type ConfirmMode = "confirm" | "alert";

export interface ConfirmOptions<TPayload = unknown> {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  mode?: ConfirmMode;
  /**
   * Optional payload you want back in the result
   * (e.g. item id, form data snapshot, etc.)
   */
  payload?: TPayload;
}

export interface ConfirmResult<TPayload = unknown> {
  confirmed: boolean;
  payload?: TPayload;
}

interface InternalState<TPayload = unknown> extends ConfirmOptions<TPayload> {
  isOpen: boolean;
}

interface ConfirmContextValue {
  confirm: <TPayload = unknown>(
    options: ConfirmOptions<TPayload>,
  ) => Promise<ConfirmResult<TPayload>>;
}

const ConfirmDialogContext = createContext<ConfirmContextValue | undefined>(
  undefined,
);

export const ConfirmDialogProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [state, setState] = useState<InternalState | null>(null);
  const [resolver, setResolver] =
    useState<((value: ConfirmResult) => void) | null>(null);

  const close = useCallback(
    (result: ConfirmResult) => {
      setState((prev) => (prev ? { ...prev, isOpen: false } : prev));
      if (resolver) {
        resolver(result);
        setResolver(null);
      }
    },
    [resolver],
  );

  const confirm = useCallback(
    <TPayload,>(
      options: ConfirmOptions<TPayload>,
    ): Promise<ConfirmResult<TPayload>> => {
      return new Promise((resolve) => {
        setState({
          isOpen: true,
          title: options.title,
          message: options.message,
          confirmLabel: options.confirmLabel,
          cancelLabel: options.cancelLabel,
          variant: options.variant ?? "default",
          mode: options.mode ?? "confirm",
          payload: options.payload,
        });
        setResolver(() => resolve as (value: ConfirmResult) => void);
      });
    },
    [],
  );

  const ctxValue = useMemo<ConfirmContextValue>(
    () => ({
      confirm,
    }),
    [confirm],
  );

  const handleBackdropClick = () => {
    if (!state?.isOpen) return;
    close({ confirmed: false, payload: state.payload });
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === "Escape" && state?.isOpen) {
      e.stopPropagation();
      close({ confirmed: false, payload: state.payload });
    }
  };

  const variantClasses =
    state?.variant === "danger"
      ? "bg-red-600 hover:bg-red-500 focus:ring-red-500/40"
      : "bg-emerald-600 hover:bg-emerald-500 focus:ring-emerald-500/40";

  const isAlert = state?.mode === "alert";

  return (
    <ConfirmDialogContext.Provider value={ctxValue}>
      {children}
      {state?.isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm"
          onKeyDown={handleKeyDown}
        >
          <button
            type="button"
            aria-label="Dismiss dialog"
            className="absolute inset-0 w-full h-full cursor-default"
            onClick={handleBackdropClick}
          />
          <div className="relative z-10 w-full max-w-md mx-4 rounded-2xl bg-slate-950 text-slate-50 border border-slate-800 shadow-2xl">
            <div className="px-6 py-5 border-b border-slate-800">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 mb-1">
                Confirmation Required
              </p>
              {state.title && (
                <h2 className="text-sm font-black text-slate-50 tracking-tight">
                  {state.title}
                </h2>
              )}
            </div>
            <div className="px-6 py-5 space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                {state.message}
              </p>
            </div>
            <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-end space-x-3 bg-slate-900/60">
              {!isAlert && (
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 transition-colors"
                  onClick={() =>
                    close({ confirmed: false, payload: state.payload })
                  }
                >
                  {state.cancelLabel || "Cancel"}
                </button>
              )}
              <button
                type="button"
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-white border border-transparent shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 ${variantClasses}`}
                onClick={() =>
                  close({ confirmed: true, payload: state.payload })
                }
              >
                {state.confirmLabel || (isAlert ? "OK" : "Confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmDialogContext.Provider>
  );
};

export const useConfirmDialog = () => {
  const ctx = useContext(ConfirmDialogContext);
  if (!ctx) {
    throw new Error(
      "useConfirmDialog must be used within <ConfirmDialogProvider />",
    );
  }
  return ctx;
};

