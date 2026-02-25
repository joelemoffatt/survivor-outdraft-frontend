import { Stack } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { useResponsive } from '../../constants/theme';
import { ResponsiveNavigation, NavigationItem } from '../../components/shared/ResponsiveNavigation';

const navigationItems: NavigationItem[] = [
  { name: 'index', label: 'Home', href: '/(player)/', icon: '🏠' },
  { name: 'team', label: 'My Team', href: '/(player)/team', icon: '👥' },
  { name: 'history', label: 'History', href: '/(player)/history', icon: '📋' },
  { name: 'settings', label: 'Settings', href: '/(player)/settings', icon: '⚙️' },
];

export default function PlayerLayout() {
  const responsive = useResponsive();

  return (
    <View style={[styles.container, responsive.isMobile && styles.mobileContainer]}>
      {!responsive.isMobile && (
        <ResponsiveNavigation items={navigationItems} baseRoute="/(player)" logo="🏁" />
      )}

      <View style={styles.contentContainer}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="history" />
          <Stack.Screen name="team" />
          <Stack.Screen name="settings" />
        </Stack>
      </View>

      {responsive.isMobile && (
        <ResponsiveNavigation items={navigationItems} baseRoute="/(player)" logo="🏁" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  mobileContainer: {
    flexDirection: 'column',
  },
  contentContainer: {
    flex: 1,
  },
});
