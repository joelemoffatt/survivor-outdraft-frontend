import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Spacing } from '../../../constants/theme';
import FormButton from '../FormButton';

interface MultiPageActionsProps {
  canGoBack: boolean;
  isFinalStep: boolean;
  onBack: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
  submitting?: boolean;
  nextLabel?: string;
  submitLabel?: string;
}

export default function MultiPageActions({
  canGoBack,
  isFinalStep,
  onBack,
  onNext,
  nextDisabled = false,
  submitting = false,
  nextLabel = 'Next',
  submitLabel = 'Submit',
}: MultiPageActionsProps) {
  return (
    <View style={styles.container}>
      <View style={styles.leftAction}>
        {canGoBack ? (
          <FormButton
            title="Back"
            variant="secondary"
            onPress={onBack}
            disabled={submitting}
          />
        ) : null}
      </View>

      <View style={styles.rightAction}>
        <FormButton
          title={isFinalStep ? submitLabel : nextLabel}
          onPress={onNext}
          disabled={nextDisabled}
          loading={submitting}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  leftAction: {
    flex: 1,
  },
  rightAction: {
    flex: 1,
  },
});