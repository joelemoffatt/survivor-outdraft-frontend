import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Colors,
  Spacing,
  FontSizes,
  BorderRadius,
} from '../../constants/theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  onPress: () => void;
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export default function Button({
  onPress,
  label,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  fullWidth = false,
}: ButtonProps) {
  const variantStyle = getVariantStyle(variant, disabled);
  const sizeStyle = getSizeStyle(size);
  const textColor = getTextColor(variant, disabled);

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        variantStyle,
        sizeStyle,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="small" color={textColor} />
        ) : (
          <>
            {icon && iconPosition === 'left' && (
              <Ionicons name={icon as any} size={18} color={textColor} style={styles.iconLeft} />
            )}
            <Text style={[styles.text, sizeStyle === styles.sm && styles.textSm, textStyle, { color: textColor }]}>
              {label}
            </Text>
            {icon && iconPosition === 'right' && (
              <Ionicons name={icon as any} size={18} color={textColor} style={styles.iconRight} />
            )}
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

function getVariantStyle(variant: ButtonVariant, disabled: boolean) {
  switch (variant) {
    case 'primary':
      return styles.primary;
    case 'secondary':
      return styles.secondary;
    case 'outline':
      return styles.outline;
    case 'danger':
      return styles.danger;
    case 'success':
      return styles.success;
    default:
      return styles.primary;
  }
}

function getSizeStyle(size: ButtonSize) {
  switch (size) {
    case 'sm':
      return styles.sm;
    case 'md':
      return styles.md;
    case 'lg':
      return styles.lg;
    default:
      return styles.md;
  }
}

function getTextColor(variant: ButtonVariant, disabled: boolean) {
  if (disabled) return Colors.disabled;
  switch (variant) {
    case 'primary':
    case 'danger':
    case 'success':
      return '#fff';
    case 'secondary':
      return Colors.text;
    case 'outline':
      return Colors.primary;
    default:
      return '#fff';
  }
}

const styles = StyleSheet.create({
  button: {
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.6,
  },
  fullWidth: {
    width: '100%',
  },

  // Variants
  primary: {
    backgroundColor: Colors.primary,
  },
  secondary: {
    backgroundColor: Colors.lightBackground,
  },
  outline: {
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: Colors.error,
  },
  success: {
    backgroundColor: Colors.success,
  },

  // Sizes
  sm: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  md: {
    paddingHorizontal: Spacing.button,
    paddingVertical: Spacing.sm,
  },
  lg: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.button,
  },

  // Text styles
  text: {
    fontSize: FontSizes.medium,
    fontWeight: '600',
    textAlign: 'center',
  },
  textSm: {
    fontSize: FontSizes.small,
  },

  // Icons
  iconLeft: {
    marginRight: Spacing.sm,
  },
  iconRight: {
    marginLeft: Spacing.sm,
  },
});
