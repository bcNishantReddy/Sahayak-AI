import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { X, TrendingUp, Calendar, User } from 'lucide-react-native';
import { Student, Class, AttendanceRecord } from '@/types';

interface AttendanceStatsModalProps {
  visible: boolean;
  onClose: () => void;
  student?: Student;
  classData?: Class;
  attendanceData: AttendanceRecord[];
  dateRange: { start: string; end: string };
}

const AttendanceStatsModal: React.FC<AttendanceStatsModalProps> = ({ 
  visible, 
  onClose, 
  student, 
  classData, 
  attendanceData, 
  dateRange 
}) => {
  // Calculate statistics
  const totalSessions = attendanceData.length;
  const presentSessions = attendanceData.filter(r => r.status === 'present').length;
  const attendancePercentage = totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 0;

  // Subject-wise breakdown
  const subjectStats = classData?.subjects.map(subject => {
    const subjectRecords = attendanceData.filter(r => r.subject === subject);
    const subjectTotal = subjectRecords.length;
    const subjectPresent = subjectRecords.filter(r => r.status === 'present').length;
    const subjectPercentage = subjectTotal > 0 ? Math.round((subjectPresent / subjectTotal) * 100) : 0;
    return { subject, total: subjectTotal, present: subjectPresent, percentage: subjectPercentage };
  }) || [];

  // Weekly breakdown (last 7 days)
  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const dayRecords = attendanceData.filter(r => r.date === dateStr);
    const dayPresent = dayRecords.filter(r => r.status === 'present').length;
    const dayTotal = dayRecords.length;
    return {
      date: dateStr,
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      present: dayPresent,
      total: dayTotal,
      percentage: dayTotal > 0 ? Math.round((dayPresent / dayTotal) * 100) : 0
    };
  }).reverse();

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Attendance Statistics</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#000" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.scrollContent}>
            {/* Student Info */}
            {student && (
              <View style={styles.studentInfo}>
                <User size={24} color="#666" />
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.studentName}>{student.name}</Text>
                  <Text style={styles.studentMeta}>{student.section} • {student.subjects.join(', ')}</Text>
                </View>
              </View>
            )}

            {/* Overall Statistics */}
            <View style={styles.statsCard}>
              <Text style={styles.sectionTitle}>Overall Attendance</Text>
              <View style={styles.statRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{attendancePercentage}%</Text>
                  <Text style={styles.statLabel}>Attendance Rate</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{presentSessions}/{totalSessions}</Text>
                  <Text style={styles.statLabel}>Present/Total</Text>
                </View>
              </View>
            </View>

            {/* Subject-wise Breakdown */}
            {subjectStats.length > 0 && (
              <View style={styles.statsCard}>
                <Text style={styles.sectionTitle}>Subject-wise Breakdown</Text>
                {subjectStats.map((stat, index) => (
                  <View key={index} style={styles.subjectRow}>
                    <Text style={styles.subjectName}>{stat.subject}</Text>
                    <View style={styles.subjectStats}>
                      <Text style={styles.subjectPercentage}>{stat.percentage}%</Text>
                      <Text style={styles.subjectCount}>({stat.present}/{stat.total})</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Weekly Breakdown */}
            <View style={styles.statsCard}>
              <Text style={styles.sectionTitle}>Weekly Breakdown</Text>
              <View style={styles.weeklyContainer}>
                {weeklyData.map((day, index) => (
                  <View key={index} style={styles.dayItem}>
                    <Text style={styles.dayName}>{day.day}</Text>
                    <Text style={styles.dayPercentage}>{day.percentage}%</Text>
                    <Text style={styles.dayCount}>{day.present}/{day.total}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Date Range */}
            <View style={styles.dateRangeCard}>
              <Calendar size={16} color="#666" />
              <Text style={styles.dateRangeText}>
                {dateRange.start} to {dateRange.end}
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Poppins',
    color: '#000',
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    padding: 20,
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7f7f7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
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
    marginTop: 2,
  },
  statsCard: {
    backgroundColor: '#f7f7f7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins',
    color: '#000',
    marginBottom: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Poppins',
    color: '#000',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins',
    marginTop: 4,
  },
  subjectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  subjectName: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Poppins',
    color: '#000',
  },
  subjectStats: {
    alignItems: 'flex-end',
  },
  subjectPercentage: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins',
    color: '#000',
  },
  subjectCount: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins',
  },
  weeklyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayItem: {
    alignItems: 'center',
    flex: 1,
  },
  dayName: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Poppins',
    color: '#666',
    marginBottom: 4,
  },
  dayPercentage: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Poppins',
    color: '#000',
  },
  dayCount: {
    fontSize: 10,
    color: '#666',
    fontFamily: 'Poppins',
    marginTop: 2,
  },
  dateRangeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
  },
  dateRangeText: {
    fontSize: 13,
    color: '#666',
    fontFamily: 'Poppins',
    marginLeft: 8,
  },
});

export default AttendanceStatsModal; 