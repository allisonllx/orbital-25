import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ScrollView } from 'react-native';

type Props = {
  createdWithin: string | null;
  isCompleted: boolean | null;
  onToggleCompleted: () => void;
  onOpenCategory: () => void;
  onOpenDate: () => void;
};

export function FilterRow({
  createdWithin,
  isCompleted,
  onToggleCompleted,
  onOpenCategory,
  onOpenDate,
}: Props) {
  return (
    <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={true} 
        style={styles.viewport} 
        contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={onOpenCategory} style={styles.chip}>
        <Text>Category</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onOpenDate} style={styles.chip}>
        <Text>Created: {createdWithin || 'All'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onToggleCompleted} style={styles.chip}>
        <Text>{isCompleted === null ? 'All' : isCompleted ? 'Completed' : 'Incomplete'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
    viewport: {
      maxHeight: 48,   
      marginBottom: 12,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
    },
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: '#eee',
      borderRadius: 20,
      marginRight: 8,
    },
  });