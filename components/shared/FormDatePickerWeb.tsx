import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DateTimePicker, { useDefaultStyles } from 'react-native-ui-datepicker';
import dayjs from 'dayjs';
import { Colors, FontSizes, Spacing } from '../../constants/theme';

interface FormDatePickerWebProps {
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

export default function FormDatePickerWeb({
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
}: FormDatePickerWebProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [draftValue, setDraftValue] = useState<Date>(value ?? new Date());
  const [draftCleared, setDraftCleared] = useState(value === null);
  const defaultStyles = useDefaultStyles();
  const isDisabled = disabled || locked;
  const now = new Date();
  const defaultMinimumDate = minimumDate ?? now;
  const defaultMaximumDate = maximumDate ?? new Date(now.getFullYear() + 1, now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());

  useEffect(() => {
    if (modalVisible) {
      setDraftValue(value ?? new Date());
      setDraftCleared(value === null);
    }
  }, [modalVisible, value]);

  const displayText = value
    ? new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(value)
    : placeholder;

  const handleChange = ({ date }: any) => {
    if (date) {
      setDraftValue(dayjs.isDayjs(date) ? date.toDate() : new Date(date));
      setDraftCleared(false);
    }
  };

  const handleDone = () => {
    onChange(draftCleared ? null : draftValue);
    setModalVisible(false);
  };

  const handleClear = () => {
    setDraftCleared(true);
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
              <DateTimePicker
                mode="single"
                date={draftCleared ? dayjs() : dayjs(draftValue)}
                onChange={handleChange}
                minDate={dayjs(defaultMinimumDate)}
                maxDate={dayjs(defaultMaximumDate)}
                timePicker
                use12Hours
                styles={{
                  ...defaultStyles,
                  header: { backgroundColor: '#fff' },
                  month_selector: { backgroundColor: '#fff' },
                  month_selector_label: { color: '#000', fontWeight: '700' },
                  year_selector: { backgroundColor: '#fff' },
                  year_selector_label: { color: '#000', fontWeight: '700' },
                  time_selector: { backgroundColor: '#fff' },
                  time_selector_label: { color: '#000', fontWeight: '700' },
                  button_prev: { backgroundColor: '#fff' },
                  button_next: { backgroundColor: '#fff' },
                  button_prev_image: { tintColor: '#000' },
                  button_next_image: { tintColor: '#000' },
                  days: { backgroundColor: '#fff' },
                  day_cell: { 
                    borderRadius: 8,
                    padding: 8,
                    marginVertical: 4,
                  },
                  day: { 
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: '#f0f0f0',
                  },
                  day_label: { color: Colors.text, fontWeight: '500', fontSize: 14 },
                  disabled: { backgroundColor: '#f5f5f5', borderColor: '#f5f5f5' },
                  disabled_label: { color: '#999' },
                  today: { 
                    borderColor: Colors.primary, 
                    borderWidth: 2,
                    backgroundColor: 'rgba(255, 140, 0, 0.08)',
                  },
                  today_label: { color: Colors.primary, fontWeight: '700' },
                  selected: { 
                    backgroundColor: Colors.primary,
                    borderColor: Colors.primary,
                  },
                  selected_label: { color: '#fff', fontWeight: '700' },
                  weekdays: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0', paddingVertical: 8 },
                  weekday_label: { color: '#000', fontWeight: '700' },
                  month: { backgroundColor: '#fff' },
                  month_label: { color: Colors.text, fontWeight: '700', fontSize: 14 },
                  year: { backgroundColor: '#fff' },
                  year_label: { color: Colors.text, fontWeight: '700', fontSize: 14 },
                  time_label: { color: '#000', fontWeight: '700', textAlign: 'center' },
                  time_selected_indicator: { backgroundColor: '#f3f4f6', borderRadius: 8 },
                }}
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
    paddingHorizontal: Spacing.sm,
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
