import React from 'react';
import { ShujaForcesLogo, ShujaForcesLogoProps } from '@/components/brand/ShujaForcesLogo';

export interface AppLogoProps extends Omit<ShujaForcesLogoProps, 'variant'> {
  theme?: 'dark' | 'light';
  subtitle?: string;
}

/**
 * AppLogo adapter that renders the canonical Shuja Forces Academy Pindsultani branding.
 */
export const AppLogo: React.FC<AppLogoProps> = ({
  theme = 'dark',
  size = 'md',
  subtitle = 'Pindsultani',
  className,
  ...props
}) => {
  return (
    <ShujaForcesLogo
      variant={theme === 'dark' ? 'light' : 'dark'}
      size={size}
      showLocation={true}
      showSubtitle={subtitle !== 'Pindsultani' && Boolean(subtitle)}
      subtitle={subtitle}
      className={className}
      {...props}
    />
  );
};

export default AppLogo;
