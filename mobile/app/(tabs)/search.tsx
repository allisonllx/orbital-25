// SearchScreen.tsx
import { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Platform } from 'react-native';
import { SearchBar } from '@/components/SearchBar';
import { FilterRow } from '@/components/FilterRow';
import { CategoryModal } from '@/components/CategoryModal';
import { DateModal } from '@/components/DateModal';
import Constants from 'expo-constants';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [createdWithin, setCreatedWithin] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState<boolean | null>(null);

  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [dateModalVisible, setDateModalVisible] = useState(false);

  const rawHost = Constants.expoConfig?.extra?.EXPRESS_HOST_URL ?? 'http://localhost:3000';
  const host = Platform.OS === 'android' ? rawHost.replace('localhost', '10.0.2.2') : rawHost;

  const applyFilters = () => {
    console.log({ query, selectedCategories, createdWithin, isCompleted });
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams();
  
      if (query) params.append('q', query); // assuming ?q=searchterm
      if (selectedCategories.length > 0) {
        selectedCategories.forEach(cat => params.append('categories', cat));
      }
      if (createdWithin) params.append('created_within', createdWithin); // e.g. '24h', '7d'
      if (isCompleted !== null) params.append('completed', isCompleted.toString());
  
      const url = `${host}/tasks?${params.toString()}`;
  
      fetch(url)
        .then(res => res.json())
        .then(data => {
          console.log('Filtered Tasks:', data);
          // TODO: for rendering results (setResults(data) — you can add state to store results)
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flex: 1,
  },
  applyButton: {
    marginTop: 'auto',
    backgroundColor: '#007AFF',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
});