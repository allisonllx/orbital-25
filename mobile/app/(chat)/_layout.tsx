import { Stack, useRouter } from 'expo-router';
import { TouchableOpacity, Text } from 'react-native'; 

export default function ChatLayout() {

  const router = useRouter();

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Chats',
          headerTitleAlign: 'center',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.replace('/(tabs)')} >
              <Text style={{ color: '#007aff', fontSize: 16, fontWeight:'500' }}>{'< Back'}</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        name="[roomId]"
        options={{
          headerTitle: 'Chat',
          headerTitleAlign: 'center',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ paddingLeft: 10 }}>
               <Text style={{ color: '#007aff', fontSize: 16, fontWeight:'500' }}>{'< Back'}</Text>
            </TouchableOpacity>
          ),
        }}
      />
    </Stack>
  );
}
