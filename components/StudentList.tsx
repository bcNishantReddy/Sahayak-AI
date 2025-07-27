import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, ActivityIndicator } from 'react-native';
import { User, CheckCircle, XCircle, MinusCircle, BarChart3 } from 'lucide-react-native';
import { Student } from '@/types';

interface StudentListProps {
  students: Student[];
  attendanceRecords: { [studentId: string]: 'present' | 'absent' | 'unmarked' };
  onToggle: (studentId: string, status: 'present' | 'absent' | 'unmarked') => void;
  onMarkAllPresent: () => void;
  onSave: () => void;
  onShowStats?: (student: Student) => void;
  loading: boolean;
}

const StudentList: React.FC<StudentListProps> = ({ 
  students, 
  attendanceRecords, 
  onToggle, 
  onMarkAllPresent, 
  onSave, 
  onShowStats,
  loading 
}) => {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Mark Attendance</Text>
        <TouchableOpacity onPress={onMarkAllPresent} style={styles.markAllButton}>
          <Text style={styles.markAllButtonText}>Mark All Present</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={students}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.attendanceCard}
            onPress={() => onShowStats?.(item)}
            activeOpacity={0.7}
          >
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
            <View style={styles.attendanceToggles}>
              <TouchableOpacity
                style={[styles.attendanceToggle, attendanceRecords[item.id] === 'present' && styles.attendanceToggleActive]}
                onPress={(e) => {
                  e.stopPropagation();
                  onToggle(item.id, 'present');
                }}
              >
                <CheckCircle size={20} color={attendanceRecords[item.id] === 'present' ? '#fff' : '#4CAF50'} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.attendanceToggle, attendanceRecords[item.id] === 'absent' && styles.attendanceToggleActive]}
                onPress={(e) => {
                  e.stopPropagation();
                  onToggle(item.id, 'absent');
                }}
              >
                <XCircle size={20} color={attendanceRecords[item.id] === 'absent' ? '#fff' : '#f44336'} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.attendanceToggle, attendanceRecords[item.id] === 'unmarked' && styles.attendanceToggleActive]}
                onPress={(e) => {
                  e.stopPropagation();
                  onToggle(item.id, 'unmarked');
                }}
              >
                <MinusCircle size={20} color={attendanceRecords[item.id] === 'unmarked' ? '#fff' : '#999'} />
              </TouchableOpacity>
            </View>
            {onShowStats && (
              <TouchableOpacity 
                style={styles.statsIcon}
                onPress={(e) => {
                  e.stopPropagation();
                  onShowStats(item);
                }}
              >
                <BarChart3 size={16} color="#666" />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        )}
      />
      <TouchableOpacity 
        style={[styles.saveButton, loading && styles.saveButtonDisabled]} 
        onPress={onSave}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>Save Attendance</Text>
        )}
      </TouchableOpacity>
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
  markAllButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  markAllButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Poppins',
  },
  attendanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7f7f7',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
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
  attendanceToggles: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attendanceToggle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  attendanceToggleActive: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  statsIcon: {
    marginLeft: 8,
    padding: 4,
  },
  saveButton: {
    backgroundColor: '#000',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins',
  },
});

export default StudentList; 