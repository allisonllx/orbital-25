import Logo from '@/assets/images/NUSeek logo.png';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/hooks/AuthContext';
import { useRouter, Link } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { API_HOST as host } from '@/constants/api';

export default function LoginScreen() {
    const { login } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        // handle login logic
        setLoading(true);
        console.log(host);
        try {
            const res = await fetch(`${host}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim(), password })
            });
            // const data = await res.json();
            // const user = data.content;
            // Read response as text first so we can inspect it
            const raw = await res.text();
            console.log('⇠ login status', res.status);
            console.log('⇠ login body  ', raw.substring(0, 200));   // log first 200 chars

            // Only parse if the server actually sent JSON
            let data: any = null;
            if (res.headers.get('content-type')?.includes('application/json')) {
                data = JSON.parse(raw);
            }

            // if (res.ok && user) {
            if (res.ok && data?.token && data?.content) {
                // login(user);
                await login(data.content, data.token);
                router.replace('../(tabs)');
            } else {
                Alert.alert('Login failed', 'Invalid credentials');
            }
        } catch (err) {
            console.error(err);
            if (err instanceof Error) console.log('Fetch failed:', err.message, err); 
            Alert.alert('Error', 'Unable to login');
        } finally {
            setLoading(false);
        }
        }
        

    return (
        <ThemedView style={styles.container}>
            {/* Logo Only */}
            <Image source={Logo} style={styles.logo} resizeMode="contain" />

            {/* Email Input */}
            <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                editable={!loading}
            />

            {/* Password Input */}
            <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#999"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                editable={!loading}
            />

            {/* Forgot Password */}
            <TouchableOpacity 
                style={styles.forgotContainer}
                onPress={() => router.push('/(auth)/(reset)')}
            >
                <ThemedText style={styles.forgot}>Forgot Password?</ThemedText>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity style={styles.button} onPress={handleLogin}>
                <ThemedText style={styles.buttonText}>Log in</ThemedText>
            </TouchableOpacity>

            {/* Sign Up */}
            <View style={styles.signupRow}>
                <ThemedText style={styles.signupText}>Don't have an account? </ThemedText>
                <TouchableOpacity onPress={() => router.push('./register')}>
                    <ThemedText style={styles.signupLink}>Sign up</ThemedText>
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
        marginBottom: 10,
    },
    input: {
        width: '100%',
        height: 50,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 10,
        paddingHorizontal: 15,
        marginBottom: 20,
        fontSize: 16,
        backgroundColor: '#FAFAFA',
    },
    forgotContainer: {
        alignSelf: 'flex-end',
        marginBottom: 30,
    },
    forgot: {
        color: '#0055A5',
        fontSize: 14,
    },
    button: {
        width: '100%',
        backgroundColor: '#002366',
        height: 50,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 30,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    signupRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
    },
    signupText: {
        color: '#666666',
        fontSize: 14,
    },
    signupLink: {
        color: '#0055A5',
        fontSize: 14,
        fontWeight: '600',
    },
});