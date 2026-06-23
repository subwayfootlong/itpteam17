"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from "react";

type ToastType = "success" | "error" | "warning" | "info";

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  push: (item: { type: ToastType; message: string; duration?: number }) => void;
  toast: {
    success: (msg: string, duration?: number) => void;
    error: (msg: string, duration?: number) => void;
    warning: (msg: string, duration?: number) => void;
    info: (msg: string, duration?: number) => void;
  };
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

const STYLES: Record<
  ToastType,
  { bg: string; border: string; icon: string; iconColor: string }
> = {
  success: {
    bg: "#f0faf0",
    border: "#3FAE2A",
    icon: "✓",
    iconColor: "#3FAE2A",
  },
  error: {
    bg: "#fde8ef",
    border: "#C51A4A",
    icon: "✕",
    iconColor: "#C51A4A",
  },
  warning: {
    bg: "#fff4de",
    border: "#FFB547",
    icon: "!",
    iconColor: "#9a6800",
  },
  info: {
    bg: "#e3f6fb",
    border: "#3BB0C9",
    icon: "i",
    iconColor: "#1a7a8f",
  },
};

function ToastItemView({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: (id: string) => void;
}) {
  const s = STYLES[item.type];
  const ref = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    ref.current = setTimeout(() => onDismiss(item.id), item.duration ?? 4000);
    return () => {
      if (ref.current) clearTimeout(ref.current);
    };
  }, [item, onDismiss]);

  return (
    <div
      role="alert"
      className="flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg max-w-sm w-full"
      style={{
        background: s.bg,
        border: `1.5px solid ${s.border}`,
        fontFamily: "'Helvetica Neue', -apple-system, sans-serif",
        animation: "toast-in 0.2s ease",
      }}
    >
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold mt-0.5"
        style={{ background: s.border, color: "#fff" }}
        aria-hidden="true"
      >
        {s.icon}
      </div>
      <p
        className="flex-1 text-[13px] font-medium leading-snug"
        style={{ color: "#1a2e1a" }}
      >
        {item.message}
      </p>
      <button
        onClick={() => onDismiss(item.id)}
        className="flex-shrink-0 text-[16px] leading-none opacity-40 hover:opacity-70 transition-opacity"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (type: ToastType, message: string, duration?: number) => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev.slice(-4), { id, type, message, duration }]);
    },
    [],
  );

  const value: ToastContextValue = {
    push: ({ type, message, duration }) => push(type, message, duration),
    toast: {
      success: (msg, d) => push("success", msg, d),
      error: (msg, d) => push("error", msg, d),
      warning: (msg, d) => push("warning", msg, d),
      info: (msg, d) => push("info", msg, d),
    },
  };

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div
        className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none"
        aria-live="polite"
        aria-label="Notifications"
      >
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItemView item={t} onDismiss={dismiss} />
          </div>
        ))}
      </div>

      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export default ToastProvider;
