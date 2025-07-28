import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/AuthContext';
import { io } from 'socket.io-client';
import { Platform } from 'react-native';
import { API_HOST as rawHost } from '@/constants/api';

let httpHost = rawHost;
if (Platform.OS === 'android' && rawHost.includes('localhost')) {
  httpHost = rawHost.replace('localhost', '10.0.2.2');
}

// Derive WebSocket URL: http → ws, https → wss
const wsHost = httpHost.replace(/^http(s?):/, 'ws$1:');
export const socket = io(wsHost, {
  transports: ['websocket'], 
  forceNew: true,
  autoConnect: true,
  ackTimeout: 10000,
  reconnectionAttempts: 3,
});

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