import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { TaskCard } from '@/components/TaskCard';
import { Task } from '@/types/types';

export function TaskList({ tasks }: { tasks: Task[] }) {
  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 80,
  },
});