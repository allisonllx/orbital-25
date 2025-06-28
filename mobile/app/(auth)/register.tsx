import Logo from '@/assets/images/NUSeek logo.png';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/hooks/AuthContext';
import { API_HOST as rawHost } from '@/constants/api';
// import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useCallback, useState, } from 'react';
import {
    ActivityIndicator, Alert, Image, Platform, StyleSheet, TextInput,
    TouchableOpacity, View,
} from 'react-native';

export default function RegisterScreen() {
  const { login } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const host =
    Platform.OS === 'android'
      ? rawHost.replace('localhost', '10.0.2.2')
      : rawHost;

  const validate = useCallback(() => {
    if (!name.trim() || !email.trim() || !password || !confirm) {
      Alert.alert('Missing fields', 'Please fill out every field.');
      return false;
    }

    // Enforce NUS student email
    // const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const emailRe = /^e\d{7}@u.nus.edu$/;
    if (!emailRe.test(email)) {
      Alert.alert('Invalid NUS Email', 'Please enter a valid NUS email address.');
      return false;
    }

    if (password !== confirm) {
      Alert.alert('Password Mismatch', 'Passwords do not match.');
      return false;
    }

    return true;
  }, [name, email, password, confirm]);

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);

    try {
      const res = await fetch(`${host}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
        }),
      });

      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload.error || payload.message || 'Registration failed');
      }

      if (payload.content) {
        login(payload.content);
        router.replace('../(tabs)');
      } else {
        Alert.alert('Success', 'Account created! Please log in.');
        router.replace('/(auth)/login');
      }
    } catch (err: any) {
      console.error('Register error:', err);
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Image source={Logo} style={styles.logo} resizeMode="contain" />

      <TextInput
        style={styles.input}
        placeholder="Name"
        placeholderTextColor="#999"
        autoCapitalize="words"
        value={name}
        onChangeText={setName}
        editable={!loading}
      />

      <TextInput
        style={styles.input}
        placeholder="NUS Email, e.g. e1234567@u.nus.edu"
        placeholderTextColor="#999"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
        editable={!loading}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#999"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        editable={!loading}
      />

      <TextInput
        style={styles.input}
        placeholder="Confirm your password"
        placeholderTextColor="#999"
        secureTextEntry
        value={confirm}
        onChangeText={setConfirm}
        editable={!loading}
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleRegister}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#FFF" />
        ) : (
          <ThemedText style={styles.buttonText}>Register</ThemedText>
        )}
      </TouchableOpacity>

      <View style={styles.signupRow}>
        <ThemedText style={styles.signupText}>Already have an account? </ThemedText>
        <TouchableOpacity onPress={() => router.replace('/(auth)/login')} disabled={loading}>
          <ThemedText style={styles.signupLink}>Log in</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 40,
    justifyContent: 'center',
  },
  logo: {
    width: 300,
    height: 300,
    alignSelf: 'center',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
  },
  button: {
    width: '100%',
    height: 50,
    borderRadius: 8,
    backgroundColor: '#002366',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 25,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  signupText: {
    color: '#666',
    fontSize: 14,
  },
  signupLink: {
    color: '#0055A5',
    fontSize: 14,
    fontWeight: '600',
  },
});