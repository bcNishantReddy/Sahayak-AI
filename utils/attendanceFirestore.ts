import { 
  doc, 
  collection, 
  addDoc, 
  getDocs, 
  getDoc, 
  setDoc,
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  limit,
  startAfter,
  writeBatch,
  serverTimestamp,
  runTransaction,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { 
  Class, 
  Student, 
  Subject, 
  AttendanceRecord, 
  Test,
  Grade,
  StudentGradeSummary,
  TestGradeSummary,
  PaginationOptions, 
  PaginatedResult,
  StudentAttendanceSummary,
  SubjectAttendanceSummary,
  AttendanceCompositeKey
} from '@/types';

// Helper function to get current user ID
export const getCurrentUserId = (): string => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }
  return user.uid;
};

// Helper function to ensure user document exists
export const ensureUserDocument = async (): Promise<void> => {
  const userId = getCurrentUserId();
  const userRef = doc(db, 'users', userId);
  
  try {
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      // Create user document if it doesn't exist
      await setDoc(userRef, {
        id: userId,
        email: auth.currentUser?.email || '',
        name: auth.currentUser?.displayName || '',
        preferredLanguage: 'English',
        onboardingCompleted: true,
        selectedClasses: [],
        selectedSubjects: {},
        selectedTextbooks: {},
        classIds: []
      });
    }
  } catch (error) {
    console.error('Error ensuring user document:', error);
  }
};

// Helper function to generate unique IDs
const generateId = (prefix: string): string => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Helper function to create composite key for attendance
const createAttendanceCompositeKey = (classId: string, subjectId: string, date: string): string => {
  return `${classId}_${subjectId}_${date}`;
};

// ===== CLASS OPERATIONS =====

export const addClass = async (className: string): Promise<string> => {
  try {
    const userId = getCurrentUserId();
    
    const newClass: Omit<Class, 'id'> = {
      name: className,
      teacherId: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      studentCount: 0,
      subjectCount: 0
    };
    
    // Add class to classes collection and get the Firestore document ID
    const docRef = await addDoc(collection(db, 'classes'), newClass);
    const classId = docRef.id;
    
    // Update the class document with the correct ID
    await updateDoc(docRef, { id: classId });
    
    // Update user document to include class ID
    const userRef = doc(db, 'users', userId);
    try {
      await updateDoc(userRef, {
        classIds: arrayUnion(classId)
      });
    } catch (error) {
      // If user document doesn't exist, create it
      await setDoc(userRef, {
        id: userId,
        email: auth.currentUser?.email || '',
        name: auth.currentUser?.displayName || '',
        preferredLanguage: 'English',
        onboardingCompleted: true,
        selectedClasses: [],
        selectedSubjects: {},
        selectedTextbooks: {},
        classIds: [classId]
      });
    }
    
    return classId;
  } catch (error) {
    console.error('❌ Error adding class:', error);
    throw new Error(`Failed to add class: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const getClasses = async (pagination?: PaginationOptions): Promise<PaginatedResult<Class>> => {
  try {
    const userId = getCurrentUserId();
    let q = query(
      collection(db, 'classes'),
      where('teacherId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    if (pagination?.limit) {
      q = query(q, limit(pagination.limit));
    }
    
    if (pagination?.lastDoc) {
      q = query(q, startAfter(pagination.lastDoc));
    }
    
    const querySnapshot = await getDocs(q);
    const classes: Class[] = [];
    
    querySnapshot.forEach((doc) => {
      classes.push(doc.data() as Class);
    });
    
    return {
      data: classes,
      hasMore: querySnapshot.docs.length === (pagination?.limit || 50),
      lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1],
      totalCount: classes.length
    };
  } catch (error) {
    console.error('Error getting classes:', error);
    throw new Error(`Failed to get classes: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const updateClass = async (classId: string, updates: Partial<Class>): Promise<void> => {
  try {
    const classRef = doc(db, 'classes', classId);
    await updateDoc(classRef, {
      ...updates,
      updatedAt: Date.now()
    });
  } catch (error) {
    console.error('Error updating class:', error);
    throw new Error(`Failed to update class: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const deleteClass = async (classId: string): Promise<void> => {
  try {
    const batch = writeBatch(db);
    
    // Delete the class
    const classRef = doc(db, 'classes', classId);
    batch.delete(classRef);
    
    // Delete all students in this class
    const studentsQuery = query(collection(db, 'students'), where('classId', '==', classId));
    const studentsSnapshot = await getDocs(studentsQuery);
    studentsSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    // Delete all subjects in this class
    const subjectsQuery = query(collection(db, 'subjects'), where('classId', '==', classId));
    const subjectsSnapshot = await getDocs(subjectsQuery);
    subjectsSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    // Delete all attendance records for this class
    const attendanceQuery = query(collection(db, 'attendance'), where('classId', '==', classId));
    const attendanceSnapshot = await getDocs(attendanceQuery);
    attendanceSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    // Delete all grades for this class
    const gradesQuery = query(collection(db, 'grades'), where('classId', '==', classId));
    const gradesSnapshot = await getDocs(gradesQuery);
    gradesSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    // Delete all tests for this class
    const testsQuery = query(collection(db, 'tests'), where('classId', '==', classId));
    const testsSnapshot = await getDocs(testsQuery);
    testsSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    
    // Remove class ID from user's classIds array
    const userId = getCurrentUserId();
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      classIds: arrayRemove(classId)
    });
  } catch (error) {
    console.error('Error deleting class:', error);
    throw new Error(`Failed to delete class: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// ===== STUDENT OPERATIONS =====

export const addStudent = async (student: Omit<Student, 'id' | 'createdAt' | 'updatedAt' | 'teacherId'>): Promise<string> => {
  try {
    const userId = getCurrentUserId();
    
    const newStudent: Omit<Student, 'id'> = {
      ...student,
      teacherId: userId,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    // Add student to students collection and get the Firestore document ID
    const docRef = await addDoc(collection(db, 'students'), newStudent);
    const studentId = docRef.id;
    
    // Update the student document with the correct ID
    await updateDoc(docRef, { id: studentId });
    
    // Update class student count
    const classRef = doc(db, 'classes', student.classId);
    
    // Check if class exists before updating
    const classDoc = await getDoc(classRef);
    if (!classDoc.exists()) {
      console.warn(`⚠️ Class ${student.classId} not found, skipping student count update`);
      return studentId;
    }
    
    await runTransaction(db, async (transaction) => {
      const classDoc = await transaction.get(classRef);
      if (classDoc.exists()) {
        const classData = classDoc.data();
        const currentCount = classData?.studentCount || 0;
        transaction.update(classRef, { studentCount: currentCount + 1 });
      }
    });
    
    return studentId;
  } catch (error) {
    console.error('Error adding student:', error);
    throw new Error(`Failed to add student: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const getStudents = async (classId?: string, pagination?: PaginationOptions): Promise<PaginatedResult<Student>> => {
  try {
    const userId = getCurrentUserId();
    let q;
    
    if (classId) {
      q = query(
        collection(db, 'students'),
        where('classId', '==', classId),
        where('teacherId', '==', userId),
        orderBy('createdAt', 'asc')
      );
    } else {
      q = query(
        collection(db, 'students'),
        where('teacherId', '==', userId),
        orderBy('createdAt', 'asc')
      );
    }
    
    if (pagination?.limit) {
      q = query(q, limit(pagination.limit));
    }
    
    if (pagination?.lastDoc) {
      q = query(q, startAfter(pagination.lastDoc));
    }
    
    const querySnapshot = await getDocs(q);
    const students: Student[] = [];
    
    querySnapshot.forEach((doc) => {
      students.push(doc.data() as Student);
    });
    
    return {
      data: students,
      hasMore: querySnapshot.docs.length === (pagination?.limit || 50),
      lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1],
      totalCount: students.length
    };
  } catch (error) {
    console.error('Error getting students:', error);
    throw new Error(`Failed to get students: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const updateStudent = async (studentId: string, updates: Partial<Student>): Promise<void> => {
  try {
    const studentRef = doc(db, 'students', studentId);
    await updateDoc(studentRef, {
      ...updates,
      updatedAt: Date.now()
    });
  } catch (error) {
    console.error('Error updating student:', error);
    throw new Error(`Failed to update student: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const deleteStudent = async (studentId: string): Promise<void> => {
  try {
    const batch = writeBatch(db);
    
    // Get student data first
    const studentRef = doc(db, 'students', studentId);
    const studentDoc = await getDoc(studentRef);
    
    if (!studentDoc.exists()) {
      console.warn(`⚠️ Student ${studentId} not found, skipping deletion`);
      return;
    }
    
    const studentData = studentDoc.data() as Student;
    
    // Delete the student
    batch.delete(studentRef);
    
    // Delete all attendance records for this student
    const attendanceQuery = query(collection(db, 'attendance'), where('studentId', '==', studentId));
    const attendanceSnapshot = await getDocs(attendanceQuery);
    attendanceSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    
    // Update class student count
    const classRef = doc(db, 'classes', studentData.classId);
    
    // Check if class exists before updating
    const classDoc = await getDoc(classRef);
    if (!classDoc.exists()) {
      console.warn(`⚠️ Class ${studentData.classId} not found, skipping student count update`);
      return;
    }
    
    await runTransaction(db, async (transaction) => {
      const classDoc = await transaction.get(classRef);
      if (classDoc.exists()) {
        const currentCount = classDoc.data()?.studentCount || 0;
        transaction.update(classRef, { studentCount: Math.max(0, currentCount - 1) });
      }
    });
  } catch (error) {
    console.error('Error deleting student:', error);
    throw new Error(`Failed to delete student: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// ===== SUBJECT OPERATIONS =====

export const addSubject = async (subject: Omit<Subject, 'id' | 'createdAt' | 'teacherId'>): Promise<string> => {
  try {
    const userId = getCurrentUserId();
    
    const newSubject: Omit<Subject, 'id'> = {
      ...subject,
      teacherId: userId,
      createdAt: Date.now()
    };

    // Add subject to subjects collection and get the Firestore document ID
    const docRef = await addDoc(collection(db, 'subjects'), newSubject);
    const subjectId = docRef.id;
    
    // Update the subject document with the correct ID
    await updateDoc(docRef, { id: subjectId });
    
    // Update class subject count
    const classRef = doc(db, 'classes', subject.classId);
    
    // Check if class exists before updating
    const classDoc = await getDoc(classRef);
    if (!classDoc.exists()) {
      console.warn(`⚠️ Class ${subject.classId} not found, skipping subject count update`);
      return subjectId;
    }
    
    await runTransaction(db, async (transaction) => {
      const classDoc = await transaction.get(classRef);
      if (classDoc.exists()) {
        const classData = classDoc.data();
        const currentCount = classData?.subjectCount || 0;
        transaction.update(classRef, { subjectCount: currentCount + 1 });
      }
    });
    
    return subjectId;
  } catch (error) {
    console.error('Error adding subject:', error);
    throw new Error(`Failed to add subject: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const getSubjects = async (classId?: string, pagination?: PaginationOptions): Promise<PaginatedResult<Subject>> => {
  try {
    const userId = getCurrentUserId();
    let q;
    
    if (classId) {
      q = query(
        collection(db, 'subjects'),
        where('classId', '==', classId),
        where('teacherId', '==', userId),
        orderBy('createdAt', 'asc')
      );
    } else {
      q = query(
        collection(db, 'subjects'),
        where('teacherId', '==', userId),
        orderBy('createdAt', 'asc')
      );
    }
    
    if (pagination?.limit) {
      q = query(q, limit(pagination.limit));
    }
    
    if (pagination?.lastDoc) {
      q = query(q, startAfter(pagination.lastDoc));
    }
    
    const querySnapshot = await getDocs(q);
    const subjects: Subject[] = [];
    
    querySnapshot.forEach((doc) => {
      subjects.push(doc.data() as Subject);
    });
    
    return {
      data: subjects,
      hasMore: querySnapshot.docs.length === (pagination?.limit || 50),
      lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1],
      totalCount: subjects.length
    };
  } catch (error) {
    console.error('Error getting subjects:', error);
    throw new Error(`Failed to get subjects: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const deleteSubject = async (subjectId: string): Promise<void> => {
  try {
    const batch = writeBatch(db);
    
    // Get subject data first
    const subjectRef = doc(db, 'subjects', subjectId);
    const subjectDoc = await getDoc(subjectRef);
    
    if (!subjectDoc.exists()) {
      console.warn(`⚠️ Subject ${subjectId} not found, skipping deletion`);
      return;
    }
    
    const subjectData = subjectDoc.data() as Subject;
    
    // Delete the subject
    batch.delete(subjectRef);
    
    // Delete all attendance records for this subject
    const attendanceQuery = query(collection(db, 'attendance'), where('subjectId', '==', subjectId));
    const attendanceSnapshot = await getDocs(attendanceQuery);
    attendanceSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    
    // Update class subject count
    const classRef = doc(db, 'classes', subjectData.classId);
    
    // Check if class exists before updating
    const classDoc = await getDoc(classRef);
    if (!classDoc.exists()) {
      console.warn(`⚠️ Class ${subjectData.classId} not found, skipping subject count update`);
      return;
    }
    
    await runTransaction(db, async (transaction) => {
      const classDoc = await transaction.get(classRef);
      if (classDoc.exists()) {
        const currentCount = classDoc.data()?.subjectCount || 0;
        transaction.update(classRef, { subjectCount: Math.max(0, currentCount - 1) });
      }
    });
  } catch (error) {
    console.error('Error deleting subject:', error);
    throw new Error(`Failed to delete subject: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// ===== ATTENDANCE OPERATIONS =====

export const saveAttendance = async (attendanceRecords: Omit<AttendanceRecord, 'id' | 'timestamp' | 'teacherId'>[]): Promise<void> => {
  try {
    const userId = getCurrentUserId();
    const batch = writeBatch(db);
    const timestamp = Date.now();
    
    // Group attendance records by class for efficient processing
    const attendanceByClass: { [classId: string]: AttendanceRecord[] } = {};
    
    attendanceRecords.forEach((record) => {
      const newAttendance: AttendanceRecord = {
        ...record,
        id: generateId('attendance'),
        teacherId: userId,
        timestamp
      };
      
      if (!attendanceByClass[record.classId]) {
        attendanceByClass[record.classId] = [];
      }
      attendanceByClass[record.classId].push(newAttendance);
    });
    
    // Add all attendance records to batch
    attendanceRecords.forEach((record) => {
      const newAttendance: Omit<AttendanceRecord, 'id'> = {
        ...record,
        teacherId: userId,
        timestamp
      };
      
      const docRef = doc(collection(db, 'attendance'));
      batch.set(docRef, newAttendance);
    });
    
    await batch.commit();
    
    // Update class last attendance date
    for (const classId of Object.keys(attendanceByClass)) {
      const classRef = doc(db, 'classes', classId);
      
      // Check if class exists before updating
      const classDoc = await getDoc(classRef);
      if (!classDoc.exists()) {
        console.warn(`⚠️ Class ${classId} not found, skipping attendance update`);
        continue;
      }
      
      const records = attendanceByClass[classId];
      if (records.length > 0) {
        const lastDate = records.reduce((latest, record) => 
          record.date > latest ? record.date : latest, records[0].date
        );
        
        await updateDoc(classRef, { lastAttendanceDate: lastDate });
      }
    }
  } catch (error) {
    console.error('Error saving attendance:', error);
    throw new Error(`Failed to save attendance: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const getAttendance = async (
  classId: string, 
  subjectId: string, 
  date: string,
  pagination?: PaginationOptions
): Promise<PaginatedResult<AttendanceRecord>> => {
  try {
    let q = query(
      collection(db, 'attendance'),
      where('classId', '==', classId),
      where('subjectId', '==', subjectId),
      where('date', '==', date),
      orderBy('timestamp', 'desc')
    );
    
    if (pagination?.limit) {
      q = query(q, limit(pagination.limit));
    }
    
    if (pagination?.lastDoc) {
      q = query(q, startAfter(pagination.lastDoc));
    }
    
    const querySnapshot = await getDocs(q);
    const attendance: AttendanceRecord[] = [];
    
    querySnapshot.forEach((doc) => {
      attendance.push(doc.data() as AttendanceRecord);
    });
    
    return {
      data: attendance,
      hasMore: querySnapshot.docs.length === (pagination?.limit || 50),
      lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1],
      totalCount: attendance.length
    };
  } catch (error) {
    console.error('Error getting attendance:', error);
    throw new Error(`Failed to get attendance: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const updateAttendance = async (attendanceId: string, status: 'present' | 'absent' | 'unmarked'): Promise<void> => {
  try {
    const attendanceRef = doc(db, 'attendance', attendanceId);
    await updateDoc(attendanceRef, {
      status,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error updating attendance:', error);
    throw new Error(`Failed to update attendance: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const getAttendanceReport = async (
  classId: string,
  subjectId: string,
  startDate: string,
  endDate: string,
  pagination?: PaginationOptions
): Promise<PaginatedResult<AttendanceRecord>> => {
  try {
    let q = query(
      collection(db, 'attendance'),
      where('classId', '==', classId),
      where('subjectId', '==', subjectId),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'asc'),
      orderBy('timestamp', 'desc')
    );
    
    if (pagination?.limit) {
      q = query(q, limit(pagination.limit));
    }
    
    if (pagination?.lastDoc) {
      q = query(q, startAfter(pagination.lastDoc));
    }
    
    const querySnapshot = await getDocs(q);
    const attendance: AttendanceRecord[] = [];
    
    querySnapshot.forEach((doc) => {
      attendance.push(doc.data() as AttendanceRecord);
    });
    
    return {
      data: attendance,
      hasMore: querySnapshot.docs.length === (pagination?.limit || 50),
      lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1],
      totalCount: attendance.length
    };
  } catch (error) {
    console.error('Error getting attendance report:', error);
    throw new Error(`Failed to get attendance report: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// ===== ANALYTICS AND SUMMARY OPERATIONS =====

export const getStudentAttendanceSummary = async (
  classId: string,
  subjectId: string,
  startDate: string,
  endDate: string
): Promise<StudentAttendanceSummary[]> => {
  try {
    // Get all students in the class
    const studentsResult = await getStudents(classId);
    const students = studentsResult.data;
    
    // Get all attendance records for the period
    const attendanceResult = await getAttendanceReport(classId, subjectId, startDate, endDate);
    const attendance = attendanceResult.data;
    
    // Calculate summary for each student
    const summaries: StudentAttendanceSummary[] = students.map(student => {
      const studentAttendance = attendance.filter(att => att.studentId === student.id);
      const totalDays = studentAttendance.length;
      const presentDays = studentAttendance.filter(att => att.status === 'present').length;
      const absentDays = studentAttendance.filter(att => att.status === 'absent').length;
      const attendancePercentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;
      
      return {
        studentId: student.id,
        studentName: student.name,
        totalDays,
        presentDays,
        absentDays,
        attendancePercentage: Math.round(attendancePercentage * 100) / 100
      };
    });
    
    return summaries.sort((a, b) => b.attendancePercentage - a.attendancePercentage);
  } catch (error) {
    console.error('Error getting student attendance summary:', error);
    throw new Error(`Failed to get student attendance summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const getSubjectAttendanceSummary = async (
  classId: string,
  date: string
): Promise<SubjectAttendanceSummary[]> => {
  try {
    // Get all subjects in the class
    const subjectsResult = await getSubjects(classId);
    const subjects = subjectsResult.data;
    
    // Get all students in the class
    const studentsResult = await getStudents(classId);
    const students = studentsResult.data;
    
    // Calculate summary for each subject
    const summaries: SubjectAttendanceSummary[] = await Promise.all(
      subjects.map(async (subject) => {
        const attendanceResult = await getAttendance(classId, subject.id, date);
        const attendance = attendanceResult.data;
        
        const totalStudents = students.length;
        const presentCount = attendance.filter(att => att.status === 'present').length;
        const absentCount = attendance.filter(att => att.status === 'absent').length;
        const attendancePercentage = totalStudents > 0 ? (presentCount / totalStudents) * 100 : 0;
        
        return {
          subjectId: subject.id,
          subjectName: subject.name,
          totalStudents,
          presentCount,
          absentCount,
          attendancePercentage: Math.round(attendancePercentage * 100) / 100
        };
      })
    );
    
    return summaries.sort((a, b) => b.attendancePercentage - a.attendancePercentage);
  } catch (error) {
    console.error('Error getting subject attendance summary:', error);
    throw new Error(`Failed to get subject attendance summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// ===== REAL-TIME LISTENERS =====

export const subscribeToClassChanges = (
  classId: string,
  callback: (classData: Class | null) => void
): (() => void) => {
  const classRef = doc(db, 'classes', classId);
  return onSnapshot(classRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data() as Class);
    } else {
      callback(null);
    }
  });
};

export const subscribeToStudents = (
  classId: string,
  callback: (students: Student[]) => void
): (() => void) => {
  const q = query(
    collection(db, 'students'),
    where('classId', '==', classId),
    orderBy('createdAt', 'asc')
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const students: Student[] = [];
    querySnapshot.forEach((doc) => {
      students.push(doc.data() as Student);
    });
    callback(students);
  });
};

export const subscribeToSubjects = (
  classId: string,
  callback: (subjects: Subject[]) => void
): (() => void) => {
  const q = query(
    collection(db, 'subjects'),
    where('classId', '==', classId),
    orderBy('createdAt', 'asc')
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const subjects: Subject[] = [];
    querySnapshot.forEach((doc) => {
      subjects.push(doc.data() as Subject);
    });
    callback(subjects);
  });
};

// ===== TEST OPERATIONS =====

export const addTest = async (test: Omit<Test, 'id' | 'createdAt'>): Promise<string> => {
  try {
    const userId = getCurrentUserId();
    
    const newTest: Omit<Test, 'id'> = {
      ...test,
      teacherId: userId,
      createdAt: Date.now()
    };

    // Add test to tests collection and get the Firestore document ID
    const docRef = await addDoc(collection(db, 'tests'), newTest);
    const testId = docRef.id;
    
    // Update the test document with the correct ID
    await updateDoc(docRef, { id: testId });
    
    return testId;
  } catch (error) {
    console.error('Error adding test:', error);
    throw new Error(`Failed to add test: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const getTests = async (classId?: string, subjectId?: string, pagination?: PaginationOptions): Promise<PaginatedResult<Test>> => {
  try {
    const userId = getCurrentUserId();
    let q;
    
    if (classId && subjectId) {
      q = query(
        collection(db, 'tests'),
        where('classId', '==', classId),
        where('subjectId', '==', subjectId),
        where('teacherId', '==', userId)
      );
    } else if (classId) {
      q = query(
        collection(db, 'tests'),
        where('classId', '==', classId),
        where('teacherId', '==', userId)
      );
    } else {
      q = query(
        collection(db, 'tests'),
        where('teacherId', '==', userId)
      );
    }
    
    if (pagination?.limit) {
      q = query(q, limit(pagination.limit));
    }
    
    if (pagination?.lastDoc) {
      q = query(q, startAfter(pagination.lastDoc));
    }
    
    const querySnapshot = await getDocs(q);
    const tests: Test[] = [];
    
    querySnapshot.forEach((doc) => {
      tests.push({ id: doc.id, ...doc.data() } as Test);
    });
    
    // Sort in memory instead of using Firestore orderBy
    tests.sort((a, b) => b.createdAt - a.createdAt);
    
    return {
      data: tests,
      hasMore: querySnapshot.docs.length === (pagination?.limit || 50),
      lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1],
      totalCount: tests.length
    };
  } catch (error) {
    console.error('Error getting tests:', error);
    throw new Error(`Failed to get tests: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const updateTest = async (testId: string, updates: Partial<Test>): Promise<void> => {
  try {
    const testRef = doc(db, 'tests', testId);
    await updateDoc(testRef, {
      ...updates,
      updatedAt: Date.now()
    });
  } catch (error) {
    console.error('Error updating test:', error);
    throw new Error(`Failed to update test: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const deleteTest = async (testId: string): Promise<void> => {
  try {
    const batch = writeBatch(db);
    
    // Get test data first
    const testRef = doc(db, 'tests', testId);
    const testDoc = await getDoc(testRef);
    
    if (!testDoc.exists()) {
      console.warn(`⚠️ Test ${testId} not found, skipping deletion`);
      return;
    }
    
    // Delete the test
    batch.delete(testRef);
    
    // Delete all grades for this test
    const gradesQuery = query(collection(db, 'grades'), where('testId', '==', testId));
    const gradesSnapshot = await getDocs(gradesQuery);
    gradesSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
  } catch (error) {
    console.error('Error deleting test:', error);
    throw new Error(`Failed to delete test: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// ===== GRADE OPERATIONS =====

export const saveGrades = async (grades: Omit<Grade, 'id' | 'timestamp' | 'teacherId'>[]): Promise<void> => {
  try {
    const userId = getCurrentUserId();
    const batch = writeBatch(db);
    const timestamp = Date.now();
    
    grades.forEach((grade) => {
      const newGrade: Omit<Grade, 'id'> = {
        ...grade,
        teacherId: userId,
        timestamp
      };
      
      const docRef = doc(collection(db, 'grades'));
      batch.set(docRef, newGrade);
    });
    
    await batch.commit();
  } catch (error) {
    console.error('Error saving grades:', error);
    throw new Error(`Failed to save grades: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const getGrades = async (
  testId?: string,
  classId?: string,
  subjectId?: string,
  pagination?: PaginationOptions
): Promise<PaginatedResult<Grade>> => {
  try {
    const userId = getCurrentUserId();
    let q;
    
    if (testId) {
      q = query(
        collection(db, 'grades'),
        where('testId', '==', testId),
        where('teacherId', '==', userId)
      );
    } else if (classId && subjectId) {
      q = query(
        collection(db, 'grades'),
        where('classId', '==', classId),
        where('subjectId', '==', subjectId),
        where('teacherId', '==', userId)
      );
    } else if (classId) {
      q = query(
        collection(db, 'grades'),
        where('classId', '==', classId),
        where('teacherId', '==', userId)
      );
    } else {
      q = query(
        collection(db, 'grades'),
        where('teacherId', '==', userId)
      );
    }
    
    if (pagination?.limit) {
      q = query(q, limit(pagination.limit));
    }
    
    if (pagination?.lastDoc) {
      q = query(q, startAfter(pagination.lastDoc));
    }
    
    const querySnapshot = await getDocs(q);
    const grades: Grade[] = [];
    
    querySnapshot.forEach((doc) => {
      grades.push(doc.data() as Grade);
    });
    
    // Sort by timestamp in memory to avoid index issues
    grades.sort((a, b) => b.timestamp - a.timestamp);
    
    return {
      data: grades,
      hasMore: querySnapshot.docs.length === (pagination?.limit || 50),
      lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1],
      totalCount: grades.length
    };
  } catch (error) {
    console.error('Error getting grades:', error);
    throw new Error(`Failed to get grades: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const updateGrade = async (gradeId: string, updates: Partial<Grade>): Promise<void> => {
  try {
    const gradeRef = doc(db, 'grades', gradeId);
    await updateDoc(gradeRef, {
      ...updates,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error updating grade:', error);
    throw new Error(`Failed to update grade: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const deleteGrade = async (gradeId: string): Promise<void> => {
  try {
    const gradeRef = doc(db, 'grades', gradeId);
    await deleteDoc(gradeRef);
  } catch (error) {
    console.error('Error deleting grade:', error);
    throw new Error(`Failed to delete grade: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Helper function to calculate grade from percentage
export const calculateGrade = (percentage: number): string => {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C+';
  if (percentage >= 40) return 'C';
  if (percentage >= 30) return 'D';
  return 'F';
}; 