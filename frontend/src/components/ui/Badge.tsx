'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'outline';
}

export default function Badge({ className, variant = 'primary', ...props }: BadgeProps) {
  const variants = {
    primary: 'bg-primary/20 text-primary border-primary/20',
    secondary: 'bg-muted/20 text-muted border-muted/20',
    danger: 'bg-danger/20 text-danger border-danger/20',
    success: 'bg-success/20 text-success border-success/20',
    warning: 'bg-warning/20 text-warning border-warning/20',
    outline: 'bg-transparent text-text border-border',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
