import { View, Text, StyleSheet } from 'react-native';

export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Tune your experience</Text>
      </View>
      <View style={styles.card}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Coming soon</Text>
        </View>
        <Text style={styles.cardTitle}>More controls are on the way</Text>
        <Text style={styles.cardText}>Account, notifications, and group options will live here.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f5f2',
    paddingHorizontal: 20,
    paddingTop: 32,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#201f1d',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 16,
    color: '#6b6a67',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e6e1da',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f1ebe3',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: '#7a5f3c',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#201f1d',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 15,
    color: '#5f5d59',
    lineHeight: 22,
  },
});
