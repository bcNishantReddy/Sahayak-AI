import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Modal, TextInput, ActivityIndicator } from 'react-native';
import { Plus, Edit, Trash2 } from 'lucide-react-native';
import { Class } from '@/types';

interface ClassManagerProps {
  classes: Class[];
  onAdd: (data: Omit<Class, 'id'>) => void;
  onEdit: (id: string, data: Omit<Class, 'id'>) => void;
  onDelete: (id: string) => void;
  loading: boolean;
}

const ClassManager: React.FC<ClassManagerProps> = ({ classes, onAdd, onEdit, onDelete, loading }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<{ name: string; sections: string; subjects: string }>({ name: '', sections: '', subjects: '' });

  const openAdd = () => {
    setEditId(null);
    setForm({ name: '', sections: '', subjects: '' });
    setModalVisible(true);
  };
  const openEdit = (cls: Class) => {
    setEditId(cls.id);
    setForm({ name: cls.name, sections: cls.sections.join(', '), subjects: cls.subjects.join(', ') });
    setModalVisible(true);
  };
  const handleSave = () => {
    const data = {
      name: form.name.trim(),
      sections: form.sections.split(',').map(s => s.trim()).filter(Boolean),
      subjects: form.subjects.split(',').map(s => s.trim()).filter(Boolean),
    };
    if (editId) {
      onEdit(editId, data);
    } else {
      onAdd(data);
    }
    setModalVisible(false);
  };

  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Classes</Text>
        <TouchableOpacity onPress={openAdd} style={styles.addButton}><Plus size={18} color="#fff" /></TouchableOpacity>
      </View>
      {loading ? <ActivityIndicator /> : (
        <FlatList
          data={classes}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.classCard}
              onPress={() => openEdit(item)}
            >
              <Text style={styles.classCardText}>{item.name}</Text>
              <TouchableOpacity onPress={() => onDelete(item.id)} style={styles.deleteIcon}><Trash2 size={16} color="#ff3b30" /></TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}
      {/* Modal for Add/Edit */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editId ? 'Edit Class' : 'Add Class'}</Text>
            <TextInput
              style={styles.input}
              placeholder="Class Name"
              value={form.name}
              onChangeText={v => setForm(f => ({ ...f, name: v }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Sections (comma separated)"
              value={form.sections}
              onChangeText={v => setForm(f => ({ ...f, sections: v }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Subjects (comma separated)"
              value={form.subjects}
              onChangeText={v => setForm(f => ({ ...f, subjects: v }))}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#000' }]} onPress={handleSave}>
                <Text style={[styles.modalButtonText, { color: '#fff' }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Poppins',
    color: '#000',
  },
  addButton: {
    backgroundColor: '#000',
    borderRadius: 20,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  classCard: {
    backgroundColor: '#f7f7f7',
    borderRadius: 12,
    padding: 12,
    marginRight: 10,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 90,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  classCardText: {
    color: '#000',
    fontFamily: 'Poppins',
    fontWeight: '600',
    fontSize: 16,
    flex: 1,
  },
  deleteIcon: {
    marginLeft: 8,
    padding: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: 320,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Poppins',
    color: '#000',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    color: '#000',
    backgroundColor: '#fff',
    fontFamily: 'Poppins',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 4,
  },
  modalButtonText: {
    color: '#000',
    fontWeight: '500',
    fontSize: 16,
    fontFamily: 'Poppins',
  },
});

export default ClassManager; 