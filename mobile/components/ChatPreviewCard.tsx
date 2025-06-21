import { StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';

type Props = {
  name: string;
  lastMessage: string;
  timestamp: string; // format: "4:30 PM" or "Yesterday"
  onPress: () => void;
};

export function ChatPreviewCard({ name, lastMessage, timestamp, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <ThemedView style={styles.left}>
        <ThemedText style={styles.name} numberOfLines={1}>{name}</ThemedText>
        <ThemedText style={styles.message} numberOfLines={1}>{lastMessage}</ThemedText>
      </ThemedView>
      <ThemedText style={styles.time}>{timestamp}</ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
    backgroundColor: '#fff',
  },
  left: {
    flex: 1,
    marginRight: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111',
  },
  message: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  time: {
    fontSize: 12,
    color: '#999',
  },
});
