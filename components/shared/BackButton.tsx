import { TouchableOpacity, Text, View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';

interface BackButtonProps {
  /**
   * Route to navigate to when there is no screen to go back to.
   * If omitted and canGoBack() is false, nothing happens.
   */
  fallbackRoute?: string;
  /** Optional label shown next to the arrow (e.g. "Back", "More") */
  label?: string;
  /** Extra styles applied to the touchable wrapper */
  style?: StyleProp<ViewStyle>;
}

/**
 * Shared back button. Calls router.back() when a previous screen exists,
 * otherwise navigates to `fallbackRoute` via router.replace().
 * Visual style matches the history-screen arrow (orange ← bold).
 */
export default function BackButton({ fallbackRoute, label, style }: BackButtonProps) {
  const router = useRouter();

  const handlePress = () => {
    if (router.canGoBack()) {
      router.back();
    } else if (fallbackRoute) {
      router.replace(fallbackRoute as any);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={label ?? 'Go back'}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Text style={styles.arrow}>←</Text>
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 8,
    paddingVertical: 4,
  },
  arrow: {
    fontSize: 28,
    color: '#f4511e',
    fontWeight: 'bold',
    lineHeight: 32,
  },
  label: {
    fontSize: 16,
    color: '#f4511e',
    fontWeight: '600',
    marginLeft: 4,
  },
});
