import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, helperText, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-semibold text-[#F5F5F5]">
            {label}
          </label>
        )}
        <input
          type={type}
          ref={ref}
          className={cn(
            'w-full px-4 py-2.5 bg-brand-secondary border rounded-lg text-[#F5F5F5] placeholder-[#71717A] focus:outline-none transition-all duration-200 text-sm md:text-base focus:ring-2',
            {
              'border-brand-border focus:border-brand-blue focus:ring-brand-blue/20': !error,
              'border-red-500 focus:border-red-500 focus:ring-red-500/20': error,
            },
            className
          )}
          {...props}
        />
        {error ? (
          <p className="text-xs text-red-400 font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-[#A1A1AA]">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
