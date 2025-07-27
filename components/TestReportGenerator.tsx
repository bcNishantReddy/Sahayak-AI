import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput
} from 'react-native';
import {
  X,
  BarChart3,
  Download,
  FileText,
  Users,
  Award,
  TrendingUp,
  Target,
  Calendar
} from 'lucide-react-native';
import { Test, Student, Grade, Subject } from '@/types';
import { getGrades, getStudentAttendanceSummary } from '@/utils/attendanceFirestore';
import { useTranslation } from 'react-i18next';

interface TestReportGeneratorProps {
  visible: boolean;
  onClose: () => void;
  classId: string;
  tests: Test[];
  students: Student[];
  subjects: Subject[];
}

type ReportType = 'overall' | 'test-wise' | 'student-wise' | 'subject-wise' | 'attendance';

interface ReportData {
  totalStudents: number;
  totalTests: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  passRate: number;
  topPerformers: Array<{ studentId: string; name: string; averageScore: number }>;
  subjectPerformance: Array<{ subjectId: string; name: string; averageScore: number }>;
}

export default function TestReportGenerator({
  visible,
  onClose,
  classId,
  tests,
  students,
  subjects
}: TestReportGeneratorProps) {
  const { t } = useTranslation();
  const [selectedReportType, setSelectedReportType] = useState<ReportType>('overall');
  const [selectedTest, setSelectedTest] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [includeAttendance, setIncludeAttendance] = useState(false);

  useEffect(() => {
    if (visible) {
      // Set default date range (last 30 days)
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 30);
      
      setDateRange({
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
      });

      if (tests.length > 0) {
        setSelectedTest(tests[0].id);
      }
      if (subjects.length > 0) {
        setSelectedSubject(subjects[0].id);
      }
      if (students.length > 0) {
        setSelectedStudent(students[0].id);
      }
    }
  }, [visible, tests, subjects, students]);

  const generateReport = async () => {
    setLoading(true);
    try {
      let data: ReportData = {
        totalStudents: students.length,
        totalTests: tests.length,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 100,
        passRate: 0,
        topPerformers: [],
        subjectPerformance: []
      };

      // Get all grades for the class
      const gradesResult = await getGrades(undefined, classId);
      const allGrades = gradesResult.data || [];

      if (allGrades.length > 0) {
        // Calculate overall statistics
        const totalMarks = allGrades.reduce((sum, grade) => sum + grade.marksObtained, 0);
        const totalPossibleMarks = allGrades.reduce((sum, grade) => sum + grade.totalMarks, 0);
        data.averageScore = totalPossibleMarks > 0 ? (totalMarks / totalPossibleMarks) * 100 : 0;
        data.highestScore = Math.max(...allGrades.map(g => g.percentage));
        data.lowestScore = Math.min(...allGrades.map(g => g.percentage));
        data.passRate = (allGrades.filter(g => g.percentage >= 40).length / allGrades.length) * 100;

        // Calculate top performers
        const studentAverages: { [key: string]: { total: number; count: number; name: string } } = {};
        allGrades.forEach(grade => {
          const student = students.find(s => s.id === grade.studentId);
          if (student) {
            if (!studentAverages[grade.studentId]) {
              studentAverages[grade.studentId] = { total: 0, count: 0, name: student.name };
            }
            studentAverages[grade.studentId].total += grade.percentage;
            studentAverages[grade.studentId].count += 1;
          }
        });

        data.topPerformers = Object.entries(studentAverages)
          .map(([studentId, data]) => ({
            studentId,
            name: data.name,
            averageScore: data.total / data.count
          }))
          .sort((a, b) => b.averageScore - a.averageScore)
          .slice(0, 5);

        // Calculate subject performance
        const subjectAverages: { [key: string]: { total: number; count: number; name: string } } = {};
        allGrades.forEach(grade => {
          const subject = subjects.find(s => s.id === grade.subjectId);
          if (subject) {
            if (!subjectAverages[grade.subjectId]) {
              subjectAverages[grade.subjectId] = { total: 0, count: 0, name: subject.name };
            }
            subjectAverages[grade.subjectId].total += grade.percentage;
            subjectAverages[grade.subjectId].count += 1;
          }
        });

        data.subjectPerformance = Object.entries(subjectAverages)
          .map(([subjectId, data]) => ({
            subjectId,
            name: data.name,
            averageScore: data.total / data.count
          }))
          .sort((a, b) => b.averageScore - a.averageScore);
      }

      setReportData(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async () => {
    Alert.alert('Export Report', 'Report export functionality will be implemented here');
  };

  const ReportTypeButton = ({ type, icon: Icon, label }: { type: ReportType; icon: any; label: string }) => (
    <TouchableOpacity
      style={[styles.reportTypeButton, selectedReportType === type && styles.selectedReportTypeButton]}
      onPress={() => setSelectedReportType(type)}
    >
      <Icon size={20} color={selectedReportType === type ? '#fff' : '#000'} />
      <Text style={[styles.reportTypeText, selectedReportType === type && styles.selectedReportTypeText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

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
          <View style={styles.modalHeader}>
            <View style={styles.headerContent}>
              <Text style={styles.modalTitle}>Generate Test Report</Text>
              <Text style={styles.modalSubtitle}>Select report type and filters</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Report Type Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Report Type</Text>
              <View style={styles.reportTypeGrid}>
                <ReportTypeButton type="overall" icon={BarChart3} label="Overall" />
                <ReportTypeButton type="test-wise" icon={FileText} label="Test-wise" />
                <ReportTypeButton type="student-wise" icon={Users} label="Student-wise" />
                <ReportTypeButton type="subject-wise" icon={Award} label="Subject-wise" />
                <ReportTypeButton type="attendance" icon={Calendar} label="Attendance" />
              </View>
            </View>

            {/* Filters */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Filters</Text>
              
              {selectedReportType === 'test-wise' && (
                <View style={styles.filterItem}>
                  <Text style={styles.filterLabel}>Select Test</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {tests.map((test) => (
                      <TouchableOpacity
                        key={test.id}
                        style={[
                          styles.filterChip,
                          selectedTest === test.id && styles.selectedFilterChip
                        ]}
                        onPress={() => setSelectedTest(test.id)}
                      >
                        <Text style={[
                          styles.filterChipText,
                          selectedTest === test.id && styles.selectedFilterChipText
                        ]}>
                          {test.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {selectedReportType === 'subject-wise' && (
                <View style={styles.filterItem}>
                  <Text style={styles.filterLabel}>Select Subject</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {subjects.map((subject) => (
                      <TouchableOpacity
                        key={subject.id}
                        style={[
                          styles.filterChip,
                          selectedSubject === subject.id && styles.selectedFilterChip
                        ]}
                        onPress={() => setSelectedSubject(subject.id)}
                      >
                        <Text style={[
                          styles.filterChipText,
                          selectedSubject === subject.id && styles.selectedFilterChipText
                        ]}>
                          {subject.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {selectedReportType === 'student-wise' && (
                <View style={styles.filterItem}>
                  <Text style={styles.filterLabel}>Select Student</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {students.map((student) => (
                      <TouchableOpacity
                        key={student.id}
                        style={[
                          styles.filterChip,
                          selectedStudent === student.id && styles.selectedFilterChip
                        ]}
                        onPress={() => setSelectedStudent(student.id)}
                      >
                        <Text style={[
                          styles.filterChipText,
                          selectedStudent === student.id && styles.selectedFilterChipText
                        ]}>
                          {student.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              <View style={styles.filterItem}>
                <Text style={styles.filterLabel}>Date Range</Text>
                <View style={styles.dateContainer}>
                  <View style={styles.dateInput}>
                    <Calendar size={16} color="#666" />
                    <Text style={styles.dateText}>{dateRange.start}</Text>
                  </View>
                  <Text style={styles.dateSeparator}>to</Text>
                  <View style={styles.dateInput}>
                    <Calendar size={16} color="#666" />
                    <Text style={styles.dateText}>{dateRange.end}</Text>
                  </View>
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

            {/* Report Results */}
            {reportData && (
              <View style={styles.resultsSection}>
                <View style={styles.resultsHeader}>
                  <Text style={styles.resultsTitle}>Report Results</Text>
                  <TouchableOpacity style={styles.exportButton} onPress={exportReport}>
                    <Download size={16} color="#000" />
                    <Text style={styles.exportButtonText}>Export</Text>
                  </TouchableOpacity>
                </View>

                {/* Overall Stats */}
                <View style={styles.statsGrid}>
                  <View style={styles.statCard}>
                    <Users size={20} color="#000" />
                    <Text style={styles.statNumber}>{reportData.totalStudents}</Text>
                    <Text style={styles.statLabel}>Students</Text>
                  </View>
                  <View style={styles.statCard}>
                    <FileText size={20} color="#000" />
                    <Text style={styles.statNumber}>{reportData.totalTests}</Text>
                    <Text style={styles.statLabel}>Tests</Text>
                  </View>
                  <View style={styles.statCard}>
                    <TrendingUp size={20} color="#000" />
                    <Text style={styles.statNumber}>{reportData.averageScore.toFixed(1)}%</Text>
                    <Text style={styles.statLabel}>Avg Score</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Target size={20} color="#000" />
                    <Text style={styles.statNumber}>{reportData.passRate.toFixed(1)}%</Text>
                    <Text style={styles.statLabel}>Pass Rate</Text>
                  </View>
                </View>

                {/* Top Performers */}
                {reportData.topPerformers.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Top Performers</Text>
                    {reportData.topPerformers.map((performer, index) => (
                      <View key={performer.studentId} style={styles.performerCard}>
                        <View style={styles.rankBadge}>
                          <Text style={styles.rankText}>{index + 1}</Text>
                        </View>
                        <View style={styles.performerInfo}>
                          <Text style={styles.performerName}>{performer.name}</Text>
                          <Text style={styles.performerScore}>
                            {performer.averageScore.toFixed(1)}% average
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* Subject Performance */}
                {reportData.subjectPerformance.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Subject Performance</Text>
                    {reportData.subjectPerformance.map((subject) => (
                      <View key={subject.subjectId} style={styles.subjectCard}>
                        <Text style={styles.subjectName}>{subject.name}</Text>
                        <Text style={styles.subjectScore}>
                          {subject.averageScore.toFixed(1)}% average
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
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
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerContent: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  reportTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reportTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    minWidth: 100,
  },
  selectedReportTypeButton: {
    backgroundColor: '#000',
  },
  reportTypeText: {
    fontSize: 12,
    color: '#000',
    marginLeft: 6,
    fontWeight: '500',
  },
  selectedReportTypeText: {
    color: '#fff',
  },
  filterItem: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    marginBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  selectedFilterChip: {
    backgroundColor: '#000',
  },
  filterChipText: {
    fontSize: 12,
    color: '#666',
  },
  selectedFilterChipText: {
    color: '#fff',
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
    padding: 10,
    borderRadius: 8,
    marginRight: 8,
  },
  dateText: {
    fontSize: 12,
    color: '#000',
    marginLeft: 6,
  },
  dateSeparator: {
    fontSize: 12,
    color: '#666',
    marginHorizontal: 8,
  },
  generateButton: {
    backgroundColor: '#000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  resultsSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#fff',
  },
  exportButtonText: {
    fontSize: 12,
    color: '#000',
    marginLeft: 4,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: 80,
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
    textAlign: 'center',
  },
  performerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  performerInfo: {
    flex: 1,
  },
  performerName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  performerScore: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  subjectCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  subjectName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  subjectScore: {
    fontSize: 12,
    color: '#666',
  },
}); 