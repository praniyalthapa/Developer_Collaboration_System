import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { ToastContext, type Toast, type ToastInput } from "./toastStore";

const VARIANT_STYLES: Record<Toast["variant"], string> = {
  info: "border-primary/30 bg-base-100",
  success: "border-success/40 bg-base-100",
  message: "border-primary/40 bg-base-100",
  error: "border-error/40 bg-base-100",
};

const VARIANT_ACCENT: Record<Toast["variant"], string> = {
  info: "bg-primary",
  success: "bg-success",
  message: "bg-primary",
  error: "bg-error",
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (input: ToastInput) => {
      const id = (idRef.current += 1);
      setToasts((current) => [...current, { ...input, id }].slice(-4));
      window.setTimeout(() => dismiss(id), 5000);
    },
    [dismiss],
  );

  const api = useMemo(() => ({ push, dismiss }), [push, dismiss]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[min(92vw,20rem)] flex-col gap-2">
        {toasts.map((toast) => (
          <button
            key={toast.id}
            type="button"
            onClick={() => {
              toast.onClick?.();
              dismiss(toast.id);
            }}
            className={`pointer-events-auto flex w-full items-stretch gap-0 overflow-hidden rounded-xl border text-left shadow-lg backdrop-blur transition hover:brightness-105 ${
              VARIANT_STYLES[toast.variant]
            }`}
          >
            <span className={`w-1 shrink-0 ${VARIANT_ACCENT[toast.variant]}`} />
            <span className="flex-1 px-3.5 py-2.5">
              <span className="block text-sm font-semibold leading-tight">
                {toast.title}
              </span>
              {toast.body ? (
                <span className="mt-0.5 block truncate text-xs text-base-content/60">
                  {toast.body}
                </span>
              ) : null}
            </span>
          </button>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
