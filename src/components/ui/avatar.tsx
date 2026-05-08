import type React from 'react';
import { cn } from '@/lib/utils';

export function Avatar({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full border border-sky-300/40', className)}>{children}</div>;
}

export function AvatarFallback({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('flex h-full w-full items-center justify-center bg-slate-800 text-sm font-bold text-sky-200', className)}>{children}</div>;
}
