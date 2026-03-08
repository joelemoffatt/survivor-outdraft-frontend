import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { Colors, FontSizes, Spacing } from '../../constants/theme';

interface SectionHeaderProps {
  title: string;
  style?: TextStyle;
}

export default function SectionHeader({ title, style }: SectionHeaderProps) {
  return <Text style={[styles.title, style]}>{title}</Text>;
}

const styles = StyleSheet.create({
  title: {
    fontSize: FontSizes.large,
    fontWeight: '700',
    color: Colors.secondary,
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
  },
});
