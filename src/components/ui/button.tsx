import * as React from 'react';
import { cn } from '@/lib/utils';

type ButtonVariant = 'default' | 'secondary' | 'ghost';
type ButtonSize = 'default' | 'sm' | 'lg';

const variants: Record<ButtonVariant, string> = {
  default: 'bg-sky-400 text-slate-950 shadow-glow hover:bg-sky-300',
  secondary: 'border border-white/10 bg-white/5 text-white hover:bg-white/10',
  ghost: 'text-slate-300 hover:bg-white/10 hover:text-white'
};

const sizes: Record<ButtonSize, string> = {
  default: 'h-10 px-4 py-2',
  sm: 'h-9 px-3',
  lg: 'h-12 px-6'
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant = 'default', size = 'default', ...props }, ref) => (
  <button className={cn('inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50', variants[variant], sizes[size], className)} ref={ref} {...props} />
));
Button.displayName = 'Button';

export { Button };
