import { StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export function ChatHeader({ name, lastSeen }: { name: string; lastSeen?: string }) {
  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.name}>{name}</ThemedText>
      {lastSeen && <ThemedText style={styles.lastSeen}>last seen {lastSeen}</ThemedText>}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  name: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  lastSeen: {
    fontSize: 12,
    color: '#888',
  },
});
