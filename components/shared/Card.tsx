import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Spacing, BorderRadius, Shadow } from '../../constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  shadow?: 'light' | 'medium' | 'dark' | 'none';
  padding?: keyof typeof Spacing;
}

export default function Card({
  children,
  style,
  shadow = 'light',
  padding = 'lg',
}: CardProps) {
  const shadowStyle = shadow !== 'none' ? Shadow[shadow] : {};

  return (
    <View
      style={[
        styles.card,
        { paddingVertical: Spacing[padding], paddingHorizontal: Spacing[padding] },
        shadowStyle,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
});
