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
} from 'react-native';
import Constants from 'expo-constants';
import { useAuth } from '@/hooks/AuthContext'; 
import { API_HOST as host } from '@/constants/api';


export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const fetchTask = async () => {
      try {
        const res = await fetch(`${host}/tasks/${id}`);
        const data = await res.json();
        setTask(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [id]);

  if (loading) return <ActivityIndicator style={{ marginTop: 50 }} />;
  if (!task) return <Text style={{ padding: 20 }}>Task not found.</Text>;

  return (
    <View style={{ flex: 1 }}>
      {/* Top Nav Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.backText}>{'< Back'}</Text>
        </TouchableOpacity>
      </View>


      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{task.title}</Text>
        <Text style={styles.meta}>Posted by: {task.username ?? 'Anonymous'}</Text>

        <View style={styles.tagContainer}>
          {task.category?.map((cat: string) => (
            <Text key={cat} style={styles.tag}>
              {cat}
            </Text>
          ))}
        </View>

        <Text style={styles.caption}>{task.caption}</Text>
      </ScrollView>

      {/* Bottom Bar with Chat Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.chatButton}
          onPress={() => {
            if (!user || !task?.user_id || user.id === task.user_id) {
              return; // Optional: show an alert here if chatting with self
            }
            if (user.id === task.user_id) {
              Alert.alert("You're the owner", "You cannot chat with yourself.");
              return;
            }

            const uid1 = user.id;
            const uid2 = task.user_id;
            const roomId = uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;

            router.push(`/(chat)/${roomId}`);
          }}
        >
          <Text style={styles.chatText}>Chat Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    height: 100,
    paddingTop: Constants.statusBarHeight,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    justifyContent: 'flex-start', // align back button to left
  },
  backText: {
    color: '#007aff',
    fontSize: 16,
    fontWeight: '500',
  },

  navTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  container: {
    padding: 20,
  },
  title: {
    fontSize: 22,
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
  },
  caption: {
    fontSize: 16,
    lineHeight: 24,
    marginTop: 10,
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
    zIndex: 10, // ensures it's on top
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
