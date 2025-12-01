import { memo } from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: number;
}

const Logo = memo(function Logo({ className, size = 48 }: LogoProps) {
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
      {/* Top person - head */}
      <circle cx="50" cy="8" r="5" fill="#3B5BFF" />
      {/* Top person - body (V shape like checkmark) */}
      <path
        d="M42 18 C42 18 50 28 50 28 C50 28 58 18 58 18"
        stroke="#3B5BFF"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* Top-right person - head */}
      <circle cx="83" cy="25" r="5" fill="#3B5BFF" />
      {/* Top-right person - body */}
      <path
        d="M73 30 C73 30 78 42 78 42 C78 42 88 35 88 35"
        stroke="#3B5BFF"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* Bottom-right person - head */}
      <circle cx="83" cy="75" r="5" fill="#3B5BFF" />
      {/* Bottom-right person - body */}
      <path
        d="M88 65 C88 65 78 58 78 58 C78 58 73 70 73 70"
        stroke="#3B5BFF"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* Bottom person - head */}
      <circle cx="50" cy="92" r="5" fill="#3B5BFF" />
      {/* Bottom person - body (inverted V) */}
      <path
        d="M58 82 C58 82 50 72 50 72 C50 72 42 82 42 82"
        stroke="#3B5BFF"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* Bottom-left person - head */}
      <circle cx="17" cy="75" r="5" fill="#3B5BFF" />
      {/* Bottom-left person - body */}
      <path
        d="M12 65 C12 65 22 58 22 58 C22 58 27 70 27 70"
        stroke="#3B5BFF"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* Top-left person - head */}
      <circle cx="17" cy="25" r="5" fill="#3B5BFF" />
      {/* Top-left person - body */}
      <path
        d="M27 30 C27 30 22 42 22 42 C22 42 12 35 12 35"
        stroke="#3B5BFF"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* Center checkmark - accent color (turquoise) - smaller size */}
      <path
        d="M38 52 L46 60 L62 42"
        stroke="#2ED1C4"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
});

export default Logo;
