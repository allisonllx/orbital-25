import { useLocalSearchParams } from "expo-router";
import Constants from 'expo-constants';
import { useCallback, useState, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { io } from 'socket.io-client';
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { ChatHeader } from "@/components/ChatHeader";
import { ChatMessages } from "@/components/ChatMessages";
import { ChatInput } from "@/components/ChatInput";
import { User, Message } from "@/types/types";

type Props = {
    userId: number
};

export function ChatRoomScreen({ userId }: Props) {
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const { roomId } = useLocalSearchParams<{ roomId: string }>();

    const rawHost = Constants.expoConfig?.extra?.EXPRESS_HOST_URL ?? 'http://localhost:3000';
    const host =
        Platform.OS === 'android'
        ? rawHost.replace('localhost', '10.0.2.2')
        : rawHost;
    const socket = io(host);

    const fetchMessages = async () => {
        // handle fetch messages logic
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

    const fetchUser = async () => {
        // handle fetch user logic
        try {
            const res = await fetch(`${host}/users/${userId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            const data = await res.json();

            if (res.ok) {
                setUser(data);
              } else {
                Alert.alert('Error', data.error || 'Failed to fetch messages');
              }
        } catch (err) {
              console.error(err);
              Alert.alert('Error', 'Unable to fetch messages');
        }
    }

    const sendMessage = async (text: string) => {
        const message: Message = {
          room_id: roomId,
          sender_id: userId,
          receiver_id: partnerId,
          content: text,
          created_at: new Date().toISOString(),
          is_read: false
        };
      
        // Emit over WebSocket
        socket.emit('send_message', message);
      
        // Add to local state
        setMessages(prev => [...prev, message]);
      
        // Send to backend to persist
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

    const getPartnerId = (roomId: string, userId: number) => {
        const [id1, id2] = roomId.split("_").map(Number);
        if (id1 == userId) return id2;
        if (id2 == userId) return id1;
        return -1; // indicates invalid id
    }

    const partnerId = getPartnerId(roomId, userId);

    useEffect(() => {
        socket.on('receive_message', (msg) => {
          if (msg.roomId === roomId) {
            setMessages(prev => [...prev, msg]);
          }
        });
      
        return () => {
          socket.off('receive_message');
        };
      }, [roomId]);

    // reloads messages every time the user navigates back to the chat screen
    useFocusEffect(
        useCallback(() => {
            fetchUser();
            fetchMessages();
        }, [])
    )

    // TODO: modify the design, also consider rendering only when messages are fetched, otherwise show some loading page
    return (
        <ThemedView>
            {loading || !user
             ? <ThemedText>Loading Messages ...</ThemedText>
             : (<ThemedView>
                    <ChatHeader name={user.name} lastSeen={user.last_seen} />
                    <ChatMessages messages={messages} currentUserId={userId} chatPartnerId={partnerId} />
                    <ChatInput onSend={sendMessage}/>
                </ThemedView>
               )
            }
        </ThemedView>
    )
}