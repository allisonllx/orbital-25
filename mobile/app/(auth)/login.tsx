import { useRouter } from 'expo-router';
import { TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useState } from 'react';
import { useAuth } from '@/hooks/AuthContext';
import Constants from 'expo-constants';

export default function LoginScreen() { // TODO: solve this issue
    const { login } = useAuth();
    const router = useRouter();
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // const host = Constants.expoConfig?.extra?.EXPRESS_HOST_URL;
    const host = 'http://localhost:3000';
    console.log('host: ', host);

    const handleLogin = async () => {
        // handle login logic
        try {
            const res = await fetch(`${host}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            const user = data.content;

            if (res.ok && user) {
                login(user);
                router.replace('../(tabs)');
            } else {
                Alert.alert('Login failed', 'Invalid credentials');
            }
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Unable to login');
        }
        }
        

    return (
        <ThemedView style={styles.container}>
            <ThemedView style={styles.titleContainer}>
                <ThemedText type="title">Login</ThemedText>
            </ThemedView>
            <ThemedText>Welcome back to the app</ThemedText>
            <ThemedText type="defaultSemiBold">Email Address</ThemedText>
            <TextInput value={email} onChangeText={setEmail} placeholder={'e1234567@u.nus.edu'} />
            <ThemedText type="defaultSemiBold">Password</ThemedText>
            <TextInput value={password} onChangeText={setPassword} placeholder={'**********'} />
            <TouchableOpacity onPress={handleLogin}>
                <ThemedText>Login</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/+not-found')}>
                <ThemedText type="defaultSemiBold">Create an account</ThemedText>
            </TouchableOpacity>
        </ThemedView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 32,
        gap: 16,
        overflow: 'hidden',
        justifyContent: 'center',
      },
    titleContainer: {
      flexDirection: 'row',
      gap: 8,
    },
});
  