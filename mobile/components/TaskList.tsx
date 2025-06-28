import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { TaskCard } from '@/components/TaskCard';
import { Task } from '@/types/types';

export function TaskList({ tasks }: { tasks: Task[] }) {
  return (
    <FlatList
      data={tasks}
      keyExtractor={(t) => t.id.toString()}
      renderItem={({ item }) => <TaskCard task={item} />}
      contentContainerStyle={styles.content}
      style={styles.list}                // gives it height → scrolls
      showsVerticalScrollIndicator={true}
    />
  );
}

const styles = StyleSheet.create({
    list: { flex: 1 },                     // the scroller itself
    content: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 80,
    },
  });