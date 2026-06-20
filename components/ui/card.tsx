import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'glass' | 'solid';
  glow?: 'teal' | 'orange' | 'none';
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  variant = 'glass',
  glow = 'none',
  hoverEffect = true,
  ...props
}) => {
  return (
    <div
      className={cn(
        'rounded-lg p-6 transition-all duration-300',
        {
          'glass-panel': variant === 'glass',
          'bg-brand-surface border border-brand-border': variant === 'solid',
          'glass-panel-hover': hoverEffect && variant === 'glass',
          'hover:border-brand-blue/70': hoverEffect && variant === 'solid',
          'glow-teal': glow === 'teal',
          'glow-orange': glow === 'orange',
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
