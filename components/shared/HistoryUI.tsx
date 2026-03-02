import { ReactNode } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, FontSizes, Spacing } from '../../constants/theme';

type HistoryContainerProps = {
  children: ReactNode;
};

type HistoryTitleProps = {
  children: ReactNode;
};

type HistoryCardProps = {
  title: string;
  onPress: () => void;
  subtitle?: string;
};

type HistoryLoadingProps = {
  label: string;
};

type HistoryEmptyProps = {
  label: string;
};

type HistorySectionProps = {
  title: string;
  children: ReactNode;
  collapsible?: boolean;
  collapsed?: boolean;
  onToggle?: () => void;
  category?: 'challenges' | 'journeys' | 'advantages' | 'tribals' | 'boots' | 'results';
};

type HistoryTextProps = {
  children: ReactNode;
};

export const HistoryContainer = ({ children }: HistoryContainerProps) => (
  <ScrollView style={styles.container} contentContainerStyle={styles.containerContent}>
    {children}
  </ScrollView>
);

export const HistoryTitle = ({ children }: HistoryTitleProps) => (
  <Text style={styles.title}>{children}</Text>
);

export const HistoryCard = ({ title, subtitle, onPress }: HistoryCardProps) => (
  <TouchableOpacity style={styles.card} onPress={onPress}>
    <Text style={styles.cardTitle}>{title}</Text>
    {subtitle ? <Text style={styles.cardSubtitle}>{subtitle}</Text> : null}
  </TouchableOpacity>
);

export const HistoryLoading = ({ label }: HistoryLoadingProps) => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={Colors.primary} />
    <Text style={styles.loadingText}>{label}</Text>
  </View>
);

export const HistoryEmpty = ({ label }: HistoryEmptyProps) => (
  <Text style={styles.emptyText}>{label}</Text>
);

export const HistorySection = ({
  title,
  children,
  collapsible,
  collapsed,
  category,
  onToggle,
}: HistorySectionProps) => {
  const getCategoryColor = (cat?: string) => {
    switch (cat) {
      case 'challenges':
        return '#FF6B6B';
      case 'journeys':
        return '#4ECDC4';
      case 'advantages':
        return '#FFD93D';
      case 'tribals':
        return '#6C5CE7';
      case 'boots':
        return '#FFA502';
      case 'results':
        return '#2ECC71';
      default:
        return Colors.primary;
    }
  };

  return (
    <View style={[styles.sectionBlock, { borderLeftColor: getCategoryColor(category) }]}>
      {collapsible ? (
        <TouchableOpacity style={styles.sectionHeader} onPress={onToggle}>
          <Text style={styles.sectionTitle}>{title}</Text>
        </TouchableOpacity>
      ) : (
        <Text style={styles.sectionTitle}>{title}</Text>
      )}
      {!collapsed && children}
    </View>
  );
};

export const HistoryLineGroup = ({ children }: HistoryTextProps) => (
  <View style={styles.lineGroup}>{children}</View>
);

export const HistoryItemTitle = ({ children }: HistoryTextProps) => (
  <Text style={styles.itemTitle}>{children}</Text>
);

export const HistoryItemSubtitle = ({ children }: HistoryTextProps) => (
  <Text style={styles.itemSubtitle}>{children}</Text>
);

export const HistoryLineText = ({ children }: HistoryTextProps) => (
  <Text style={styles.lineText}>{children}</Text>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  containerContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  title: {
    fontSize: FontSizes.xxlarge,
    fontWeight: '700',
    color: Colors.secondary,
    marginBottom: Spacing.md,
  },
  card: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  cardTitle: {
    fontSize: FontSizes.large,
    fontWeight: '700',
    color: Colors.secondary,
  },
  cardSubtitle: {
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  loadingText: {
    marginTop: Spacing.sm,
    fontSize: FontSizes.medium,
    color: Colors.textLight,
  },
  emptyText: {
    textAlign: 'center',
    color: Colors.textLight,
    fontSize: FontSizes.medium,
    marginTop: Spacing.sm,
  },
  sectionBlock: {
    marginBottom: Spacing.lg,
    borderLeftWidth: 4,
    borderRadius: 8,
    padding: Spacing.sm,
    paddingLeft: Spacing.md,
    borderLeftColor: Colors.primary,
    backgroundColor: Colors.secondaryBackground,
  },
  sectionTitle: {
    fontSize: FontSizes.large,
    fontWeight: '700',
    color: Colors.secondary,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionToggle: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  lineGroup: {
    marginLeft: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  itemTitle: {
    fontSize: FontSizes.medium,
    fontWeight: '700',
    color: Colors.secondary,
    marginBottom: Spacing.xs,
  },
  itemSubtitle: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  lineText: {
    marginLeft: Spacing.sm,
    fontSize: FontSizes.medium,
    color: Colors.secondary,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
});
