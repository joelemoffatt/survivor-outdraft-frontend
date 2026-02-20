import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Dashboard</Text>
      <Text style={styles.subtitle}>Manage your Survivor game</Text>
      
      {user && (
        <Text style={styles.welcome}>Welcome, {user.username}!</Text>
      )}
      
      <Text style={styles.platform}>
        Platform: {Platform.OS}
      </Text>
      {Platform.OS !== 'web' && (
        <Text style={styles.warning}>
          Admin dashboard is optimized for web
        </Text>
      )}

      {/* Navigation back to Player view */}
      <Link href="/" asChild>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Go to Player View</Text>
        </TouchableOpacity>
      </Link>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ecf0f1',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2c3e50',
  },
  subtitle: {
    fontSize: 20,
    color: '#7f8c8d',
    marginBottom: 20,
  },
  platform: {
    fontSize: 14,
    color: '#95a5a6',
    marginBottom: 10,
  },
  warning: {
    fontSize: 14,
    color: '#e74c3c',
    marginTop: 20,
    textAlign: 'center',
  },
  welcome: {
    fontSize: 18,
    color: '#2c3e50',
    marginBottom: 20,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#2c3e50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    marginTop: 30,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  logoutButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
