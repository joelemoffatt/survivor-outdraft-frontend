import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { Colors, FontSizes, Spacing } from '../../constants/theme';

interface FormInputProps extends TextInputProps {
  label: string;
  error?: string;
  required?: boolean;
  locked?: boolean;
}

export default function FormInput({
  label,
  error,
  required,
  locked = false,
  style,
  ...props
}: FormInputProps) {
  const isDisabled = locked || props.editable === false;

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, isDisabled && styles.labelDisabled]}>{label}</Text>
        {required && <Text style={styles.required}>*</Text>}
      </View>
      <TextInput
        style={[
          styles.input,
          isDisabled && styles.inputDisabled,
          error && styles.inputError,
          style,
        ]}
        placeholderTextColor={Colors.textSecondary}
        {...props}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  labelRow: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: FontSizes.medium,
    fontWeight: '600',
    color: Colors.text,
  },
  labelDisabled: {
    color: Colors.textSecondary,
  },
  required: {
    fontSize: FontSizes.medium,
    color: Colors.warning,
    marginLeft: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: Spacing.md,
    fontSize: FontSizes.medium,
    color: Colors.text,
    backgroundColor: '#fff',
  },
  inputDisabled: {
    backgroundColor: Colors.lightBackground,
    borderColor: Colors.border,
    color: Colors.textSecondary,
  },
  inputError: {
    borderColor: Colors.warning,
  },
  errorText: {
    fontSize: FontSizes.small,
    color: Colors.warning,
    marginTop: Spacing.xs,
  },
});
