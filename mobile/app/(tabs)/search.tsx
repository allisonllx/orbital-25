import { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Platform } from 'react-native';
import { SearchBar } from '@/components/SearchBar';
import { FilterRow } from '@/components/FilterRow';
import { CategoryModal } from '@/components/CategoryModal';
import { DateModal } from '@/components/DateModal';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { Ionicons, Feather, FontAwesome5 } from '@expo/vector-icons';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [createdWithin, setCreatedWithin] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState<boolean | null>(null);

  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [dateModalVisible, setDateModalVisible] = useState(false);

  const rawHost = Constants.expoConfig?.extra?.EXPRESS_HOST_URL ?? 'http://localhost:3000';
  const host = Platform.OS === 'android' ? rawHost.replace('localhost', '10.0.2.2') : rawHost;

  const router = useRouter();

  const applyFilters = () => {
    console.log({ query, selectedCategories, createdWithin, isCompleted });
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams();

      if (query) params.append('q', query);
      if (selectedCategories.length > 0) {
        selectedCategories.forEach(cat => params.append('categories', cat));
      }
      if (createdWithin) params.append('created_within', createdWithin);
      if (isCompleted !== null) params.append('completed', isCompleted.toString());

      const url = `${host}/tasks?${params.toString()}`;

      fetch(url)
        .then(res => res.json())
        .then(data => {
          console.log('Filtered Tasks:', data);
          // TODO: setResults(data)
        })
        .catch(err => {
          console.error('Failed to fetch filtered tasks', err);
        });
    }, 500);

    return () => clearTimeout(timeout);
  }, [query, selectedCategories, createdWithin, isCompleted]);

  return (
    <View style={styles.container}>
      <SearchBar onSearch={setQuery} />

      <FilterRow
        createdWithin={createdWithin}
        isCompleted={isCompleted}
        onToggleCompleted={() => setIsCompleted(prev => prev === null ? false : !prev)}
        onOpenCategory={() => setCategoryModalVisible(true)}
        onOpenDate={() => setDateModalVisible(true)}
      />

      <CategoryModal
        visible={categoryModalVisible}
        selectedCategories={selectedCategories}
        onToggleCategory={(cat) =>
          setSelectedCategories(prev =>
            prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
          )
        }
        onClose={() => setCategoryModalVisible(false)}
      />

      <DateModal
        visible={dateModalVisible}
        selectedDate={createdWithin}
        onSelect={setCreatedWithin}
        onClose={() => setDateModalVisible(false)}
      />

      <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
        <Text style={{ color: '#fff' }}>Apply Filters</Text>
      </TouchableOpacity>

      {/* Bottom Nav Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)')}>
          <Ionicons name="home-outline" size={24} color="black" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/(tabs)/search')}>
          <Feather name="search" size={24} color="black" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/(tabs)/task')}>
          <Ionicons name="add-circle-outline" size={32} color="black" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/(tabs)/explore')}>
          <FontAwesome5 name="bookmark" size={20} color="black" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
          <Ionicons name="person-circle-outline" size={26} color="black" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flex: 1,
    backgroundColor: 'white',
  },
  applyButton: {
    marginTop: 'auto',
    backgroundColor: '#007AFF',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 60, // Leave space for nav bar
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
});
