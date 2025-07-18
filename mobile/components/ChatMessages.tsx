import React, { useEffect, useRef } from 'react';
import { FlatList, View, StyleSheet, Text } from 'react-native';
import { io } from 'socket.io-client';
import { useIsFocused } from '@react-navigation/native';
import { MessageBubble } from '@/components/MessageBubble';
import { Message } from '@/types/types';
import { ThemedText } from '@/components/ThemedText';
import { API_HOST as host } from '@/constants/api';

const socket = io(host);

type ChatItem =
  | { type: 'date'; date: string }
  | (Message & { type: 'message' });

const groupMessagesByDate = (messages: Message[]): ChatItem[] => {
  const result: ChatItem[] = [];
  let lastDate = '';

  messages.forEach(msg => {
    const date = new Date(msg.created_at).toDateString();
    if (date !== lastDate) {
      result.push({ type: 'date', date });
      lastDate = date;
    }
    result.push({ type: 'message', ...msg });
  });

  return result;
};

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export type Props = {
  messages: Message[];
  currentUserId: number;
  chatPartnerId: number;
};

export function ChatMessages({ messages, currentUserId, chatPartnerId }: Props) {
  const flatListRef = useRef<FlatList<ChatItem>>(null);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (messages.length === 0) return;

    const unreadMessages = messages.filter(
      msg => !msg.is_read && msg.sender_id === chatPartnerId
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
      keyExtractor={(item, index) =>
        item.type === 'date'
          ? `date-${item.date}-${index}`
          : `msg-${item.id}`
      }
      style={{ flex: 1 }}
      keyboardShouldPersistTaps="handled"
      renderItem={({ item }) => {
        if (item.type === 'date') {
          return (
            <View style={styles.dateContainer}>
              <Text style={styles.dateText}>{item.date}</Text>
            </View>
          );
        }

        const isSentByMe = item.sender_id === currentUserId;
        const bubbleStyle = isSentByMe
          ? [styles.bubble, styles.bubbleRight]
          : [styles.bubble, styles.bubbleLeft];

        return (
            <View style={styles.bubbleWrapper}>
                <View style={bubbleStyle}>
                    <Text style={styles.messageText}>{item.content}</Text>
                    <Text style={styles.timeText}>{formatTime(item.created_at)}</Text>
                </View>
            </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  dateContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  dateText: {
    backgroundColor: '#eee',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 12,
    color: '#555',
  },
  bubbleWrapper: {
    paddingHorizontal: 10,
  },
  bubble: {
    borderRadius: 16,
    padding: 10,
    marginVertical: 4,
    maxWidth: '80%',
    alignSelf: 'flex-start',
  },
  bubbleLeft: {
    paddingHorizontal: 8,
    backgroundColor: '#f1f1f1',
    alignSelf: 'flex-start',
  },
  bubbleRight: {
    paddingHorizontal: 8,
    backgroundColor: '#cce5ff',
    alignSelf: 'flex-end',
  },
  messageText: {
    fontSize: 16,
    color: '#000',
  },
  timeText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
  },
});
