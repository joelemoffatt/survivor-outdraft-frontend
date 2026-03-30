import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import Card from '../../../components/shared/Card';
import AvatarCircle from '../../../components/shared/AvatarCircle';
import { Colors, FontSizes, Spacing } from '../../../constants/theme';
import { getImportedCastawayImageSource } from '../../../utils/castawayImages';
import apiService, { CastawaySearchResult } from '../../../services/api';

export default function CastawaysScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CastawaySearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiService.searchCastaways(trimmedQuery);
        setResults(data);
      } catch (searchError) {
        console.error('Failed to search castaways:', searchError);
        setError(searchError instanceof Error ? searchError.message : 'Failed to search castaways');
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [query]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Card shadow="light" style={styles.searchCard}>
        <Text style={styles.label}>Search Castaways</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Type a castaway full name"
          placeholderTextColor={Colors.textLight}
          style={styles.input}
          autoCorrect={false}
          autoCapitalize="words"
          returnKeyType="search"
        />
      </Card>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.stateText}>Searching...</Text>
        </View>
      ) : null}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {!loading && !error && query.trim().length > 0 && results.length === 0 ? (
        <Text style={styles.stateText}>No castaways found.</Text>
      ) : null}

      {!query.trim() ? (
        <Text style={styles.helperText}>Enter a full name to search across seasons.</Text>
      ) : null}

      {results.length > 0 ? (
        <Card shadow="light" padding="sm">
          {results.map((item, index) => (
            <TouchableOpacity
              key={`${item.castawayId}-${item.season}-${index}`}
              onPress={() =>
                router.push({
                  pathname: '/(player)/history/castaways/[id]',
                  params: {
                    id: String(item.castawayId),
                    season: String(item.season),
                    jsonId: item.jsonId,
                  },
                })
              }
              style={[styles.resultRow, index < results.length - 1 && styles.rowBorder]}
            >
              <View style={styles.resultRowContent}>
                <AvatarCircle
                  size={40}
                  source={getImportedCastawayImageSource(item.season, item.jsonId)}
                  fallbackText={item.fullName}
                  style={styles.avatarCircle}
                />
                <View style={styles.resultTextGroup}>
                  <Text style={styles.resultName}>{item.fullName}</Text>
                  <Text style={styles.resultSeason}>Season {item.season}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </Card>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.secondaryBackground,
  },
  content: {
    padding: Spacing.lg,
  },
  searchCard: {
    marginBottom: Spacing.md,
  },
  label: {
    color: Colors.text,
    fontSize: FontSizes.medium,
    fontWeight: '700',
    marginBottom: Spacing.sm,
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
  centerState: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  stateText: {
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    fontSize: FontSizes.medium,
  },
  helperText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.medium,
  },
  errorText: {
    color: Colors.warning,
    fontSize: FontSizes.medium,
    marginBottom: Spacing.sm,
  },
  resultRow: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  resultRowContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    marginRight: Spacing.md,
  },
  resultTextGroup: {
    flex: 1,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  resultName: {
    color: Colors.primary,
    fontSize: FontSizes.medium,
    fontWeight: '700',
  },
  resultSeason: {
    color: Colors.textSecondary,
    fontSize: FontSizes.small,
    marginTop: Spacing.xxs,
  },
});
