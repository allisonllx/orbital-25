import { useLocalSearchParams, useNavigation } from "expo-router";
import Constants from 'expo-constants';
import { useCallback, useState, useEffect, useLayoutEffect, useRef } from 'react';
import { Alert, AppState, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { ChatHeader } from "@/components/ChatHeader";
import { ChatMessages } from "@/components/ChatMessages";
import { ChatInput } from "@/components/ChatInput";
import { User, Message } from "@/types/types";
import { socket } from '@/app/index';

type Props = {
    userId: number
};

export function ChatRoomScreen({ userId }: Props) {
    const [loading, setLoading] = useState(false);
    // const [user, setUser] = useState<User | null>(null);
    const [partner, setPartner] = useState<User | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const { roomId } = useLocalSearchParams<{ roomId: string }>();
    
    const rawHost = Constants.expoConfig?.extra?.EXPRESS_HOST_URL ?? 'http://localhost:3000';
    const host =
        Platform.OS === 'android'
        ? rawHost.replace('localhost', '10.0.2.2')
        : rawHost;

    const navigation = useNavigation();

    // track when user opens the chat
    useEffect(() => {
        if (userId && partner) {
          socket.emit('open-chat', { senderId: partner.id, receiverId: userId }); 
          socket.emit('join-room', roomId);
        }
      }, [roomId, userId, partner]);

    // update last seen on disconnect or background
    useEffect(() => {
        const subscription = AppState.addEventListener('change', (state) => {
          if (state !== 'active' && userId) {
            socket.emit('update-last-seen', { userId });
          }
        });
      
        return () => {
          subscription.remove();
        };
      }, [userId]);

    // handle fetch messages logic
    const fetchMessages = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${host}/chats/rooms/${roomId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            const data = await res.json();

            if (res.ok) {
                // data is the array of messages
                setMessages(data || []);
              } else {
                Alert.alert('Error', data.error || 'Failed to fetch messages');
              }
        } catch (err) {
              console.error(err);
              Alert.alert('Error', 'Unable to fetch messages');
        } finally {
              setLoading(false);
        }
    }

    // handle fetch user logic (for partner)
    const fetchUser = async (user_id: number) => {
        try {
            const res = await fetch(`${host}/users/${user_id}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            const data = await res.json();

            if (res.ok) {
                // setUser(data);
                setPartner(data);
              } else {
                Alert.alert('Error', data.error || 'Failed to fetch messages');
              }
        } catch (err) {
              console.error(err);
              Alert.alert('Error', 'Unable to fetch messages');
        }
    }

    // send message
    const sendMessage = async (text: string) => {
        const message: Message = {
          room_id: roomId,
          sender_id: userId,
          receiver_id: partnerId,
          content: text,
          created_at: new Date().toISOString(),
          is_read: false
        };
      
        // emit over WebSocket
        // socket.emit('send-message', message);
      
        // add to local state
        setMessages(prev => [...prev, message]);
      
        // send to backend to persist (internally handles WebSocket emit)
        try {
          await fetch(`${host}/chats/rooms/${roomId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                sender_id: message.sender_id,
                receiver_id: message.receiver_id,
                content: message.content,
            })
          });
        } catch (err) {
          console.error('Failed to persist message:', err);
        }
      };

    // receive message (socket listener remains active even after one-time trigger of useEffect)
    useEffect(() => {
        const handler = (msg: Message) => {
            if (msg.room_id === roomId) {
              setMessages(prev => [...prev, msg]);
            }
          };
        
        socket.on('receive_message', handler);
      
        return () => {
          socket.off('receive_message', handler);
        };
      }, [roomId]);

    const getPartnerId = (roomId: string, userId: number) => {
        const [id1, id2] = roomId.split("_").map(Number);
        if (id1 == userId) return id2;
        if (id2 == userId) return id1;
        return -1; // indicates invalid id
    }

    const partnerId = getPartnerId(roomId, userId);

    useLayoutEffect(() => {
        const chatPartnerName = partner?.name;
        navigation.setOptions({ title: chatPartnerName });
      }, [navigation, roomId]);

    // reload messages every time the user navigates back to the chat screen
    useFocusEffect(
        useCallback(() => {
            fetchUser(partnerId);
            fetchMessages();
        }, [])
    )

    // TODO: modify the design, also consider rendering only when messages are fetched, otherwise show some loading page
    return (
        <ThemedView>
            {loading || !partner
             ? <ThemedText>Loading Messages ...</ThemedText>
             : (<ThemedView>
                    <ChatHeader name={partner.name} lastSeen={partner.last_seen} />
                    <ChatMessages messages={messages} currentUserId={userId} chatPartnerId={partnerId} />
                    <ChatInput onSend={sendMessage}/>
                </ThemedView>
               )
            }
        </ThemedView>
    )
}