import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, SafeAreaView, Animated } from 'react-native';
import { useEffect, useRef, useState } from 'react';

import { Ionicons } from '@expo/vector-icons';
import { Colors, Layout, Spacing } from '../../constants/theme';
import { GroupResponse } from '../../services/api';

interface GroupSelectorProps {
  groups: GroupResponse[];
  selectedGroupId: number | null;
  onSelectGroup: (groupId: number) => void;
  triggerColor?: string;
  disabled?: boolean;
}

export function GroupSelector({
  groups,
  selectedGroupId,
  onSelectGroup,
  triggerColor = Colors.text,
  disabled = false,
}: GroupSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedGroup = groups.find((g) => g.id === selectedGroupId);
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (!disabled) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 600, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [disabled]);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => { if (!disabled) setIsOpen(true); }}
        accessibilityRole="button"
        accessibilityLabel="Switch group"
        disabled={disabled}
      >
        {disabled ? (
          <Animated.View style={[styles.skeleton, { opacity: pulseAnim }]} />
        ) : (
          <>
            <Text style={[styles.triggerText, { color: triggerColor }]} numberOfLines={1}>
              {selectedGroup?.name || 'Select Group'}
            </Text>
            <Ionicons
              name={isOpen ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={triggerColor}
            />
          </>
        )}
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
        statusBarTranslucent
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <SafeAreaView style={styles.sheet} onStartShouldSetResponder={() => true}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Switch Group</Text>
              <TouchableOpacity onPress={() => setIsOpen(false)} style={styles.closeButton}>
                <Ionicons name="close" size={22} color="rgba(255,255,255,0.8)" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.list}
              bounces={false}
              keyboardShouldPersistTaps="handled"
            >
              {groups.map((group) => {
                const isSelected = group.id === selectedGroupId;
                return (
                  <TouchableOpacity
                    key={group.id}
                    style={[styles.option, isSelected && styles.optionSelected]}
                    onPress={() => {
                      onSelectGroup(group.id);
                      setIsOpen(false);
                    }}
                  >
                    <View style={styles.optionContent}>
                      <Text
                        style={[styles.optionText, isSelected && styles.optionTextSelected]}
                        numberOfLines={1}
                      >
                        {group.name}
                      </Text>
                      {group.season && (
                        <Text
                          style={[styles.seasonText, isSelected && styles.seasonTextSelected]}
                          numberOfLines={1}
                        >
                          {group.season.seasonName}
                        </Text>
                      )}
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark" size={18} color="#fff" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </SafeAreaView>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },

  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },

  skeleton: {
    width: 120,
    height: 16,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },

  triggerText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
    flexShrink: 1,
  },

  // Modal overlay
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-start',
  },

  sheet: {
    backgroundColor: Colors.primary,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },

  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    height: Layout.playerHeaderRowHeight,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.3)',
    backgroundColor: Colors.primary,
  },

  sheetTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },

  closeButton: {
    padding: Spacing.xs,
  },

  list: {
    maxHeight: 360,
  },

  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    height: Layout.playerHeaderRowHeight,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)',
  },

  optionSelected: {
    backgroundColor: 'rgba(0,0,0,0.15)',
  },

  optionContent: {
    flex: 1,
    marginRight: Spacing.sm,
  },

  optionText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '500',
  },

  optionTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },

  seasonText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },

  seasonTextSelected: {
    color: 'rgba(255,255,255,0.85)',
  },
});
