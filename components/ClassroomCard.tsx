import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Users, Edit, Trash2 } from 'lucide-react-native';
import { Class } from '@/types';

interface ClassroomCardProps {
  classroom: Class;
  studentCount: number;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const ClassroomCard: React.FC<ClassroomCardProps> = ({ classroom, studentCount, onPress, onEdit, onDelete }) => {
  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.cardContent} onPress={onPress} activeOpacity={0.8}>
        <Text style={styles.className}>{classroom.name}</Text>
        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <Users size={16} color="#666" />
            <Text style={styles.statText}>{studentCount} students</Text>
          </View>
        </View>
      </TouchableOpacity>
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
          <Edit size={16} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={onDelete}>
          <Trash2 size={16} color="#ff4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    margin: 8,
    width: '45%',
    minHeight: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  className: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Poppins',
    color: '#000',
    marginBottom: 8,
  },
  statsContainer: {
    marginBottom: 8,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins',
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    padding: 4,
    borderRadius: 4,
  },
});

export default ClassroomCard; 