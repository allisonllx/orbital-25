import { Stack } from 'expo-router';

export default function ChatLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Chats',
          headerTitleAlign: 'center',
        }}
      />
      <Stack.Screen
        name="[roomId]"
        options={{
          title: 'Chat',
          headerBackTitle: 'Back',
          headerTitleAlign: 'center',
        }}
      />
    </Stack>
  );
}
