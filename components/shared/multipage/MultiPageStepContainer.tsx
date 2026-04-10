import React, { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Colors, Spacing } from '../../../constants/theme';

interface MultiPageStepContainerProps {
  children: ReactNode;
}

export default function MultiPageStepContainer({
  children,
}: MultiPageStepContainerProps) {
  return <View style={styles.container}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: Spacing.lg,
  },
});