import { Stack } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useResponsive } from '../../constants/theme';
import { ResponsiveNavigation, NavigationItem } from '../../components/shared/ResponsiveNavigation';

const navigationItems: NavigationItem[] = [
  { name: 'index', label: 'Home', href: '/admin', icon: 'home' },
  { name: 'social', label: 'Social', href: '/admin/social', icon: 'people' },
  { name: 'game', label: 'Game', href: '/admin/game', icon: 'game-controller' },
  { name: 'more', label: 'More', href: '/admin/more', icon: 'ellipsis-horizontal' },
];

export default function AdminLayout() {
  const responsive = useResponsive();

  return (
    <SafeAreaView style={[styles.container, responsive.isMobile && styles.mobileContainer]} edges={['top', 'left', 'right']}>
      {!responsive.isMobile && (
        <ResponsiveNavigation items={navigationItems} baseRoute="/admin" logo="construct" />
      )}

      <View style={styles.contentContainer}>
        <View style={styles.stackContainer}>
          <Stack screenOptions={{ 
            headerShown: false, 
            animation: 'none',
            gestureEnabled: false,
          }}>
            <Stack.Screen name="index" options={{ animation: 'none' }} />
            <Stack.Screen name="create" options={{ animation: 'none' }} />
            <Stack.Screen name="social/index" options={{ animation: 'none' }} />
            <Stack.Screen name="social/[resource]" options={{ animation: 'none' }} />
            <Stack.Screen name="game" options={{ animation: 'none' }} />
            <Stack.Screen name="more" options={{ animation: 'none'}} />
          </Stack>
        </View>
      </View>

      {responsive.isMobile && (
        <ResponsiveNavigation items={navigationItems} baseRoute="/admin" logo="construct" />
      )}
    </SafeAreaView>
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
