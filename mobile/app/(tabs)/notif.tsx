import { useCallback, useState } from 'react';
import { View, StyleSheet } from 'react-native';
// import Constants from 'expo-constants';
import { Task } from '@/types/types';
import { TaskList } from '@/components/TaskList';
// import { TopBanner } from '@/components/TopBanner';
import { API_HOST as host } from '@/constants/api';
import { authFetch } from '@/utils/authFetch';
import { useFocusEffect } from '@react-navigation/native';
import { ThemedText } from '@/components/ThemedText';

export default function NotifScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);

  useFocusEffect(
    useCallback(() => {
      const fetchTasks = async () => {
        try {
          const res = await authFetch(`${host}/tasks/saved`);
          const data = await res.json();
          setTasks(data);
        } catch (err) {
          console.error('Error fetching tasks:', err);
        }
      };
      fetchTasks();
    }, [])
  );

  return (
    <View style={styles.container}>
      {tasks.length > 0 
        ? <TaskList tasks={tasks} />
        : <ThemedText>No Saved Tasks</ThemedText>
      }
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
});