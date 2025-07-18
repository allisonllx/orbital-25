import { useEffect, useState } from 'react';
import { ScrollView, Alert, Platform, TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { ChatPreviewCard } from '@/components/ChatPreviewCard';
import { ThemedText } from '@/components/ThemedText';
import { ChatRoom } from '@/types/types';
import { useAuth } from '@/hooks/AuthContext';
import { API_HOST as rawHost } from '@/constants/api';
import { authFetch } from '@/utils/authFetch';

type PartnerInfo = {
  id: number;
  name: string;
};

export default function ChatListScreen() {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [partners, setPartners] = useState<Record<string, PartnerInfo>>({});
  const { user } = useAuth();
  if (!user) return (<ThemedText>Loading ...</ThemedText>);
  const userId = user.id;

  const router = useRouter();
  let host = rawHost;
  if (Platform.OS === 'android' && rawHost.includes('localhost')) {
    host = rawHost.replace('localhost', '10.0.2.2');
  }

  const getPartnerId = (roomId: string) => {
    const [a, b] = roomId.split('_').map(Number);
    return a === userId ? b : a;
  };

  const fetchChatRooms = async () => {
    try {
      const res = await authFetch(`${host}/chats/rooms/users/${userId}`);
      const data: ChatRoom[] = await res.json();
      if (!res.ok) throw new Error('Failed to load chat rooms');
      setRooms(data);

      // fetch partner names once
      const ids = [...new Set(data.map(r => getPartnerId(r.room_id)))];
      const fetched: Record<number, PartnerInfo> = {};
      await Promise.all(
        ids.map(async id => {
          const r = await authFetch(`${host}/users/${id}`);
          const u = await r.json();
          if (r.ok) fetched[id] = { id, name: u.name };
        })
      );
      setPartners(fetched);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', String(err));
    }
  };

  useEffect(() => {
    fetchChatRooms();
  }, []);

  return (
    <View style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1 }}>
            {rooms.map(room => {
                const partner = partners[getPartnerId(room.room_id)];
            
                return (
                <ChatPreviewCard
                    key={room.room_id}
                    name={partner?.name || 'Unknown'}
                    lastMessage={room.last_message_content ?? ''}
                    timestamp={room.last_message_time
                        ? formatTimestamp(room.last_message_time)
                        : ''
                    }
                    onPress={() => router.push(`/(chat)/${room.room_id}`)}
                />
                );
            })}
        </ScrollView>
    </View>
  );
}

// may tweak this or use date-fns
function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const styles = StyleSheet.create({
    topBar: {
        height: 100,
        paddingTop: Constants.statusBarHeight,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderColor: '#eee',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        justifyContent: 'flex-start', // align back button to left
      },
      backText: {
        color: '#007aff',
        fontSize: 16,
        fontWeight: '500',
      },
})
