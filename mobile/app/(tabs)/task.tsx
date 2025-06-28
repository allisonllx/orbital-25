import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
} from 'react-native';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/AuthContext';
import Logo from '@/assets/images/NUSeek logo.png';
import { categories } from '@/constants/Categories';

export default function CreateTaskScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const host =
    Constants.expoConfig?.extra?.EXPRESS_HOST_URL ?? 'http://localhost:3000';

  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleCategoryToggle = (cat: string) => {
    setSelectedCategory((prev) => (prev === cat ? null : cat));
  };

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Error', 'User not logged in.');
      return;
    }
    if (!title.trim() || !caption.trim()) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    if (selectedCategory.length === 0) {
      Alert.alert('Error', 'Please select at least one category.');
      return;
    }
    if (caption.length > 2000) {
      Alert.alert('Error', 'Caption cannot exceed 2000 characters.');
      return;
    }

    try {
      const res = await fetch(`${host}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          caption,
          category: [selectedCategory],
          user_id: user.id,
        }),
      });

      if (!res.ok) throw new Error('Task creation failed');

      Alert.alert('Success', 'Task created successfully!');
      router.push('/(tabs)/');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.screen}>
      {/* Top Navbar */}
      <View style={styles.topBar}>
        <View style={styles.logoContainer}>
         <Image source={Logo} style={styles.logo} resizeMode="contain" />
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView contentContainerStyle={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Title"
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.sectionLabel}>Category:</Text>
        <View style={styles.pickerContainer}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.pickerOption,
                selectedCategory == cat && styles.selectedOption,
              ]}
              onPress={() => handleCategoryToggle(cat)}
            >
              <Text style={styles.pickerText}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Caption:</Text>
        <TextInput
          style={[styles.input, styles.captionBox]}
          placeholder="Write your caption here..."
          value={caption}
          onChangeText={(text) => {
            if (text.length <= 2000) setCaption(text);
          }}
          multiline
        />
        <Text style={styles.charCount}>{caption.length}/2000</Text>
      </ScrollView>

      {/* Bottom Buttons */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.bottomButton, styles.cancelButton]}
          onPress={() => router.replace('/(tabs)')}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.bottomButton, styles.postButton]}
          onPress={handleSubmit}
        >
          <Text style={styles.postText}>Post</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingTop: Constants.statusBarHeight,
    backgroundColor: '#fff',
  },
  topBar: {
    height: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 20,
  },
  logoContainer: {
    height: 40,             // limits visible height
    overflow: 'hidden',     // crops excess image
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    height: 100,
    width: 'auto',
    aspectRatio: 3.5, 
  },
  form: {
    padding: 20,
    paddingBottom: 100, 
  },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  captionBox: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    textAlign: 'right',
    color: '#666',
    marginBottom: 10,
  },
  sectionLabel: {
    fontWeight: '600',
    marginBottom: 8,
    fontSize: 16,
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  pickerOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
  },
  selectedOption: {
    backgroundColor: '#cce5ff',
    borderColor: '#3399ff',
  },
  pickerText: {
    fontSize: 14,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
  },
  bottomButton: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#fff',
  },
  postButton: {
    backgroundColor: '#007aff',
  },
  cancelText: {
    color: '#444',
    fontSize: 16,
    fontWeight: '500',
  },
  postText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
