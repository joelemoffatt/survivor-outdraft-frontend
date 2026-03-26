import { Stack } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useResponsive, Colors } from '../../constants/theme';
import { ResponsiveNavigation } from '../../components/shared/ResponsiveNavigation';
import { useAuth } from '../../contexts/AuthContext';
import { getNavigationConfig } from '../../constants/navigation';
import BackButton from '../../components/shared/BackButton';

export default function SharedLayout() {
  const responsive = useResponsive();
  const { user, isAdminView } = useAuth();
  const navigationConfig = getNavigationConfig(Boolean(user?.isAdmin && isAdminView));

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
            <Stack.Screen name="more" options={{ animation: 'none' }} />
            <Stack.Screen
              name="profile/edit"
              options={{
                animation: 'none',
                headerShown: true,
                title: 'Edit Profile',
                headerTitleAlign: 'left',
                headerTitleStyle: { fontSize: 28, fontWeight: 'bold' },
                headerLeft: () => <BackButton fallbackRoute="/more" />,
              }}
            />
            <Stack.Screen name="settings" options={{ animation: 'none' }} />
          </Stack>
        </View>
      </View>

      {responsive.isMobile && (
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
