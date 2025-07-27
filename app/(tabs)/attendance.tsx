import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList, Alert, ActivityIndicator, Modal, TextInput } from 'react-native';
import { Plus, RefreshCw } from 'lucide-react-native';
import { Class } from '@/types';
import { getClasses, addClass, updateClass, deleteClass, getStudents, ensureUserDocument } from '@/utils/attendanceFirestore';
import { auth } from '@/utils/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import ClassroomCard from '@/components/ClassroomCard';
import AddClassroomModal from '@/components/AddClassroomModal';
import EnhancedClassroomDetail from '@/components/EnhancedClassroomDetail';

export default function StudentDetails() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState<Class | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [classStudentCounts, setClassStudentCounts] = useState<{[key: string]: number}>({});
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [editClassName, setEditClassName] = useState('');

  // Monitor authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('🔐 Auth state changed:', user ? `User logged in: ${user.uid}` : 'No user');
      setIsAuthenticated(!!user);
      if (user) {
        loadClasses();
      } else {
        setClasses([]);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const loadClasses = async () => {
    if (!auth.currentUser) {
      console.log('❌ No authenticated user found');
      setLoading(false);
      return;
    }

    try {
      console.log('🔄 Loading classes for user:', auth.currentUser.uid);
      setLoading(true);
      
      // Ensure user document exists
      await ensureUserDocument();
      
      const result = await getClasses({ limit: 100 }); // Load up to 100 classes
      const fetchedClasses = result.data;
      console.log('✅ Classes loaded successfully:', fetchedClasses);
      setClasses(fetchedClasses || []);
      
      // Load student counts for each class (now using metadata)
      const counts: {[key: string]: number} = {};
      for (const cls of fetchedClasses || []) {
        counts[cls.id] = cls.studentCount || 0;
      }
      setClassStudentCounts(counts);
    } catch (error) {
      console.error('❌ Error loading classes:', error);
      if (error instanceof Error && error.message.includes('No authenticated user')) {
        Alert.alert('Authentication Error', 'Please log in to access your classrooms.');
      } else {
        Alert.alert('Error', 'Failed to load classrooms. Please check your internet connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddClassroom = async (data: { name: string }) => {
    console.log('🚀 handleAddClassroom called with data:', data);
    
    if (!auth.currentUser) {
      console.error('❌ No authenticated user in handleAddClassroom');
      Alert.alert('Authentication Error', 'Please log in to create classrooms.');
      return;
    }

    if (!data.name.trim()) {
      console.error('❌ Empty classroom name');
      Alert.alert('Error', 'Please enter a classroom name');
      return;
    }

    try {
      console.log('➕ Adding classroom:', data.name);
      console.log('👤 Current user:', auth.currentUser.uid);
      setLoading(true);
      
      // Ensure user document exists
      await ensureUserDocument();
      
      // Add class to Firebase
      const classId = await addClass(data.name.trim());
      
      console.log('✅ Classroom added with ID:', classId);
      
      // Reload classes from Firebase to get the updated list
      await loadClasses();
      
      // Close modal
      setAddModalVisible(false);
      
      // Show success message
      Alert.alert('Success', `Classroom "${data.name}" created successfully!`);
      
    } catch (error) {
      console.error('❌ Error adding classroom:', error);
      if (error instanceof Error && error.message.includes('No authenticated user')) {
        Alert.alert('Authentication Error', 'Please log in to create classrooms.');
      } else {
        Alert.alert('Error', 'Failed to create classroom. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!auth.currentUser) {
      Alert.alert('Authentication Error', 'Please log in to access your classrooms.');
      return;
    }
    
    setRefreshing(true);
    await loadClasses();
    setRefreshing(false);
  };

  const handleClassroomPress = (classroom: Class) => {
    setSelectedClassroom(classroom);
  };

  const handleClassUpdate = (updatedClass: Class) => {
    setSelectedClassroom(updatedClass);
    // Update the class in the main list
    setClasses(prevClasses => 
      prevClasses.map(cls => 
        cls.id === updatedClass.id ? updatedClass : cls
      )
    );
  };

  const handleBackFromClassroom = () => {
    setSelectedClassroom(null);
    // Refresh data when returning
    loadClasses();
  };

  const handleEditClassroom = async () => {
    if (!editingClass || !editClassName.trim()) {
      Alert.alert('Error', 'Please enter a classroom name');
      return;
    }

    try {
      setLoading(true);
      await updateClass(editingClass.id, { name: editClassName.trim() });
      
      // Update local state
      setClasses(prevClasses =>
        prevClasses.map(cls =>
          cls.id === editingClass.id
            ? { ...cls, name: editClassName.trim() }
            : cls
        )
      );
      
      setEditingClass(null);
      setEditClassName('');
      Alert.alert('Success', 'Classroom updated successfully');
    } catch (error) {
      console.error('Error updating classroom:', error);
      Alert.alert('Error', 'Failed to update classroom');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClassroom = async (classId: string) => {
    Alert.alert(
      'Delete Classroom',
      'Are you sure you want to delete this classroom? This will also delete all students, subjects, attendance records, tests, and grades.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await deleteClass(classId);
              
              // Update local state
              setClasses(prevClasses => prevClasses.filter(cls => cls.id !== classId));
              
              // Remove from student counts
              setClassStudentCounts(prev => {
                const newCounts = { ...prev };
                delete newCounts[classId];
                return newCounts;
              });
              
              Alert.alert('Success', 'Classroom deleted successfully');
            } catch (error) {
              console.error('Error deleting classroom:', error);
              Alert.alert('Error', 'Failed to delete classroom');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const openEditModal = (classroom: Class) => {
    setEditingClass(classroom);
    setEditClassName(classroom.name);
  };



  if (selectedClassroom) {
    return (
              <EnhancedClassroomDetail
          classroom={selectedClassroom}
          onBack={handleBackFromClassroom}
          onClassUpdate={handleClassUpdate}
        />
    );
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.authMessage}>Please log in to access your classrooms</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Classrooms</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
            <RefreshCw size={20} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={styles.loadingText}>Loading classrooms...</Text>
        </View>
      ) : classes.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No classrooms yet</Text>
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={() => setAddModalVisible(true)}
            activeOpacity={0.8}
          >
            <Plus size={48} color="#000" />
            <Text style={styles.addButtonText}>Add your classroom</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.content}>
          <Text style={styles.classCount}>You have {classes.length} classroom{classes.length !== 1 ? 's' : ''}</Text>
          <FlatList
            data={classes}
            keyExtractor={(item) => item.id}
            numColumns={2}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            renderItem={({ item }) => (
              <ClassroomCard
                classroom={item}
                studentCount={classStudentCounts[item.id] || 0}
                onPress={() => handleClassroomPress(item)}
                onEdit={() => openEditModal(item)}
                onDelete={() => handleDeleteClassroom(item.id)}
              />
            )}
            contentContainerStyle={styles.gridContainer}
          />
        </View>
      )}

      {/* Floating Add Button - only show when classes exist */}
      {!loading && classes.length > 0 && (
        <TouchableOpacity 
          style={styles.floatingAddButton} 
          onPress={() => setAddModalVisible(true)}
        >
          <Plus size={24} color="#fff" />
        </TouchableOpacity>
      )}

      <AddClassroomModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onSave={handleAddClassroom}
      />

      {/* Edit Classroom Modal */}
      <Modal
        visible={!!editingClass}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditingClass(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Classroom</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setEditingClass(null)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalInput}
              value={editClassName}
              onChangeText={setEditClassName}
              placeholder="Enter classroom name"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setEditingClass(null)}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleEditClassroom}
                disabled={loading}
              >
                <Text style={styles.modalSaveButtonText}>
                  {loading ? 'Updating...' : 'Update'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    fontFamily: 'Poppins',
    color: '#000',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  testButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  testButtonText: {
    fontSize: 12,
    fontFamily: 'Poppins',
    color: '#666',
  },
  refreshButton: {
    padding: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  authMessage: {
    fontSize: 18,
    fontFamily: 'Poppins',
    color: '#666',
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Poppins',
    color: '#666',
  },
  emptyText: {
    fontSize: 18,
    fontFamily: 'Poppins',
    color: '#666',
    marginBottom: 24,
  },
  addButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  addButtonText: {
    fontSize: 18,
    fontWeight: '500',
    fontFamily: 'Poppins',
    color: '#000',
    marginTop: 16,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  classCount: {
    fontSize: 16,
    fontFamily: 'Poppins',
    color: '#666',
    padding: 16,
    paddingBottom: 8,
  },
  gridContainer: {
    padding: 8,
  },
  floatingAddButton: {
    position: 'absolute',
    bottom: 24,
    left: '50%',
    marginLeft: -28,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#000',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalSaveButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#000',
    borderRadius: 6,
    alignItems: 'center',
  },
  modalSaveButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
}); 