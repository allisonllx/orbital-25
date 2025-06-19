import { TextInput, StyleSheet } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';

type Props = {
  placeholder?: string;
  onSearch: (query: string) => void;
};

export function SearchBar({ placeholder = "Search...", onSearch }: Props) {
  const [query, setQuery] = useState('');

  const handleChange = (text: string) => {
    setQuery(text);
    onSearch(text);
  };

  return (
    <ThemedView style={styles.container}>
      <Ionicons name="search" size={20} color="#888" style={styles.icon} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={query}
        onChangeText={handleChange}
        placeholderTextColor="#aaa"
        clearButtonMode="while-editing"
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eee',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    margin: 8,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
});
