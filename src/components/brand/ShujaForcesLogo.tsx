import React from 'react';
import { cn } from '@/lib/utils';

export interface ShujaForcesLogoProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'light' | 'dark'; // 'light' text on dark background, 'dark' text on light background
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  showLocation?: boolean;
  showSubtitle?: boolean;
  subtitle?: string;
  iconOnly?: boolean;
  compact?: boolean;
}

/**
 * Premium SVG Academy Mark for Shuja Forces Academy Pindsultani.
 * Features an institutional shield, disciplined geometric SF monogram, and achievement apex diamond.
 */
export const ShujaForcesEmblem: React.FC<{
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'dark';
  className?: string;
}> = ({ size = 'md', variant = 'light', className }) => {
  const pixelSizes = {
    xs: 20,
    sm: 28,
    md: 36,
    lg: 48,
    xl: 64,
  };

  const px = pixelSizes[size] || 36;
  const isLight = variant === 'light'; // on dark background

  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0 select-none transition-transform', className)}
      aria-label="Shuja Forces Academy Emblem"
    >
      {/* Outer Shield Foundation */}
      <path
        d="M24 3L40 9.5V22C40 32.5 33.2 41.5 24 45C14.8 41.5 8 32.5 8 22V9.5L24 3Z"
        fill={isLight ? '#0E1B2A' : '#0E1B2A'}
        stroke="#C6A75E"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Inner Accent Inset Shield */}
      <path
        d="M24 7L36.5 12V21.5C36.5 29.8 31.2 37.2 24 40.2C16.8 37.2 11.5 29.8 11.5 21.5V12L24 7Z"
        fill={isLight ? '#132337' : '#14253B'}
      />

      {/* Stylized Disciplined 'S' and 'F' Dynamic Academy Vectors */}
      {/* Upper Chevron / Wing ('S' top curve & apex wings) */}
      <path
        d="M24 11L32 15V18.5L24 14.5L16 18.5V15L24 11Z"
        fill="#C6A75E"
      />

      {/* Central Geometric 'S'-Bar & 'F'-Arm Cross Section */}
      <path
        d="M17 21H31V23.5H21.5L20.5 26.5H29.5V29H18.5L17.5 33H15L17 21Z"
        fill="#FFFFFF"
      />

      {/* Secondary 'F' Lower Parallel Wing Bar */}
      <path
        d="M23 26.5H29.5V29H22L23 26.5Z"
        fill="#C6A75E"
      />

      {/* Lower Upward Apex Chevron */}
      <path
        d="M24 33.5L30 29.5V32L24 36L18 32V29.5L24 33.5Z"
        fill="#C6A75E"
      />

      {/* Central Achievement Star/Diamond Marker */}
      <polygon
        points="24,15 25.8,18.5 29.5,19 26.8,21.5 27.5,25 24,23.2 20.5,25 21.2,21.5 18.5,19 22.2,18.5"
        fill="#C6A75E"
        opacity="0.95"
      />
    </svg>
  );
};

export const ShujaForcesLogo: React.FC<ShujaForcesLogoProps> = ({
  variant = 'light',
  size = 'md',
  showText = true,
  showLocation = true,
  showSubtitle = false,
  subtitle = 'Computerized Testing & Examination System',
  iconOnly = false,
  compact = false,
  className,
  ...props
}) => {
  const isLight = variant === 'light'; // light text on dark background

  if (iconOnly || !showText) {
    return (
      <div className={cn('inline-flex items-center', className)} {...props}>
        <ShujaForcesEmblem size={size} variant={variant} />
      </div>
    );
  }

  return (
    <div
      className={cn('inline-flex items-center select-none', className, {
        'gap-2': size === 'xs' || size === 'sm',
        'gap-3': size === 'md',
        'gap-3.5': size === 'lg',
        'gap-4': size === 'xl',
      })}
      {...props}
    >
      <ShujaForcesEmblem size={size} variant={variant} />

      <div className="flex flex-col min-w-0 justify-center leading-none">
        {/* Main Brand Title */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={cn(
              'font-display font-bold uppercase tracking-wider',
              isLight ? 'text-white' : 'text-[#0E1B2A]',
              {
                'text-[11px]': size === 'xs',
                'text-xs tracking-wide': size === 'sm',
                'text-sm tracking-wider': size === 'md',
                'text-base tracking-widest': size === 'lg',
                'text-xl tracking-widest': size === 'xl',
              },
            )}
          >
            {compact ? 'Shuja Forces Academy' : 'Shuja Forces Academy'}
          </span>
        </div>

        {/* Secondary Location Tag & Subtitle */}
        <div className="flex items-center gap-2 mt-0.5">
          {showLocation && (
            <span
              className={cn(
                'font-sans font-bold uppercase tracking-widest',
                isLight ? 'text-[#C6A75E]' : 'text-[#A37E2C]',
                {
                  'text-[8px]': size === 'xs',
                  'text-[9px]': size === 'sm',
                  'text-[10px]': size === 'md',
                  'text-[11px]': size === 'lg',
                  'text-xs': size === 'xl',
                },
              )}
            >
              Pindsultani
            </span>
          )}

          {showLocation && showSubtitle && (
            <span
              className={cn(
                'text-[10px] opacity-40',
                isLight ? 'text-white' : 'text-[#64748B]',
              )}
            >
              •
            </span>
          )}

          {showSubtitle && (
            <span
              className={cn(
                'font-sans tracking-tight',
                isLight ? 'text-[#94A3B8]' : 'text-[#64748B]',
                {
                  'text-[8px]': size === 'xs',
                  'text-[9px]': size === 'sm',
                  'text-[10px]': size === 'md',
                  'text-xs': size === 'lg' || size === 'xl',
                },
              )}
            >
              {subtitle}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShujaForcesLogo;
