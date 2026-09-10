"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title?: string;
  message: string;
}

interface ToastContextType {
  toast: (options: {
    type?: "success" | "error" | "info" | "warning";
    title?: string;
    message: string;
    duration?: number;
  }) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({
      type = "info",
      title,
      message,
      duration = 3500,
    }: {
      type?: "success" | "error" | "info" | "warning";
      title?: string;
      message: string;
      duration?: number;
    }) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, type, title, message }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback(
    (message: string, title?: string) => showToast({ type: "success", message, title }),
    [showToast]
  );
  const error = useCallback(
    (message: string, title?: string) => showToast({ type: "error", message, title }),
    [showToast]
  );
  const info = useCallback(
    (message: string, title?: string) => showToast({ type: "info", message, title }),
    [showToast]
  );
  const warning = useCallback(
    (message: string, title?: string) => showToast({ type: "warning", message, title }),
    [showToast]
  );

  return (
    <ToastContext.Provider value={{ toast: showToast, success, error, info, warning }}>
      {children}
      {/* Toast container */}
      <div
        aria-live="polite"
        className="fixed bottom-20 sm:bottom-6 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-lg text-sm transition-all duration-200 animate-in fade-in slide-in-from-bottom-3 ${
              t.type === "success"
                ? "bg-slate-900 text-white border-emerald-500/50 dark:bg-slate-900 dark:border-emerald-500"
                : t.type === "error"
                ? "bg-slate-900 text-white border-rose-500/50 dark:bg-slate-900 dark:border-rose-500"
                : t.type === "warning"
                ? "bg-slate-900 text-white border-amber-500/50 dark:bg-slate-900 dark:border-amber-500"
                : "bg-slate-900 text-white border-blue-500/50 dark:bg-slate-900 dark:border-blue-500"
            }`}
          >
            <div className="shrink-0 text-base mt-0.5">
              {t.type === "success" && (
                <span className="text-emerald-400">✓</span>
              )}
              {t.type === "error" && (
                <span className="text-rose-400">✕</span>
              )}
              {t.type === "warning" && (
                <span className="text-amber-400">⚠️</span>
              )}
              {t.type === "info" && (
                <span className="text-blue-400">ℹ️</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              {t.title && <p className="font-semibold text-xs text-slate-200">{t.title}</p>}
              <p className="text-xs text-slate-300 leading-snug">{t.message}</p>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-white text-xs cursor-pointer p-0.5"
              aria-label="Dismiss notification"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // Graceful fallback if used outside provider
    return {
      toast: () => {},
      success: () => {},
      error: () => {},
      info: () => {},
      warning: () => {},
    };
  }
  return context;
}
