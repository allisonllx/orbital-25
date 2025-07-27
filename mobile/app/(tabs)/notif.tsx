import { useCallback, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Task } from '@/types/types';
import { TaskList } from '@/components/TaskList';
import { authFetch } from '@/utils/authFetch';
import { useFocusEffect } from '@react-navigation/native';
import { ThemedText } from '@/components/ThemedText';
import { API_HOST as host } from '@/constants/api';

export default function NotifScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [savedIds, setSavedIds] = useState<number[]>([]);

  useFocusEffect(
    useCallback(() => {
      const fetchSavedTasks = async () => {
        try {
          const res = await authFetch(`${host}/tasks/saved`);
          const data = await res.json();
          setTasks(data);
          setSavedIds(data.map((task: Task) => task.id));
        } catch (err) {
          console.error('Error fetching saved tasks:', err);
        }
      };
      fetchSavedTasks();
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

      if (newState) {
        setSavedIds((prev) => [...prev, taskId]);
      } else {
        setSavedIds((prev) => prev.filter((id) => id !== taskId));
        setTasks((prev) => prev.filter((task) => task.id !== taskId)); // hide from list
      }
    } catch (err) {
      console.error('Failed to toggle save', err);
    }
  };

  return (
    <View style={styles.container}>
      {tasks.length > 0 ? (
        <TaskList tasks={tasks} savedIds={savedIds} onToggleSave={handleToggleSave} />
      ) : (
        <ThemedText>No Saved Tasks</ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
});
