import { useState, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface FloatingInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  containerClassName?: string;
}

export function FloatingInput({ 
  label, 
  error, 
  className = '', 
  containerClassName = '',
  value, 
  onFocus, 
  onBlur, 
  ...props 
}: FloatingInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value !== '' && value !== undefined;

  return (
    <div className={cn("relative", containerClassName)}>
      <div className="relative">
        <input
          {...props}
          value={value}
          onFocus={(e) => { setIsFocused(true); onFocus?.(e); }}
          onBlur={(e) => { setIsFocused(false); onBlur?.(e); }}
          className={cn(
            "peer w-full h-16 px-4 pt-5 pb-1 rounded-2xl border-2 bg-card shadow-sm outline-none transition-all placeholder-transparent font-medium text-foreground",
            error 
              ? "border-destructive/50 focus:border-destructive text-destructive" 
              : "border-transparent focus:border-primary/50",
            className
          )}
          placeholder={label}
          data-testid={`input-${label.toLowerCase().replace(/\s+/g, '-')}`}
        />
        <label 
          className={cn(
            "absolute left-4 transition-all duration-200 pointer-events-none truncate max-w-[calc(100%-32px)]",
            isFocused || hasValue 
              ? "top-3 text-[10px] font-bold text-primary uppercase tracking-wider" 
              : "top-5 text-base text-muted-foreground",
            error && "!text-destructive"
          )}
        >
          {label}
        </label>
      </div>
      {error && (
        <div className="flex items-center gap-1 mt-1.5 ml-2 animate-slide-up">
          <span className="material-symbols-outlined text-xs text-destructive">error</span>
          <p className="text-xs text-destructive font-bold">{error}</p>
        </div>
      )}
    </div>
  );
}
