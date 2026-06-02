import { Stack, useSegments } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useResponsive, Colors } from '../../constants/theme';
import { ResponsiveNavigation } from '../../components/shared/ResponsiveNavigation';
import { PlayerHeader } from '../../components/shared/PlayerHeader';
import { useAuth } from '../../contexts/AuthContext';
import { getNavigationConfig } from '../../constants/navigation';
import { shouldShowPlayerMobileMenu } from '../../constants/playerMenuVisibility';
import BackButton from '../../components/shared/BackButton';

const MAIN_SCREENS = new Set(['(player)', 'group', 'team']);

export default function PlayerLayout() {
  const responsive = useResponsive();
  const { user, isAdminView } = useAuth();
  const segments = useSegments();
  const navigationConfig = getNavigationConfig(Boolean(user?.isAdmin && isAdminView));
  const showMobileBottomNavigation =
    responsive.isMobile && shouldShowPlayerMobileMenu(segments);
  const currentScreen = segments[segments.length - 1];
  const showGroupBar = MAIN_SCREENS.has(currentScreen);

  return (
    <SafeAreaView style={[styles.container, responsive.isMobile && styles.mobileContainer, responsive.isMobile && styles.mobileBackground]} edges={['left', 'right']}>
      {!responsive.isMobile && (
        <ResponsiveNavigation items={navigationConfig.items} baseRoute={navigationConfig.baseRoute} logo={navigationConfig.logo} />
      )}

      <View style={styles.contentContainer}>
        {showGroupBar && <PlayerHeader />}
        <View style={styles.stackContainer}>
          <Stack screenOptions={{ 
            headerShown: false, 
            animation: 'none',
            gestureEnabled: false,
          }}>
            <Stack.Screen name="index" options={{ animation: 'none' }} />
            <Stack.Screen name="history" options={{ animation: 'none' }} />
            <Stack.Screen name="team" options={{ animation: 'none' }} />
            <Stack.Screen name="group" options={{ animation: 'none' }} />
            <Stack.Screen name="groups" options={{ animation: 'none' }} />
            <Stack.Screen
              name="notifications"
              options={{
                animation: 'none',
                headerShown: true,
                title: 'Notifications',
                headerTitleAlign: 'left',
                headerTitleStyle: { fontSize: 28, fontWeight: 'bold' },
                headerLeft: () => <BackButton fallbackRoute="/(player)/" />,
              }}
            />
            <Stack.Screen
              name="teams/[teamId]"
              options={{
                animation: 'none',
                headerShown: true,
                title: 'Team',
                headerTitleAlign: 'left',
                headerTitleStyle: { fontSize: 28, fontWeight: 'bold' },
                headerLeft: () => <BackButton fallbackRoute="/(player)/group" />,
              }}
            />
          </Stack>
        </View>
      </View>

      {showMobileBottomNavigation && (
        <ResponsiveNavigation items={navigationConfig.items} baseRoute={navigationConfig.baseRoute} logo={navigationConfig.logo} />
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
  mobileBackground: {
    backgroundColor: Colors.primary,
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
