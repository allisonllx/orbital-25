import AsyncStorage from '@react-native-async-storage/async-storage';

export async function authFetch(url: string, options: any = {}) {
  const token = await AsyncStorage.getItem('token');

  const headers = {
    ...(options.headers || {}),
    Authorization: token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
  };

  return fetch(url, {
    ...options,
    headers,
  });
}