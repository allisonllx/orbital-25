import React, {useEffect, useRef } from 'react';
import { FlatList } from 'react-native';
import { io } from 'socket.io-client';
import { useIsFocused } from '@react-navigation/native';
import { MessageBubble } from '@/components/MessageBubble';
import { Message } from '@/types/types';
import { API_HOST as host } from '@/constants/api';

const socket = io(host); // points to backend server

type ChatItem = 
    | { type: 'date', date: string }
    | Message & { type: 'message' };

const groupMessagesByDate = (messages: Message[]): ChatItem[] => {
    const result: ChatItem[] = [];
    let lastDate = '';

    messages.forEach(msg => {
        const date = new Date(msg.created_at).toDateString();
        if (date != lastDate) {
            result.push({ type: 'date', date });
        }
        result.push({ type: 'message', ...msg });
    });

    return result;
}

export type Props = {
    messages: Message[];
    currentUserId: number;
    chatPartnerId: number;
  };

export function ChatMessages({ messages, currentUserId, chatPartnerId }: Props) {
    const flatListRef = useRef<FlatList<ChatItem>>(null);
    const isFocused = useIsFocused();

    useEffect(() => {
        if (messages.length == 0) return;

        const unreadMessages = messages.filter(
            (msg: { is_read: boolean; sender_id: number; }) => !msg.is_read && msg.sender_id == chatPartnerId
        );

        if (unreadMessages.length > 0 && isFocused) {
            const messageIds = unreadMessages.map(msg => msg.id);
            socket.emit('messages_read', { messageIds });
        }
    }, [messages, isFocused]);

    return (
        <FlatList
            ref={flatListRef}
            data={groupMessagesByDate(messages)}
            keyExtractor={(item, index) => item.type === 'date' ? `date-${item.date}-${index}` : `msg-${item.id}`}
            style={{ flex: 1 }}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
                if (item.type == 'date') {
                    return <ThemedText>{item.date}</ThemedText>
                }
                return <MessageBubble message={item} isSentByMe={false}/> // TODO: update logic for is sent by me
            }}
        />
    )
}