import { useLocalSearchParams, useNavigation } from "expo-router";
import Constants from 'expo-constants';
import { useCallback, useState, useEffect, useLayoutEffect } from 'react';
import { Alert, AppState, Platform, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { ChatHeader } from "@/components/ChatHeader";
import { ChatMessages } from "@/components/ChatMessages";
import { ChatInput } from "@/components/ChatInput";
import { User, Message } from "@/types/types";
import { socket } from '@/app/index';
import { useAuth } from "@/hooks/AuthContext";
import { API_HOST as rawHost } from '@/constants/api';

export default function ChatRoomScreen() {
    const [loading, setLoading] = useState(false);
    // const [user, setUser] = useState<User | null>(null);
    const { user } = useAuth();
    if (!user) return (<ThemedText>Loading ...</ThemedText>);
    const userId = user.id;
    const [partner, setPartner] = useState<User | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isOnline, setIsOnline] = useState<boolean>(false);
    const { roomId } = useLocalSearchParams<{ roomId: string }>();
    
    let host = rawHost;
    if (Platform.OS === 'android' && rawHost.includes('localhost')) {
        host = rawHost.replace('localhost', '10.0.2.2');
    }

    const navigation = useNavigation();

    // track when user opens the chat
    useEffect(() => {
        if (userId && partner) {
          socket.emit('open-chat', { senderId: partner.id, receiverId: userId }); 
          socket.emit('join-room', roomId);
          socket.emit('user-online', userId);
        }
      }, [roomId, userId, partner]);

    // update last seen on disconnect or background
    useEffect(() => {
        const subscription = AppState.addEventListener('change', (state) => {
          if (state !== 'active' && userId) {
            socket.emit('user-offline', { userId });
          }
        });
      
        return () => {
          subscription.remove();
        };
      }, [userId]);

    // subscribe to presence updates
    useEffect(() => {
        const handler = ({ userId, status }: { userId: number, status: string }) => {
          if (userId === partner?.id) {
            setIsOnline(status === 'online');
          }
        };
      
        socket.on('presence-update', handler);
      
        return () => {
          socket.off('presence-update', handler); // pass the same handler
        };
      }, [partner]);      

    // handle fetch messages logic
    const fetchMessages = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${host}/chats/rooms/${roomId}`);
            const text = await res.text();
            if (!res.ok) {
                const errorData = text ? JSON.parse(text) : {};
                Alert.alert('Error', errorData.error || 'Failed to fetch messages');
                return;
              }
          
            const data = text ? JSON.parse(text) : [];
            setMessages(data);
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
                Alert.alert('Error', data.error || 'Failed to fetch partner');
              }
        } catch (err) {
              console.error(err);
              Alert.alert('Error', 'Unable to fetch partner');
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
        <>
            {loading || !partner
             ? <ThemedText>Loading Messages ...</ThemedText>
             : (<ThemedView style={{ flex: 1 }}>
                    <ChatHeader name={partner.name} lastSeen={partner.last_seen} isOnline={isOnline} />
                    <View style={{ flex: 1 }}>
                        <ChatMessages messages={messages} currentUserId={userId} chatPartnerId={partnerId} />
                    </View>
                    <View style={{ position: 'absolute', bottom: 10, left: 0, right: 0 }}>
                        <ChatInput onSend={sendMessage}/>
                    </View>
                </ThemedView>
               )
            }
        </>
    )
}