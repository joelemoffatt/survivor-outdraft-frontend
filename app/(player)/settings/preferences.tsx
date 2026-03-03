import { ScrollView, StyleSheet, Text, View, Switch } from 'react-native';
import { useState } from 'react';
import { Colors, FontSizes, Spacing } from '../../../constants/theme';

export default function PreferencesScreen() {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>App Preferences</Text>
      <View style={styles.card}>
        <View style={styles.setting}>
          <Text style={styles.settingLabel}>Dark Mode</Text>
          <Switch value={darkMode} onValueChange={setDarkMode} />
        </View>
        <Text style={styles.description}>Customize your app experience.</Text>
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
  setting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  settingLabel: {
    fontSize: FontSizes.medium,
    color: Colors.text,
  },
  description: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
});
