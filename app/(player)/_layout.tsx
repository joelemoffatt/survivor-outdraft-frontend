import { Stack, useSegments } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useResponsive, Colors } from '../../constants/theme';
import { ResponsiveNavigation } from '../../components/shared/ResponsiveNavigation';
import { useAuth } from '../../contexts/AuthContext';
import { getNavigationConfig } from '../../constants/navigation';
import { shouldShowPlayerMobileMenu } from '../../constants/playerMenuVisibility';
import BackButton from '../../components/shared/BackButton';

export default function PlayerLayout() {
  const responsive = useResponsive();
  const { user, isAdminView } = useAuth();
  const segments = useSegments();
  const navigationConfig = getNavigationConfig(Boolean(user?.isAdmin && isAdminView));
  const showMobileBottomNavigation =
    responsive.isMobile && shouldShowPlayerMobileMenu(segments);

  return (
    <SafeAreaView style={[styles.container, responsive.isMobile && styles.mobileContainer]} edges={['top', 'left', 'right']}>
      {!responsive.isMobile && (
        <ResponsiveNavigation items={navigationConfig.items} baseRoute={navigationConfig.baseRoute} logo={navigationConfig.logo} />
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
            <Stack.Screen name="group" options={{ animation: 'none' }} />
            <Stack.Screen name="groups" options={{ animation: 'none' }} />
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
  contentContainer: {
    flex: 1,
    flexDirection: 'column',
    overflow: 'visible',
  },
  stackContainer: {
    flex: 1,
  },
});
