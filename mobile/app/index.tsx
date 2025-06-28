import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/AuthContext';
import { io } from 'socket.io-client';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { API_HOST as rawHost } from '@/constants/api';

const host =
    Platform.OS === 'android'
    ? rawHost.replace('localhost', '10.0.2.2')
    : Platform.OS === 'ios'
    ? Constants.expoConfig?.extra?.SOCKET_HOST 
    : rawHost;
const wsHost = host.replace('http', 'ws');
export const socket = io(wsHost, { ackTimeout: 10000, retries: 3 });

socket.on('connect', () => {
  console.log('WebSocket connected');
})

export default function Index() {
  const router = useRouter();
  const { user } = useAuth();

  const [isReady, setIsReady] = useState(false);

  // defer navigation to next tick
  useEffect(() => {
    const timeout = setTimeout(() => setIsReady(true), 0);
    return () => clearTimeout(timeout);
  }, [])

  useEffect(() => {
    if (!isReady) return;

    // check if user is logged in
    if (user) {
      router.replace("./(tabs)");
    } else {
      router.replace('./(auth)/register'); 
    }
  }, [isReady, user]);

  return null; // or a spinner
}