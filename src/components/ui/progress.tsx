import { cn } from '@/lib/utils';

export function Progress({ className, value = 0 }: { className?: string; value?: number }) {
  return (
    <div className={cn('relative h-2 w-full overflow-hidden rounded-full bg-white/10', className)}>
      <div className="h-full bg-sky-400 transition-all" style={{ width: `${value}%` }} />
    </div>
  );
}
