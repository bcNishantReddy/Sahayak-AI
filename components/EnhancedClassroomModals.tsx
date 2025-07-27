import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native';
import { X, Plus } from 'lucide-react-native';
import { Student, Test } from '@/types';
import { useTranslation } from 'react-i18next';

interface StudentModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
  editingStudent: Student | null;
  studentName: string;
  setStudentName: (name: string) => void;
  loading: boolean;
}

export const StudentModal = ({
  visible,
  onClose,
  onSubmit,
  editingStudent,
  studentName,
  setStudentName,
  loading
}: StudentModalProps) => {
  const { t } = useTranslation();

  const handleSubmit = () => {
    if (!studentName.trim()) {
      Alert.alert('Error', 'Please enter a student name');
      return;
    }
    onSubmit(studentName.trim());
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingStudent ? 'Edit Student' : 'Add Student'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Student Name"
            placeholderTextColor="#000"
            value={studentName}
            onChangeText={setStudentName}
            autoFocus
          />

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {editingStudent ? 'Update' : 'Add'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

interface SubjectModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
  subjectName: string;
  setSubjectName: (name: string) => void;
  loading: boolean;
}

export const SubjectModal = ({
  visible,
  onClose,
  onSubmit,
  subjectName,
  setSubjectName,
  loading
}: SubjectModalProps) => {
  const handleSubmit = () => {
    if (!subjectName.trim()) {
      Alert.alert('Error', 'Please enter a subject name');
      return;
    }
    onSubmit(subjectName.trim());
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Subject</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Subject Name"
            placeholderTextColor="#000"
            value={subjectName}
            onChangeText={setSubjectName}
            autoFocus
          />

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>Add</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

interface TestModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (name: string, totalMarks: number) => void;
  editingTest: Test | null;
  testName: string;
  setTestName: (name: string) => void;
  testTotalMarks: string;
  setTestTotalMarks: (marks: string) => void;
  loading: boolean;
}

export const TestModal = ({
  visible,
  onClose,
  onSubmit,
  editingTest,
  testName,
  setTestName,
  testTotalMarks,
  setTestTotalMarks,
  loading
}: TestModalProps) => {
  const handleSubmit = () => {
    if (!testName.trim()) {
      Alert.alert('Error', 'Please enter a test name');
      return;
    }
    if (!testTotalMarks || isNaN(Number(testTotalMarks))) {
      Alert.alert('Error', 'Please enter valid total marks');
      return;
    }
    onSubmit(testName.trim(), Number(testTotalMarks));
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingTest ? 'Edit Test' : 'Add Test'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Test Name"
            placeholderTextColor="#000"
            value={testName}
            onChangeText={setTestName}
            autoFocus
          />

          <TextInput
            style={styles.input}
            placeholder="Total Marks"
            placeholderTextColor="#000"
            value={testTotalMarks}
            onChangeText={setTestTotalMarks}
            keyboardType="numeric"
          />

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {editingTest ? 'Update' : 'Add'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  closeButton: {
    padding: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#000',
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#000',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 