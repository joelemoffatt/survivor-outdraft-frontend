import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';

type MenuItemVariant = 'default' | 'danger' | 'success' | 'info';

interface MenuItemProps {
  onPress: () => void;
  icon?: string;
  label: string;
  description?: string;
  rightContent?: React.ReactNode;
  showChevron?: boolean;
  variant?: MenuItemVariant;
  style?: ViewStyle;
  disabled?: boolean;
}

export default function MenuItem({
  onPress,
  icon,
  label,
  description,
  rightContent,
  showChevron = true,
  variant = 'default',
  style,
  disabled = false,
}: MenuItemProps) {
  const iconColor = getIconColor(variant, disabled);
  const labelColor = getTextColor(variant, disabled);

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[styles.container, style]}
      activeOpacity={disabled ? 1 : 0.7}
    >
      <View style={styles.left}>
        {icon && (
          <Ionicons name={icon as any} size={20} color={iconColor} style={styles.icon} />
        )}
        <View style={styles.content}>
          <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
          {description && <Text style={styles.description}>{description}</Text>}
        </View>
      </View>

      <View style={styles.right}>
        {rightContent || (
          showChevron && (
            <Ionicons
              name="chevron-forward"
              size={20}
              color={Colors.textSecondary}
            />
          )
        )}
      </View>
    </TouchableOpacity>
  );
}

function getIconColor(variant: MenuItemVariant, disabled: boolean) {
  if (disabled) return Colors.disabled;
  switch (variant) {
    case 'danger':
      return Colors.error;
    case 'success':
      return Colors.success;
    case 'info':
      return Colors.primary;
    default:
      return Colors.primary;
  }
}

function getTextColor(variant: MenuItemVariant, disabled: boolean) {
  if (disabled) return Colors.disabled;
  switch (variant) {
    case 'danger':
      return Colors.error;
    case 'success':
      return Colors.success;
    default:
      return Colors.text;
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: Spacing.md,
  },
  content: {
    flex: 1,
  },
  label: {
    fontSize: FontSizes.medium,
    fontWeight: '500',
    marginBottom: Spacing.xxs,
  },
  description: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
  },
  right: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
