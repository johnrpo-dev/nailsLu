"use client";

import * as ToastPrimitive from "@radix-ui/react-toast";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

type ToastVariant = "success" | "error" | "info";

type ToastInput = {
  title: string;
  description?: string;
  variant?: ToastVariant;
};

type ToastRecord = ToastInput & { id: number };

const ToastContext = createContext<{ showToast: (toast: ToastInput) => void }>({
  showToast: () => undefined,
});

const variantStyles: Record<ToastVariant, { icon: typeof CheckCircle2; className: string }> = {
  success: { icon: CheckCircle2, className: "text-[hsl(var(--accent))]" },
  error: { icon: AlertTriangle, className: "text-[hsl(var(--danger))]" },
  info: { icon: Info, className: "text-[hsl(var(--muted))]" },
};

let toastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);

  const showToast = useCallback((toast: ToastInput) => {
    toastId += 1;
    const record = { ...toast, id: toastId };
    // Se apilan en vez de reemplazarse: dos avisos seguidos no se pisan.
    setToasts((current) => [...current.slice(-2), record]);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      <ToastPrimitive.Provider swipeDirection="right">
        {children}
        {toasts.map((toast) => {
          const { icon: Icon, className } = variantStyles[toast.variant ?? "success"];
          return (
            <ToastPrimitive.Root
              className={cn(
                "toast-root grid w-[min(420px,calc(100vw-2rem))] grid-cols-[auto_1fr] gap-3 rounded-3xl border p-4 shadow-2xl",
                "border-[hsl(var(--border))] bg-[hsl(var(--card))]",
              )}
              duration={toast.variant === "error" ? 7000 : 4500}
              key={toast.id}
              onOpenChange={(open) => !open && dismiss(toast.id)}
            >
              <Icon aria-hidden="true" className={cn("mt-0.5 size-5 shrink-0", className)} />
              <div className="min-w-0">
                <ToastPrimitive.Title className="text-sm font-bold">{toast.title}</ToastPrimitive.Title>
                {toast.description ? (
                  <ToastPrimitive.Description className="mt-1 text-sm leading-6 text-[hsl(var(--muted))]">
                    {toast.description}
                  </ToastPrimitive.Description>
                ) : null}
              </div>
            </ToastPrimitive.Root>
          );
        })}
        <ToastPrimitive.Viewport className="fixed bottom-0 right-0 z-[60] m-4 grid gap-3 outline-none" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
