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
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { StorageService } from '@/utils/storage';
import { db } from '@/utils/firebase';
import { setDoc, doc } from 'firebase/firestore';

const classes = [
  'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6',
  'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'
];

export default function ClassSelectionScreen() {
  const router = useRouter();
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);

  const toggleClass = (className: string) => {
    setSelectedClasses(prev => 
      prev.includes(className)
        ? prev.filter(c => c !== className)
        : [...prev, className]
    );
  };

  const handleContinue = async () => {
    if (selectedClasses.length > 0) {
      // Save selected classes to user data
      const user = await StorageService.getUser();
      if (user) {
        user.selectedClasses = selectedClasses;
        await StorageService.saveUser(user);
        await setDoc(doc(db, 'users', user.id), user, { merge: true });
      }
      router.push({
        pathname: '/onboarding/subject-selection',
        params: { selectedClasses: JSON.stringify(selectedClasses) }
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.stepIndicator}>Step 1 of 3</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Which classes do you teach?</Text>
        <Text style={styles.subtitle}>Select all the classes you currently teach</Text>

        <ScrollView style={styles.classGrid} showsVerticalScrollIndicator={false}>
          <View style={styles.gridContainer}>
            {classes.map((className) => (
              <TouchableOpacity
                key={className}
                style={[
                  styles.classCard,
                  selectedClasses.includes(className) && styles.selectedClassCard,
                ]}
                onPress={() => toggleClass(className)}
              >
                <Text style={[
                  styles.classText,
                  selectedClasses.includes(className) && styles.selectedClassText,
                ]}>
                  {className}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Text style={styles.selectedCount}>
            {selectedClasses.length} class{selectedClasses.length !== 1 ? 'es' : ''} selected
          </Text>
          <TouchableOpacity
            style={[
              styles.continueButton,
              selectedClasses.length === 0 && styles.disabledButton,
            ]}
            onPress={handleContinue}
            disabled={selectedClasses.length === 0}
          >
            <Text style={[
              styles.continueText,
              selectedClasses.length === 0 && styles.disabledText,
            ]}>
              Continue
            </Text>
            <ChevronRight size={20} color={selectedClasses.length > 0 ? '#FFFFFF' : '#999999'} />
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
  classGrid: {
    flex: 1,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  classCard: {
    width: '48%',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E9ECEF',
  },
  selectedClassCard: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  classText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'Poppins-SemiBold',
  },
  selectedClassText: {
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