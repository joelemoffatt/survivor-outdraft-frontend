import { Stack } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useResponsive, Colors } from '../../constants/theme';
import { ResponsiveNavigation, NavigationItem } from '../../components/shared/ResponsiveNavigation';
import { useRouter, useSegments } from 'expo-router';

const navigationItems: NavigationItem[] = [
  { name: 'index', label: 'Home', href: '/(player)/', icon: 'home' },
  { name: 'team', label: 'My Team', href: '/(player)/team', icon: 'people' },
  { name: 'more', label: 'More', href: '/(player)/more', icon: 'ellipsis-horizontal' },
];

export default function PlayerLayout() {
  const responsive = useResponsive();

  return (
    <SafeAreaView style={[styles.container, responsive.isMobile && styles.mobileContainer]} edges={['top', 'left', 'right']}>
      {!responsive.isMobile && (
        <ResponsiveNavigation items={navigationItems} baseRoute="/(player)" logo="flag" />
      )}

      <View style={styles.contentContainer}>
        <View style={styles.stackContainer}>
          <Stack screenOptions={{ 
            headerShown: false, 
            animation: 'none',
            gestureEnabled: false,
          }}>
            <Stack.Screen name="index" options={{ animation: 'none' }} />
            <Stack.Screen name="history" options={{ animation: 'none' }} />
            <Stack.Screen name="team" options={{ animation: 'none' }} />
            <Stack.Screen name="more" options={{ animation: 'none' }} />
            <Stack.Screen name="groups" options={{ animation: 'none' }} />
            <Stack.Screen name="profile" options={{ animation: 'none' }} />
            <Stack.Screen name="settings" options={{ animation: 'none' }} />
          </Stack>
        </View>
      </View>

      {responsive.isMobile && (
        <ResponsiveNavigation items={navigationItems} baseRoute="/(player)" logo="flag" />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Colors.background,
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
