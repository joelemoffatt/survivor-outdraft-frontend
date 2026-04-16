import React, { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
  if (!value) {
    return '';
  }
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(value);
};

export default function FormDatePickerNative({
  label,
  value,
  onChange,
  placeholder = 'Select a date and time',
  error,
  required,
  minimumDate,
  maximumDate,
  disabled = false,
  locked = false,
}: FormDatePickerNativeProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [draftValue, setDraftValue] = useState<Date>(value ?? new Date());
  const [mode, setMode] = useState<'date' | 'time'>('date');

  const isDisabled = disabled || locked;
  const displayText = value ? formatDisplayValue(value) : placeholder;

  const handleDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (selectedDate) {
      setDraftValue(selectedDate);
      if (Platform.OS === 'android') {
        if (mode === 'date') {
          setMode('time');
        } else {
          onChange(selectedDate);
          setModalVisible(false);
        }
      }
    }
  };

  const handleDone = () => {
    onChange(draftValue);
    setModalVisible(false);
  };

  const handleClear = () => {
    onChange(null);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, isDisabled && styles.labelDisabled]}>{label}</Text>
        {required && <Text style={styles.required}>*</Text>}
      </View>

      <TouchableOpacity
        style={[styles.picker, error && styles.pickerError, isDisabled && styles.pickerDisabled]}
        onPress={() => !isDisabled && setModalVisible(true)}
        disabled={isDisabled}
      >
        <Text
          style={[
            styles.pickerText,
            !value && styles.placeholderText,
            isDisabled && styles.pickerDisabledText,
          ]}
        >
          {displayText}
        </Text>
      </TouchableOpacity>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <Pressable style={styles.modalContent} onPress={(event) => event.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.pickerContainer}>
              {Platform.OS === 'ios' && (
                <View style={styles.modeButtons}>
                  <TouchableOpacity
                    style={[styles.modeButton, mode === 'date' && styles.modeButtonActive]}
                    onPress={() => setMode('date')}
                  >
                    <Text style={[styles.modeButtonText, mode === 'date' && styles.modeButtonTextActive]}>
                      Date
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modeButton, mode === 'time' && styles.modeButtonActive]}
                    onPress={() => setMode('time')}
                  >
                    <Text style={[styles.modeButtonText, mode === 'time' && styles.modeButtonTextActive]}>
                      Time
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
              <DateTimePicker
                value={draftValue}
                mode={mode}
                display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
                onChange={handleDateChange}
                minimumDate={minimumDate}
                maximumDate={maximumDate}
              />
            </View>

            <View style={styles.actions}>
              <TouchableOpacity style={styles.secondaryButton} onPress={handleClear}>
                <Text style={styles.secondaryButtonText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryButton} onPress={handleDone}>
                <Text style={styles.primaryButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
  picker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    color: Colors.textSecondary,
  },
  errorText: {
    fontSize: FontSizes.small,
    color: Colors.warning,
    marginTop: Spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: FontSizes.large,
    fontWeight: '700',
    color: Colors.text,
  },
  closeButton: {
    fontSize: 24,
    color: Colors.text,
  },
  pickerContainer: {
    paddingVertical: Spacing.md,
  },
  modeButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  modeButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modeButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  modeButtonText: {
    fontSize: FontSizes.small,
    fontWeight: '600',
    color: Colors.text,
  },
  modeButtonTextActive: {
    color: '#fff',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryButtonText: {
    color: Colors.text,
    fontSize: FontSizes.medium,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: Colors.primary,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: FontSizes.medium,
    fontWeight: '700',
  },
});
