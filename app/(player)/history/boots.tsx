import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Colors, FontSizes, Spacing } from '../../../constants/theme';

export default function BootsScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Boots</Text>
      <View style={styles.card}>
        <Text style={styles.text}>See elimination history and boot order from all seasons.</Text>
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
    marginBottom: Spacing.md,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: Spacing.lg,
  },
  text: {
    fontSize: FontSizes.medium,
    color: Colors.text,
  },
});
