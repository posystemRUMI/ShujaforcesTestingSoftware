import React from 'react';
import { cn } from '@/lib/utils';
import { User } from 'lucide-react';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  name?: string;
  fallbackText?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl',
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'Cadet avatar',
  name,
  fallbackText,
  size = 'md',
  className,
  ...props
}) => {
  const [imageError, setImageError] = React.useState(false);
  const initials = fallbackText
    ? fallbackText.slice(0, 2).toUpperCase()
    : name
    ? name
        .trim()
        .split(/\s+/)
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : undefined;

  return (
    // STRICT RULE: Soft-squared with 4px radius (rounded). Never rounded-full (circular prohibited).
    <div
      className={cn(
        'relative rounded bg-[#EDF1F5] border border-[#D4D9DF] flex items-center justify-center overflow-hidden flex-shrink-0 text-[#0E1B2A] font-bold font-mono select-none',
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {src && !imageError ? (
        <img
          src={src}
          alt={alt}
          onError={() => setImageError(true)}
          className="w-full h-full object-cover"
        />
      ) : initials ? (
        <span>{initials}</span>
      ) : (
        <User className="w-1/2 h-1/2 text-[#64748B]" />
      )}
    </div>
  );
};
