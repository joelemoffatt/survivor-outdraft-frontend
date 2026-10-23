import { View, StyleSheet } from 'react-native';
import AppLoader from '../../../components/shared/AppLoader';
import { Colors } from '../../../constants/theme';

/**
 * Dev-only preview page for the AppLoader animation.
 * Reachable from More → Developer → Loader Preview when SHOW_DEV_FEATURES is true.
 */
export default function LoaderPreview() {
  return (
    <View style={styles.container}>
      <AppLoader />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.secondaryBackground,
  },
});
