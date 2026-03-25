'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'outline' | 'ghost' | 'glass';
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'outline', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl border border-border bg-card p-4 transition-all',
          variant === 'outline' && 'shadow-sm',
          variant === 'glass' && 'bg-card/40 backdrop-blur-md',
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';

export default Card;
