import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';

type ChipVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'outline';

interface ChipProps {
  label: string;
  variant?: ChipVariant;
  onPress?: () => void;
  onRemove?: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

export default function Chip({
  label,
  variant = 'default',
  onPress,
  onRemove,
  style,
  textStyle,
  disabled = false,
}: ChipProps) {
  const variantStyle = getVariantStyle(variant);
  const textColor = getTextColor(variant);

  const content = (
    <View style={[styles.chip, variantStyle, style]}>
      <Text style={[styles.label, { color: textColor }, textStyle]}>
        {label}
      </Text>
      {onRemove && (
        <TouchableOpacity onPress={onRemove} disabled={disabled}>
          <Text style={[styles.removeIcon, { color: textColor }]}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} disabled={disabled} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

function getVariantStyle(variant: ChipVariant) {
  switch (variant) {
    case 'primary':
      return styles.primary;
    case 'success':
      return styles.success;
    case 'warning':
      return styles.warning;
    case 'error':
      return styles.error;
    case 'outline':
      return styles.outline;
    default:
      return styles.default;
  }
}

function getTextColor(variant: ChipVariant) {
  switch (variant) {
    case 'primary':
    case 'success':
    case 'error':
    case 'warning':
      return '#fff';
    case 'outline':
      return Colors.primary;
    default:
      return Colors.text;
  }
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: FontSizes.small,
    fontWeight: '500',
  },
  removeIcon: {
    marginLeft: Spacing.xs,
    fontSize: 16,
    fontWeight: '600',
  },

  // Variants
  default: {
    backgroundColor: Colors.lightBackground,
  },
  primary: {
    backgroundColor: Colors.primary,
  },
  success: {
    backgroundColor: Colors.success,
  },
  warning: {
    backgroundColor: Colors.warning,
  },
  error: {
    backgroundColor: Colors.error,
  },
  outline: {
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: 'transparent',
  },
});
