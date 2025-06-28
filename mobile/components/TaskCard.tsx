import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'expo-router';
import { Task } from '@/types/types';

export function TaskCard({ task }: { task: Task }) {
    const router = useRouter();
  
    return (
      <View style={styles.taskCard}>
        <View style={styles.taskHeader}>
          {task.user_image && <Image source={{ uri: task.user_image }} style={styles.avatar} />}
          <View>
            <Text style={styles.poster}>{`User #${task.user_id}`}</Text>
            <Text style={styles.timeAgo}>
              {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
            </Text>
          </View>
        </View>
  
        <Text style={styles.title}>{task.title}</Text>
  
        <View style={styles.tagRow}>
          <Text style={[styles.tag, { backgroundColor: '#ff6b6b' }]}>{task.category}</Text>
          {task.completed && (
            <Text style={[styles.tag, { backgroundColor: '#4caf50', color: '#fff' }]}>Completed</Text>
          )}
        </View>
  
        <Text numberOfLines={2} style={styles.caption}>{task.caption}</Text>
  
        <TouchableOpacity onPress={() => router.push(`/task/${task.id}`)}>
          <Text style={styles.viewMore}>View more</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  const styles = StyleSheet.create({
    taskCard: {
      backgroundColor: '#f2f2f2',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: '#e0e0e0',
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 6,
      elevation: 3,
    },
    taskHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    avatar: {
      width: 30,
      height: 30,
      borderRadius: 15,
      marginRight: 10,
    },
    poster: {
      fontWeight: 'bold',
      fontSize: 13,
    },
    timeAgo: {
      fontSize: 11,
      color: '#999',
    },
    title: {
      fontSize: 15,
      fontWeight: '600',
      marginVertical: 6,
    },
    tagRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: 8,
    },
    tag: {
      fontSize: 11,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 5,
      overflow: 'hidden',
      color: '#300',
      fontWeight: '500',
    },
    caption: {
      fontSize: 13,
      color: '#444',
    },
    viewMore: {
      color: '#1e16cd',
      fontSize: 12,
      marginTop: 6,
    },
  });