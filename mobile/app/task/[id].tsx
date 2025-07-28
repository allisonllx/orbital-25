import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { useAuth } from '@/hooks/AuthContext';
import { API_HOST as host } from '@/constants/api';
import { authFetch } from '@/utils/authFetch';
import { formatDistanceToNow, format } from 'date-fns';
import { Comment } from '@/types/types';

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const res = await authFetch(`${host}/tasks/${id}`);
        const data = await res.json();
        setTask(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    const fetchComments = async () => {
      try {
        const res = await authFetch(`${host}/tasks/${id}/comments`);
        const data = await res.json();
        setComments(data);
      } catch (err) {
        console.error("Failed to load comments", err);
      }
    };

    fetchTask();
    fetchComments();
  }, [id]);

  const handleAddComment = async () => {
    if (!user) {
      Alert.alert("You need to be logged in to comment.");
      return;
    }

    if (!newComment.trim()) return;
    try {
      const res = await authFetch(`${host}/tasks/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, content: newComment }),
      });
      const data = await res.json();
      setComments([...comments, data.content]);
      setNewComment('');
    } catch (err) {
      console.error('Failed to add comment', err);
    }
  };

  const handleDeleteTask = async () => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              await authFetch(`${host}/tasks/${id}`, {
                method: 'DELETE',
              });
              router.replace('/(tabs)');
            } catch (err) {
              console.error('Failed to delete task', err);
              Alert.alert('Error', 'Could not delete the task.');
            }
          },
        },
      ]
    );
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 50 }} />;
  if (!task) return <Text style={{ padding: 20 }}>Task not found.</Text>;

  const formattedDateTime = task.created_at
    ? format(new Date(task.created_at), 'PPpp')
    : '';

  return (
    <View style={{ flex: 1 }}>
      {/* Top Nav Bar */}
      <SafeAreaView edges={['top']} style={styles.topBar}>
        <View style={styles.navRow}>
          <TouchableOpacity onPress={() => router.push('/(tabs)')}>
            <Text style={styles.backText}>{'< Back'}</Text>
          </TouchableOpacity>

          {user?.id === task.user_id && (
            <TouchableOpacity onPress={handleDeleteTask} style={styles.deleteButton}>
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{task.title}</Text>
        <Text style={styles.meta}>Posted by: {task.user_name ?? 'Anonymous'}</Text>

        <View style={styles.tagContainer}>
          {task.category?.map((cat: string) => (
            <Text key={cat} style={styles.tag}>
              {cat}
            </Text>
          ))}
        </View>

        <Text style={styles.caption}>{task.caption}</Text>

        {/* Post Timestamp */}
        {formattedDateTime && (
          <Text style={styles.meta}>Posted on: {formattedDateTime}</Text>
        )}

        {/* Comments */}
        <Text style={styles.sectionTitle}>Comments</Text>

        {comments.map((comment, index) => (
          <View key={index} style={styles.commentBubble}>
            <Text style={styles.commentUser}>
              {comment.user_name || `User #${comment.user_id}`}
              <Text style={styles.commentTime}> · {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</Text>
            </Text>
            <Text style={styles.commentText}>{comment.content}</Text>
          </View>
        ))}

        {/* Add Comment */}
        <View style={styles.addCommentSection}>
          <TextInput
            value={newComment}
            onChangeText={setNewComment}
            placeholder="Add a comment..."
            style={styles.commentInput}
          />
          <TouchableOpacity onPress={handleAddComment}>
            <Text style={styles.addCommentBtn}>Post</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Chat Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.chatButton}
          onPress={async () => {
            if (!user || !task?.user_id || user.id === task.user_id) {
              Alert.alert("Oops", "You can't chat with yourself.");
              return;
            }

            const uid1 = user.id;
            const uid2 = task.user_id;
            const roomId = uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;

            try {
              await authFetch(`${host}/rooms/${roomId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user1_id: uid1, user2_id: uid2 }),
              });

              router.push(`/(chat)/${roomId}`);
            } catch (err) {
              console.error('Failed to create room:', err);
              Alert.alert('Error', 'Could not start chat.');
            }
          }}
        >
          <Text style={styles.chatText}>Chat now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backText: {
    color: '#007aff',
    fontSize: 16,
    fontWeight: '500',
  },
  deleteButton: {},
  deleteText: {
    color: '#ff3b30',
    fontWeight: 'bold',
    fontSize: 16,
  },
  container: {
    padding: 20,
    paddingBottom: 100,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  meta: {
    color: '#888',
    marginBottom: 10,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  tag: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginRight: 8,
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  caption: {
    fontSize: 16,
    lineHeight: 22,
    marginTop: 10,
    marginBottom: 10,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginTop: 20,
    fontSize: 16,
  },
  commentBubble: {
    marginTop: 12,
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 8,
    borderColor: '#ddd',
    borderWidth: 1,
  },
  commentUser: {
    fontWeight: '600',
    fontSize: 13,
  },
  commentTime: {
    fontWeight: 'normal',
    color: '#888',
    fontSize: 12,
  },
  commentText: {
    marginTop: 4,
    fontSize: 14,
    color: '#333',
  },
  addCommentSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 10,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 14,
  },
  addCommentBtn: {
    color: '#1e16cd',
    fontWeight: 'bold',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    alignItems: 'center',
    zIndex: 10,
  },
  chatButton: {
    backgroundColor: '#a8e10c',
    paddingVertical: 12,
    paddingHorizontal: 120,
    borderRadius: 10,
  },
  chatText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
