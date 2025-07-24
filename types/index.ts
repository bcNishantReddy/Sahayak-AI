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