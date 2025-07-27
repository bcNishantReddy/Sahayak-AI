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
  Switch,
  ActivityIndicator
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
  Award
} from 'lucide-react-native';
import { Class, Student, Subject, AttendanceRecord, Test, Grade } from '@/types';
import MarksReportScreen from '@/components/MarksReportScreen';
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
  updateAttendance,
  addTest,
  getTests,
  updateTest,
  deleteTest,
  saveGrades,
  getGrades,
  updateGrade,
  deleteGrade,
  calculateGrade,
  getCurrentUserId
} from '@/utils/attendanceFirestore';

interface ClassroomDetailScreenProps {
  classroom: Class;
  onBack: () => void;
}

type TabType = 'students' | 'subjects' | 'attendance' | 'tests' | 'grades';

export default function ClassroomDetailScreen({ classroom, onBack }: ClassroomDetailScreenProps) {
  const [activeTab, setActiveTab] = useState<TabType>('students');
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);

  // Student modal states
  const [studentModalVisible, setStudentModalVisible] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentName, setStudentName] = useState('');
  const [studentSection, setStudentSection] = useState('A');

  // Subject modal states
  const [subjectModalVisible, setSubjectModalVisible] = useState(false);
  const [newSubject, setNewSubject] = useState('');

  // Attendance states
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState<{[key: string]: 'present' | 'absent' | 'unmarked'}>({});
  const [attendanceLoaded, setAttendanceLoaded] = useState(false);
  const [savingAttendance, setSavingAttendance] = useState(false);

  // Report states
  const [reportSubject, setReportSubject] = useState<string>('');
  const [reportData, setReportData] = useState<any[]>([]);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Test states
  const [tests, setTests] = useState<Test[]>([]);
  const [testModalVisible, setTestModalVisible] = useState(false);
  const [newTest, setNewTest] = useState('');
  const [testTotalMarks, setTestTotalMarks] = useState('');
  const [testDate, setTestDate] = useState(new Date().toISOString().split('T')[0]);
  const [editingTest, setEditingTest] = useState<Test | null>(null);

  // Grade states
  const [grades, setGrades] = useState<Grade[]>([]);
  const [selectedTest, setSelectedTest] = useState<string>('');
  const [gradeData, setGradeData] = useState<{[key: string]: { marks: string; remarks: string }}>({});
  const [savingGrades, setSavingGrades] = useState(false);
  const [gradeModalVisible, setGradeModalVisible] = useState(false);

  // Marks Report states
  const [showMarksReport, setShowMarksReport] = useState(false);

  useEffect(() => {
    loadStudents();
    loadSubjects();
    loadTests();
  }, [classroom.id]);

  // Reset attendanceData when subject or date changes
  useEffect(() => {
    // Set all students to 'unmarked' and mark as not loaded
    const reset: {[key: string]: 'present' | 'absent' | 'unmarked'} = {};
    students.forEach(student => {
      reset[student.id] = 'unmarked';
    });
    setAttendanceData(reset);
    setAttendanceLoaded(false);
  }, [selectedSubject, selectedDate, students]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const result = await getStudents(classroom.id, { limit: 1000 }); // Load up to 1000 students
      setStudents(result.data);
    } catch (error) {
      console.error('Error loading students:', error);
      Alert.alert('Error', 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const loadSubjects = async () => {
    try {
      const result = await getSubjects(classroom.id, { limit: 100 }); // Load up to 100 subjects
      setSubjects(result.data);
    } catch (error) {
      console.error('Error loading subjects:', error);
      Alert.alert('Error', 'Failed to load subjects');
    }
  };

  const loadTests = async () => {
    try {
      const result = await getTests(classroom.id, undefined, { limit: 1000 }); // Load up to 1000 tests
      setTests(result.data);
    } catch (error) {
      console.error('Error loading tests:', error);
      Alert.alert('Error', 'Failed to load tests');
    }
  };

  const loadGrades = async (testId?: string) => {
    try {
      const result = await getGrades(testId, classroom.id, undefined, { limit: 1000 });
      setGrades(result.data);
    } catch (error) {
      console.error('Error loading grades:', error);
      Alert.alert('Error', 'Failed to load grades');
    }
  };

  const handleAddStudent = async () => {
    if (!studentName.trim()) {
      Alert.alert('Error', 'Please enter student name');
      return;
    }

    try {
      setLoading(true);
      const newStudent: Omit<Student, 'id' | 'createdAt' | 'updatedAt' | 'teacherId'> = {
        name: studentName.trim(),
        classId: classroom.id,
        section: studentSection,
        photoUrl: '', // Use empty string instead of undefined
        rollNumber: '',
        email: '',
        phone: ''
      };

      await addStudent(newStudent);
      
      // Update local state immediately for better UX
      const newStudentWithId: Student = {
        ...newStudent,
        id: `student_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        teacherId: getCurrentUserId(),
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      setStudents(prevStudents => [...prevStudents, newStudentWithId]);
      
      // Close modal and reset form
      setStudentModalVisible(false);
      setStudentName('');
      setStudentSection('A');
      
      Alert.alert('Success', 'Student added successfully');
    } catch (error) {
      console.error('Error adding student:', error);
      Alert.alert('Error', 'Failed to add student. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditStudent = async () => {
    if (!editingStudent || !studentName.trim()) {
      Alert.alert('Error', 'Please enter student name');
      return;
    }

    try {
      setLoading(true);
      await updateStudent(editingStudent.id, {
        name: studentName.trim(),
        section: studentSection
      });

      // Update local state
      setStudents(prevStudents =>
        prevStudents.map(student =>
          student.id === editingStudent.id
            ? { ...student, name: studentName.trim(), section: studentSection }
            : student
        )
      );

      setStudentModalVisible(false);
      setEditingStudent(null);
      setStudentName('');
      setStudentSection('A');
      Alert.alert('Success', 'Student updated successfully');
    } catch (error) {
      console.error('Error updating student:', error);
      Alert.alert('Error', 'Failed to update student');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    Alert.alert(
      'Delete Student',
      'Are you sure you want to delete this student?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await deleteStudent(studentId);
              setStudents(prevStudents => prevStudents.filter(s => s.id !== studentId));
              Alert.alert('Success', 'Student deleted successfully');
            } catch (error) {
              console.error('Error deleting student:', error);
              Alert.alert('Error', 'Failed to delete student');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleAddSubject = async () => {
    if (!newSubject.trim()) {
      Alert.alert('Error', 'Please enter subject name');
      return;
    }

    try {
      setLoading(true);
      const newSubjectData: Omit<Subject, 'id' | 'createdAt' | 'teacherId'> = {
        name: newSubject.trim(),
        classId: classroom.id,
        code: '',
        description: ''
      };

      const subjectId = await addSubject(newSubjectData);
      
      // Update local state
      const newSubjectWithId: Subject = {
        ...newSubjectData,
        id: subjectId,
        teacherId: getCurrentUserId(),
        createdAt: Date.now()
      };
      
      setSubjects(prevSubjects => [...prevSubjects, newSubjectWithId]);
      
      setSubjectModalVisible(false);
      setNewSubject('');
      Alert.alert('Success', 'Subject added successfully');
    } catch (error) {
      console.error('Error adding subject:', error);
      Alert.alert('Error', 'Failed to add subject');
    } finally {
      setLoading(false);
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
              setLoading(true);
              await deleteSubject(subjectId);
              setSubjects(prevSubjects => prevSubjects.filter(s => s.id !== subjectId));
              Alert.alert('Success', 'Subject deleted successfully');
            } catch (error) {
              console.error('Error deleting subject:', error);
              Alert.alert('Error', 'Failed to delete subject');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const loadAttendanceData = async () => {
    if (!selectedSubject) {
      Alert.alert('Error', 'Please select a subject first');
      return;
    }

    try {
      setLoading(true);
      const result = await getAttendance(classroom.id, selectedSubject, selectedDate);
      const attendance = result.data;
      
      const attendanceMap: {[key: string]: 'present' | 'absent' | 'unmarked'} = {};
      
      // Initialize all students as unmarked
      students.forEach(student => {
        attendanceMap[student.id] = 'unmarked';
      });
      
      // Set attendance from database
      attendance.forEach((att: AttendanceRecord) => {
        attendanceMap[att.studentId] = att.status;
      });
      
      setAttendanceData(attendanceMap);
      setAttendanceLoaded(true);
    } catch (error) {
      console.error('Error loading attendance:', error);
      Alert.alert('Error', 'Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAttendance = async () => {
    if (!selectedSubject) {
      Alert.alert('Error', 'Please select a subject first');
      return;
    }

    try {
      setSavingAttendance(true);
      
      const attendanceRecords: Omit<AttendanceRecord, 'id' | 'timestamp' | 'teacherId'>[] = [];
      
      students.forEach(student => {
        const status = attendanceData[student.id];
        if (status && status !== 'unmarked') {
          attendanceRecords.push({
            classId: classroom.id,
            subjectId: selectedSubject,
            studentId: student.id,
            date: selectedDate,
            status: status,
            period: '',
            remarks: ''
          });
        }
      });

      await saveAttendance(attendanceRecords);
      Alert.alert('Success', 'Attendance saved successfully');
    } catch (error) {
      console.error('Error saving attendance:', error);
      Alert.alert('Error', 'Failed to save attendance');
    } finally {
      setSavingAttendance(false);
    }
  };

  const generateReport = async () => {
    if (!reportSubject) {
      Alert.alert('Error', 'Please select a subject first');
      return;
    }

    try {
      setGeneratingReport(true);
      
      // Get last 30 days of attendance
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      // This would need to be implemented in Firebase utils
      // const report = await getAttendanceReport(classroom.id, reportSubject, startDate, endDate);
      
      // For now, show placeholder data
      const placeholderReport = students.map(student => ({
        studentName: student.name,
        present: Math.floor(Math.random() * 25) + 5,
        absent: Math.floor(Math.random() * 5),
        total: 30,
        percentage: Math.floor(Math.random() * 20) + 80
      }));
      
      setReportData(placeholderReport);
    } catch (error) {
      console.error('Error generating report:', error);
      Alert.alert('Error', 'Failed to generate report');
    } finally {
      setGeneratingReport(false);
    }
  };

  const downloadPDF = async () => {
    if (reportData.length === 0) {
      Alert.alert('Error', 'No report data to download');
      return;
    }

    try {
      // Generate HTML content for the report
      let htmlContent = `
        <html>
          <head>
            <title>Attendance Report - ${classroom.name}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              .header { text-align: center; margin-bottom: 20px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Attendance Report</h1>
              <h2>${classroom.name}</h2>
              <p>Generated on: ${new Date().toLocaleDateString()}</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Present</th>
                  <th>Absent</th>
                  <th>Total</th>
                  <th>Percentage</th>
                </tr>
              </thead>
              <tbody>
      `;

      reportData.forEach(row => {
        htmlContent += `
          <tr>
            <td>${row.studentName}</td>
            <td>${row.present}</td>
            <td>${row.absent}</td>
            <td>${row.total}</td>
            <td>${row.percentage}%</td>
          </tr>
        `;
      });

      htmlContent += `
              </tbody>
            </table>
          </body>
        </html>
      `;

      Alert.alert(
        'Report Generated',
        'HTML content has been generated. You can copy this content and save it as an HTML file.',
        [
          { text: 'Copy HTML', onPress: () => {
            // In a real app, you would copy to clipboard
            console.log('HTML Content:', htmlContent);
          }},
          { text: 'OK' }
        ]
      );
    } catch (error) {
      console.error('Error downloading PDF:', error);
      Alert.alert('Error', 'Failed to download report');
    }
  };

  const openStudentModal = (student?: Student) => {
    if (student) {
      setEditingStudent(student);
      setStudentName(student.name);
      setStudentSection(student.section);
    } else {
      setEditingStudent(null);
      setStudentName('');
      setStudentSection('A');
    }
    setStudentModalVisible(true);
  };

  // ===== TEST OPERATIONS =====

  const handleAddTest = async () => {
    if (!newTest.trim() || !testTotalMarks.trim()) {
      Alert.alert('Error', 'Please enter test name and total marks');
      return;
    }

    if (!selectedSubject) {
      Alert.alert('Error', 'Please select a subject first');
      return;
    }

    try {
      setLoading(true);
      const newTestData: Omit<Test, 'id' | 'createdAt'> = {
        name: newTest.trim(),
        classId: classroom.id,
        subjectId: selectedSubject,
        totalMarks: parseInt(testTotalMarks),
        date: testDate,
        description: '',
        duration: 60,
        weightage: 100,
        teacherId: getCurrentUserId()
      };

      const testId = await addTest(newTestData);
      
      // Update local state
      const newTestWithId: Test = {
        ...newTestData,
        id: testId,
        teacherId: getCurrentUserId(),
        createdAt: Date.now()
      };
      
      setTests(prevTests => [...prevTests, newTestWithId]);
      
      setTestModalVisible(false);
      setNewTest('');
      setTestTotalMarks('');
      setTestDate(new Date().toISOString().split('T')[0]);
      Alert.alert('Success', 'Test added successfully');
    } catch (error) {
      console.error('Error adding test:', error);
      Alert.alert('Error', 'Failed to add test');
    } finally {
      setLoading(false);
    }
  };

  const handleEditTest = async () => {
    if (!editingTest || !newTest.trim() || !testTotalMarks.trim()) {
      Alert.alert('Error', 'Please enter test name and total marks');
      return;
    }

    try {
      setLoading(true);
      await updateTest(editingTest.id, {
        name: newTest.trim(),
        totalMarks: parseInt(testTotalMarks),
        date: testDate
      });

      // Update local state
      setTests(prevTests =>
        prevTests.map(test =>
          test.id === editingTest.id
            ? { ...test, name: newTest.trim(), totalMarks: parseInt(testTotalMarks), date: testDate }
            : test
        )
      );

      setTestModalVisible(false);
      setEditingTest(null);
      setNewTest('');
      setTestTotalMarks('');
      setTestDate(new Date().toISOString().split('T')[0]);
      Alert.alert('Success', 'Test updated successfully');
    } catch (error) {
      console.error('Error updating test:', error);
      Alert.alert('Error', 'Failed to update test');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTest = async (testId: string) => {
    Alert.alert(
      'Delete Test',
      'Are you sure you want to delete this test? All grades for this test will also be deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await deleteTest(testId);
              setTests(prevTests => prevTests.filter(t => t.id !== testId));
              Alert.alert('Success', 'Test deleted successfully');
            } catch (error) {
              console.error('Error deleting test:', error);
              Alert.alert('Error', 'Failed to delete test');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const openTestModal = (test?: Test) => {
    if (test) {
      setEditingTest(test);
      setNewTest(test.name);
      setTestTotalMarks(test.totalMarks.toString());
      setTestDate(test.date);
    } else {
      setEditingTest(null);
      setNewTest('');
      setTestTotalMarks('');
      setTestDate(new Date().toISOString().split('T')[0]);
    }
    setTestModalVisible(true);
  };

  // ===== GRADE OPERATIONS =====

  const handleSaveGrades = async () => {
    if (!selectedTest) {
      Alert.alert('Error', 'Please select a test first');
      return;
    }

    try {
      setSavingGrades(true);
      
      const gradesToSave: Omit<Grade, 'id' | 'timestamp' | 'teacherId'>[] = [];
      
      students.forEach(student => {
        const gradeInfo = gradeData[student.id];
        if (gradeInfo && gradeInfo.marks.trim()) {
          const marks = parseFloat(gradeInfo.marks);
          const test = tests.find(t => t.id === selectedTest);
          if (test && !isNaN(marks) && marks >= 0 && marks <= test.totalMarks) {
            const percentage = (marks / test.totalMarks) * 100;
            gradesToSave.push({
              testId: selectedTest,
              studentId: student.id,
              classId: classroom.id,
              subjectId: test.subjectId,
              marksObtained: marks,
              totalMarks: test.totalMarks,
              percentage: percentage,
              grade: calculateGrade(percentage),
              remarks: gradeInfo.remarks || ''
            });
          }
        }
      });

      if (gradesToSave.length === 0) {
        Alert.alert('Error', 'Please enter marks for at least one student');
        return;
      }

      await saveGrades(gradesToSave);
      Alert.alert('Success', 'Grades saved successfully');
      setGradeModalVisible(false);
      setGradeData({});
      setSelectedTest('');
    } catch (error) {
      console.error('Error saving grades:', error);
      Alert.alert('Error', 'Failed to save grades');
    } finally {
      setSavingGrades(false);
    }
  };

  const openGradeModal = () => {
    if (!selectedTest) {
      Alert.alert('Error', 'Please select a test first');
      return;
    }
    setGradeModalVisible(true);
  };

  const renderStudentsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.tabHeader}>
        <Text style={styles.tabTitle}>Students ({students.length})</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => openStudentModal()}
        >
          <Plus size={20} color="#000" />
          <Text style={styles.addButtonText}>Add Student</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#000" style={styles.loader} />
      ) : students.length === 0 ? (
        <View style={styles.emptyState}>
          <Users size={48} color="#ccc" />
          <Text style={styles.emptyStateText}>No students added yet</Text>
          <Text style={styles.emptyStateSubtext}>Add your first student to get started</Text>
        </View>
      ) : (
        <FlatList
          data={students}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.studentCard}>
              <View style={styles.studentInfo}>
                <Text style={styles.studentName}>{item.name}</Text>
                <Text style={styles.studentSection}>Section {item.section}</Text>
              </View>
              <View style={styles.studentActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => openStudentModal(item)}
                >
                  <Edit size={16} color="#000" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDeleteStudent(item.id)}
                >
                  <Trash2 size={16} color="#ff4444" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );

  const renderSubjectsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.tabHeader}>
        <Text style={styles.tabTitle}>Subjects ({subjects.length})</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setSubjectModalVisible(true)}
        >
          <Plus size={20} color="#000" />
          <Text style={styles.addButtonText}>Add Subject</Text>
        </TouchableOpacity>
      </View>

      {subjects.length === 0 ? (
        <View style={styles.emptyState}>
          <BookOpen size={48} color="#ccc" />
          <Text style={styles.emptyStateText}>No subjects added yet</Text>
          <Text style={styles.emptyStateSubtext}>Add subjects to start taking attendance</Text>
        </View>
      ) : (
        <FlatList
          data={subjects}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.subjectCard}>
              <Text style={styles.subjectName}>{item.name}</Text>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleDeleteSubject(item.id)}
              >
                <Trash2 size={16} color="#ff4444" />
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );

  const renderAttendanceTab = () => {
    const filteredStudents = students.filter(student =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <View style={styles.tabContent}>
        <View style={styles.attendanceHeader}>
          <View style={styles.attendanceControls}>
            <View style={styles.controlGroup}>
              <Text style={styles.controlLabel}>Subject:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.subjectButtons}>
                  {subjects.map((subject) => (
                    <TouchableOpacity
                      key={subject.id}
                      style={[
                        styles.subjectButton,
                        selectedSubject === subject.id && styles.subjectButtonActive
                      ]}
                      onPress={() => setSelectedSubject(subject.id)}
                    >
                      <Text style={[
                        styles.subjectButtonText,
                        selectedSubject === subject.id && styles.subjectButtonTextActive
                      ]}>
                        {subject.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.controlGroup}>
              <Text style={styles.controlLabel}>Date:</Text>
              <TextInput
                style={styles.dateInput}
                value={selectedDate}
                onChangeText={setSelectedDate}
                placeholder="YYYY-MM-DD"
              />
            </View>
          </View>

          <View style={styles.attendanceActions}>
            <TouchableOpacity
              style={[styles.actionButton, !selectedSubject && styles.actionButtonDisabled]}
              onPress={loadAttendanceData}
              disabled={!selectedSubject || loading}
            >
              <Text style={styles.actionButtonText}>Load Attendance</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionButton,
                (!attendanceLoaded || savingAttendance) && styles.actionButtonDisabled
              ]}
              onPress={handleSaveAttendance}
              disabled={!attendanceLoaded || savingAttendance}
            >
              <Text style={styles.actionButtonText}>
                {savingAttendance ? 'Saving...' : 'Save Attendance'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {selectedSubject && (
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search students..."
            />
          </View>
        )}

        {loading ? (
          <ActivityIndicator size="large" color="#000" style={styles.loader} />
        ) : selectedSubject && filteredStudents.length > 0 ? (
          <FlatList
            data={filteredStudents}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.attendanceRow}>
                <View style={styles.studentInfo}>
                  <Text style={styles.studentName}>{item.name}</Text>
                  <Text style={styles.studentSection}>Section {item.section}</Text>
                </View>
                <View style={styles.attendanceSwitches}>
                  <TouchableOpacity
                    style={[
                      styles.attendanceSwitch,
                      attendanceData[item.id] === 'present' && styles.attendanceSwitchActive
                    ]}
                    onPress={() => setAttendanceData(prev => ({
                      ...prev,
                      [item.id]: 'present'
                    }))}
                    disabled={!attendanceLoaded}
                  >
                    <Text style={[
                      styles.attendanceSwitchText,
                      attendanceData[item.id] === 'present' && styles.attendanceSwitchTextActive
                    ]}>
                      Present
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.attendanceSwitch,
                      attendanceData[item.id] === 'absent' && styles.attendanceSwitchActive
                    ]}
                    onPress={() => setAttendanceData(prev => ({
                      ...prev,
                      [item.id]: 'absent'
                    }))}
                    disabled={!attendanceLoaded}
                  >
                    <Text style={[
                      styles.attendanceSwitchText,
                      attendanceData[item.id] === 'absent' && styles.attendanceSwitchTextActive
                    ]}>
                      Absent
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        ) : selectedSubject ? (
          <View style={styles.emptyState}>
            <Users size={48} color="#ccc" />
            <Text style={styles.emptyStateText}>No students found</Text>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Calendar size={48} color="#ccc" />
            <Text style={styles.emptyStateText}>Select a subject to take attendance</Text>
          </View>
        )}
      </View>
    );
  };

  const renderReportsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.tabHeader}>
        <Text style={styles.tabTitle}>Attendance Reports</Text>
      </View>

      <View style={styles.reportControls}>
        <View style={styles.controlGroup}>
          <Text style={styles.controlLabel}>Subject:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.subjectButtons}>
              {subjects.map((subject) => (
                <TouchableOpacity
                  key={subject.id}
                  style={[
                    styles.subjectButton,
                    reportSubject === subject.id && styles.subjectButtonActive
                  ]}
                  onPress={() => setReportSubject(subject.id)}
                >
                  <Text style={[
                    styles.subjectButtonText,
                    reportSubject === subject.id && styles.subjectButtonTextActive
                  ]}>
                    {subject.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={styles.reportActions}>
          <TouchableOpacity
            style={[styles.actionButton, !reportSubject && styles.actionButtonDisabled]}
            onPress={generateReport}
            disabled={!reportSubject || generatingReport}
          >
            <Text style={styles.actionButtonText}>
              {generatingReport ? 'Generating...' : 'Generate Report'}
            </Text>
          </TouchableOpacity>
          {reportData.length > 0 && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={downloadPDF}
            >
              <Download size={16} color="#000" />
              <Text style={styles.actionButtonText}>Download</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {reportData.length > 0 && (
        <View style={styles.reportTable}>
          <View style={styles.reportHeader}>
            <Text style={styles.reportHeaderCell}>Student</Text>
            <Text style={styles.reportHeaderCell}>Present</Text>
            <Text style={styles.reportHeaderCell}>Absent</Text>
            <Text style={styles.reportHeaderCell}>Total</Text>
            <Text style={styles.reportHeaderCell}>%</Text>
          </View>
          <FlatList
            data={reportData}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <View style={styles.reportRow}>
                <Text style={styles.reportCell}>{item.studentName}</Text>
                <Text style={styles.reportCell}>{item.present}</Text>
                <Text style={styles.reportCell}>{item.absent}</Text>
                <Text style={styles.reportCell}>{item.total}</Text>
                <Text style={styles.reportCell}>{item.percentage}%</Text>
              </View>
            )}
          />
        </View>
      )}
    </View>
  );

  const renderTestsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.tabHeader}>
        <Text style={styles.tabTitle}>Tests ({tests.length})</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => openTestModal()}
        >
          <Plus size={20} color="#000" />
          <Text style={styles.addButtonText}>Add Test</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#000" style={styles.loader} />
      ) : tests.length === 0 ? (
        <View style={styles.emptyState}>
          <FileText size={48} color="#ccc" />
          <Text style={styles.emptyStateText}>No tests added yet</Text>
          <Text style={styles.emptyStateSubtext}>Add your first test to get started</Text>
        </View>
      ) : (
        <FlatList
          data={tests}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const subject = subjects.find(s => s.id === item.subjectId);
            return (
              <View style={styles.testCard}>
                <View style={styles.testInfo}>
                  <Text style={styles.testName}>{item.name}</Text>
                  <Text style={styles.testSubject}>Subject: {subject?.name || 'Unknown'}</Text>
                  <Text style={styles.testDetails}>
                    Total Marks: {item.totalMarks} | Date: {item.date}
                  </Text>
                </View>
                <View style={styles.testActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => openTestModal(item)}
                  >
                    <Edit size={16} color="#000" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDeleteTest(item.id)}
                  >
                    <Trash2 size={16} color="#ff4444" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );

  const renderGradesTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.tabHeader}>
        <Text style={styles.tabTitle}>Grades</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={openGradeModal}
          disabled={!selectedTest}
        >
          <Text style={styles.addButtonText}>Add Grades</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.gradeControls}>
        <Text style={styles.gradeLabel}>Select Test:</Text>
        <TouchableOpacity
          style={styles.gradePicker}
          onPress={() => {
            const testOptions = tests.map(test => {
              const subject = subjects.find(s => s.id === test.subjectId);
              return {
                label: `${test.name} (${subject?.name || 'Unknown'})`,
                value: test.id
              };
            });
            
            Alert.alert(
              'Select Test',
              'Choose a test to add grades:',
              [
                { text: 'Cancel', style: 'cancel' },
                ...testOptions.map(test => ({
                  text: test.label,
                  onPress: () => setSelectedTest(test.value)
                }))
              ]
            );
          }}
        >
          <Text style={styles.gradePickerText}>
            {selectedTest 
              ? tests.find(t => t.id === selectedTest)?.name || 'Choose a test...'
              : 'Choose a test...'
            }
          </Text>
        </TouchableOpacity>
      </View>

      {selectedTest && (
        <View style={styles.gradeForm}>
          <Text style={styles.gradeFormTitle}>Enter Grades for Students</Text>
          {students.map(student => (
            <View key={student.id} style={styles.gradeRow}>
              <Text style={styles.gradeStudentName}>{student.name}</Text>
              <TextInput
                style={styles.gradeInput}
                value={gradeData[student.id]?.marks || ''}
                onChangeText={(text) => setGradeData(prev => ({
                  ...prev,
                  [student.id]: { ...prev[student.id], marks: text }
                }))}
                placeholder="Marks"
                keyboardType="numeric"
              />
              <TextInput
                style={styles.gradeRemarksInput}
                value={gradeData[student.id]?.remarks || ''}
                onChangeText={(text) => setGradeData(prev => ({
                  ...prev,
                  [student.id]: { ...prev[student.id], remarks: text }
                }))}
                placeholder="Remarks"
              />
            </View>
          ))}
          
          <TouchableOpacity
            style={[styles.saveGradesButton, savingGrades && styles.saveGradesButtonDisabled]}
            onPress={handleSaveGrades}
            disabled={savingGrades}
          >
            <Text style={styles.saveGradesButtonText}>
              {savingGrades ? 'Saving...' : 'Save Grades'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {!selectedTest && (
        <View style={styles.emptyState}>
          <Award size={48} color="#ccc" />
          <Text style={styles.emptyStateText}>No test selected</Text>
          <Text style={styles.emptyStateSubtext}>Select a test to add grades</Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{classroom.name}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.tabsContainer}>
        <View style={styles.tabsWrapper}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'students' && styles.activeTab]}
            onPress={() => setActiveTab('students')}
          >
            <Text style={[styles.tabText, activeTab === 'students' && styles.activeTabText]}>
              Students
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'subjects' && styles.activeTab]}
            onPress={() => setActiveTab('subjects')}
          >
            <Text style={[styles.tabText, activeTab === 'subjects' && styles.activeTabText]}>
              Subjects
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'attendance' && styles.activeTab]}
            onPress={() => setActiveTab('attendance')}
          >
            <Text style={[styles.tabText, activeTab === 'attendance' && styles.activeTabText]}>
              Attendance
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
            style={[styles.tab, activeTab === 'grades' && styles.activeTab]}
            onPress={() => setActiveTab('grades')}
          >
            <Text style={[styles.tabText, activeTab === 'grades' && styles.activeTabText]}>
              Grades
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.marksReportButton}
          onPress={() => setShowMarksReport(true)}
        >
          <Text style={styles.marksReportButtonText}>Marks Report</Text>
        </TouchableOpacity>
      </View>

      {showMarksReport ? (
        <MarksReportScreen classroom={classroom} onBack={() => setShowMarksReport(false)} />
      ) : (
        <>
          {activeTab === 'students' && renderStudentsTab()}
          {activeTab === 'subjects' && renderSubjectsTab()}
          {activeTab === 'attendance' && renderAttendanceTab()}
          {activeTab === 'tests' && renderTestsTab()}
          {activeTab === 'grades' && renderGradesTab()}
        </>
      )}

      {/* Student Modal */}
      <Modal
        visible={studentModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setStudentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingStudent ? 'Edit Student' : 'Add Student'}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setStudentModalVisible(false)}
              >
                <X size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalInput}
              value={studentName}
              onChangeText={setStudentName}
              placeholder="Enter student name"
            />

            <TextInput
              style={styles.modalInput}
              value={studentSection}
              onChangeText={setStudentSection}
              placeholder="Enter section (e.g., A, B, C)"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setStudentModalVisible(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={editingStudent ? handleEditStudent : handleAddStudent}
                disabled={loading}
              >
                <Text style={styles.modalSaveButtonText}>
                  {loading ? 'Saving...' : (editingStudent ? 'Update' : 'Add')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Subject Modal */}
      <Modal
        visible={subjectModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSubjectModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Subject</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSubjectModalVisible(false)}
              >
                <X size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalInput}
              value={newSubject}
              onChangeText={setNewSubject}
              placeholder="Enter subject name"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setSubjectModalVisible(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleAddSubject}
                disabled={loading}
              >
                <Text style={styles.modalSaveButtonText}>
                  {loading ? 'Adding...' : 'Add'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Test Modal */}
      <Modal
        visible={testModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setTestModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingTest ? 'Edit Test' : 'Add Test'}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setTestModalVisible(false)}
              >
                <X size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalInput}
              value={newTest}
              onChangeText={setNewTest}
              placeholder="Enter test name"
            />

            <TextInput
              style={styles.modalInput}
              value={testTotalMarks}
              onChangeText={setTestTotalMarks}
              placeholder="Total marks"
              keyboardType="numeric"
            />

            <TextInput
              style={styles.modalInput}
              value={testDate}
              onChangeText={setTestDate}
              placeholder="Date (YYYY-MM-DD)"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setTestModalVisible(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={editingTest ? handleEditTest : handleAddTest}
                disabled={loading}
              >
                <Text style={styles.modalSaveButtonText}>
                  {loading ? 'Saving...' : (editingTest ? 'Update' : 'Add')}
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
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 16,
    flex: 1,
  },
  headerSpacer: {
    width: 40,
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
  marksReportButton: {
    backgroundColor: '#000',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: 'center',
  },
  marksReportButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  tabHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tabTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  loader: {
    marginTop: 40,
  },
  studentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '500',
  },
  studentSection: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  studentActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  subjectCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '500',
  },
  attendanceHeader: {
    marginBottom: 16,
  },
  attendanceControls: {
    marginBottom: 16,
  },
  controlGroup: {
    marginBottom: 12,
  },
  controlLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  subjectButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  subjectButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  subjectButtonActive: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  subjectButtonText: {
    fontSize: 14,
    color: '#666',
  },
  subjectButtonTextActive: {
    color: '#fff',
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
  },
  attendanceActions: {
    flexDirection: 'row',
    gap: 12,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
  },
  attendanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 8,
  },
  attendanceSwitches: {
    flexDirection: 'row',
    gap: 8,
  },
  attendanceSwitch: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
  },
  attendanceSwitchActive: {
    backgroundColor: '#000',
  },
  attendanceSwitchText: {
    fontSize: 14,
    color: '#666',
  },
  attendanceSwitchTextActive: {
    color: '#fff',
  },
  reportControls: {
    marginBottom: 16,
  },
  reportActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  reportTable: {
    flex: 1,
  },
  reportHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  reportHeaderCell: {
    flex: 1,
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  reportRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  reportCell: {
    flex: 1,
    fontSize: 14,
    textAlign: 'center',
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
  // Test styles
  testCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  testInfo: {
    flex: 1,
  },
  testName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  testSubject: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  testDetails: {
    fontSize: 12,
    color: '#999',
  },
  testActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  // Grade styles
  gradeControls: {
    marginBottom: 16,
  },
  gradeLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  gradePicker: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    backgroundColor: '#fff',
  },
  gradePickerText: {
    fontSize: 16,
    color: '#000',
  },
  gradeForm: {
    flex: 1,
  },
  gradeFormTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  gradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  gradeStudentName: {
    flex: 2,
    fontSize: 14,
    fontWeight: '500',
  },
  gradeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    textAlign: 'center',
  },
  gradeRemarksInput: {
    flex: 2,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
  },
  saveGradesButton: {
    backgroundColor: '#000',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 16,
  },
  saveGradesButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveGradesButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
}); 