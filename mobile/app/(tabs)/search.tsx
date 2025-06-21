// SearchScreen.tsx
import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { SearchBar } from '@/components/SearchBar';
import { FilterRow } from '@/components/FilterRow';
import { CategoryModal } from '@/components/CategoryModal';
import { DateModal } from '@/components/DateModal';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [createdWithin, setCreatedWithin] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState<boolean | null>(null);

  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [dateModalVisible, setDateModalVisible] = useState(false);

  const applyFilters = () => {
    console.log({ query, selectedCategories, createdWithin, isCompleted });
  };

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