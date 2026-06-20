import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'teal';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
          {
            'bg-brand-orange text-white hover:bg-orange-500 shadow-sm active:scale-[0.98]':
              variant === 'primary',
            'bg-brand-surface text-[#F5F5F5] hover:bg-[#1d1d1d] border border-brand-border':
              variant === 'secondary',
            'bg-transparent text-[#F5F5F5] hover:bg-brand-surface border border-brand-border hover:border-brand-blue':
              variant === 'outline',
            'bg-red-600 text-white hover:bg-red-500 shadow-md shadow-red-600/10 active:scale-[0.98]':
              variant === 'danger',
            'bg-transparent text-[#A1A1AA] hover:text-[#F5F5F5] hover:bg-brand-surface':
              variant === 'ghost',
            'bg-brand-blue text-white hover:bg-blue-500 shadow-sm active:scale-[0.98]':
              variant === 'teal',
          },
          {
            'px-3 py-1.5 text-sm': size === 'sm',
            'px-5 py-2.5 text-base': size === 'md',
            'px-6 py-3 text-lg': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
