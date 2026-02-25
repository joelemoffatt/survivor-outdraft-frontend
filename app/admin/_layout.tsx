import { Stack } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { useResponsive } from '../../constants/theme';
import { ResponsiveNavigation, NavigationItem } from '../../components/shared/ResponsiveNavigation';

const navigationItems: NavigationItem[] = [
  { name: 'index', label: 'Home', href: '/admin', icon: '🏠' },
  { name: 'create', label: 'Create', href: '/admin/create', icon: '➕' },
  { name: 'social', label: 'Social', href: '/admin/social', icon: '💬' },
  { name: 'game', label: 'Game', href: '/admin/game', icon: '🎲' },
];

export default function AdminLayout() {
  const responsive = useResponsive();

  return (
    <View style={[styles.container, responsive.isMobile && styles.mobileContainer]}>
      {!responsive.isMobile && (
        <ResponsiveNavigation items={navigationItems} baseRoute="/admin" logo="🛠️" />
      )}

      <View style={styles.contentContainer}>
        <View style={styles.stackContainer}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="create" />
            <Stack.Screen name="social" />
            <Stack.Screen name="game" />
          </Stack>
        </View>
      </View>

      {responsive.isMobile && (
        <ResponsiveNavigation items={navigationItems} baseRoute="/admin" logo="🛠️" />
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
