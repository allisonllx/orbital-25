import { useEffect, useState } from 'react';
import { ScrollView, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { ChatPreviewCard } from '@/components/ChatPreviewCard';
import { ThemedText } from '@/components/ThemedText';
import { ChatRoom } from '@/types/types';
import { useAuth } from '@/hooks/AuthContext';

type PartnerInfo = {
  id: number;
  name: string;
};

type MessageMap = Record<number, { content: string, created_at: string }>;

export function ChatListScreen() {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [partners, setPartners] = useState<Record<string, PartnerInfo>>({});
  const [lastMessages, setLastMessages] = useState<MessageMap>({});
  const { user } = useAuth();
  if (!user) return (<ThemedText>Loading ...</ThemedText>);
  const userId = user.id;

  const router = useRouter();
  const rawHost = Constants.expoConfig?.extra?.EXPRESS_HOST_URL ?? 'http://localhost:3000';
  const host = Platform.OS === 'android' ? rawHost.replace('localhost', '10.0.2.2') : rawHost;

  const getPartnerId = (roomId: string, userId: number) => {
    const [id1, id2] = roomId.split('_').map(Number);
    return id1 === userId ? id2 : id1;
  };

  const fetchChatRooms = async () => {
    try {
      const res = await fetch(`${host}/chats/rooms/users/${userId}`);
      const data: ChatRoom[] = await res.json();
      if (res.ok) {
        setRooms(data);

        // Fetch all partner names
        const partnerIds = data.map(r => getPartnerId(r.room_id, userId));
        const uniqueIds = [...new Set(partnerIds)];
        const fetchedPartners: Record<string, PartnerInfo> = {};

        await Promise.all(
          uniqueIds.map(async (pid) => {
            const res = await fetch(`${host}/users/${pid}`);
            const user = await res.json();
            if (res.ok) fetchedPartners[pid] = { id: pid, name: user.name };
          })
        );

        setPartners(fetchedPartners);

         // Fetch last messages
        const messageMap: MessageMap = {};
        await Promise.all(
        data.map(async ({ last_message_id }) => {
            if (!last_message_id) return;
            const res = await fetch(`${host}/messages/${last_message_id}`);
            const msg = await res.json();
            if (res.ok) {
            messageMap[last_message_id] = {
                content: msg.content,
                created_at: msg.created_at,
            };
            }
        })
        );

        setLastMessages(messageMap);
      } else {
        Alert.alert('Error', 'Failed to load chat rooms');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Could not fetch chat rooms');
    }
  };

  useEffect(() => {
    fetchChatRooms();
  }, []);

  return (
    <ScrollView>
      {rooms.map(({ room_id, last_message_id }) => {
        const partnerId = getPartnerId(room_id, userId);
        const partner = partners[partnerId];
        const msg = lastMessages[last_message_id];

        return (
          <ChatPreviewCard
            key={room_id}
            name={partner?.name || 'Unknown'}
            lastMessage={msg.content}
            timestamp={formatTimestamp(msg.created_at)}
            onPress={() => router.push(`/chat/${room_id}`)}
          />
        );
      })}
    </ScrollView>
  );
}

// Optional: tweak this or use date-fns
function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
