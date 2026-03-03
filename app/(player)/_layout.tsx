import { Stack } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { useResponsive } from '../../constants/theme';
import { ResponsiveNavigation, NavigationItem } from '../../components/shared/ResponsiveNavigation';
import { PlayerHeader } from '../../components/shared/PlayerHeader';
import { useRouter, useSegments } from 'expo-router';

const navigationItems: NavigationItem[] = [
  { name: 'index', label: 'Home', href: '/(player)/', icon: 'home' },
  { name: 'team', label: 'My Team', href: '/(player)/team', icon: 'people' },
  { name: 'more', label: 'More', href: '/(player)/more', icon: 'ellipsis-horizontal' },
];

export default function PlayerLayout() {
  const responsive = useResponsive();

  return (
    <View style={[styles.container, responsive.isMobile && styles.mobileContainer]}>
      {!responsive.isMobile && (
        <ResponsiveNavigation items={navigationItems} baseRoute="/(player)" logo="flag" />
      )}

      <View style={styles.contentContainer}>
        <View style={styles.stackContainer}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="history" />
            <Stack.Screen name="team" />
            <Stack.Screen name="more" />
            <Stack.Screen name="settings" />
          </Stack>
        </View>
      </View>

      {responsive.isMobile && (
        <ResponsiveNavigation items={navigationItems} baseRoute="/(player)" logo="flag" />
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
