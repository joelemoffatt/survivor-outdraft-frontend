import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, FontSizes, Spacing } from '../../../constants/theme';

interface MultiPageProgressProps {
  stepTitle: string;
  currentStep: number;
  totalSteps: number;
  description?: string;
}

export default function MultiPageProgress({
  stepTitle,
  currentStep,
  totalSteps,
  description,
}: MultiPageProgressProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.stepCount}>{`Step ${currentStep} of ${totalSteps}`}</Text>
      <Text style={styles.title}>{stepTitle}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${(currentStep / totalSteps) * 100}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  stepCount: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    fontWeight: '700',
  },
  title: {
    fontSize: FontSizes.xlarge,
    color: Colors.text,
    fontWeight: '700',
  },
  description: {
    marginTop: Spacing.sm,
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
  },
  track: {
    marginTop: Spacing.md,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#ececec',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
});