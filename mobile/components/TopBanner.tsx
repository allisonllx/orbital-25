import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import Logo from '@/assets/images/NUSeek logo.png';

export function TopBanner() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Image source={Logo} style={styles.logo} resizeMode="contain" />

      <TouchableOpacity onPress={() => router.push('/(chat)/index')}>
        <Ionicons name="chatbubble-ellipses-outline" size={24} color="#333" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 60,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  logo: {
    width: 120,
    height: 40,
  },
});
