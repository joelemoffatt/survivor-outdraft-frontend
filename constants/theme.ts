import { useWindowDimensions } from 'react-native';

/**
 * App-wide constants
 */

export const Colors = {
  // Brand
  primary: '#f4511e',
  secondary: '#2c3e50',

  // Backgrounds
  background: '#fff',
  secondaryBackground: '#fbfbfb',
  adminBackground: '#ecf0f1',
  lightBackground: '#f5f5f5',
  card: '#fff',

  // State backgrounds
  infoBackground: '#e8f4f8',
  successBackground: '#e0f2f1',
  warningBackground: '#fff8f7',
  errorBackground: '#ffebee',

  // Text
  text: '#000',
  textSecondary: '#666',
  textLight: '#999',

  // Status
  warning: '#e74c3c',
  success: '#2ecc71',
  error: '#ff6b6b',
  disabled: '#ccc',

  // UI
  border: '#e0e0e0',
  overlay: 'rgba(0, 0, 0, 0.6)',
};

export const Spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  button: 18,
};

export const FontSizes = {
  // Body text
  small: 12,
  medium: 16,

  // Headings
  large: 20,
  xlarge: 24,
  xxlarge: 32,

  // Display/Hero
  subtitle: 32,
  title: 42,
};

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  full: 30,
};

export const Shadow = {
  light: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  dark: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
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
