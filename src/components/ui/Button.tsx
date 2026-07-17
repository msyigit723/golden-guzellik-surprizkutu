import * as React from 'react';
import { cn } from '@/utils/cn';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = 'primary', size = 'md', isLoading, children, ...props },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background',
          {
            'bg-luxury-gold text-luxury-black hover:bg-[#c29e2f] active:scale-95 shadow-premium':
              variant === 'primary',
            'bg-luxury-surface text-luxury-white hover:bg-white/10':
              variant === 'secondary',
            'border border-luxury-gold text-luxury-gold hover:bg-luxury-gold/10':
              variant === 'outline',
            'hover:bg-luxury-black/5 text-foreground': variant === 'ghost',
            'h-9 px-3 text-sm': size === 'sm',
            'h-12 px-6 text-base': size === 'md', // 48px minimum for mobile
            'h-14 px-8 text-lg': size === 'lg',
          },
          className
        )}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading ? (
          <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button };
