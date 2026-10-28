import { useCallback, useMemo, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import type { Toast } from '@/types';

type ToastProps = {
  toasts: Toast[];
  onDismiss: (id: string) => void;
};

const TYPE_ICON: Record<Toast['type'], React.ReactNode> = {
  success: <CheckCircle className="w-4 h-4 text-green-600" />,
  error: <AlertCircle className="w-4 h-4 text-red-600" />,
  info: <Info className="w-4 h-4 text-blue-600" />,
};

const TYPE_CLASS: Record<Toast['type'], string> = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};

export function ToastContainer({ toasts, onDismiss }: ToastProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => {
        const Icon = TYPE_ICON[toast.type];
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 w-full max-w-sm p-3 rounded-md border shadow-sm ${
              TYPE_CLASS[toast.type]
            } animate-fade-in`}
          >
            <div className="shrink-0">{Icon}</div>
            <div className="flex-1 text-sm font-medium">{toast.message}</div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="ml-2 inline p-1 rounded-md text-neutral-500 hover:text-neutral-700"
              aria-label="Fechar notificação"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const add = useCallback(
    (message: string, type: Toast['type'] = 'info') => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
      return id;
    },
    [],
  );

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toastList = useMemo(() => toasts, [toasts]);

  return { toasts: toastList, add, dismiss, Toast: () => <ToastContainer toasts={toastList} onDismiss={dismiss} /> };
}
