import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { categories } from '@/constants/Categories';

type Props = {
  visible: boolean;
  selectedCategories: string[];
  onToggleCategory: (category: string) => void;
  onClose: () => void;
};

export function CategoryModal({ visible, selectedCategories, onToggleCategory, onClose }: Props) {
  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.modalContainer}>
        <Text style={styles.modalTitle}>Select Categories</Text>
        {categories.map((cat, idx) => (
          <TouchableOpacity key={idx} onPress={() => onToggleCategory(cat)} style={styles.modalItem}>
            <Text style={{ fontWeight: selectedCategories.includes(cat) ? 'bold' : 'normal' }}>{cat}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity onPress={onClose} style={styles.modalClose}>
          <Text>Done</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    padding: 24,
    flex: 1,
    backgroundColor: '#fff',
  },
  modalTitle: {
    fontSize: 20,
    marginBottom: 16,
  },
  modalItem: {
    paddingVertical: 12,
  },
  modalClose: {
    marginTop: 24,
    alignSelf: 'flex-end',
  },
});
