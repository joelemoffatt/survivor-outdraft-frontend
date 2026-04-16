import React from 'react';
import { Platform } from 'react-native';
import FormDatePickerNative from './FormDatePickerNa';
import FormDatePickerWeb from './FormDatePickerWeb';

interface FormDatePickerProps {
  label: string;
  value: Date | null;
  onChange: (value: Date | null) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  minimumDate?: Date;
  maximumDate?: Date;
  disabled?: boolean;
  locked?: boolean;
}

export default function FormDatePicker(props: FormDatePickerProps) {
  const now = new Date();
  const minimumDate = props.minimumDate ?? now;
  const maximumDate =
    props.maximumDate ??
    new Date(
      now.getFullYear() + 1,
      now.getMonth(),
      now.getDate(),
      now.getHours(),
      now.getMinutes(),
      now.getSeconds(),
      now.getMilliseconds(),
    );

  return Platform.select({
    web: () => <FormDatePickerWeb {...props} minimumDate={minimumDate} maximumDate={maximumDate} />,
    default: () => <FormDatePickerNative {...props} minimumDate={minimumDate} maximumDate={maximumDate} />,
  })();
}