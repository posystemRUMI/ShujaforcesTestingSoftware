import React from 'react';
import { Shield } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const logoVariants = cva('flex items-center space-x-3 select-none', {
  variants: {
    size: {
      sm: 'space-x-2',
      md: 'space-x-3',
      lg: 'space-x-4',
    },
    theme: {
      dark: 'text-white',
      light: 'text-[#0E1B2A]',
    },
  },
  defaultVariants: {
    size: 'md',
    theme: 'dark',
  },
});

const emblemVariants = cva(
  'rounded flex items-center justify-center font-bold flex-shrink-0 transition-transform',
  {
    variants: {
      size: {
        sm: 'w-7 h-7 bg-[#C6A75E] text-[#0E1B2A]',
        md: 'w-9 h-9 bg-[#C6A75E] text-[#0E1B2A]',
        lg: 'w-12 h-12 bg-[#0E1B2A] border-2 border-[#C6A75E] text-[#C6A75E]',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

export interface AppLogoProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof logoVariants> {
  subtitle?: string;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  size,
  theme,
  subtitle = 'CBT Command Center',
  className,
  ...props
}) => {
  return (
    <div className={cn(logoVariants({ size, theme, className }))} {...props}>
      <div className={emblemVariants({ size })}>
        <Shield
          className={cn(
            size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-7 h-7' : 'w-5 h-5',
            'stroke-[2.2]',
          )}
        />
      </div>
      <div className="flex flex-col leading-tight">
        <span
          className={cn(
            'font-bold tracking-wider uppercase font-display',
            size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-lg' : 'text-sm',
          )}
        >
          Forces Academy
        </span>
        <span
          className={cn(
            'tracking-tight font-sans',
            theme === 'dark' ? 'text-[#A0AEC0]' : 'text-[#64748B]',
            size === 'sm' ? 'text-[9px]' : size === 'lg' ? 'text-xs' : 'text-[10px]',
          )}
        >
          {subtitle}
        </span>
      </div>
    </div>
  );
};
