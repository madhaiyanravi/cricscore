'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'rect' | 'circle' | 'text';
}

export default function Skeleton({ className, variant = 'rect', ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-muted/20',
        variant === 'rect' && 'rounded-lg',
        variant === 'circle' && 'rounded-full',
        variant === 'text' && 'h-4 rounded-md w-full',
        className
      )}
      {...props}
    />
  );
}
