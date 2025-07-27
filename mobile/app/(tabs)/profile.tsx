import React, { useState } from 'react';
import { View, Text, TextInput, Image, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { authFetch } from '@/utils/authFetch';
import { API_HOST as host } from '@/constants/api';
import { useAuth } from '@/hooks/AuthContext';
import { ThemedText } from '@/components/ThemedText';
import logo from '@/assets/images/NUSeek logo.png';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { user, refreshUser, logout } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const handleSave = async () => {
    try {
      setIsSaving(true);

      if (!user) {
        Alert.alert('Error', 'User not found.');
        setIsSaving(false);
        return;
      }

      if (name !== user.name) {
        await authFetch(`${host}/users/update-name/${user.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name }),
        });
      }

      if (password && password === confirmPassword) {
        await authFetch(`${host}/users/update-password/${user.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        });
      } else if (password && password !== confirmPassword) {
        Alert.alert('Error', 'Passwords do not match.');
        setIsSaving(false);
        return;
      }

      await refreshUser();
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    router.replace('/login');
  };

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image source={logo} style={styles.logo} />

      <View style={styles.infoRow}>
        <ThemedText style={styles.label}>Name</ThemedText>
      </View>
      <TextInput style={styles.input} value={name} onChangeText={setName} />

      <View style={styles.infoRow}>
        <ThemedText style={styles.label}>Email</ThemedText>
      </View>
      <Text style={styles.email}>{user.email}</Text>

      <ThemedText style={styles.label}>Change password</ThemedText>
      <TextInput
        style={styles.input}
        placeholder="New password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm your password"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <TouchableOpacity onPress={handleSave} style={styles.saveButton} disabled={isSaving}>
        <Text style={styles.saveText}>{isSaving ? 'Saving...' : 'Save'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: 'white',
    flex: 1,
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 140,
    height: 140,
    resizeMode: 'contain',
    marginVertical: 10,
  },
  label: {
    fontWeight: '600',
    alignSelf: 'flex-start',
    marginBottom: 4,
    fontSize: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    width: '100%',
    marginBottom: 10,
  },
  email: {
    alignSelf: 'flex-start',
    marginBottom: 20,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#004AAD',
    paddingVertical: 10,
    paddingHorizontal: 44,
    borderRadius: 6,
    marginTop: 10,
  },
  saveText: {
    color: 'white',
    fontWeight: '600',
  },
  signOutButton: {
    backgroundColor: '#ff4d4d',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 6,
    marginTop: 30,
  },
  signOutText: {
    color: 'white',
    fontWeight: '600',
  },
});
