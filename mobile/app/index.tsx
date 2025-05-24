import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/AuthContext';

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
      router.replace('./(auth)/login'); 
    }
  }, [isReady, user]);

  return null; // or a spinner
}