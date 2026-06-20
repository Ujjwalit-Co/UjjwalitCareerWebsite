import React from 'react';
import { cn, getStatusColor } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: string; // e.g. 'pending', 'accepted', 'active', 'revoked'
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant, className }) => {
  const badgeColor = variant ? getStatusColor(variant) : 'bg-slate-800 text-slate-300 border-slate-700';

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border',
        badgeColor,
        className
      )}
    >
      {children}
    </span>
  );
};
