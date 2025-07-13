import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import { User } from '@/types/types';
import { API_HOST as host } from '@/constants/api';

interface AuthContextType {
  user: User | null;
  login: (userData: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const loadToken = async () => {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        try {
          const decoded: any = jwtDecode(token);

          // fetch user only on startup/token restore
          const res = await fetch(`${host}/users/${decoded.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const user = await res.json();
            setUser(user);
          } else {
            await AsyncStorage.removeItem('token');
          }
        } catch (err) {
          console.error('Invalid token:', err);
          await AsyncStorage.removeItem('token');
        }
      }
    };
    loadToken();
  }, []);

  const login = async (userData: User, token: string) => {
    await AsyncStorage.setItem('token', token);
    setUser(userData);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
