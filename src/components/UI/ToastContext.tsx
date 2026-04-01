import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextValue {
  addToast: (type: ToastType, title: string, message?: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS: Record<ToastType, typeof CheckCircle> = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const STYLES: Record<ToastType, { container: string; icon: string; bar: string }> = {
  success: {
    container: 'bg-white dark:bg-slate-800 border border-green-200 dark:border-green-700',
    icon: 'text-green-500',
    bar: 'bg-green-500',
  },
  error: {
    container: 'bg-white dark:bg-slate-800 border border-red-200 dark:border-red-700',
    icon: 'text-red-500',
    bar: 'bg-red-500',
  },
  warning: {
    container: 'bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-700',
    icon: 'text-amber-500',
    bar: 'bg-amber-500',
  },
  info: {
    container: 'bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700',
    icon: 'text-blue-500',
    bar: 'bg-blue-500',
  },
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const Icon = ICONS[toast.type];
  const styles = STYLES[toast.type];

  return (
    <div
      className={`relative flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg min-w-[280px] max-w-sm overflow-hidden ${styles.container}`}
      role="alert"
    >
      {/* Coloured left bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${styles.bar} rounded-l-lg`} />

      <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${styles.icon}`} />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 dark:text-white leading-snug">
          {toast.title}
        </p>
        {toast.message && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
            {toast.message}
          </p>
        )}
      </div>

      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => removeToast(id), 4000);
  }, [removeToast]);

  const success = useCallback((title: string, message?: string) => addToast('success', title, message), [addToast]);
  const error = useCallback((title: string, message?: string) => addToast('error', title, message), [addToast]);
  const warning = useCallback((title: string, message?: string) => addToast('warning', title, message), [addToast]);
  const info = useCallback((title: string, message?: string) => addToast('info', title, message), [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, success, error, warning, info }}>
      {children}

      {/* Toast container — bottom-right */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto animate-slide-in-right">
            <ToastItem toast={toast} onRemove={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
