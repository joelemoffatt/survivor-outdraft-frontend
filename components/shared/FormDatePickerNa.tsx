import React, { useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Colors, FontSizes, Spacing } from '../../constants/theme';

interface FormDatePickerNativeProps {
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

const formatDisplayValue = (value: Date | null) => {
  if (!value) return '';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(value);
};

// iOS: render compact native date + time pickers inline — no custom modal
function IOSDatePicker({
  label,
  value,
  onChange,
  placeholder,
  error,
  required,
  minimumDate,
  maximumDate,
  disabled = false,
  locked = false,
}: FormDatePickerNativeProps) {
  const isDisabled = disabled || locked;
  const current = value ?? new Date();

  const handleDateChange = (_: DateTimePickerEvent, selected?: Date) => {
    if (!selected) return;
    // Preserve the existing time when only the date changes
    const merged = value ? new Date(value) : new Date();
    merged.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
    onChange(merged);
  };

  const handleTimeChange = (_: DateTimePickerEvent, selected?: Date) => {
    if (!selected) return;
    const merged = value ? new Date(value) : new Date();
    merged.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
    onChange(merged);
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, isDisabled && styles.labelDisabled]}>{label}</Text>
        {required && <Text style={styles.required}>*</Text>}
      </View>

      <View style={[styles.iosRow, isDisabled && styles.iosRowDisabled]}>
        <DateTimePicker
          value={current}
          mode="date"
          display="compact"
          onChange={handleDateChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          disabled={isDisabled}
          style={styles.iosPicker}
        />
        <DateTimePicker
          value={current}
          mode="time"
          display="compact"
          onChange={handleTimeChange}
          disabled={isDisabled}
          style={styles.iosPicker}
        />
        {value && !isDisabled && (
          <TouchableOpacity onPress={() => onChange(null)} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {!value && (
        <Text style={styles.placeholderText}>{placeholder ?? 'Select a date and time'}</Text>
      )}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

// Android: present the system date/time dialog — no custom modal
function AndroidDatePicker({
  label,
  value,
  onChange,
  placeholder,
  error,
  required,
  minimumDate,
  maximumDate,
  disabled = false,
  locked = false,
}: FormDatePickerNativeProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [mode, setMode] = useState<'date' | 'time'>('date');
  const [draftDate, setDraftDate] = useState<Date>(value ?? new Date());

  const isDisabled = disabled || locked;
  const displayText = value ? formatDisplayValue(value) : placeholder ?? 'Select a date and time';

  const handlePress = () => {
    setDraftDate(value ?? new Date());
    setMode('date');
    setShowPicker(true);
  };

  const handleChange = (_: DateTimePickerEvent, selected?: Date) => {
    if (!selected) {
      setShowPicker(false);
      return;
    }
    if (mode === 'date') {
      setDraftDate(selected);
      setMode('time'); // stay open for time selection
    } else {
      onChange(selected);
      setShowPicker(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, isDisabled && styles.labelDisabled]}>{label}</Text>
        {required && <Text style={styles.required}>*</Text>}
      </View>

      <View style={styles.androidRow}>
        <TouchableOpacity
          style={[styles.picker, error && styles.pickerError, isDisabled && styles.pickerDisabled]}
          onPress={handlePress}
          disabled={isDisabled}
        >
          <Text style={[styles.pickerText, !value && styles.placeholderText, isDisabled && styles.pickerDisabledText]}>
            {displayText}
          </Text>
        </TouchableOpacity>

        {value && !isDisabled && (
          <TouchableOpacity onPress={() => onChange(null)} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {showPicker && (
        <DateTimePicker
          value={draftDate}
          mode={mode}
          display="default"
          onChange={handleChange}
          minimumDate={mode === 'date' ? minimumDate : undefined}
          maximumDate={mode === 'date' ? maximumDate : undefined}
        />
      )}
    </View>
  );
}

export default function FormDatePickerNative(props: FormDatePickerNativeProps) {
  if (Platform.OS === 'ios') {
    return <IOSDatePicker {...props} />;
  }
  return <AndroidDatePicker {...props} />;
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

  // iOS
  iosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  iosRowDisabled: {
    opacity: 0.5,
  },
  iosPicker: {
    // compact pickers size themselves; no fixed width needed
  },

  // Android
  androidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  picker: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: Spacing.md,
    backgroundColor: '#fff',
  },
  pickerError: {
    borderColor: Colors.warning,
  },
  pickerDisabled: {
    backgroundColor: Colors.lightBackground,
    borderColor: Colors.border,
  },
  pickerText: {
    fontSize: FontSizes.medium,
    color: Colors.text,
  },
  pickerDisabledText: {
    color: Colors.textSecondary,
  },
  placeholderText: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },

  // Shared
  clearButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  clearButtonText: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
    textDecorationLine: 'underline',
  },
  errorText: {
    fontSize: FontSizes.small,
    color: Colors.warning,
    marginTop: Spacing.xs,
  },
});
