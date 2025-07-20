import { useState, useCallback } from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Platform } from 'react-native';
import { SearchBar } from '@/components/SearchBar';
import { FilterRow } from '@/components/FilterRow';
import { CategoryModal } from '@/components/CategoryModal';
import { DateModal } from '@/components/DateModal';
import { TaskList } from '@/components/TaskList';
import { Task } from '@/types/types';
import { API_HOST as rawHost } from '@/constants/api';
import { authFetch } from '@/utils/authFetch';
import { useFocusEffect } from '@react-navigation/native';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [createdWithin, setCreatedWithin] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState<boolean | null>(null);

  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [dateModalVisible, setDateModalVisible] = useState(false);

  const [results, setResults] = useState<Task[]>([]);

  let host = rawHost;
  if (Platform.OS === 'android' && rawHost.includes('localhost')) {
    host = rawHost.replace('localhost', '10.0.2.2');
  }

  const clearFilters = () => {
    setQuery('');
    setSelectedCategories([]);
    setCreatedWithin(null);
    setIsCompleted(null);
  }

  useFocusEffect(
    useCallback(() => {
      const timeout = setTimeout(() => {
        const params = new URLSearchParams();
  
        if (query) params.append('q', query);
        if (selectedCategories.length > 0) {
          selectedCategories.forEach(cat => params.append('category', cat));
        }
        if (createdWithin) params.append('created_within', createdWithin);
        if (isCompleted !== null) params.append('completed', isCompleted.toString());
  
        const url = `${host}/tasks?${params.toString()}`;
        console.log(url);
  
        authFetch(url)
          .then(res => res.json())
          .then(data => {
            setResults(data);
          })
          .catch(err => {
            console.error('Failed to fetch filtered tasks', err);
          });
      }, 500);
  
      return () => clearTimeout(timeout);
    }, [query, selectedCategories, createdWithin, isCompleted])
  );

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

      <TouchableOpacity style={styles.applyButton} onPress={clearFilters}>
        <Text style={{ color: '#fff' }}>Clear Filters</Text>
      </TouchableOpacity>

      <TaskList tasks={results} />
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
});
