
import React, { useState } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  containerClassName?: string;
}

export const Input: React.FC<InputProps> = ({ 
  label, 
  error, 
  className = '', 
  containerClassName = '',
  value, 
  onFocus, 
  onBlur, 
  ...props 
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value !== '' && value !== undefined;

  return (
    <div className={`relative ${containerClassName}`}>
      <div className="relative">
        <input
          {...props}
          value={value}
          onFocus={(e) => { setIsFocused(true); onFocus?.(e); }}
          onBlur={(e) => { setIsFocused(false); onBlur?.(e); }}
          className={`peer w-full h-16 px-4 pt-5 pb-1 rounded-2xl border-2 bg-white dark:bg-surface-dark shadow-sm outline-none transition-all placeholder-transparent font-medium text-text-primary dark:text-text-primary-dark ${
            error 
              ? 'border-danger/50 focus:border-danger text-danger' 
              : 'border-transparent focus:border-primary/50'
          } ${className}`}
          placeholder={label} // Required for peer-placeholder-shown logic if we used CSS only, but we use JS state too
        />
        <label 
          className={`absolute left-4 transition-all duration-200 pointer-events-none truncate max-w-[calc(100%-32px)] ${
            isFocused || hasValue 
              ? 'top-3 text-[10px] font-bold text-primary uppercase tracking-wider' 
              : 'top-5 text-base text-text-secondary dark:text-text-secondary-dark'
          } ${error ? '!text-danger' : ''}`}
        >
          {label}
        </label>
      </div>
      {error && (
        <div className="flex items-center gap-1 mt-1.5 ml-2 animate-slide-up">
            <span className="material-symbols-outlined text-xs text-danger">error</span>
            <p className="text-xs text-danger font-bold">{error}</p>
        </div>
      )}
    </div>
  );
};
