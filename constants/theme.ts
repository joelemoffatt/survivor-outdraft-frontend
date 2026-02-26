import { useWindowDimensions } from 'react-native';

/**
 * App-wide constants
 */

export const Colors = {
  primary: '#f4511e',
  secondary: '#2c3e50',
  background: '#fff',
  secondaryBackground: '#fbfbfb',
  adminBackground: '#ecf0f1',
  text: '#000',
  textSecondary: '#666',
  textLight: '#999',
  warning: '#e74c3c',
  success: '#2ecc71',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const FontSizes = {
  small: 12,
  medium: 16,
  large: 20,
  xlarge: 24,
  xxlarge: 32,
};

export const Breakpoints = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
  wide: 1440,
};

export const useResponsive = () => {
  const { width } = useWindowDimensions();
  return {
    isMobile: width < Breakpoints.tablet,
    isTablet: width >= Breakpoints.tablet && width < Breakpoints.desktop,
    isDesktop: width >= Breakpoints.desktop,
    isWide: width >= Breakpoints.wide,
    width,
    screenType: 
      width < Breakpoints.tablet 
        ? 'Mobile' 
        : width < Breakpoints.desktop 
          ? 'Tablet' 
          : width < Breakpoints.wide
            ? 'Desktop'
            : 'Wide Desktop',
  };
};
