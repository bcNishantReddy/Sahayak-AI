import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  FlatList,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import {
  ArrowLeft,
  Plus,
  Users,
  BookOpen,
  Calendar,
  FileText,
  Edit,
  Trash2,
  X,
  Download,
  Award,
  BarChart3,
  CheckCircle,
  XCircle,
  Clock,
  ChevronRight
} from 'lucide-react-native';
import { Class, Student, Subject, AttendanceRecord, Test, Grade } from '@/types';
import {
  getStudents,
  addStudent,
  updateStudent,
  deleteStudent,
  addSubject,
  getSubjects,
  deleteSubject,
  saveAttendance,
  getAttendance,
  addTest,
  getTests,
  updateTest,
  deleteTest,
  saveGrades,
  getGrades,
  getCurrentUserId
} from '@/utils/attendanceFirestore';
import { useTranslation } from 'react-i18next';
import { StudentModal, SubjectModal, TestModal } from './EnhancedClassroomModals';
import TestReportGenerator from './TestReportGenerator';
import AttendanceReportGenerator from './AttendanceReportGenerator';

interface EnhancedClassroomDetailProps {
  classroom: Class;
  onBack: () => void;
  onClassUpdate?: (updatedClass: Class) => void;
}

type TabType = 'students' | 'subjects' | 'attendance' | 'quiz';

const { width } = Dimensions.get('window');

export default function EnhancedClassroomDetail({ classroom, onBack, onClassUpdate }: EnhancedClassroomDetailProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('students');
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(false);

  // Student states
  const [studentModalVisible, setStudentModalVisible] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentName, setStudentName] = useState('');

  // Subject states
  const [subjectModalVisible, setSubjectModalVisible] = useState(false);
  const [newSubject, setNewSubject] = useState('');

  // Attendance states
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState<{[key: string]: 'present' | 'absent' | 'unmarked'}>({});
  const [savingAttendance, setSavingAttendance] = useState(false);

  // Test states
  const [testModalVisible, setTestModalVisible] = useState(false);
  const [newTest, setNewTest] = useState('');
  const [testTotalMarks, setTestTotalMarks] = useState('');
  const [editingTest, setEditingTest] = useState<Test | null>(null);

  // Grades states
  const [grades, setGrades] = useState<Grade[]>([]);
  const [selectedTest, setSelectedTest] = useState<string>('');
  const [gradeModalVisible, setGradeModalVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [attendanceReportVisible, setAttendanceReportVisible] = useState(false);

  useEffect(() => {
    loadData();
  }, [classroom.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadStudents(),
        loadSubjects(),
        loadTests()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    try {
      const result = await getStudents(classroom.id);
      setStudents(result.data || []);
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  const loadSubjects = async () => {
    try {
      const result = await getSubjects(classroom.id);
      setSubjects(result.data || []);
    } catch (error) {
      console.error('Error loading subjects:', error);
    }
  };

  const loadTests = async () => {
    try {
      const result = await getTests(classroom.id);
      setTests(result.data || []);
    } catch (error) {
      console.error('Error loading tests:', error);
    }
  };

  // Tab Component
  const TabButton = ({ tab, icon: Icon, label }: { tab: TabType; icon: any; label: string }) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
      onPress={() => setActiveTab(tab)}
    >
      <Icon size={20} color={activeTab === tab ? '#000' : '#666'} />
      <Text style={[styles.tabLabel, activeTab === tab && styles.activeTabLabel]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  // Students Tab
  const renderStudentsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t('attendance.students')}</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setStudentModalVisible(true)}
        >
          <Plus size={20} color="#000" />
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={students}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.studentCard}>
            <View style={styles.studentInfo}>
              <View style={styles.studentAvatar}>
                <Text style={styles.avatarText}>
                  {item.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.studentDetails}>
                <Text style={styles.studentName}>{item.name}</Text>
                <Text style={styles.studentSection}>Section {item.section}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => openStudentModal(item)}
            >
              <Edit size={16} color="#666" />
            </TouchableOpacity>
          </View>
        )}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );

  // Subjects Tab
  const renderSubjectsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t('attendance.subjects')}</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setSubjectModalVisible(true)}
        >
          <Plus size={20} color="#000" />
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={subjects}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.subjectCard}>
            <BookOpen size={20} color="#000" />
            <Text style={styles.subjectName}>{item.name}</Text>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteSubject(item.id)}
            >
              <Trash2 size={16} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        )}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );

  // Attendance Tab
  const renderAttendanceTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.attendanceHeader}>
        <Text style={styles.sectionTitle}>{t('attendance.attendance')}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.reportButton}
            onPress={() => setAttendanceReportVisible(true)}
          >
            <BarChart3 size={16} color="#000" />
            <Text style={styles.reportButtonText}>Attendance Report</Text>
          </TouchableOpacity>
          <View style={styles.attendanceStats}>
            <View style={styles.statItem}>
              <CheckCircle size={16} color="#34C759" />
              <Text style={styles.statText}>Present: {students.filter(s => attendanceData[s.id] === 'present').length}</Text>
            </View>
            <View style={styles.statItem}>
              <XCircle size={16} color="#FF3B30" />
              <Text style={styles.statText}>Absent: {students.filter(s => attendanceData[s.id] === 'absent').length}</Text>
            </View>
          </View>
        </View>
      </View>

      {subjects.length > 0 && (
        <View style={styles.subjectSelector}>
          <Text style={styles.selectorLabel}>Select Subject:</Text>
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
      )}

      {selectedSubject && (
        <View style={styles.attendanceList}>
          <Text style={styles.dateLabel}>{selectedDate}</Text>
          <FlatList
            data={students}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.attendanceRow}>
                <View style={styles.studentInfo}>
                  <Text style={styles.studentName}>{item.name}</Text>
                </View>
                <View style={styles.attendanceButtons}>
                  <TouchableOpacity
                    style={[
                      styles.attendanceButton,
                      attendanceData[item.id] === 'present' && styles.presentButton
                    ]}
                    onPress={() => setAttendanceData(prev => ({ ...prev, [item.id]: 'present' }))}
                  >
                    <CheckCircle size={16} color={attendanceData[item.id] === 'present' ? '#fff' : '#34C759'} />
                    <Text style={[
                      styles.attendanceButtonText,
                      attendanceData[item.id] === 'present' && styles.presentButtonText
                    ]}>
                      Present
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.attendanceButton,
                      attendanceData[item.id] === 'absent' && styles.absentButton
                    ]}
                    onPress={() => setAttendanceData(prev => ({ ...prev, [item.id]: 'absent' }))}
                  >
                    <XCircle size={16} color={attendanceData[item.id] === 'absent' ? '#fff' : '#FF3B30'} />
                    <Text style={[
                      styles.attendanceButtonText,
                      attendanceData[item.id] === 'absent' && styles.absentButtonText
                    ]}>
                      Absent
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            showsVerticalScrollIndicator={false}
          />
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveAttendance}
            disabled={savingAttendance}
          >
            {savingAttendance ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Attendance</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // Quiz Tab
  const renderQuizTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Tests & Grades</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.reportButton}
            onPress={() => setReportModalVisible(true)}
          >
            <BarChart3 size={16} color="#000" />
            <Text style={styles.reportButtonText}>Generate Report</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setTestModalVisible(true)}
          >
            <Plus size={20} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.quizTabs}>
        <TouchableOpacity
          style={[styles.quizTab, !selectedTest && styles.activeQuizTab]}
          onPress={() => setSelectedTest('')}
        >
          <Text style={[styles.quizTabText, !selectedTest && styles.activeQuizTabText]}>
            Tests
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quizTab, selectedTest && styles.activeQuizTab]}
          onPress={() => tests.length > 0 && setSelectedTest(tests[0].id)}
        >
          <Text style={[styles.quizTabText, selectedTest && styles.activeQuizTabText]}>
            Grades
          </Text>
        </TouchableOpacity>
      </View>

      {!selectedTest ? (
        // Tests List
        <FlatList
          data={tests}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.testCard}>
              <View style={styles.testInfo}>
                <Text style={styles.testName}>{item.name}</Text>
                <Text style={styles.testDetails}>
                  Total Marks: {item.totalMarks} • Date: {item.date}
                </Text>
              </View>
                             <View style={styles.testActions}>
                 <TouchableOpacity
                   style={styles.assignGradesButton}
                   onPress={() => handleAssignGrades(item.id)}
                 >
                   <Award size={16} color="#000" />
                   <Text style={styles.assignGradesButtonText}>Assign Grades</Text>
                 </TouchableOpacity>
                 <TouchableOpacity
                   style={styles.gradeButton}
                   onPress={() => {
                     setSelectedTest(item.id);
                     loadGrades(item.id);
                   }}
                 >
                   <Award size={16} color="#000" />
                   <Text style={styles.gradeButtonText}>View Grades</Text>
                 </TouchableOpacity>
                 <TouchableOpacity
                   style={styles.editButton}
                   onPress={() => openTestModal(item)}
                 >
                   <Edit size={16} color="#666" />
                 </TouchableOpacity>
               </View>
            </View>
          )}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        // Grades View
        <View style={styles.gradesContainer}>
          <Text style={styles.gradesTitle}>Grades for {tests.find(t => t.id === selectedTest)?.name}</Text>
          <FlatList
            data={grades}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.gradeCard}>
                <Text style={styles.studentName}>{students.find(s => s.id === item.studentId)?.name}</Text>
                <Text style={styles.gradeText}>{item.marksObtained}/{item.totalMarks}</Text>
              </View>
            )}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}
    </View>
  );

  // Handler functions
  const handleSaveAttendance = async () => {
    if (!selectedSubject) {
      Alert.alert('Error', 'Please select a subject first');
      return;
    }

    setSavingAttendance(true);
    try {
      const attendanceRecords = students.map(student => ({
        classId: classroom.id,
        subjectId: selectedSubject,
        studentId: student.id,
        date: selectedDate,
        status: attendanceData[student.id] || 'unmarked'
      }));
      
      await saveAttendance(attendanceRecords);
      Alert.alert('Success', 'Attendance saved successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to save attendance');
    } finally {
      setSavingAttendance(false);
    }
  };

  const handleDeleteSubject = async (subjectId: string) => {
    Alert.alert(
      'Delete Subject',
      'Are you sure you want to delete this subject?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSubject(subjectId);
              loadSubjects();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete subject');
            }
          }
        }
      ]
    );
  };

  const openStudentModal = (student?: Student) => {
    setEditingStudent(student || null);
    setStudentName(student?.name || '');
    setStudentModalVisible(true);
  };

  const openTestModal = (test?: Test) => {
    setEditingTest(test || null);
    setNewTest(test?.name || '');
    setTestTotalMarks(test?.totalMarks?.toString() || '');
    setTestModalVisible(true);
  };

  const loadGrades = async (testId: string) => {
    try {
      const result = await getGrades(testId);
      setGrades(result.data || []);
    } catch (error) {
      console.error('Error loading grades:', error);
    }
  };

  const handleAddStudent = async (name: string) => {
    try {
      await addStudent({
        name,
        classId: classroom.id,
        section: 'A'
      });
      setStudentModalVisible(false);
      setStudentName('');
      await loadStudents();
      
      // Update the class data to reflect new student count
      if (onClassUpdate) {
        const updatedClass = { ...classroom, studentCount: (classroom.studentCount || 0) + 1 };
        onClassUpdate(updatedClass);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add student');
    }
  };

  const handleAddSubject = async (name: string) => {
    try {
      await addSubject({
        name,
        classId: classroom.id
      });
      setSubjectModalVisible(false);
      setNewSubject('');
      loadSubjects();
    } catch (error) {
      Alert.alert('Error', 'Failed to add subject');
    }
  };

  const handleAddTest = async (name: string, totalMarks: number) => {
    try {
      await addTest({
        name,
        classId: classroom.id,
        subjectId: selectedSubject || subjects[0]?.id || '',
        totalMarks,
        date: new Date().toISOString().split('T')[0],
        teacherId: getCurrentUserId()
      });
      setTestModalVisible(false);
      setNewTest('');
      setTestTotalMarks('');
      loadTests();
    } catch (error) {
      Alert.alert('Error', 'Failed to add test');
    }
  };

  const handleAssignGrades = async (testId: string) => {
    try {
      const test = tests.find(t => t.id === testId);
      if (!test) return;

      // Create grades for all students
      const grades = students.map(student => ({
        testId: testId,
        studentId: student.id,
        classId: classroom.id,
        subjectId: test.subjectId,
        marksObtained: 0, // Default to 0, can be updated later
        totalMarks: test.totalMarks,
        percentage: 0,
        grade: 'F',
        teacherId: getCurrentUserId()
      }));

      await saveGrades(grades);
      Alert.alert('Success', 'Grades assigned successfully');
      loadGrades(testId);
    } catch (error) {
      Alert.alert('Error', 'Failed to assign grades');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.classroomName}>{classroom.name}</Text>
          <Text style={styles.studentCount}>{students.length} students</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TabButton tab="students" icon={Users} label="Students" />
        <TabButton tab="subjects" icon={BookOpen} label="Subjects" />
        <TabButton tab="attendance" icon={Calendar} label="Attendance" />
        <TabButton tab="quiz" icon={Award} label="Quiz" />
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <>
          {activeTab === 'students' && renderStudentsTab()}
          {activeTab === 'subjects' && renderSubjectsTab()}
          {activeTab === 'attendance' && renderAttendanceTab()}
          {activeTab === 'quiz' && renderQuizTab()}
        </>
      )}

      {/* Modals */}
      <StudentModal
        visible={studentModalVisible}
        onClose={() => setStudentModalVisible(false)}
        onSubmit={handleAddStudent}
        editingStudent={editingStudent}
        studentName={studentName}
        setStudentName={setStudentName}
        loading={false}
      />

      <SubjectModal
        visible={subjectModalVisible}
        onClose={() => setSubjectModalVisible(false)}
        onSubmit={handleAddSubject}
        subjectName={newSubject}
        setSubjectName={setNewSubject}
        loading={false}
      />

      <TestModal
        visible={testModalVisible}
        onClose={() => setTestModalVisible(false)}
        onSubmit={handleAddTest}
        editingTest={editingTest}
        testName={newTest}
        setTestName={setNewTest}
        testTotalMarks={testTotalMarks}
        setTestTotalMarks={setTestTotalMarks}
        loading={false}
      />

      <TestReportGenerator
        visible={reportModalVisible}
        onClose={() => setReportModalVisible(false)}
        classId={classroom.id}
        tests={tests}
        students={students}
        subjects={subjects}
      />

      <AttendanceReportGenerator
        visible={attendanceReportVisible}
        onClose={() => setAttendanceReportVisible(false)}
        classId={classroom.id}
        students={students}
        subjects={subjects}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  classroomName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  studentCount: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  activeTabButton: {
    backgroundColor: '#f0f0f0',
  },
  tabLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontWeight: '500',
  },
  activeTabLabel: {
    color: '#000',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  reportButtonText: {
    fontSize: 12,
    color: '#000',
    marginLeft: 4,
    fontWeight: '500',
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  studentInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  studentDetails: {
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
  editButton: {
    padding: 8,
  },
  subjectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  subjectName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginLeft: 12,
  },
  deleteButton: {
    padding: 8,
  },
  attendanceHeader: {
    marginBottom: 20,
  },
  attendanceStats: {
    flexDirection: 'row',
    marginTop: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  statText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  subjectSelector: {
    marginBottom: 20,
  },
  selectorLabel: {
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
    backgroundColor: '#000',
  },
  subjectChipText: {
    fontSize: 14,
    color: '#666',
  },
  selectedSubjectChipText: {
    color: '#fff',
    fontWeight: '500',
  },
  attendanceList: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 16,
  },
  attendanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  attendanceButtons: {
    flexDirection: 'row',
  },
  attendanceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginLeft: 8,
  },
  presentButton: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  absentButton: {
    backgroundColor: '#666',
    borderColor: '#666',
  },
  attendanceButtonText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  presentButtonText: {
    color: '#fff',
  },
  absentButtonText: {
    color: '#fff',
  },
  saveButton: {
    backgroundColor: '#000',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  quizTabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  quizTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeQuizTab: {
    backgroundColor: '#000',
  },
  quizTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeQuizTabText: {
    color: '#fff',
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
    elevation: 2,
  },
  testInfo: {
    marginBottom: 12,
  },
  testName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  testDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  testActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assignGradesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  assignGradesButtonText: {
    fontSize: 12,
    color: '#000',
    marginLeft: 4,
  },
  gradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  gradeButtonText: {
    fontSize: 12,
    color: '#000',
    marginLeft: 4,
  },
  gradesContainer: {
    flex: 1,
  },
  gradesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  gradeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  gradeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 