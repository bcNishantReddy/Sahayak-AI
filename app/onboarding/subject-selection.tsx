import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react-native';
import { NCERT_DATABASE } from '@/types';
import { StorageService } from '@/utils/storage';
import { db } from '@/utils/firebase';
import { setDoc, doc } from 'firebase/firestore';

export default function SubjectSelectionScreen() {
  const router = useRouter();
  const { selectedClasses } = useLocalSearchParams();
  const classesArray = selectedClasses ? JSON.parse(selectedClasses as string) : [];
  const [expandedClass, setExpandedClass] = useState<string | null>(null);
  const [selectedSubjects, setSelectedSubjects] = useState<Record<string, string[]>>({});

  const toggleClass = (className: string) => {
    setExpandedClass(expandedClass === className ? null : className);
  };

  const toggleSubject = (className: string, subject: string) => {
    setSelectedSubjects(prev => ({
      ...prev,
      [className]: prev[className]?.includes(subject)
        ? prev[className].filter(s => s !== subject)
        : [...(prev[className] || []), subject]
    }));
  };

  const getTotalSelectedSubjects = () => {
    return Object.values(selectedSubjects).reduce((total, subjects) => total + subjects.length, 0);
  };

  const handleContinue = async () => {
    if (getTotalSelectedSubjects() > 0) {
      // Save selected subjects to user data
      const user = await StorageService.getUser();
      if (user) {
        user.selectedSubjects = selectedSubjects;
        await StorageService.saveUser(user);
        await setDoc(doc(db, 'users', user.id), user, { merge: true });
      }
      router.push({
        pathname: '/onboarding/textbook-selection',
        params: { 
          selectedClasses: JSON.stringify(classesArray),
          selectedSubjects: JSON.stringify(selectedSubjects)
        }
      });
    }
  };

  const getSubjectsForClass = (className: string) => {
    const classData = NCERT_DATABASE[className as keyof typeof NCERT_DATABASE];
    return classData ? Object.keys(classData.subjects) : [];
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.stepIndicator}>Step 2 of 3</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Select subjects for each class</Text>
        <Text style={styles.subtitle}>Choose the subjects you teach in each selected class</Text>

        <ScrollView style={styles.classesContainer} showsVerticalScrollIndicator={false}>
          {classesArray.map((className: string) => (
            <View key={className} style={styles.classSection}>
              <TouchableOpacity
                style={styles.classHeader}
                onPress={() => toggleClass(className)}
              >
                <Text style={styles.className}>{className}</Text>
                <View style={styles.classHeaderRight}>
                  {selectedSubjects[className] && (
                    <Text style={styles.subjectCount}>
                      {selectedSubjects[className].length} selected
                    </Text>
                  )}
                  {expandedClass === className ? (
                    <ChevronUp size={20} color="#000000" />
                  ) : (
                    <ChevronDown size={20} color="#000000" />
                  )}
                </View>
              </TouchableOpacity>

              {expandedClass === className && (
                <View style={styles.subjectsContainer}>
                  {getSubjectsForClass(className).map((subject) => (
                    <TouchableOpacity
                      key={subject}
                      style={[
                        styles.subjectCard,
                        selectedSubjects[className]?.includes(subject) && styles.selectedSubjectCard,
                      ]}
                      onPress={() => toggleSubject(className, subject)}
                    >
                      <Text style={[
                        styles.subjectText,
                        selectedSubjects[className]?.includes(subject) && styles.selectedSubjectText,
                      ]}>
                        {subject}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <Text style={styles.selectedCount}>
            {getTotalSelectedSubjects()} subject{getTotalSelectedSubjects() !== 1 ? 's' : ''} selected
          </Text>
          <TouchableOpacity
            style={[
              styles.continueButton,
              getTotalSelectedSubjects() === 0 && styles.disabledButton,
            ]}
            onPress={handleContinue}
            disabled={getTotalSelectedSubjects() === 0}
          >
            <Text style={[
              styles.continueText,
              getTotalSelectedSubjects() === 0 && styles.disabledText,
            ]}>
              Continue
            </Text>
            <ChevronRight size={20} color={getTotalSelectedSubjects() > 0 ? '#FFFFFF' : '#999999'} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  stepIndicator: {
    fontSize: 14,
    color: '#999999',
    fontWeight: '500',
    fontFamily: 'Poppins-Medium',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    marginTop: 30,
    marginBottom: 10,
    fontFamily: 'Poppins-Bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 30,
    fontFamily: 'Poppins-Regular',
  },
  classesContainer: {
    flex: 1,
  },
  classSection: {
    marginBottom: 20,
  },
  classHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  className: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'Poppins-SemiBold',
  },
  classHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subjectCount: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
    marginRight: 10,
    fontFamily: 'Poppins-Medium',
  },
  subjectsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
    paddingTop: 15,
  },
  subjectCard: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    margin: 5,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  selectedSubjectCard: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  subjectText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    fontFamily: 'Poppins-Medium',
  },
  selectedSubjectText: {
    color: '#FFFFFF',
  },
  footer: {
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  selectedCount: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
    marginBottom: 15,
    fontFamily: 'Poppins-Medium',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    paddingVertical: 16,
    borderRadius: 12,
  },
  disabledButton: {
    backgroundColor: '#F0F0F0',
  },
  continueText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 5,
    fontFamily: 'Poppins-SemiBold',
  },
  disabledText: {
    color: '#999999',
  },
});