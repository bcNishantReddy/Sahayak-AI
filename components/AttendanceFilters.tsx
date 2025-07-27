import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { Calendar } from 'lucide-react-native';
import { Class } from '@/types';

interface AttendanceFiltersProps {
  classes: Class[];
  filters: {
    classId: string;
    section: string;
    subject: string;
    date: string;
  };
  onChange: (filters: AttendanceFiltersProps['filters']) => void;
}

const AttendanceFilters: React.FC<AttendanceFiltersProps> = ({ classes, filters, onChange }) => {
  const selectedClass = classes.find(c => c.id === filters.classId);

  if (!selectedClass) {
    return <Text style={{ color: '#666', fontFamily: 'Poppins', margin: 16 }}>Please select a class to begin.</Text>;
  }

  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>Attendance Filters</Text>
      {/* Class Filter */}
      <Text style={styles.filterLabel}>Class</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        {classes.map(cls => (
          <TouchableOpacity
            key={cls.id}
            style={[styles.filterChip, filters.classId === cls.id && styles.filterChipActive]}
            onPress={() => onChange({ ...filters, classId: cls.id, section: '', subject: '' })}
          >
            <Text style={[styles.filterChipText, filters.classId === cls.id && styles.filterChipTextActive]}>{cls.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {/* Section Filter */}
      <Text style={styles.filterLabel}>Section</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        {selectedClass.sections.map(section => (
          <TouchableOpacity
            key={section}
            style={[styles.filterChip, filters.section === section && styles.filterChipActive]}
            onPress={() => onChange({ ...filters, section, subject: '' })}
          >
            <Text style={[styles.filterChipText, filters.section === section && styles.filterChipTextActive]}>{section}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {/* Subject Filter */}
      <Text style={styles.filterLabel}>Subject</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        {selectedClass.subjects.map(subject => (
          <TouchableOpacity
            key={subject}
            style={[styles.filterChip, filters.subject === subject && styles.filterChipActive]}
            onPress={() => onChange({ ...filters, subject })}
          >
            <Text style={[styles.filterChipText, filters.subject === subject && styles.filterChipTextActive]}>{subject}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {/* Date Filter */}
      <Text style={styles.filterLabel}>Date</Text>
      <View style={styles.dateContainer}>
        <Calendar size={20} color="#666" />
        <TextInput
          style={styles.dateInput}
          value={filters.date}
          onChangeText={date => onChange({ ...filters, date })}
          placeholder="YYYY-MM-DD"
        />
      </View>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Poppins',
    color: '#000',
    marginBottom: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Poppins',
    color: '#000',
    marginTop: 12,
    marginBottom: 8,
  },
  filterScroll: {
    marginBottom: 8,
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
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7f7f7',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dateInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    fontFamily: 'Poppins',
    color: '#000',
  },
});

export default AttendanceFilters; 