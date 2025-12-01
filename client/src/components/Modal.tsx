import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, action, className }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      modalRef.current?.focus();

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      document.addEventListener('keydown', handleEscape);

      return () => {
        document.body.style.overflow = 'unset';
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
        data-testid="modal-backdrop"
      />

      <div 
        ref={modalRef}
        className={cn(
          "bg-surface/95 dark:bg-card/95 w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 pb-safe shadow-2xl border-t border-border backdrop-blur-2xl ring-1 ring-black/5 animate-slide-up outline-none relative z-10 m-0 sm:m-4",
          className
        )}
        tabIndex={-1}
        data-testid="modal-content"
      >
        <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-6 sm:hidden"></div>

        <div className="flex justify-between items-center mb-6 gap-4">
          {title && <div className="text-2xl font-extrabold tracking-tight">{title}</div>}
          <button 
            onClick={onClose} 
            className="w-10 h-10 flex items-center justify-center rounded-full bg-muted/50 hover:bg-muted transition-colors active:scale-90 ms-auto flex-shrink-0"
            aria-label="Close modal"
            data-testid="button-close-modal"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="space-y-6">
          {children}
        </div>

        {action && (
          <div className="mt-8 pt-4">
            {action}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
