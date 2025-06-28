import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const dateOptions = ['24h', '7d', '30d'];

type Props = {
  visible: boolean;
  selectedDate: string | null;
  onSelect: (option: string) => void;
  onClose: () => void;
};

export function DateModal({ visible, selectedDate, onSelect, onClose }: Props) {
  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.modalContainer}>
        <Text style={styles.modalTitle}>Created Within</Text>
        {dateOptions.map((option, idx) => (
          <TouchableOpacity key={idx} onPress={() => onSelect(option)} style={styles.modalItem}>
            <Text style={{ fontWeight: selectedDate === option ? 'bold' : 'normal' }}>{option}</Text>
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
