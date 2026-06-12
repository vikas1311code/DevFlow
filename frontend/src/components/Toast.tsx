"use client";
import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { CheckCircle2, XCircle, X } from "lucide-react";

interface ToastItem {
  id: number;
  message: string;
  type: "success" | "error";
}

const ToastContext = createContext<{ show: (msg: string, type?: "success" | "error") => void }>({
  show: () => {},
});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const show = useCallback((message: string, type: "success" | "error" = "success") => {
    const id = Date.now();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-2 px-4 py-3 rounded-lg border text-sm font-mono shadow-lg animate-slide-in"
            style={{
              borderColor: "var(--border)",
              background: "var(--surface)",
              color: t.type === "success" ? "var(--success)" : "var(--danger)",
            }}
          >
            {t.type === "success" ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
            <span style={{ color: "var(--text)" }}>{t.message}</span>
            <button onClick={() => setToasts((cur) => cur.filter((x) => x.id !== t.id))}>
              <X size={14} style={{ color: "var(--text-muted)" }} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
