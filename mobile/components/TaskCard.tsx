import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'expo-router';
import { Task } from '@/types/types';
import { API_HOST as host } from '@/constants/api';
import { authFetch } from '@/utils/authFetch';
import { ThemedText } from '@/components/ThemedText';
import { useAuth } from '@/hooks/AuthContext';

export function TaskCard({ task }: { task: Task }) {
    const router = useRouter();
    const { user } = useAuth();
    if (!user) return (<ThemedText>Loading ...</ThemedText>);
    // const userId = user.id;
    const [isSaved, setIsSaved] = useState(false); 

    // TODO: shift fetching logic outside of task card in the future 
    useEffect(() => {
        if (!user) return;
    
        const fetchSaved = async () => {
          try {
            const res = await authFetch(`${host}/tasks/saved`);
            const text = await res.text();

            if (!res.ok) {
                console.error(`Error fetching saved tasks: ${res.status} - ${text}`);
                return;
              }

            const data = JSON.parse(text);
            if (!Array.isArray(data)) {
                console.error('Expected array but got:', data);
                return;
            }
            const savedTaskIds = data.map((row: { task_id: number }) => row.task_id);
            setIsSaved(savedTaskIds.includes(task.id));
          } catch (error) {
            console.error('Failed to fetch saved status', error);
          }
        };
    
        fetchSaved();
    }, [user?.id, task.id]);

    const toggleSave = async () => {
        try {
          const endpoint = isSaved ? `${host}/users/unsave-task/${task.id}` : `${host}/users/save-task/${task.id}`;
          await authFetch(endpoint, {
            method: isSaved ? 'DELETE' : 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          setIsSaved(!isSaved);
        } catch (err) {
          console.error('Failed to toggle save', err);
        }
      };
  
    return (
      <View style={styles.taskCard}>
        <View style={styles.topRow}>
            <View style={styles.taskHeader}>
                {task.user_image && <Image source={{ uri: task.user_image }} style={styles.avatar} />}
                <View>
                    <Text style={styles.poster}>{`User #${task.user_id}`}</Text>
                    <Text style={styles.timeAgo}>
                    {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
                    </Text>
                </View>
            </View>
            <TouchableOpacity onPress={toggleSave}>
                <FontAwesome name={isSaved ? 'bookmark' : 'bookmark-o'} size={20} color="#444" />
            </TouchableOpacity>
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
    topRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
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