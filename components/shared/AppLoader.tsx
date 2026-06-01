import { Image, StyleSheet, Text, View } from 'react-native';
import { Colors, FontSizes } from '../../constants/theme';

const icon = require('../../assets/icon.png');

export default function AppLoader() {
  return (
    <View style={styles.container}>
      <Image source={icon} style={styles.icon} />
      <Text style={styles.label}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.secondaryBackground,
  },
  icon: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
  },
  label: {
    marginTop: 16,
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
  },
});
