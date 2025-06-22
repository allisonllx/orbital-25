import { Message } from '@/types/types';
// import { ThemedText } from './ThemedText';
import { View, Text, StyleSheet } from 'react-native';
import { format } from 'date-fns';
import { ThemedView } from './ThemedView';

type Props = {
    message: Message,
    isSentByMe: boolean
}

export function MessageBubble({ message, isSentByMe }: Props) {
    const time = format(new Date(message.created_at), 'p');

    return (
        <ThemedView>
            <View style={[styles.container, isSentByMe ? styles.sent : styles.received]}>
                <Text style={styles.message}>{message.content}</Text>
                <View style={styles.meta}>
                    <Text style={styles.time}>{time}</Text>
                    {isSentByMe && message.is_read !== undefined && (
                    <Text style={styles.read}>{message.is_read ? '✓✓' : '✓'}</Text>
                    )}
                </View>
            </View>
        </ThemedView>
    )
}

const styles = StyleSheet.create({
    container: {
      maxWidth: '75%',
      marginVertical: 4,
      padding: 10,
      borderRadius: 12,
    },
    sent: {
      alignSelf: 'flex-end',
      backgroundColor: '#e1f5fe',
      borderTopRightRadius: 0,
    },
    received: {
      alignSelf: 'flex-start',
      backgroundColor: '#f0f0f0',
      borderTopLeftRadius: 0,
    },
    message: {
      fontSize: 16,
      marginBottom: 4,
    },
    meta: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 4,
    },
    time: {
      fontSize: 10,
      color: '#888',
    },
    read: {
      fontSize: 10,
      color: '#4fc3f7',
    },
  });
  