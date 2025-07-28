import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/hooks/AuthContext';
import { API_HOST as host } from '@/constants/api';
import logo from '@/assets/images/NUSeek logo.png';

export default function CodeVerifyScreen() {
  const [code, setCode] = useState('');
  const { email } = useLocalSearchParams();
  const { login } = useAuth();
  const router = useRouter();

  const handleVerify = async () => {
    console.log('Verifying code for email:', email, 'with code:', code);
    const res = await fetch(`${host}/auth/verify-reset-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code: code.trim() }),
    });

    if (res.ok) {
      const { token, content } = await res.json();
      await AsyncStorage.setItem('token', token);
      await login(content, token);
      router.replace('/(tabs)/home');
    } else {
      Alert.alert('Invalid or expired code');
    }
  };

  return (
    <View style={styles.container}>
      <Image source={logo} style={styles.logo} />
      <TextInput
        placeholder="Enter code"
        value={code}
        onChangeText={setCode}
        style={styles.input}
        keyboardType="number-pad"
      />
      <TouchableOpacity onPress={handleVerify} style={styles.button}>
        <Text style={styles.buttonText}>Confirm</Text>
      </TouchableOpacity>
      <Text style={styles.link} onPress={() => router.replace('/(auth)/login')}>
        Back to Login
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  logo: { 
    width: 240,
    height: 240,
    marginBottom: 32,
    resizeMode: 'contain',
  },
  input: { 
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
  },
  button: { 
    backgroundColor: '#004AAD',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 6,
  },
  buttonText: { 
    color: 'white',
    fontWeight: '600',
  },
  link: { 
    marginTop: 16,
    color: '#004AAD',
    textDecorationLine: 'underline',
  },
});
