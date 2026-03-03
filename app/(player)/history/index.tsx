import { ScrollView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, FontSizes, Spacing } from '../../../constants/theme';
import Ionicons from '@expo/vector-icons/Ionicons';

interface HistoryOption {
  label: string;
  icon: string;
  route: string;
}

const historyOptions: HistoryOption[] = [
  { label: 'Seasons', icon: 'calendar', route: '/(player)/history/seasons' },
  { label: 'Episodes', icon: 'film', route: '/(player)/history/episodes' },
  { label: 'Castaways', icon: 'person-outline', route: '/(player)/history/castaways' },
  { label: 'Tribes', icon: 'people-outline', route: '/(player)/history/tribes' },
  { label: 'Challenges', icon: 'fitness', route: '/(player)/history/challenges' },
  { label: 'Tribals', icon: 'flame', route: '/(player)/history/tribals' },
  { label: 'Votes', icon: 'checkbox', route: '/(player)/history/votes' },
  { label: 'Advantages', icon: 'star', route: '/(player)/history/advantages' },
  { label: 'Journeys', icon: 'map', route: '/(player)/history/journeys' },
  { label: 'Boots', icon: 'exit', route: '/(player)/history/boots' },
  { label: 'Results', icon: 'trophy', route: '/(player)/history/results' },
];

export default function HistoryScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Survivor History</Text>
      <Text style={styles.subtitle}>Explore all Survivor data and statistics</Text>
      
      <View style={styles.grid}>
        {historyOptions.map((option) => (
          <TouchableOpacity
            key={option.route}
            style={styles.card}
            onPress={() => router.push(option.route)}
          >
            <Ionicons name={option.icon as keyof typeof Ionicons.glyphMap} size={32} color={Colors.primary} />
            <Text style={styles.cardLabel}>{option.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
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
  title: {
    fontSize: FontSizes.xxlarge,
    fontWeight: '700',
    color: Colors.secondary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
    flex: 1,
    minHeight: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardLabel: {
    fontSize: FontSizes.medium,
    color: Colors.text,
    fontWeight: '600',
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
});
