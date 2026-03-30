import React, { useState } from 'react';
import { StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { Colors, FontSizes, Spacing } from '../../constants/theme';

export type LocalRuleType =
  | 'INDIVIDUAL_IMMUNITY'
  | 'TRIBAL_IMMUNITY'
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

export const DEFAULT_RULE_TEMPLATES: RuleTemplate[] = [
  { ruleType: 'INDIVIDUAL_IMMUNITY', label: 'Individual Immunity', defaultPoints: 2 },
  { ruleType: 'TRIBAL_IMMUNITY', label: 'Tribal Immunity', defaultPoints: 2 },
  { ruleType: 'FOUND_IDOL', label: 'Found Idol', defaultPoints: 1 },
  { ruleType: 'FOUND_ADVANTAGE', label: 'Found Advantage', defaultPoints: 1 },
  { ruleType: 'SOLE_SURVIVOR', label: 'Sole Survivor', defaultPoints: 5 },
  { ruleType: 'RUNNER_UP', label: 'Runner-Up', defaultPoints: 2 },
  { ruleType: 'MADE_MERGE', label: 'Made the Merge', defaultPoints: 1 },
  { ruleType: 'MED_EVAC', label: 'Med Evac', defaultPoints: -2 },
  { ruleType: 'QUIT', label: 'Quit', defaultPoints: -2 },
];

export const getLocalRuleLabel = (ruleType: string) =>
  DEFAULT_RULE_TEMPLATES.find((rule) => rule.ruleType === ruleType)?.label ?? ruleType;

export const getDefaultLocalRules = (): LocalRule[] =>
  DEFAULT_RULE_TEMPLATES.map((rule) => ({
    ruleType: rule.ruleType,
    points: rule.defaultPoints,
  }));

type GroupRulesEditorProps = {
  rules: LocalRule[];
  onChange: (rules: LocalRule[]) => void;
};

const normalizeRules = (rules: LocalRule[]): LocalRule[] => {
  const map = new Map<LocalRuleType, number>();
  for (const rule of rules) {
    map.set(rule.ruleType, rule.points);
  }

  return DEFAULT_RULE_TEMPLATES
    .filter((template) => map.has(template.ruleType))
    .map((template) => ({
      ruleType: template.ruleType,
      points: map.get(template.ruleType) ?? template.defaultPoints,
    }));
};

export default function GroupRulesEditor({ rules, onChange }: GroupRulesEditorProps) {
  const [displayValues, setDisplayValues] = useState<Record<string, string>>({});
  const normalizedRules = normalizeRules(rules);

  const setRuleActive = (template: RuleTemplate, isActive: boolean) => {
    const existing = normalizedRules.find((rule) => rule.ruleType === template.ruleType);

    if (isActive) {
      if (existing) {
        return;
      }
      onChange([
        ...normalizedRules,
        {
          ruleType: template.ruleType,
          points: template.defaultPoints,
        },
      ]);
      return;
    }

    onChange(normalizedRules.filter((rule) => rule.ruleType !== template.ruleType));
  };

  const sanitizePointsInput = (input: string): string => {
    if (input === '' || input === '-') return input;
    const cleaned = input.replace(/[^\d-]/g, '');
    if (cleaned.startsWith('-')) {
      return '-' + cleaned.slice(1).replace(/-/g, '');
    }
    return cleaned.replace(/-/g, '');
  };

  const updatePoints = (template: RuleTemplate, rawPoints: string) => {
    const sanitized = sanitizePointsInput(rawPoints);
    setDisplayValues((prev) => ({ ...prev, [template.ruleType]: sanitized }));
  };

  const finalizPoints = (template: RuleTemplate) => {
    const displayValue = displayValues[template.ruleType] ?? String(normalizedRules.find((r) => r.ruleType === template.ruleType)?.points ?? template.defaultPoints);
    if (displayValue === '' || displayValue === '-') {
      setDisplayValues((prev) => ({ ...prev, [template.ruleType]: String(template.defaultPoints) }));
      return;
    }
    const parsedPoints = parseInt(displayValue, 10);
    const nextPoints = Number.isNaN(parsedPoints) ? 0 : parsedPoints;

    const nextRules = normalizedRules.map((rule) =>
      rule.ruleType === template.ruleType ? { ...rule, points: nextPoints } : rule
    );
    onChange(nextRules);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scoring Rules</Text>
      <Text style={styles.subtitle}>Toggle rules on/off and set points.</Text>

      {DEFAULT_RULE_TEMPLATES.map((template) => {
        const activeRule = normalizedRules.find((rule) => rule.ruleType === template.ruleType);
        const isActive = Boolean(activeRule);

        return (
          <View
            key={template.ruleType}
            style={[styles.ruleCard, !isActive && styles.ruleCardInactive]}
          >
            <View style={styles.headerRow}>
              <Text style={[styles.ruleLabel, !isActive && styles.ruleLabelInactive]}>
                {template.label}
              </Text>
              <Switch
                value={isActive}
                onValueChange={(value) => setRuleActive(template, value)}
                trackColor={{ false: Colors.disabled, true: Colors.primary }}
                thumbColor={Colors.background}
              />
            </View>

            <View style={styles.pointsRow}>
              <Text style={[styles.pointsLabel, !isActive && styles.ruleLabelInactive]}>Points</Text>
              <TextInput
                value={displayValues[template.ruleType] ?? String(activeRule?.points ?? template.defaultPoints)}
                onChangeText={(value) => updatePoints(template, value)}
                onBlur={() => finalizPoints(template)}
                keyboardType="numbers-and-punctuation"
                editable={isActive}
                style={[styles.pointsInput, !isActive && styles.pointsInputInactive]}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  title: {
    fontSize: FontSizes.large,
    fontWeight: '700',
    color: Colors.text,
  },
  subtitle: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  ruleCard: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: Spacing.md,
    backgroundColor: Colors.card,
    gap: Spacing.sm,
  },
  ruleCardInactive: {
    backgroundColor: Colors.lightBackground,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ruleLabel: {
    flex: 1,
    fontSize: FontSizes.medium,
    fontWeight: '600',
    color: Colors.text,
    marginRight: Spacing.sm,
  },
  ruleLabelInactive: {
    color: Colors.textLight,
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pointsLabel: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
  },
  pointsInput: {
    minWidth: 90,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    fontSize: FontSizes.medium,
    color: Colors.text,
    textAlign: 'right',
    backgroundColor: Colors.background,
  },
  pointsInputInactive: {
    color: Colors.textLight,
    backgroundColor: Colors.secondaryBackground,
  },
});
