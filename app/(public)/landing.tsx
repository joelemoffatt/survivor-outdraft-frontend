import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Link } from 'expo-router';

export default function Landing() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Survivor OutDraft</Text>
        <Text style={styles.subtitle}>
          Play along with your favorite reality show
        </Text>
        
        <Link href="/login" asChild>
          <TouchableOpacity style={styles.loginButton}>
            <Text style={styles.loginButtonText}>Login to Play</Text>
          </TouchableOpacity>
        </Link>

        <Link href="/signup" asChild>
          <TouchableOpacity style={styles.signupButton}>
            <Text style={styles.signupButtonText}>Create Account</Text>
          </TouchableOpacity>
        </Link>

        <Text style={styles.footerText}>
          Join your game night crew and draft your favorite castaways
        </Text>
      </View>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#f4511e',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 50,
    textAlign: 'center',
    maxWidth: 400,
  },
  loginButton: {
    backgroundColor: '#f4511e',
    paddingHorizontal: 50,
    paddingVertical: 18,
    borderRadius: 30,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  signupButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 50,
    paddingVertical: 18,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#f4511e',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  signupButtonText: {
    color: '#f4511e',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footerText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    maxWidth: 300,
  },
});
