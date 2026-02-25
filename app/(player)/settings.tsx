import { View, Text, StyleSheet } from 'react-native';
import { useResponsive } from '../../constants/theme';

export default function SettingsScreen() {
  const responsive = useResponsive();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>Customize your preferences</Text>
      <Text style={styles.screenInfo}>Screen Type: {responsive.screenType}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  screenInfo: {
    fontSize: 14,
    color: '#999',
  },
});
