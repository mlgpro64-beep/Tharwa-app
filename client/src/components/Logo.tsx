import { memo } from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: number;
  variant?: 'full' | 'icon';
}

const Logo = memo(function Logo({ className, size = 48, variant = 'icon' }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('flex-shrink-0', className)}
      data-testid="logo"
    >
      {/* Top person */}
      <circle cx="50" cy="12" r="6" fill="url(#primaryGradient)" />
      <path
        d="M40 28 L50 22 L60 28"
        stroke="url(#primaryGradient)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* Top-right person */}
      <circle cx="82" cy="27" r="6" fill="url(#primaryGradient)" />
      <path
        d="M72 43 L78 34 L88 37"
        stroke="url(#primaryGradient)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* Bottom-right person */}
      <circle cx="82" cy="73" r="6" fill="url(#primaryGradient)" />
      <path
        d="M88 63 L78 66 L72 57"
        stroke="url(#primaryGradient)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* Bottom person */}
      <circle cx="50" cy="88" r="6" fill="url(#primaryGradient)" />
      <path
        d="M60 72 L50 78 L40 72"
        stroke="url(#primaryGradient)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* Bottom-left person */}
      <circle cx="18" cy="73" r="6" fill="url(#primaryGradient)" />
      <path
        d="M12 63 L22 66 L28 57"
        stroke="url(#primaryGradient)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* Top-left person */}
      <circle cx="18" cy="27" r="6" fill="url(#primaryGradient)" />
      <path
        d="M28 43 L22 34 L12 37"
        stroke="url(#primaryGradient)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* Center checkmark */}
      <path
        d="M32 52 L45 65 L70 35"
        stroke="url(#accentGradient)"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* Gradients */}
      <defs>
        <linearGradient id="primaryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B5BFF" />
          <stop offset="100%" stopColor="#6F86FF" />
        </linearGradient>
        <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2ED1C4" />
          <stop offset="100%" stopColor="#1FA697" />
        </linearGradient>
      </defs>
    </svg>
  );
});

export default Logo;
