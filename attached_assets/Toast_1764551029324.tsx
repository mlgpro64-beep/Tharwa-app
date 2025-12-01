
import React, { createContext, useContext, useState, useEffect } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: ToastType = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-20 left-0 right-0 flex flex-col items-center pointer-events-none z-50 space-y-2 px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`animate-slide-up shadow-lg rounded-full px-6 py-3 text-sm font-bold text-white flex items-center gap-2 ${
              toast.type === 'success' ? 'bg-green-600' : toast.type === 'error' ? 'bg-red-500' : 'bg-gray-800'
            }`}
          >
            {toast.type === 'success' && <span className="material-symbols-outlined text-lg">check_circle</span>}
            {toast.type === 'error' && <span className="material-symbols-outlined text-lg">error</span>}
            {toast.type === 'info' && <span className="material-symbols-outlined text-lg">info</span>}
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
