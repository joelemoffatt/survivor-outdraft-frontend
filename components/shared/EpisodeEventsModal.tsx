import React from 'react';
import { ActivityIndicator, Modal, View, Text, ScrollView, Pressable, TouchableOpacity, StyleSheet } from 'react-native';
import { BorderRadius, Colors, FontSizes, Shadow, Spacing } from '../../constants/theme';

export interface EpisodeEvent {
  id?: string | number;
  label: string;
  points?: number | null;
}

export interface EpisodeBlock {
  episodeNumber: number | null;
  episodeTitle?: string | null;
  events: EpisodeEvent[];
}

export type { EpisodeBlock as EpisodeBlockType };

interface Props {
  visible: boolean;
  onClose: () => void;
  title?: string | null;
  subtitle?: string | null;
  seasonId?: number | null;
  episodes: EpisodeBlock[];
  onEpisodePress?: (seasonId: number, episodeNumber: number) => void;
  loading?: boolean;
}

export default function EpisodeEventsModal({
  visible,
  onClose,
  title,
  subtitle,
  seasonId,
  episodes,
  onEpisodePress,
  loading = false,
}: Props) {
  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {title ? <Text style={styles.modalTitle}>{title}</Text> : null}
          {subtitle ? <Text style={styles.modalSubtitle}>{subtitle}</Text> : null}

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : (
          <ScrollView style={styles.modalList}>
            {episodes && episodes.length > 0 ? (
              episodes.map((episode) => (
                <View key={`ep-${String(episode.episodeNumber)}`} style={styles.scoreEventRow}>
                  <View style={styles.scoreEventLeft}>
                    {episode.episodeNumber != null && seasonId != null && onEpisodePress ? (
                      <Pressable onPress={() => onEpisodePress(seasonId, episode.episodeNumber as number)}>
                        <Text style={styles.scoreEventEpisodeLink}>{`Ep ${episode.episodeNumber}`}</Text>
                      </Pressable>
                    ) : (
                      <Text style={styles.scoreEventEpisode}>—</Text>
                    )}

                    <View style={styles.scoreEventBody}>
                      {episode.episodeTitle ? (
                        <Text style={styles.scoreEventTitle}>{episode.episodeTitle}</Text>
                      ) : null}

                      {episode.events.map((ev) => (
                        <View key={ev.id ?? ev.label} style={styles.scoreEventRowInner}>
                          <Text style={styles.scoreEventLabel}>{ev.label}</Text>
                          <Text style={styles.scoreEventPoints}>{ev.points != null ? (ev.points >= 0 ? `+${ev.points}` : String(ev.points)) : ''}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No events found for this category.</Text>
            )}
          </ScrollView>
          )}

          <TouchableOpacity style={styles.modalClose} onPress={onClose}>
            <Text style={styles.modalCloseText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    maxHeight: '70%',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.dark,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  modalList: {
    flexGrow: 0,
  },
  scoreEventRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  scoreEventLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: Spacing.sm,
  },
  scoreEventEpisodeLink: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    width: 44,
    paddingTop: 1,
  },
  scoreEventEpisode: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    width: 44,
    paddingTop: 1,
  },
  scoreEventBody: {
    flex: 1,
    gap: 2,
  },
  scoreEventTitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  scoreEventRowInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: Spacing.xs,
  },
  scoreEventLabel: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 21,
  },
  scoreEventPoints: {
    fontSize: 15,
    color: Colors.primary,
    fontWeight: '800',
    marginLeft: Spacing.md,
  },
  modalClose: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    ...Shadow.light,
  },
  modalCloseText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
  },
});
