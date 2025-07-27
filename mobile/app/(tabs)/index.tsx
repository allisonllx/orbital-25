import { useCallback, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Task } from '@/types/types';
import { TaskList } from '@/components/TaskList';
import { TopBanner } from '@/components/TopBanner';
import { API_HOST as host } from '@/constants/api';
import { authFetch } from '@/utils/authFetch';
import { useFocusEffect } from '@react-navigation/native';

export default function HomeScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [savedIds, setSavedIds] = useState<number[]>([]);

  useFocusEffect(
    useCallback(() => {
      const fetchTasks = async () => {
        try {
          const res = await authFetch(`${host}/tasks`);
          const data = await res.json();
          setTasks(data);
        } catch (err) {
          console.error('Error fetching tasks:', err);
        }
      };

      const fetchSaved = async () => {
        try {
          const res = await authFetch(`${host}/tasks/saved`);
          const data = await res.json();
          setSavedIds(data.map((task: Task) => task.id));
        } catch (err) {
          console.error('Error fetching saved tasks:', err);
        }
      };

      fetchTasks();
      fetchSaved();
    }, [])
  );

  const handleToggleSave = async (taskId: number, newState: boolean) => {
    try {
      const endpoint = newState
        ? `${host}/users/save-task/${taskId}`
        : `${host}/users/unsave-task/${taskId}`;
      await authFetch(endpoint, {
        method: newState ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      setSavedIds((prev) =>
        newState ? [...prev, taskId] : prev.filter((id) => id !== taskId)
      );
    } catch (err) {
      console.error('Failed to toggle save', err);
    }
  };

  return (
    <View style={styles.container}>
      <TopBanner />
      <TaskList
        tasks={tasks}
        savedIds={savedIds}
        onToggleSave={handleToggleSave}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
});
