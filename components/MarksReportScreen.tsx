import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  FlatList
} from 'react-native';
import { ArrowLeft, Download, Filter, BarChart3, Award, Users, BookOpen } from 'lucide-react-native';
import { Class, Test, Grade, Student, Subject } from '@/types';
import { getTests, getGrades, getStudents, getSubjects } from '@/utils/attendanceFirestore';

interface MarksReportScreenProps {
  classroom: Class;
  onBack: () => void;
}

interface TestSummary {
  test: Test;
  totalStudents: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  passCount: number;
  failCount: number;
}

interface StudentSummary {
  student: Student;
  totalTests: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  totalMarks: number;
  totalObtained: number;
}

export default function MarksReportScreen({ classroom, onBack }: MarksReportScreenProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'tests' | 'students'>('overview');
  const [tests, setTests] = useState<Test[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  useEffect(() => {
    loadData();
  }, [classroom.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [testsData, studentsData, subjectsData] = await Promise.all([
        getTests(classroom.id),
        getStudents(classroom.id),
        getSubjects(classroom.id)
      ]);
      
      setTests(testsData.data);
      setStudents(studentsData.data);
      setSubjects(subjectsData.data);
      
      // Load all grades for this class
      const gradesData = await getGrades(undefined, classroom.id);
      setGrades(gradesData.data);
    } catch (error) {
      console.error('Error loading marks report data:', error);
      Alert.alert('Error', 'Failed to load marks report data');
    } finally {
      setLoading(false);
    }
  };

  const getTestSummary = (test: Test): TestSummary => {
    const testGrades = grades.filter(g => g.testId === test.id);
    const scores = testGrades.map(g => g.percentage);
    
    return {
      test,
      totalStudents: testGrades.length,
      averageScore: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
      highestScore: scores.length > 0 ? Math.max(...scores) : 0,
      lowestScore: scores.length > 0 ? Math.min(...scores) : 0,
      passCount: scores.filter(s => s >= 40).length,
      failCount: scores.filter(s => s < 40).length
    };
  };

  const getStudentSummary = (student: Student): StudentSummary => {
    const studentGrades = grades.filter(g => g.studentId === student.id);
    const scores = studentGrades.map(g => g.percentage);
    
    return {
      student,
      totalTests: studentGrades.length,
      averageScore: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
      highestScore: scores.length > 0 ? Math.max(...scores) : 0,
      lowestScore: scores.length > 0 ? Math.min(...scores) : 0,
      totalMarks: studentGrades.reduce((sum, g) => sum + g.totalMarks, 0),
      totalObtained: studentGrades.reduce((sum, g) => sum + g.marksObtained, 0)
    };
  };

  const getFilteredTests = () => {
    if (!selectedSubject) return tests;
    return tests.filter(test => test.subjectId === selectedSubject);
  };

  const getFilteredStudents = () => {
    if (!selectedSubject) return students;
    const subjectTests = tests.filter(test => test.subjectId === selectedSubject);
    const testIds = subjectTests.map(test => test.id);
    const relevantGrades = grades.filter(grade => testIds.includes(grade.testId));
    const studentIds = [...new Set(relevantGrades.map(grade => grade.studentId))];
    return students.filter(student => studentIds.includes(student.id));
  };

  const renderOverviewTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.overviewGrid}>
        <View style={styles.overviewCard}>
          <Text style={styles.overviewNumber}>{tests.length}</Text>
          <Text style={styles.overviewLabel}>Total Tests</Text>
        </View>
        <View style={styles.overviewCard}>
          <Text style={styles.overviewNumber}>{students.length}</Text>
          <Text style={styles.overviewLabel}>Total Students</Text>
        </View>
        <View style={styles.overviewCard}>
          <Text style={styles.overviewNumber}>{subjects.length}</Text>
          <Text style={styles.overviewLabel}>Total Subjects</Text>
        </View>
        <View style={styles.overviewCard}>
          <Text style={styles.overviewNumber}>{grades.length}</Text>
          <Text style={styles.overviewLabel}>Total Grades</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Tests</Text>
        {tests.slice(0, 3).map(test => {
          const summary = getTestSummary(test);
          const subject = subjects.find(s => s.id === test.subjectId);
          return (
            <View key={test.id} style={styles.testCard}>
              <View style={styles.testHeader}>
                <Text style={styles.testName}>{test.name}</Text>
                <Text style={styles.testSubject}>{subject?.name || 'Unknown'}</Text>
              </View>
              <View style={styles.testStats}>
                <Text style={styles.testStat}>Students: {summary.totalStudents}</Text>
                <Text style={styles.testStat}>Avg: {summary.averageScore.toFixed(1)}%</Text>
                <Text style={styles.testStat}>Pass: {summary.passCount}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );

  const renderTestsTab = () => (
    <View style={styles.tabContent}>
      <FlatList
        data={getFilteredTests()}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const summary = getTestSummary(item);
          const subject = subjects.find(s => s.id === item.subjectId);
          return (
            <View style={styles.testCard}>
              <View style={styles.testHeader}>
                <Text style={styles.testName}>{item.name}</Text>
                <Text style={styles.testSubject}>{subject?.name || 'Unknown'}</Text>
              </View>
              <View style={styles.testDetails}>
                <Text style={styles.testDate}>Date: {item.date}</Text>
                <Text style={styles.testMarks}>Total Marks: {item.totalMarks}</Text>
              </View>
              <View style={styles.testStats}>
                <Text style={styles.testStat}>Students: {summary.totalStudents}</Text>
                <Text style={styles.testStat}>Average: {summary.averageScore.toFixed(1)}%</Text>
                <Text style={styles.testStat}>Highest: {summary.highestScore.toFixed(1)}%</Text>
                <Text style={styles.testStat}>Lowest: {summary.lowestScore.toFixed(1)}%</Text>
                <Text style={styles.testStat}>Pass Rate: {summary.totalStudents > 0 ? ((summary.passCount / summary.totalStudents) * 100).toFixed(1) : 0}%</Text>
              </View>
            </View>
          );
        }}
      />
    </View>
  );

  const renderStudentsTab = () => (
    <View style={styles.tabContent}>
      <FlatList
        data={getFilteredStudents()}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const summary = getStudentSummary(item);
          return (
            <View style={styles.studentCard}>
              <View style={styles.studentHeader}>
                <Text style={styles.studentName}>{item.name}</Text>
                <Text style={styles.studentSection}>{item.section}</Text>
              </View>
              <View style={styles.studentStats}>
                <Text style={styles.studentStat}>Tests: {summary.totalTests}</Text>
                <Text style={styles.studentStat}>Average: {summary.averageScore.toFixed(1)}%</Text>
                <Text style={styles.studentStat}>Highest: {summary.highestScore.toFixed(1)}%</Text>
                <Text style={styles.studentStat}>Lowest: {summary.lowestScore.toFixed(1)}%</Text>
                <Text style={styles.studentStat}>Total: {summary.totalObtained}/{summary.totalMarks}</Text>
              </View>
            </View>
          );
        }}
      />
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <ArrowLeft size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Marks Report</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={styles.loaderText}>Loading marks report...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Marks Report</Text>
        <TouchableOpacity style={styles.filterButton} onPress={() => setFilterModalVisible(true)}>
          <Filter size={20} color="#000" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabsContainer}>
        <View style={styles.tabsWrapper}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
            onPress={() => setActiveTab('overview')}
          >
            <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
              Overview
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'tests' && styles.activeTab]}
            onPress={() => setActiveTab('tests')}
          >
            <Text style={[styles.tabText, activeTab === 'tests' && styles.activeTabText]}>
              Tests
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'students' && styles.activeTab]}
            onPress={() => setActiveTab('students')}
          >
            <Text style={[styles.tabText, activeTab === 'students' && styles.activeTabText]}>
              Students
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {activeTab === 'overview' && renderOverviewTab()}
      {activeTab === 'tests' && renderTestsTab()}
      {activeTab === 'students' && renderStudentsTab()}

      {/* Filter Modal */}
      <Modal
        visible={filterModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter by Subject</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.filterOption, !selectedSubject && styles.filterOptionActive]}
              onPress={() => {
                setSelectedSubject('');
                setFilterModalVisible(false);
              }}
            >
              <Text style={[styles.filterOptionText, !selectedSubject && styles.filterOptionTextActive]}>
                All Subjects
              </Text>
            </TouchableOpacity>
            {subjects.map(subject => (
              <TouchableOpacity
                key={subject.id}
                style={[styles.filterOption, selectedSubject === subject.id && styles.filterOptionActive]}
                onPress={() => {
                  setSelectedSubject(subject.id);
                  setFilterModalVisible(false);
                }}
              >
                <Text style={[styles.filterOptionText, selectedSubject === subject.id && styles.filterOptionTextActive]}>
                  {subject.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  headerRight: {
    width: 40,
  },
  filterButton: {
    padding: 8,
  },
  tabsContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tabsWrapper: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
  },
  activeTab: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#666',
    textAlign: 'center',
    lineHeight: 14,
  },
  activeTabText: {
    color: '#000',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  overviewCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  overviewNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  overviewLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#000',
  },
  testCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  testHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  testName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  testSubject: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  testDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  testDate: {
    fontSize: 12,
    color: '#666',
  },
  testMarks: {
    fontSize: 12,
    color: '#666',
  },
  testStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  testStat: {
    fontSize: 11,
    color: '#666',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  studentCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  studentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  studentSection: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  studentStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  studentStat: {
    fontSize: 11,
    color: '#666',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    fontSize: 20,
    color: '#666',
  },
  filterOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  filterOptionActive: {
    backgroundColor: '#000',
  },
  filterOptionText: {
    fontSize: 16,
    color: '#000',
  },
  filterOptionTextActive: {
    color: '#fff',
  },
}); 