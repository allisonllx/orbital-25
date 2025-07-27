import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { TaskCard } from './TaskCard';
import { Task } from '@/types/types';

export type TaskListProps = {
  tasks: Task[];
  savedIds?: number[];
  onToggleSave?: (taskId: number, newState: boolean) => void;
};

export function TaskList({ tasks, savedIds = [], onToggleSave }: TaskListProps) {
  return (
    <FlatList
      data={tasks}
      keyExtractor={(t) => t.id.toString()}
      renderItem={({ item }) => (
        <TaskCard
          task={item}
          isSaved={savedIds.includes(item.id)}
          onToggleSave={onToggleSave}
        />
      )}
      contentContainerStyle={styles.content}
      style={styles.list}
      showsVerticalScrollIndicator={true}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 80 },
});