import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Constants from 'expo-constants';
import { Task } from '@/types/types';
import { TaskList } from '@/components/TaskList';
import { TopBanner } from '@/components/TopBanner';

export default function HomeScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const host = Constants.expoConfig?.extra?.EXPRESS_HOST_URL ?? 'http://localhost:3000';

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch(`${host}/tasks`);
        const data = await res.json();
        setTasks(data);
      } catch (err) {
        console.error('Error fetching tasks:', err);
      }
    };
    fetchTasks();
  }, []);

  return (
    <View style={styles.container}>
      <TopBanner />
      <TaskList tasks={tasks} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
});