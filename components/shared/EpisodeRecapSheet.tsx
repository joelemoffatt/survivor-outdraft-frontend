import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import Ionicons from '@expo/vector-icons/Ionicons';
import { BorderRadius, Colors, FontSizes, Spacing } from '../../constants/theme';
import type { GroupResponse, TeamResponse } from '../../services/api';
import {
  buildTeamRecaps,
  extractSeasonNumber,
  renderRecap,
  type RecapPreset,
} from '../../utils/episodeRecap';

interface Props {
  visible: boolean;
  onClose: () => void;
  group: GroupResponse;
  teams: TeamResponse[];
}

const PRESETS: { key: RecapPreset; label: string }[] = [
  { key: 'full', label: 'Full' },
  { key: 'tight', label: 'Tight' },
  { key: 'hype', label: 'Hype' },
];

export default function EpisodeRecapSheet({ visible, onClose, group, teams }: Props) {
  const [preset, setPreset] = useState<RecapPreset>('full');
  const [toast, setToast] = useState<string | null>(null);

  const episodeNumber = group.latestEpisodeWatched?.episodeNumber ?? 0;
  const seasonNumber = extractSeasonNumber(group);

  const recaps = useMemo(() => {
    if (episodeNumber <= 0) return [];
    return buildTeamRecaps(teams, episodeNumber);
  }, [teams, episodeNumber]);

  const previews = useMemo(() => {
    if (recaps.length === 0) return { full: '', tight: '', hype: '' };
    return {
      full: renderRecap('full', seasonNumber, episodeNumber, recaps),
      tight: renderRecap('tight', seasonNumber, episodeNumber, recaps),
      hype: renderRecap('hype', seasonNumber, episodeNumber, recaps),
    };
  }, [recaps, seasonNumber, episodeNumber]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 1800);
    return () => clearTimeout(id);
  }, [toast]);

  const handleCopy = async () => {
    try {
      await Clipboard.setStringAsync(previews[preset]);
      setToast('Copied ✓');
    } catch {
      setToast('Copy failed');
    }
  };

  const currentPreview = previews[preset];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>Ep {episodeNumber} recap</Text>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.presets}>
            {PRESETS.map((p) => {
              const active = preset === p.key;
              return (
                <TouchableOpacity
                  key={p.key}
                  onPress={() => setPreset(p.key)}
                  style={[styles.presetButton, active && styles.presetButtonActive]}
                >
                  <Text
                    style={[styles.presetLabel, active && styles.presetLabelActive]}
                  >
                    {p.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <ScrollView
            style={styles.previewScroll}
            contentContainerStyle={styles.previewContent}
          >
            <Text style={styles.previewText} selectable>
              {currentPreview || 'No scored data yet for this episode.'}
            </Text>
          </ScrollView>

          <TouchableOpacity
            style={[styles.copyButton, !currentPreview && styles.copyButtonDisabled]}
            disabled={!currentPreview}
            onPress={handleCopy}
          >
            <Ionicons name="copy-outline" size={20} color="#fff" />
            <Text style={styles.copyButtonLabel}>Copy</Text>
          </TouchableOpacity>

          {toast && (
            <View style={styles.toast}>
              <Text style={styles.toastText}>{toast}</Text>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: { fontSize: FontSizes.large, fontWeight: '600', color: Colors.text },
  presets: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  presetButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.secondaryBackground,
    alignItems: 'center',
  },
  presetButtonActive: { backgroundColor: Colors.primary },
  presetLabel: { color: Colors.text, fontWeight: '500' },
  presetLabelActive: { color: '#fff' },
  previewScroll: {
    backgroundColor: Colors.secondaryBackground,
    borderRadius: BorderRadius.md,
    maxHeight: 340,
  },
  previewContent: { padding: Spacing.md },
  previewText: {
    fontFamily: 'Courier',
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
  },
  copyButton: {
    marginTop: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
  },
  copyButtonDisabled: { opacity: 0.5 },
  copyButtonLabel: { color: '#fff', fontWeight: '600', fontSize: FontSizes.medium },
  toast: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  toastText: { color: '#fff', fontSize: FontSizes.small },
});
