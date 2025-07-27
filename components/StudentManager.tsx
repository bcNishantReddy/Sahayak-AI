import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Modal, TextInput, Image, ActivityIndicator } from 'react-native';
import { Plus, Edit, Trash2, User } from 'lucide-react-native';
import { Student, Class } from '@/types';

interface StudentManagerProps {
  students: Student[];
  classes: Class[];
  onAdd: (data: Omit<Student, 'id' | 'createdAt' | 'subjects'>) => void;
  onEdit: (id: string, data: Omit<Student, 'id' | 'createdAt' | 'subjects'>) => void;
  onDelete: (id: string) => void;
  onPickPhoto: (cb: (uri: string) => void) => void;
  loading: boolean;
}

const StudentManager: React.FC<StudentManagerProps> = ({ students, classes, onAdd, onEdit, onDelete, onPickPhoto, loading }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<{ name: string; classId: string; section: string; photoUrl?: string }>({ name: '', classId: '', section: '', photoUrl: '' });
  const [photo, setPhoto] = useState<string | undefined>(undefined);

  const openAdd = () => {
    setEditId(null);
    setForm({ name: '', classId: '', section: '', photoUrl: '' });
    setPhoto(undefined);
    setModalVisible(true);
  };
  const openEdit = (student: Student) => {
    setEditId(student.id);
    setForm({
      name: student.name,
      classId: student.classId,
      section: student.section,
      photoUrl: student.photoUrl,
    });
    setPhoto(student.photoUrl);
    setModalVisible(true);
  };
  const handleSave = () => {
    const data = {
      name: form.name.trim(),
      classId: form.classId,
      section: form.section,
      photoUrl: photo || '',
    };
    if (editId) {
      onEdit(editId, data);
    } else {
      onAdd(data);
    }
    setModalVisible(false);
  };
  const handlePickPhoto = () => {
    onPickPhoto(uri => setPhoto(uri));
  };

  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Students</Text>
        <TouchableOpacity onPress={openAdd} style={styles.addButton}><Plus size={18} color="#fff" /></TouchableOpacity>
      </View>
      {loading ? <ActivityIndicator /> : (
        <FlatList
          data={students}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.studentCard}>
              <View style={styles.studentAvatar}>
                {item.photoUrl ? (
                  <Image source={{ uri: item.photoUrl }} style={styles.avatarImg} />
                ) : (
                  <User size={28} color="#bbb" />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.studentName}>{item.name}</Text>
                <Text style={styles.studentMeta}>{item.section}</Text>
              </View>
              <TouchableOpacity onPress={() => openEdit(item)} style={styles.editIcon}><Edit size={18} color="#000" /></TouchableOpacity>
              <TouchableOpacity onPress={() => onDelete(item.id)} style={styles.deleteIcon}><Trash2 size={18} color="#ff3b30" /></TouchableOpacity>
            </View>
          )}
        />
      )}
      {/* Modal for Add/Edit */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editId ? 'Edit Student' : 'Add Student'}</Text>
            <TouchableOpacity style={styles.avatarPicker} onPress={handlePickPhoto}>
              {photo ? (
                <Image source={{ uri: photo }} style={styles.avatarImgLarge} />
              ) : (
                <User size={40} color="#bbb" />
              )}
              <Text style={styles.avatarPickerText}>Pick Photo</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder="Student Name"
              value={form.name}
              onChangeText={v => setForm(f => ({ ...f, name: v }))}
            />
            <Text style={styles.inputLabel}>Class</Text>
            <FlatList
              data={classes}
              keyExtractor={item => item.id}
              horizontal
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.filterChip, form.classId === item.id && styles.filterChipActive]}
                  onPress={() => setForm(f => ({ ...f, classId: item.id }))}
                >
                  <Text style={[styles.filterChipText, form.classId === item.id && styles.filterChipTextActive]}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
            <Text style={styles.inputLabel}>Section</Text>
            <TextInput
              style={styles.input}
              placeholder="Section"
              value={form.section}
              onChangeText={v => setForm(f => ({ ...f, section: v }))}
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
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7f7f7',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eee',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  avatarImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarImgLarge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
  },
  avatarPicker: {
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarPickerText: {
    color: '#000',
    fontFamily: 'Poppins',
    fontSize: 13,
    marginTop: 2,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins',
    color: '#000',
  },
  studentMeta: {
    fontSize: 13,
    color: '#666',
    fontFamily: 'Poppins',
  },
  editIcon: {
    marginLeft: 8,
    padding: 2,
  },
  deleteIcon: {
    marginLeft: 8,
    padding: 2,
  },
  filterChip: {
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterChipActive: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  filterChipText: {
    fontSize: 13,
    fontFamily: 'Poppins',
    color: '#666',
  },
  filterChipTextActive: {
    color: '#fff',
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
  inputLabel: {
    fontSize: 13,
    color: '#666',
    fontFamily: 'Poppins',
    marginBottom: 2,
    marginTop: 4,
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

export default StudentManager; 