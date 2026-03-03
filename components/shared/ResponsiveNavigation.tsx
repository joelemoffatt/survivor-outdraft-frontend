import { View, ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useSegments, useRouter } from 'expo-router';
import { useResponsive, Colors, Spacing } from '../../constants/theme';
import Ionicons from '@expo/vector-icons/Ionicons';

export interface NavigationItem {
  name: string;
  label: string;
  href: string;
  icon: string;
}

interface ResponsiveNavigationProps {
  items: NavigationItem[];
  baseRoute: string;
  logo?: string;
}

export function ResponsiveNavigation({
  items,
  baseRoute,
  logo = 'flag',
}: ResponsiveNavigationProps) {
  const segments = useSegments();
  const router = useRouter();
  const responsive = useResponsive();

  const currentScreen = segments[segments.length - 1] || 'index';

  const renderMobileNavItem = (item: NavigationItem) => (
    <TouchableOpacity
      key={item.name}
      style={[
        styles.mobileNavItem,
        currentScreen === item.name && styles.navItemActive,
      ]}
      onPress={() => router.push(item.href)}
    >
      <Ionicons
        name={item.icon as keyof typeof Ionicons.glyphMap}
        size={24}
        color={currentScreen === item.name ? '#fff' : '#ccc'}
        style={styles.mobileIcon}
      />
      <Text style={[styles.mobileLabel, currentScreen === item.name && styles.navItemTextActive]}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  const renderDesktopNavItem = (item: NavigationItem) => (
    <TouchableOpacity
      key={item.name}
      style={[
        styles.desktopNavItem,
        currentScreen === item.name && styles.navItemActive,
      ]}
      onPress={() => router.push(item.href)}
    >
      <Ionicons
        name={item.icon as keyof typeof Ionicons.glyphMap}
        size={28}
        color={currentScreen === item.name ? '#fff' : '#ccc'}
      />
    </TouchableOpacity>
  );

  if (responsive.isMobile) {
    // Bottom navigation bar for mobile
    return (
      <View style={styles.mobileNavBar}>
        {items.map(renderMobileNavItem)}
      </View>
    );
  } else {
    // Skinny sidebar for tablet and desktop
    return (
      <ScrollView style={styles.sidebar}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Ionicons name={logo as keyof typeof Ionicons.glyphMap} size={32} color="#fff" />
        </View>

        {/* Navigation Items */}
        <View style={styles.navItemsContainer}>
          {items.map(renderDesktopNavItem)}
        </View>
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  // Skinny Sidebar
  sidebar: {
    width: 70,
    backgroundColor: '#2c3e50',
    borderRightWidth: 1,
    borderRightColor: '#34495e',
    paddingVertical: Spacing.md,
    flexGrow: 0,
  },

  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.md,
  },

  navItemsContainer: {
    alignItems: 'center',
    gap: Spacing.md,
  },

  desktopNavItem: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: 'transparent',
  },

  navItemActive: {
    backgroundColor: Colors.primary,
  },

  // Mobile Bottom Navigation
  mobileNavBar: {
    flexDirection: 'row',
    backgroundColor: '#2c3e50',
    borderTopWidth: 1,
    borderTopColor: '#34495e',
    paddingBottom: 0,
  },

  mobileNavItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 3,
    borderTopColor: 'transparent',
  },

  mobileIcon: {
    marginBottom: 4,
  },

  mobileLabel: {
    fontSize: 10,
    color: '#ccc',
    fontWeight: '500',
  },

  navItemText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },

  navItemTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
