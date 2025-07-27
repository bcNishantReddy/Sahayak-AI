export interface User {
  id: string;
  email: string;
  name: string;
  location?: string;
  preferredLanguage: string;
  onboardingCompleted: boolean;
  selectedClasses: string[];
  selectedSubjects: Record<string, string[]>;
  selectedTextbooks: Record<string, string[]>;
  // Only store class IDs, not full objects
  classIds?: string[];
}

export interface Document {
  id: string;
  title: string;
  type: 'worksheet' | 'quiz' | 'lesson-plan' | 'story';
  class: string;
  subject: string;
  content: string;
  questions?: Question[];
  createdAt: Date;
}

export interface Question {
  id: string;
  type: 'mcq' | 'short' | 'long' | 'fill';
  question: string;
  options?: string[];
  answer: string;
  marks: number;
}

export const NCERT_DATABASE = {
  "Class 1": {
    "no_of_subjects": 1,
    "subjects": {
      "Maths": ["Math's Magic (Ganit ka Jaadu) Part 1 (13 chapters)"]
    }
  },
  "Class 2": {
    "no_of_subjects": 1,
    "subjects": {
      "Maths": ["Math's Magic Part 2"]
    }
  },
  "Class 3": {
    "no_of_subjects": 2,
    "subjects": {
      "Maths": ["Math's Magic Part 3"],
      "EVS": ["Looking Around"]
    }
  },
  "Class 4": {
    "no_of_subjects": 2,
    "subjects": {
      "Maths": ["Maths (14 chapters)"],
      "EVS": ["Looking Around"]
    }
  },
  "Class 5": {
    "no_of_subjects": 2,
    "subjects": {
      "Maths": ["Maths"],
      "EVS": ["Looking Around"]
    }
  },
  "Class 6": {
    "no_of_subjects": 4,
    "subjects": {
      "Maths": ["Maths"],
      "Science": ["Science Book"],
      "Social Science": ["Social Science Book"]
    }
  },
  "Class 7": {
    "no_of_subjects": 4,
    "subjects": {
      "Maths": ["Maths"],
      "Science": ["Science"],
      "Social Science": ["History", "Geography", "Civics"]
    }
  },
  "Class 8": {
    "no_of_subjects": 4,
    "subjects": {
      "Maths": ["Maths"],
      "Science": ["Science"],
      "Social Science": ["History", "Geography", "Civics"]
    }
  },
  "Class 9": {
    "no_of_subjects": 5,
    "subjects": {
      "Maths": ["Maths"],
      "Science": ["Science"],
      "Social Science": ["History", "Geography", "Civics"]
    }
  },
  "Class 10": {
    "no_of_subjects": 5,
    "subjects": {
      "Maths": ["Maths"],
      "Science": ["Science"],
      "Social Science": ["History", "Geography", "Civics"]
    }
  },
  "Class 11": {
    "no_of_subjects": 5,
    "subjects": {
      "Maths": ["Mathematics"],
      "Physics": ["Physics"],
      "Chemistry": ["Chemistry"],
      "Biology": ["Biology"],
      "Economics": ["Economics"],
      "Political Science": ["Political Science"]
    }
  },
  "Class 12": {
    "no_of_subjects": 6,
    "subjects": {
      "Maths": ["Mathematics"],
      "Physics": ["Physics"],
      "Chemistry": ["Chemistry"],
      "Biology": ["Biology"],
      "Accountancy": ["Accountancy"],
      "Business Studies": ["Business Studies"],
      "Economics": ["Economics"]
    }
  }
};

// HIGHLY SCALABLE ARCHITECTURE FOR 100s OF STUDENTS/SUBJECTS/DAYS

export interface Class {
  id: string;
  name: string; // e.g., "10A", "10B", "Class 10"
  teacherId: string; // Reference to the teacher/user who created this class
  createdAt: number;
  updatedAt: number;
  // Metadata for quick access
  studentCount: number;
  subjectCount: number;
  lastAttendanceDate?: string; // YYYY-MM-DD format
}

export interface Student {
  id: string;
  name: string;
  classId: string; // Reference to the class this student belongs to
  section: string; // e.g., "A", "B", "C"
  photoUrl?: string;
  teacherId: string; // Reference to the teacher
  createdAt: number;
  updatedAt: number;
  // Metadata for quick access
  rollNumber?: string;
  email?: string;
  phone?: string;
}

export interface Subject {
  id: string;
  name: string; // e.g., "Mathematics", "English", "Science"
  classId: string; // Reference to the class this subject belongs to
  teacherId: string; // Reference to the teacher who added this subject
  createdAt: number;
  // Metadata for quick access
  code?: string; // Subject code
  description?: string;
}

export interface AttendanceRecord {
  id: string;
  classId: string; // Reference to the class
  subjectId: string; // Reference to the subject
  studentId: string; // Reference to the student
  date: string; // YYYY-MM-DD format
  status: 'present' | 'absent' | 'unmarked';
  teacherId: string; // Reference to the teacher who marked attendance
  timestamp: number;
  // Metadata for quick access
  period?: string; // e.g., "1st Period", "2nd Period"
  remarks?: string;
}

// COMPOSITE KEYS FOR EFFICIENT QUERIES
export interface AttendanceCompositeKey {
  classId: string;
  subjectId: string;
  date: string;
}

export interface StudentAttendanceSummary {
  studentId: string;
  studentName: string;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  attendancePercentage: number;
}

export interface SubjectAttendanceSummary {
  subjectId: string;
  subjectName: string;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  attendancePercentage: number;
}

// PAGINATION SUPPORT
export interface PaginationOptions {
  limit: number;
  offset?: number;
  lastDoc?: any; // Firestore document snapshot for cursor-based pagination
}

export interface PaginatedResult<T> {
  data: T[];
  hasMore: boolean;
  lastDoc?: any;
  totalCount?: number;
}

// ===== GRADES SYSTEM =====

export interface Test {
  id: string;
  name: string; // e.g., "Midterm Exam", "Final Exam", "Quiz 1"
  classId: string; // Reference to the class
  subjectId: string; // Reference to the subject
  teacherId: string; // Reference to the teacher
  totalMarks: number; // Maximum marks for the test
  date: string; // YYYY-MM-DD format
  createdAt: number;
  // Metadata for quick access
  description?: string;
  duration?: number; // in minutes
  weightage?: number; // percentage weight in final grade
}

export interface Grade {
  id: string;
  testId: string; // Reference to the test
  studentId: string; // Reference to the student
  classId: string; // Reference to the class
  subjectId: string; // Reference to the subject
  teacherId: string; // Reference to the teacher
  marksObtained: number; // Marks scored by student
  totalMarks: number; // Maximum marks for the test
  percentage: number; // (marksObtained / totalMarks) * 100
  grade: string; // A+, A, B+, B, C+, C, D, F
  remarks?: string;
  timestamp: number;
}

export interface StudentGradeSummary {
  studentId: string;
  studentName: string;
  totalTests: number;
  averagePercentage: number;
  averageGrade: string;
  highestGrade: string;
  lowestGrade: string;
  totalMarks: number;
  totalObtained: number;
}

export interface TestGradeSummary {
  testId: string;
  testName: string;
  totalStudents: number;
  averagePercentage: number;
  averageGrade: string;
  highestScore: number;
  lowestScore: number;
  passCount: number;
  failCount: number;
}

// Firebase Collections Structure for Scalability:
// users/{userId} - User profile and preferences (only class IDs)
// classes/{classId} - Class information with metadata
// students/{studentId} - Student information with metadata
// subjects/{subjectId} - Subject information with metadata
// attendance/{attendanceId} - Individual attendance records with composite keys
// 
// Indexes for efficient queries:
// - classes: teacherId, createdAt
// - students: classId, teacherId, createdAt
// - subjects: classId, teacherId, createdAt
// - attendance: classId+subjectId+date (composite), studentId, teacherId, timestamp