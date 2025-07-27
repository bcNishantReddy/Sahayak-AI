import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal
} from 'react-native';
import {
  BarChart3,
  Download,
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  ArrowLeft,
  FileText
} from 'lucide-react-native';
import { Subject, Student, AttendanceRecord } from '@/types';
import { getAttendanceReport, getStudentAttendanceSummary } from '@/utils/attendanceFirestore';
import { useTranslation } from 'react-i18next';

interface AttendanceReportGeneratorProps {
  visible: boolean;
  onClose: () => void;
  classId: string;
  subjects: Subject[];
  students: Student[];
}

interface ReportData {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  attendancePercentage: number;
}

export default function AttendanceReportGenerator({
  visible,
  onClose,
  classId,
  subjects,
  students
}: AttendanceReportGeneratorProps) {
  const { t } = useTranslation();
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState<{[key: string]: ReportData}>({});
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  console.log('📊 AttendanceReportGenerator props:', { visible, classId, subjectsCount: subjects.length, studentsCount: students.length });

  useEffect(() => {
    console.log('📊 Setting up default values');
    // Set default dates (last 30 days)
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    
    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
    
    if (subjects.length > 0) {
      setSelectedSubject(subjects[0].id);
      console.log('📊 Set default subject:', subjects[0].name);
    }
  }, [subjects]);

  const generateReport = async () => {
    console.log('📊 Generating report with:', { selectedSubject, startDate, endDate, classId });
    
    if (!selectedSubject || !startDate || !endDate) {
      Alert.alert('Error', 'Please select subject and date range');
      return;
    }

    setLoading(true);
    try {
      console.log('📊 Fetching attendance summary...');
      const summary = await getStudentAttendanceSummary(classId, selectedSubject, startDate, endDate);
      console.log('📊 Received summary:', summary);
      
      const data: {[key: string]: ReportData} = {};
      summary.forEach(student => {
        data[student.studentId] = {
          totalDays: student.totalDays,
          presentDays: student.presentDays,
          absentDays: student.absentDays,
          attendancePercentage: student.attendancePercentage
        };
      });
      
      console.log('📊 Processed report data:', data);
      setReportData(data);
    } catch (error) {
      console.error('❌ Error generating report:', error);
      Alert.alert('Error', 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async () => {
    Alert.alert('Export', 'Report export functionality will be implemented here');
  };

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 90) return '#34C759';
    if (percentage >= 75) return '#FF9500';
    return '#FF3B30';
  };

  const getAttendanceStatus = (percentage: number) => {
    if (percentage >= 90) return 'Excellent';
    if (percentage >= 75) return 'Good';
    if (percentage >= 60) return 'Fair';
    return 'Poor';
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
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={onClose}>
              <ArrowLeft size={24} color="#000" />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Attendance Report</Text>
              <Text style={styles.headerSubtitle}>Generate detailed reports</Text>
            </View>
            <TouchableOpacity style={styles.exportButton} onPress={exportReport}>
              <Download size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Filters */}
            <View style={styles.filtersSection}>
              <Text style={styles.sectionTitle}>Report Filters</Text>
              
              {/* Subject Selector */}
              <View style={styles.filterItem}>
                <Text style={styles.filterLabel}>Subject</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {subjects.map((subject) => (
                    <TouchableOpacity
                      key={subject.id}
                      style={[
                        styles.subjectChip,
                        selectedSubject === subject.id && styles.selectedSubjectChip
                      ]}
                      onPress={() => setSelectedSubject(subject.id)}
                    >
                      <Text style={[
                        styles.subjectChipText,
                        selectedSubject === subject.id && styles.selectedSubjectChipText
                      ]}>
                        {subject.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Date Range */}
              <View style={styles.filterItem}>
                <Text style={styles.filterLabel}>Date Range</Text>
                <View style={styles.dateContainer}>
                  <View style={styles.dateInput}>
                    <Calendar size={16} color="#666" />
                    <Text style={styles.dateText}>{startDate}</Text>
                  </View>
                  <Text style={styles.dateSeparator}>to</Text>
                  <View style={styles.dateInput}>
                    <Calendar size={16} color="#666" />
                    <Text style={styles.dateText}>{endDate}</Text>
                  </View>
                </View>
              </View>

              {/* Generate Button */}
              <TouchableOpacity
                style={styles.generateButton}
                onPress={generateReport}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <BarChart3 size={20} color="#fff" />
                    <Text style={styles.generateButtonText}>Generate Report</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Report Results */}
            {Object.keys(reportData).length > 0 ? (
              <View style={styles.resultsSection}>
                <Text style={styles.sectionTitle}>Attendance Summary</Text>
                
                {/* Overall Stats */}
                <View style={styles.overallStats}>
                  <View style={styles.statCard}>
                    <Users size={24} color="#007AFF" />
                    <Text style={styles.statNumber}>{students.length}</Text>
                    <Text style={styles.statLabel}>Total Students</Text>
                  </View>
                  <View style={styles.statCard}>
                    <CheckCircle size={24} color="#34C759" />
                    <Text style={styles.statNumber}>
                      {Object.values(reportData).filter(d => d.attendancePercentage >= 75).length}
                    </Text>
                    <Text style={styles.statLabel}>Good Attendance</Text>
                  </View>
                  <View style={styles.statCard}>
                    <XCircle size={24} color="#FF3B30" />
                    <Text style={styles.statNumber}>
                      {Object.values(reportData).filter(d => d.attendancePercentage < 75).length}
                    </Text>
                    <Text style={styles.statLabel}>Needs Attention</Text>
                  </View>
                </View>

                {/* Student Details */}
                <View style={styles.studentDetails}>
                  <Text style={styles.subsectionTitle}>Student Details</Text>
                  {students.map((student) => {
                    const data = reportData[student.id];
                    if (!data) return null;

                    return (
                      <View key={student.id} style={styles.studentReportCard}>
                        <View style={styles.studentInfo}>
                          <View style={styles.studentAvatar}>
                            <Text style={styles.avatarText}>
                              {student.name.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                          <View style={styles.studentInfoDetails}>
                            <Text style={styles.studentName}>{student.name}</Text>
                            <Text style={styles.studentSection}>Section {student.section}</Text>
                          </View>
                        </View>
                        
                        <View style={styles.attendanceStats}>
                          <View style={styles.attendanceBar}>
                            <View 
                              style={[
                                styles.attendanceFill,
                                { 
                                  width: `${data.attendancePercentage}%`,
                                  backgroundColor: getAttendanceColor(data.attendancePercentage)
                                }
                              ]} 
                            />
                          </View>
                          <View style={styles.attendanceNumbers}>
                            <Text style={styles.attendancePercentage}>
                              {data.attendancePercentage.toFixed(1)}%
                            </Text>
                            <Text style={styles.attendanceStatus}>
                              {getAttendanceStatus(data.attendancePercentage)}
                            </Text>
                          </View>
                        </View>
                        
                        <View style={styles.detailedStats}>
                          <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Present</Text>
                            <Text style={styles.detailValue}>{data.presentDays}</Text>
                          </View>
                          <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Absent</Text>
                            <Text style={styles.detailValue}>{data.absentDays}</Text>
                          </View>
                          <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Total Days</Text>
                            <Text style={styles.detailValue}>{data.totalDays}</Text>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            ) : (
              <View style={styles.resultsSection}>
                <Text style={styles.sectionTitle}>No Report Data</Text>
                <Text style={styles.noDataText}>
                  Click "Generate Report" to create an attendance report for the selected subject and date range.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

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
    width: '95%',
    maxWidth: 500,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden', // Ensure content doesn't overflow
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  exportButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f8ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  filtersSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  filterItem: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 8,
  },
  subjectChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  selectedSubjectChip: {
    backgroundColor: '#007AFF',
  },
  subjectChipText: {
    fontSize: 14,
    color: '#666',
  },
  selectedSubjectChipText: {
    color: '#fff',
    fontWeight: '500',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  dateText: {
    fontSize: 14,
    color: '#000',
    marginLeft: 8,
  },
  dateSeparator: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 8,
  },
  generateButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 10,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  resultsSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  overallStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  studentDetails: {
    marginTop: 20,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  studentReportCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  studentInfoDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  studentSection: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  attendanceStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  attendanceBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    marginRight: 12,
    overflow: 'hidden',
  },
  attendanceFill: {
    height: '100%',
    borderRadius: 4,
  },
  attendanceNumbers: {
    alignItems: 'flex-end',
  },
  attendancePercentage: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  attendanceStatus: {
    fontSize: 12,
    color: '#666',
  },
  detailedStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  noDataText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
}); 