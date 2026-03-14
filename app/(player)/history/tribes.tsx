import { Alert, StyleSheet, TextInput, View } from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import apiService, { TribeRecord } from '../../../services/api';
import { Colors, FontSizes, Spacing } from '../../../constants/theme';
import {
  HistoryCard,
  HistoryContainer,
  HistoryEmpty,
  HistoryLoading,
} from '../../../components/shared/HistoryUI';

export default function TribesScreen() {
  const [tribes, setTribes] = useState<TribeRecord[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadTribes = async () => {
      try {
        const data = await apiService.getTribes();
        const sorted = data.sort((a, b) => {
          if (a.seasonId !== b.seasonId) {
            return b.seasonId - a.seasonId;
          }
          return a.name.localeCompare(b.name);
        });
        setTribes(sorted);
      } catch (error) {
        Alert.alert('Error', 'Failed to load tribes');
      } finally {
        setLoading(false);
      }
    };

    loadTribes();
  }, []);

  const filteredTribes = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return tribes;
    }

    return tribes.filter((tribe) =>
      [tribe.name, tribe.seasonName, String(tribe.seasonId)].some((value) =>
        value?.toLowerCase().includes(trimmed),
      ),
    );
  }, [query, tribes]);

  if (loading) {
    return <HistoryLoading label="Loading tribes..." />;
  }

  return (
    <HistoryContainer>
      <View style={styles.searchCard}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search tribes"
          placeholderTextColor={Colors.textLight}
          style={styles.input}
          autoCorrect={false}
          autoCapitalize="words"
          returnKeyType="search"
        />
      </View>

      {filteredTribes.map((tribe) => (
        <HistoryCard
          key={tribe.id}
          title={`S${tribe.seasonId} - ${tribe.name}`}
          subtitle={tribe.seasonName}
          onPress={() =>
            router.push({
              pathname: '/(player)/history/tribes/[id]',
              params: { id: String(tribe.id), seasonId: String(tribe.seasonId), tribeName: tribe.name },
            })
          }
        />
      ))}

      {filteredTribes.length === 0 && <HistoryEmpty label="No tribes found" />}
    </HistoryContainer>
  );
}

const styles = StyleSheet.create({
  searchCard: {
    marginBottom: Spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    color: Colors.text,
    fontSize: FontSizes.medium,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
  },
});
