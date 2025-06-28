import { StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { format, isToday, isYesterday } from 'date-fns';
// import { useRouter } from 'expo-router';

export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);

  if (isToday(date)) return format(date, 'p'); // e.g. 3:45 PM
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'dd/MM/yyyy');
}


export function ChatHeader({ name, lastSeen, isOnline }: { name: string; lastSeen: string, isOnline: boolean }) {
  // const router = useRouter();

  return (
    <ThemedView style={styles.container}>
      
        <ThemedText style={styles.name}>{name}</ThemedText>
        <ThemedText style={styles.lastSeen}>
          {isOnline ? 'online' : `last seen ${formatRelativeTime(lastSeen)}`}
        </ThemedText>
     
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
  // backText: {
  //   color: '#007aff',
  //   fontSize: 16,
  //   fontWeight: '500',
  //   marginRight: 12,
  // },
  // centerBlock: {
  //   flex: 1, 
  // },
  name: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  lastSeen: {
    fontSize: 12,
    color: '#888',
  },
});
