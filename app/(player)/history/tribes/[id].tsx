import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppLoader from '../../../../components/shared/AppLoader';
import { useLocalSearchParams, useRouter } from 'expo-router';
import apiService, { TribeMappingRecord } from '../../../../services/api';
import AvatarCircle from '../../../../components/shared/AvatarCircle';
import { Colors, FontSizes, Spacing } from '../../../../constants/theme';
import { getImportedCastawayImageSource } from '../../../../utils/castawayImages';
import useDelayedLoader from '../../../../hooks/useDelayedLoader';

type MemberRecord = {
  castawayId: number;
  castawayName: string;
  castawayJsonId?: string;
  seasonId: number;
};

type TribeRangeGroup = {
  startEpisode: number;
  endEpisode: number;
  members: MemberRecord[];
};

const membersKey = (members: MemberRecord[]): string =>
  members
    .map((member) => member.castawayId)
    .sort((a, b) => a - b)
    .join(',');

const buildRangeGroups = (mappings: TribeMappingRecord[]): TribeRangeGroup[] => {
  if (mappings.length === 0) {
    return [];
  }

  const byEpisode = new Map<number, MemberRecord[]>();

  mappings.forEach((mapping) => {
    if (mapping.episodeNumber == null || mapping.castawayId == null) {
      return;
    }

    const current = byEpisode.get(mapping.episodeNumber) ?? [];
    const exists = current.some((member) => member.castawayId === mapping.castawayId);
    if (!exists) {
      current.push({
        castawayId: mapping.castawayId,
        castawayName: mapping.castawayName,
        castawayJsonId: mapping.castawayJsonId,
        seasonId: mapping.seasonId,
      });
    }

    byEpisode.set(mapping.episodeNumber, current);
  });

  const episodeNumbers = Array.from(byEpisode.keys()).sort((a, b) => a - b);
  if (episodeNumbers.length === 0) {
    return [];
  }

  const groups: TribeRangeGroup[] = [];
  let currentStart = episodeNumbers[0];
  let currentEnd = episodeNumbers[0];
  let currentMembers = (byEpisode.get(episodeNumbers[0]) ?? []).slice().sort((a, b) => a.castawayName.localeCompare(b.castawayName));

  for (let i = 1; i < episodeNumbers.length; i += 1) {
    const episodeNumber = episodeNumbers[i];
    const members = (byEpisode.get(episodeNumber) ?? []).slice().sort((a, b) => a.castawayName.localeCompare(b.castawayName));
    const isConsecutive = episodeNumber === currentEnd + 1;
    const sameMembers = membersKey(members) === membersKey(currentMembers);

    if (isConsecutive && sameMembers) {
      currentEnd = episodeNumber;
      continue;
    }

    groups.push({
      startEpisode: currentStart,
      endEpisode: currentEnd,
      members: currentMembers,
    });

    currentStart = episodeNumber;
    currentEnd = episodeNumber;
    currentMembers = members;
  }

  groups.push({
    startEpisode: currentStart,
    endEpisode: currentEnd,
    members: currentMembers,
  });

  return groups;
};

export default function TribeDetailsScreen() {
  const { id, tribeName } = useLocalSearchParams<{ id: string; tribeName?: string }>();
  const router = useRouter();
  const [mappings, setMappings] = useState<TribeMappingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const showLoadingSpinner = useDelayedLoader(loading, 200);

  useEffect(() => {
    const parsedId = Number(id);
    if (!id || Number.isNaN(parsedId)) {
      setError('Invalid tribe id');
      setLoading(false);
      return;
    }

    const loadMappings = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiService.getTribeMappingsByTribeId(parsedId);
        setMappings(data);
      } catch (loadError) {
        console.error('Failed to load tribe mappings:', loadError);
        setError(loadError instanceof Error ? loadError.message : 'Failed to load tribe details');
      } finally {
        setLoading(false);
      }
    };

    loadMappings();
  }, [id]);

  const groups = useMemo(() => buildRangeGroups(mappings), [mappings]);

  if (loading) {
    if (!showLoadingSpinner) {
      return <View style={styles.centerState} />;
    }

    return <AppLoader />;
  }

  if (error) {
    return (
      <View style={styles.centerState}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{tribeName || mappings[0]?.tribeName || 'Tribe Details'}</Text>

      {groups.map((group, groupIndex) => (
        <View key={`${group.startEpisode}-${group.endEpisode}-${groupIndex}`} style={styles.groupCard}>
          <Text style={styles.groupTitle}>
            {group.startEpisode === group.endEpisode
              ? `Episode ${group.startEpisode}`
              : `Episodes ${group.startEpisode}-${group.endEpisode}`}
          </Text>

          {group.members.map((member, memberIndex) => {
            const imageSource = getImportedCastawayImageSource(member.seasonId, member.castawayJsonId);
            return (
              <TouchableOpacity
                key={`${member.castawayId}-${memberIndex}`}
                style={[styles.memberRow, memberIndex < group.members.length - 1 && styles.memberRowBorder]}
                onPress={() =>
                  router.push({
                    pathname: '/(player)/history/castaways/[id]',
                    params: {
                      id: String(member.castawayId),
                      season: String(member.seasonId),
                      jsonId: member.castawayJsonId,
                    },
                  })
                }
                accessibilityRole="button"
                accessibilityLabel={`View ${member.castawayName} details`}
              >
                <AvatarCircle
                  size={36}
                  source={imageSource}
                  fallbackText={member.castawayName}
                  style={styles.avatarCircle}
                />
                <Text style={styles.memberName}>{member.castawayName}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}

      {groups.length === 0 ? <Text style={styles.emptyText}>No tribe mapping data available.</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.lg,
  },
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.background,
  },
  stateText: {
    marginTop: Spacing.sm,
    color: Colors.textSecondary,
    fontSize: FontSizes.medium,
  },
  errorText: {
    color: Colors.warning,
    fontSize: FontSizes.medium,
    textAlign: 'center',
  },
  title: {
    color: Colors.text,
    fontSize: FontSizes.large,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  groupCard: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  groupTitle: {
    color: Colors.secondary,
    fontSize: FontSizes.medium,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  memberRowBorder: {
    borderBottomColor: Colors.border,
    borderBottomWidth: 1,
  },
  avatarCircle: {
    marginRight: Spacing.md,
  },
  memberName: {
    color: Colors.text,
    fontSize: FontSizes.medium,
    fontWeight: '600',
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.medium,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});
