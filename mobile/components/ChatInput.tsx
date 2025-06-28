import { use, useState } from 'react';
import { TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';

export function ChatInput({ onSend }: { onSend: (message: string) => void}) {
    const [message, setMessage] = useState('');

    const handleSend = () => {
        if (!message.trim()) return;
        onSend(message.trim());
        setMessage('');
    }

    return (
        <ThemedView style={styles.container}>
            <TextInput 
                value={message}
                onChangeText={setMessage}
                placeholder="Type a message"
                style={styles.input} />
            <TouchableOpacity onPress={handleSend} style={styles.button}>
                <Ionicons name="send" size={20} color="#007aff" />
            </TouchableOpacity>
        </ThemedView>
    )
}

const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      padding: 8,
      alignItems: 'center',
      backgroundColor: '#fff',
      borderTopWidth: 1,
      borderTopColor: '#ddd',
    },
    input: {
      flex: 1,
      backgroundColor: '#f1f1f1',
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 8,
      fontSize: 16,
    },
    button: {
      marginLeft: 8,
      padding: 8,
    },
  });