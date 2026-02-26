import { Stack } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { useResponsive } from '../../constants/theme';
import { ResponsiveNavigation, NavigationItem } from '../../components/shared/ResponsiveNavigation';
import { PlayerHeader } from '../../components/shared/PlayerHeader';
import { useRouter, useSegments } from 'expo-router';

const navigationItems: NavigationItem[] = [
  { name: 'index', label: 'Home', href: '/(player)/', icon: '🏠' },
  { name: 'team', label: 'My Team', href: '/(player)/team', icon: '👥' },
  { name: 'history', label: 'History', href: '/(player)/history', icon: '📋' },
  { name: 'profile', label: 'Profile', href: '/(player)/profile', icon: '👤' },
];

export default function PlayerLayout() {
  const responsive = useResponsive();
  const segments = useSegments();
  // segments example: ["(player)", "team"] or ["(player)", "index"]
  const currentScreen = "index";

  return (
    <View style={[styles.container, responsive.isMobile && styles.mobileContainer]}>
      {!responsive.isMobile && (
        <ResponsiveNavigation items={navigationItems} baseRoute="/(player)" logo="🏁" />
      )}

      <View style={styles.contentContainer}>
        <PlayerHeader showGroupSelector={currentScreen === "index" || currentScreen === "team"} />
        <View style={styles.stackContainer}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="history" />
            <Stack.Screen name="team" />
            <Stack.Screen name="profile" />
            <Stack.Screen name="settings" />
          </Stack>
        </View>
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
    flexDirection: 'column',
    overflow: 'visible',
  },
  stackContainer: {
    flex: 1,
  },
});
