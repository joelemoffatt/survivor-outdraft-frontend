import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  FlatList,
  Modal,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSizes, Spacing } from '../../constants/theme';

export type LocalRuleType =
  | 'INDIVIDUAL_IMMUNITY'
  | 'FOUND_IDOL'
  | 'FOUND_ADVANTAGE'
  | 'SOLE_SURVIVOR'
  | 'RUNNER_UP'
  | 'MADE_MERGE'
  | 'MED_EVAC'
  | 'QUIT';

export interface LocalRule {
  ruleType: LocalRuleType;
  points: number;
}

type RuleTemplate = {
  ruleType: LocalRuleType;
  label: string;
  defaultPoints: number;
};

export const RULE_TEMPLATES: RuleTemplate[] = [
  { ruleType: 'INDIVIDUAL_IMMUNITY', label: 'Individual Immunity', defaultPoints: 2 },
  { ruleType: 'FOUND_IDOL', label: 'Found Idol', defaultPoints: 1 },
  { ruleType: 'FOUND_ADVANTAGE', label: 'Found Advantage', defaultPoints: 1 },
  { ruleType: 'SOLE_SURVIVOR', label: 'Sole Survivor', defaultPoints: 5 },
  { ruleType: 'RUNNER_UP', label: 'Runner-Up', defaultPoints: 2 },
  { ruleType: 'MADE_MERGE', label: 'Made the Merge', defaultPoints: 1 },
  { ruleType: 'MED_EVAC', label: 'Med Evac', defaultPoints: -2 },
  { ruleType: 'QUIT', label: 'Quit', defaultPoints: -2 },
];

export const getDefaultLocalRules = (): LocalRule[] =>
  RULE_TEMPLATES.map((rule) => ({
    ruleType: rule.ruleType,
    points: rule.defaultPoints,
  }));

interface PointRulesInputProps {
  rules: LocalRule[];
  onChange: (rules: LocalRule[]) => void;
}

interface RuleRowProps {
  rule: LocalRule;
  index: number;
  onPointsChange: (index: number, points: string) => void;
  onDelete: (index: number) => void;
}

function RuleRow({ rule, index, onPointsChange, onDelete }: RuleRowProps) {
  const ruleLabel = RULE_TEMPLATES.find((t) => t.ruleType === rule.ruleType)?.label || rule.ruleType;

  return (
    <View style={styles.ruleRow}>
      <Text style={styles.ruleLabelText}>{ruleLabel}</Text>
      <TextInput
        value={String(rule.points)}
        onChangeText={(points) => onPointsChange(index, points)}
        keyboardType="number-pad"
        style={styles.pointsInput}
        placeholder="0"
      />
      <TouchableOpacity onPress={() => onDelete(index)}>
        <Ionicons name="trash" size={20} color={Colors.warning} />
      </TouchableOpacity>
    </View>
  );
}

export default function PointRulesInput({ rules, onChange }: PointRulesInputProps) {
  const [modalVisible, setModalVisible] = useState(false);

  const availableRuleOptions = RULE_TEMPLATES.filter(
    (template) => !rules.find((r) => r.ruleType === template.ruleType)
  );

  const handleAddRule = () => {
    setModalVisible(true);
  };

  const handleSelectRuleType = (ruleType: LocalRuleType) => {
    const template = RULE_TEMPLATES.find((t) => t.ruleType === ruleType);
    if (template) {
      onChange([
        ...rules,
        {
          ruleType: template.ruleType,
          points: template.defaultPoints,
        },
      ]);
    }
    setModalVisible(false);
  };

  const handlePointsChange = (index: number, pointsStr: string) => {
    const points = parseInt(pointsStr, 10);
    const newPoints = Number.isNaN(points) ? 0 : points;

    const newRules = [...rules];
    newRules[index] = { ...newRules[index], points: newPoints };
    onChange(newRules);
  };

  const handleDeleteRule = (index: number) => {
    onChange(rules.filter((_, i) => i !== index));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scoring Rules</Text>

      {rules.length === 0 ? (
        <Text style={styles.emptyText}>No rules added yet</Text>
      ) : (
        <FlatList
          data={rules}
          keyExtractor={(_, index) => String(index)}
          scrollEnabled={false}
          renderItem={({ item, index }) => (
            <RuleRow
              rule={item}
              index={index}
              onPointsChange={handlePointsChange}
              onDelete={handleDeleteRule}
            />
          )}
        />
      )}

      <TouchableOpacity
        style={[styles.addButton, availableRuleOptions.length === 0 && styles.addButtonDisabled]}
        onPress={handleAddRule}
        disabled={availableRuleOptions.length === 0}
      >
        <Ionicons
          name="add"
          size={20}
          color={availableRuleOptions.length === 0 ? Colors.textSecondary : '#000'}
        />
        <Text style={[styles.addButtonText, availableRuleOptions.length === 0 && styles.addButtonTextDisabled]}>
          Add Rule
        </Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <Pressable
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Rule Type</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {availableRuleOptions.length === 0 ? (
                <Text style={styles.modalEmptyText}>All rules have been added</Text>
              ) : (
                availableRuleOptions.map((template) => (
                  <TouchableOpacity
                    key={template.ruleType}
                    style={styles.modalOption}
                    onPress={() => handleSelectRuleType(template.ruleType)}
                  >
                    <Text style={styles.modalOptionText}>{template.label}</Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  title: {
    fontSize: FontSizes.medium,
    fontWeight: '600',
    color: Colors.text,
  },
  emptyText: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingLeft: Spacing.md,
    paddingRight: Spacing.md,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#000',
    height: 54,
  },
  ruleLabelText: {
    flex: 1,
    fontSize: FontSizes.medium,
    color: Colors.text,
    fontWeight: '500',
  },
  pointsInput: {
    flex: 0,
    width: 80,
    height: '100%',
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 6,
    marginRight: Spacing.md,
    fontSize: FontSizes.medium,
    color: Colors.text,
    textAlign: 'center',
    backgroundColor: '#fff',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    height: 54,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#000',
    gap: Spacing.sm,
    backgroundColor: '#fff',
  },
  addButtonDisabled: {
    borderColor: Colors.textSecondary,
    opacity: 0.5,
  },
  addButtonText: {
    fontSize: FontSizes.medium,
    fontWeight: '600',
    color: '#000',
  },
  addButtonTextDisabled: {
    color: Colors.textSecondary,
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
    maxHeight: '70%',
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
  modalBody: {
    maxHeight: '80%',
  },
  modalEmptyText: {
    padding: Spacing.lg,
    textAlign: 'center',
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
  },
  modalOption: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  modalOptionText: {
    fontSize: FontSizes.medium,
    color: Colors.text,
  },
});
