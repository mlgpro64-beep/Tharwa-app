import { useEffect, useRef, memo, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}

export const Modal = memo(function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  action, 
  className 
}: ModalProps) {
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

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          role="dialog"
          aria-modal="true"
        >
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-md"
            onClick={onClose}
            aria-hidden="true"
            data-testid="modal-backdrop"
          />

          <motion.div 
            ref={modalRef}
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ 
              type: "spring",
              stiffness: 300,
              damping: 30
            }}
            className={cn(
              "glass-premium w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 pb-safe shadow-2xl outline-none relative z-10 m-0 sm:m-4",
              className
            )}
            tabIndex={-1}
            data-testid="modal-content"
          >
            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6 sm:hidden" />

            <div className="flex justify-between items-center mb-6 gap-4">
              {title && (
                <motion.h2 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-2xl font-extrabold tracking-tight text-foreground"
                >
                  {title}
                </motion.h2>
              )}
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose} 
                className="w-10 h-10 flex items-center justify-center rounded-2xl glass-button ms-auto flex-shrink-0"
                aria-label="Close modal"
                data-testid="button-close-modal"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-6"
            >
              {children}
            </motion.div>

            {action && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-8"
              >
                {action}
              </motion.div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
});
