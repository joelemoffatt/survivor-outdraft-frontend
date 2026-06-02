import { useEffect, useState } from 'react';
import { Text, TouchableOpacity, StyleSheet, View } from 'react-native';
import AppLoader from './AppLoader';
import { Colors, FontSizes, Spacing } from '../../constants/theme';

const STUCK_TIMEOUT_MS = 15000;

interface Props {
  loadingText?: string | null;
  onForceRefresh?: () => void;
}

export default function GroupLoadingScreen({ loadingText, onForceRefresh }: Props) {
  const phrases = loadingText
    ? loadingText.split(',').map((s) => s.trim()).filter(Boolean)
    : ['Loading...'];

  const [index, setIndex] = useState(0);
  const [showRefresh, setShowRefresh] = useState(false);

  useEffect(() => {
    if (phrases.length <= 1) return;
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % phrases.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [phrases.length]);

  useEffect(() => {
    setShowRefresh(false);
    const timeout = setTimeout(() => setShowRefresh(true), STUCK_TIMEOUT_MS);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <View style={styles.container}>
      <AppLoader label={phrases[index]} />
      {showRefresh && onForceRefresh && (
        <TouchableOpacity style={styles.refreshButton} onPress={onForceRefresh}>
          <Text style={styles.refreshText}>Taking longer than expected — tap to refresh</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.secondaryBackground },
  refreshButton: {
    position: 'absolute',
    bottom: Spacing.xl,
    left: Spacing.lg,
    right: Spacing.lg,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  refreshText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.small,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});
