import { StyleSheet, Text, View } from 'react-native';
import Card from '../shared/Card';
import { BorderRadius, Colors, FontSizes, Spacing } from '../../constants/theme';
import { CastawayPerformanceDetail } from '../../services/api';
import SeasonCastawayDetailsSection from './SeasonCastawayDetailsSection';

interface CastawayPerformanceSectionsProps {
  performances: CastawayPerformanceDetail[];
  castawayName?: string | null;
  castawayFullName?: string | null;
}

interface RequirementMetric {
  label: string;
  value: string;
  requirement?: string;
}

const displayValue = (value?: string | null) => {
  if (!value || !value.trim()) {
    return '—';
  }

  return value;
};

const formatSeasonChip = (performance: CastawayPerformanceDetail) => {
  const seasonName = displayValue(performance.season?.seasonName);
  const seasonId = performance.season?.id;
  const version = displayValue(performance.season?.version);

  return `${seasonName} • S${seasonId ?? '—'} • ${version}`;
};

const SectionHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <View style={styles.headerRow}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
  </View>
);

const RequirementGrid = ({ metrics }: { metrics: RequirementMetric[] }) => (
  <View style={styles.grid}>
    {metrics.map((metric) => (
      <View key={metric.label} style={styles.metricCard}>
        <Text style={styles.metricLabel}>{metric.label}</Text>
        <Text style={styles.metricValue}>{metric.value}</Text>
        {metric.requirement ? <Text style={styles.metricHint}>Need: {metric.requirement}</Text> : null}
      </View>
    ))}
  </View>
);

export default function CastawayPerformanceSections({
  performances,
  castawayName,
  castawayFullName,
}: CastawayPerformanceSectionsProps) {
  const sortedPerformances = [...performances].sort((a, b) => (a.season?.id ?? 0) - (b.season?.id ?? 0));
  const uniqueSeasonIds = new Set(sortedPerformances.map((entry) => entry.season?.id).filter(Boolean));
  const seasonsPlayed = uniqueSeasonIds.size;
  const firstSeason = sortedPerformances[0]?.season;
  const latestSeason = sortedPerformances[sortedPerformances.length - 1]?.season;

  const versionCounts = sortedPerformances.reduce<Record<string, number>>((accumulator, performance) => {
    const version = displayValue(performance.season?.version);
    accumulator[version] = (accumulator[version] ?? 0) + 1;
    return accumulator;
  }, {});

  const versionBadges = Object.entries(versionCounts).map(([version, count]) => `${version} (${count})`);

  const challengeProfile: RequirementMetric[] = [
    { label: 'Team Wins', value: '—', requirement: 'challengePerformance.teamResult' },
    { label: 'Individual Wins', value: '—', requirement: 'challengePerformance.individualResult' },
    { label: 'Immunity Wins', value: '—', requirement: 'challengePerformance.isImmunityWin' },
    { label: 'Reward Wins', value: '—', requirement: 'challengePerformance.isRewardWin' },
  ];

  const tribalPressure: RequirementMetric[] = [
    { label: 'Tribals Attended', value: '—', requirement: 'tribal attendance by episode' },
    { label: 'Votes Received', value: '—', requirement: 'vote.targetCastawayId counts' },
    { label: 'Revotes', value: '—', requirement: 'vote round flags' },
    { label: 'Tie Votes', value: '—', requirement: 'vote round tie metadata' },
  ];

  const advantageHistory: RequirementMetric[] = [
    { label: 'Found', value: '—', requirement: 'advantageMovement action=FOUND' },
    { label: 'Played', value: '—', requirement: 'advantageMovement action=PLAYED' },
    { label: 'Successful Plays', value: '—', requirement: 'play outcome field' },
    { label: 'Failed Plays', value: '—', requirement: 'play outcome field' },
  ];

  const gameProgress: RequirementMetric[] = [
    { label: 'Seasons Played', value: String(seasonsPlayed || 0) },
    { label: 'First Season', value: displayValue(firstSeason?.seasonName) },
    { label: 'Latest Season', value: displayValue(latestSeason?.seasonName) },
    { label: 'Performance Records', value: String(sortedPerformances.length) },
    { label: 'Days Survived', value: '—', requirement: 'boot episode/day mapping' },
    { label: 'Merge Reached', value: '—', requirement: 'tribe/merge event mapping' },
  ];

  const relationshipSignals: RequirementMetric[] = [
    { label: 'Vote Alignment %', value: '—', requirement: 'majority vs castaway vote' },
    { label: 'Flipped Votes', value: '—', requirement: 'episode-to-episode vote switch' },
    { label: 'Blindsides For', value: '—', requirement: 'boot expectation vs outcome' },
    { label: 'Blindsides Against', value: '—', requirement: 'elimination expectation model' },
  ];

  return (
    <View style={styles.container}>
      <Card shadow="light">
        <SectionHeader title="Performance Summary" subtitle="Chip-based snapshot (available now)" />
        <View style={styles.chipRow}>
          <View style={styles.bigChip}>
            <Text style={styles.bigChipLabel}>Seasons</Text>
            <Text style={styles.bigChipValue}>{seasonsPlayed || 0}</Text>
          </View>
          <View style={styles.bigChip}>
            <Text style={styles.bigChipLabel}>First</Text>
            <Text style={styles.bigChipValueSmall}>{displayValue(firstSeason?.seasonName)}</Text>
          </View>
          <View style={styles.bigChip}>
            <Text style={styles.bigChipLabel}>Latest</Text>
            <Text style={styles.bigChipValueSmall}>{displayValue(latestSeason?.seasonName)}</Text>
          </View>
        </View>

        <View style={styles.badgeWrap}>
          {versionBadges.length > 0 ? (
            versionBadges.map((badge) => (
              <View key={badge} style={styles.badge}>
                <Text style={styles.badgeText}>{badge}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No season versions found.</Text>
          )}
        </View>
      </Card>

      <Card shadow="light">
        <SectionHeader title="Episode Timeline Preview" subtitle="Card timeline style (currently season-level data)" />
        {sortedPerformances.length > 0 ? (
          sortedPerformances.map((performance, index) => (
            <View key={performance.id} style={[styles.timelineRow, index === sortedPerformances.length - 1 && styles.timelineRowLast]}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>{displayValue(performance.season?.seasonName)}</Text>
                <Text style={styles.timelineMeta}>Performance ID: {performance.id}</Text>
                <Text style={styles.timelineMeta}>Format: {formatSeasonChip(performance)}</Text>
                <Text style={styles.timelineHint}>
                  Need episode-level fields for event tags like Reward Win, Immunity Win, Tribal, Safe, Jury.
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No performance records found.</Text>
        )}
      </Card>

      <SeasonCastawayDetailsSection
        performances={performances}
        castawayName={castawayName}
        castawayFullName={castawayFullName}
      />

      <Card shadow="light">
        <SectionHeader title="Challenge Profile" subtitle="Metric grid style" />
        <RequirementGrid metrics={challengeProfile} />
      </Card>

      <Card shadow="light">
        <SectionHeader title="Tribal Pressure" subtitle="Metric grid style" />
        <RequirementGrid metrics={tribalPressure} />
      </Card>

      <Card shadow="light">
        <SectionHeader title="Advantage History" subtitle="Metric grid style" />
        <RequirementGrid metrics={advantageHistory} />
      </Card>

      <Card shadow="light">
        <SectionHeader title="Game Progress" subtitle="Mixed available + required fields" />
        <RequirementGrid metrics={gameProgress} />
      </Card>

      <Card shadow="light">
        <SectionHeader title="Relationship Signals" subtitle="Comparison/table style" />
        {relationshipSignals.map((metric, index) => (
          <View key={metric.label} style={[styles.tableRow, index === relationshipSignals.length - 1 && styles.tableRowLast]}>
            <View style={styles.tableLabelWrap}>
              <Text style={styles.tableLabel}>{metric.label}</Text>
              <Text style={styles.tableRequirement}>Need: {metric.requirement}</Text>
            </View>
            <Text style={styles.tableValue}>{metric.value}</Text>
          </View>
        ))}
      </Card>

      <Card shadow="light">
        <SectionHeader title="Narrative Badges" subtitle="Badge-style storytelling (preview)" />
        <View style={styles.badgeWrap}>
          <View style={styles.storyBadge}><Text style={styles.storyBadgeText}>Veteran {seasonsPlayed >= 2 ? '✓' : '—'}</Text></View>
          <View style={styles.storyBadge}><Text style={styles.storyBadgeText}>Challenge Beast ?</Text></View>
          <View style={styles.storyBadge}><Text style={styles.storyBadgeText}>Tribal Magnet ?</Text></View>
          <View style={styles.storyBadge}><Text style={styles.storyBadgeText}>Advantage Hunter ?</Text></View>
          <View style={styles.storyBadge}><Text style={styles.storyBadgeText}>Low Visibility ?</Text></View>
        </View>
        <Text style={styles.storyHint}>Badges with “?” need episode/challenge/vote/advantage event data.</Text>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  headerRow: {
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSizes.large,
    fontWeight: '700',
    color: Colors.text,
  },
  sectionSubtitle: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  chipRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  bigChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.lightBackground,
    padding: Spacing.sm,
    minHeight: 72,
  },
  bigChipLabel: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  bigChipValue: {
    fontSize: FontSizes.xlarge,
    fontWeight: '700',
    color: Colors.text,
  },
  bigChipValueSmall: {
    fontSize: FontSizes.medium,
    fontWeight: '700',
    color: Colors.text,
  },
  badgeWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  badge: {
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.infoBackground,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  badgeText: {
    color: Colors.secondary,
    fontSize: FontSizes.small,
    fontWeight: '600',
  },
  timelineRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  timelineRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
    marginTop: 6,
  },
  timelineContent: {
    flex: 1,
    gap: Spacing.xs,
  },
  timelineTitle: {
    color: Colors.text,
    fontSize: FontSizes.medium,
    fontWeight: '700',
  },
  timelineMeta: {
    color: Colors.textSecondary,
    fontSize: FontSizes.small,
  },
  timelineHint: {
    color: Colors.textLight,
    fontSize: FontSizes.small,
    lineHeight: 17,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  metricCard: {
    width: '48%',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    backgroundColor: Colors.secondaryBackground,
    minHeight: 88,
    gap: Spacing.xs,
  },
  metricLabel: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  metricValue: {
    fontSize: FontSizes.large,
    color: Colors.text,
    fontWeight: '700',
  },
  metricHint: {
    fontSize: FontSizes.small,
    color: Colors.textLight,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  tableRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  tableLabelWrap: {
    flex: 1,
    gap: Spacing.xs,
  },
  tableLabel: {
    color: Colors.text,
    fontSize: FontSizes.medium,
    fontWeight: '600',
  },
  tableRequirement: {
    color: Colors.textLight,
    fontSize: FontSizes.small,
  },
  tableValue: {
    color: Colors.text,
    fontSize: FontSizes.medium,
    fontWeight: '700',
  },
  storyBadge: {
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.successBackground,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  storyBadgeText: {
    color: Colors.secondary,
    fontSize: FontSizes.small,
    fontWeight: '700',
  },
  storyHint: {
    marginTop: Spacing.sm,
    color: Colors.textSecondary,
    fontSize: FontSizes.small,
  },
  emptyText: {
    marginTop: Spacing.sm,
    color: Colors.textSecondary,
    fontSize: FontSizes.medium,
  },
});
