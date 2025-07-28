import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { API_HOST as host } from '@/constants/api';
import logo from '@/assets/images/NUSeek logo.png';

export default function RequestResetScreen() {
  const [email, setEmail] = useState('');
  const router = useRouter();

  const handleSend = async () => {
    const res = await fetch(`${host}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    });

    if (res.ok) {
      router.push({ pathname: '/(auth)/(reset)/code', params: { email } });
    } else {
      Alert.alert('Error', 'Email not found');
    }
  };

  return (
    <View style={styles.container}>
      <Image source={logo} style={styles.logo} />
      <TextInput placeholder="Enter your email" value={email} onChangeText={setEmail} style={styles.input} />
      <TouchableOpacity onPress={handleSend} style={styles.button}><Text style={styles.buttonText}>Get verification code</Text></TouchableOpacity>
      <Text style={styles.link} onPress={() => router.replace('/(auth)/login')}>Back to Login</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 24, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#fff' 
  },
  logo: { 
    width: 200, 
    height: 200, 
    marginBottom: 1, 
    resizeMode: 'contain' 
  },
  input: { 
    width: '100%', 
    borderWidth: 1, 
    borderColor: '#ccc', 
    borderRadius: 6, 
    padding: 12, 
    marginBottom: 16 
  },
  button: { 
    backgroundColor: '#004AAD', 
    paddingVertical: 12, 
    paddingHorizontal: 32, 
    borderRadius: 6 
  },
  buttonText: { 
    color: 'white', 
    fontWeight: '600' 
  },
  link: { 
    marginTop: 16, 
    color: '#004AAD', 
    textDecorationLine: 'underline' 
  },
});
