
import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  action?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, action }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Prevent scrolling on the body
      document.body.style.overflow = 'hidden';
      
      // Focus the modal for accessibility
      modalRef.current?.focus();

      // Handle Escape key
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
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div 
        ref={modalRef}
        className="bg-surface/85 dark:bg-surface-dark/85 w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 pb-safe shadow-2xl border-t border-white/20 dark:border-gray-700/50 backdrop-blur-2xl ring-1 ring-black/5 animate-slide-up outline-none relative z-10 m-0 sm:m-4"
        tabIndex={-1}
      >
        {/* Handle Bar for mobile feel */}
        <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-6 sm:hidden"></div>

        <div className="flex justify-between items-center mb-6">
          {title && <div className="text-2xl font-extrabold tracking-tight">{title}</div>}
          <button 
            onClick={onClose} 
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100/50 dark:bg-gray-800/50 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors active:scale-90 ms-auto"
            aria-label="Close modal"
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
};
