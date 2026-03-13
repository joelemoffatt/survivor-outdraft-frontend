import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import Card from './Card';
import { Colors, FontSizes, Spacing } from '../../constants/theme';

interface DetailsSectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

interface DetailRowProps {
  label: string;
  value?: React.ReactNode;
  helperText?: string;
  noBorder?: boolean;
}

export function DetailsSection({ title, subtitle, children, style }: DetailsSectionProps) {
  return (
    <Card style={style} shadow="light" padding="lg">
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      <View style={styles.rows}>{children}</View>
    </Card>
  );
}

export function DetailRow({ label, value, helperText, noBorder = false }: DetailRowProps) {
  return (
    <View style={[styles.row, !noBorder && styles.rowBorder]}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueContainer}>
        {typeof value === 'string' || typeof value === 'number' ? (
          <Text style={styles.value}>{value}</Text>
        ) : (
          value
        )}
        {helperText ? <Text style={styles.helperText}>{helperText}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: FontSizes.large,
    fontWeight: '700',
    color: Colors.text,
  },
  sectionSubtitle: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    lineHeight: 18,
  },
  rows: {
    marginTop: Spacing.md,
  },
  row: {
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  label: {
    fontSize: FontSizes.small,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  valueContainer: {
    gap: Spacing.xs,
  },
  value: {
    fontSize: FontSizes.medium,
    color: Colors.text,
    lineHeight: 22,
  },
  helperText: {
    fontSize: FontSizes.small,
    color: Colors.textLight,
    lineHeight: 18,
  },
});