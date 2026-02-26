import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useState } from 'react';
import { Colors, Spacing } from '../../constants/theme';
import { GroupResponse } from '../../services/api';

interface GroupSelectorProps {
  groups: GroupResponse[];
  selectedGroupId: number | null;
  onSelectGroup: (groupId: number) => void;
}

export function GroupSelector({
  groups,
  selectedGroupId,
  onSelectGroup,
}: GroupSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setIsOpen(!isOpen)}
      >
        <Text style={styles.triggerText}>
          {selectedGroup?.name || 'Select Group'}
        </Text>
        <Text style={styles.arrow}>{isOpen ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {isOpen && (
        <ScrollView style={styles.dropdown}>
          {groups.map((group) => (
            <TouchableOpacity
              key={group.id}
              style={[
                styles.option,
                group.id === selectedGroupId && styles.optionSelected,
              ]}
              onPress={() => {
                onSelectGroup(group.id);
                setIsOpen(false);
              }}
            >
              <Text
                style={[
                  styles.optionText,
                  group.id === selectedGroupId && styles.optionTextSelected,
                ]}
              >
                {group.name}
              </Text>
              {group.season && (
                <Text
                  style={[
                    styles.seasonText,
                    group.id === selectedGroupId && styles.seasonTextSelected,
                  ]}
                >
                  {group.season.seasonName}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },

  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },

  triggerText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },

  arrow: {
    color: Colors.text,
    fontSize: 12,
  },

  dropdown: {
    maxHeight: 400,
    marginTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
  },

  option: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 50,
    gap: Spacing.sm,
    backgroundColor: '#f9f9f9',
  },

  optionSelected: {
    backgroundColor: '#2c3e50',
  },

  optionText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },

  optionTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },

  seasonText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },

  seasonTextSelected: {
    color: '#fff',
  },
});
