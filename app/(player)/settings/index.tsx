import { View, Text, StyleSheet } from 'react-native';
import { useResponsive } from '../../../constants/theme';
import { useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';

export default function SettingsScreen() {
  const responsive = useResponsive();
  const router = useRouter();

  const handleLogout = () => {
    // Add your logout logic here (e.g., clear auth, redirect)
    alert('Logged out!');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <View style={styles.menuCol}>
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(player)/settings/general')}>
          <Text style={styles.menuText}>General</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(player)/settings/groups')}>
          <Text style={styles.menuText}>Groups</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  menuCol: {
    width: '100%',
    alignItems: 'flex-start',
  },
  menuHeader: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 8,
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
    width: '100%',
  },
  menuText: {
    fontSize: 16,
    color: '#333',
  },
  logoutText: {
    fontSize: 16,
    color: '#d32f2f',
    fontWeight: 'bold',
  },
});
