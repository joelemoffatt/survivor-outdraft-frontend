import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useResponsive } from '../../constants/theme';

export default function PlayerHome() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const responsive = useResponsive();

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Survivor OutDraft</Text>
      <Text style={styles.subtitle}>Dashboard</Text>
      
      {user && (
        <Text style={styles.welcome}>Welcome, {user.username}!</Text>
      )}

      {user?.isAdmin && (
        <Link href="/admin" asChild>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Go to Admin Dashboard</Text>
          </TouchableOpacity>
        </Link>
      )}

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
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 20,
    color: '#666',
    marginBottom: 10,
  },
  welcome: {
    fontSize: 18,
    color: '#f4511e',
    marginBottom: 20,
    fontWeight: '600',
  },
  infoContainer: {
    marginBottom: 30,
    alignItems: 'center',
    gap: 8,
  },
  info: {
    fontSize: 14,
    color: '#999',
  },
  button: {
    backgroundColor: '#f4511e',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    marginTop: 10,
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
