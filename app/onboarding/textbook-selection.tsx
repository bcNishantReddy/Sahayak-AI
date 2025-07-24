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
import { ChevronLeft, Upload, Check, BookOpen } from 'lucide-react-native';
import { NCERT_DATABASE } from '@/types';
import { StorageService } from '@/utils/storage';
import * as Location from 'expo-location';
import { db } from '@/utils/firebase';
import { setDoc, doc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const languages = ['English', 'Hindi', 'Bengali', 'Tamil', 'Telugu', 'Marathi', 'Gujarati', 'Kannada', 'Malayalam', 'Punjabi'];

export default function TextbookSelectionScreen() {
  const router = useRouter();
  const { selectedClasses, selectedSubjects } = useLocalSearchParams();
  const classesArray = selectedClasses ? JSON.parse(selectedClasses as string) : [];
  const subjectsData = selectedSubjects ? JSON.parse(selectedSubjects as string) : {};
  const [selectedBooks, setSelectedBooks] = useState<string[]>([]);
  const [preferredLanguage, setPreferredLanguage] = useState('English');

  const generateBooksList = () => {
    const books: any[] = [];
    classesArray.forEach((className: string) => {
      const classData = NCERT_DATABASE[className as keyof typeof NCERT_DATABASE];
      if (classData && subjectsData[className]) {
        subjectsData[className].forEach((subject: string) => {
          if (classData.subjects[subject as keyof typeof classData.subjects]) {
            const textbooks = classData.subjects[subject as keyof typeof classData.subjects];
            textbooks.forEach((book: string, index: number) => {
              books.push({
                id: `${className}-${subject}-${index}`,
                title: book,
                class: className,
                subject: subject,
              });
            });
          }
        });
      }
    });
    return books;
  };

  const availableBooks = generateBooksList();

  const toggleBook = (bookId: string) => {
    setSelectedBooks(prev => 
      prev.includes(bookId)
        ? prev.filter(id => id !== bookId)
        : [...prev, bookId]
    );
  };

  const handleFinish = async () => {
    try {
      // Get location permission and data
      let location = '';
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const locationData = await Location.getCurrentPositionAsync({});
        const address = await Location.reverseGeocodeAsync({
          latitude: locationData.coords.latitude,
          longitude: locationData.coords.longitude,
        });
        if (address[0]) {
          location = `${address[0].city}, ${address[0].region}`;
        }
      }

      // Save all onboarding data
      const user = await StorageService.getUser();
      if (user) {
        user.selectedTextbooks = { books: selectedBooks };
        user.location = location;
        user.preferredLanguage = preferredLanguage;
        user.onboardingCompleted = true;
        await StorageService.saveUser(user);
        await setDoc(doc(db, 'users', user.id), user, { merge: true });
        await AsyncStorage.setItem('featureTourStep', '0');
        await StorageService.setOnboardingCompleted(true);
      }

      router.replace('/(tabs)/chat');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      router.replace('/(tabs)/chat');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.stepIndicator}>Step 3 of 3</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Select your textbooks</Text>
        <Text style={styles.subtitle}>Choose from NCERT books or upload your own</Text>

        <ScrollView style={styles.booksContainer} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>Preferred Language</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.languageContainer}>
            {languages.map((language) => (
              <TouchableOpacity
                key={language}
                style={[
                  styles.languageButton,
                  preferredLanguage === language && styles.selectedLanguageButton,
                ]}
                onPress={() => setPreferredLanguage(language)}
              >
                <Text style={[
                  styles.languageText,
                  preferredLanguage === language && styles.selectedLanguageText,
                ]}>
                  {language}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.sectionTitle}>NCERT Textbooks</Text>
          
          <View style={styles.booksGrid}>
            {availableBooks.map((book) => (
              <TouchableOpacity
                key={book.id}
                style={[
                  styles.bookCard,
                  selectedBooks.includes(book.id) && styles.selectedBookCard,
                ]}
                onPress={() => toggleBook(book.id)}
              >
                <View style={styles.bookImage}>
                  <BookOpen size={40} color="#666666" />
                </View>
                {selectedBooks.includes(book.id) && (
                  <View style={styles.selectedOverlay}>
                    <Check size={24} color="#FFFFFF" />
                  </View>
                )}
                <View style={styles.bookInfo}>
                  <Text style={styles.bookTitle}>{book.title}</Text>
                  <Text style={styles.bookMeta}>{book.class} <Text style={{fontSize:18, color:'#999', marginHorizontal:2}}>·</Text> {book.subject}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Text style={styles.selectedCount}>
            {selectedBooks.length} book{selectedBooks.length !== 1 ? 's' : ''} selected
          </Text>
          <TouchableOpacity
            style={styles.finishButton}
            onPress={handleFinish}
          >
            <Text style={styles.finishText}>Start Using Sahayak AI</Text>
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
  booksContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 20,
    fontFamily: 'Poppins-SemiBold',
  },
  languageContainer: {
    marginBottom: 30,
  },
  languageButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  selectedLanguageButton: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  languageText: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
    fontFamily: 'Poppins-Medium',
  },
  selectedLanguageText: {
    color: '#FFFFFF',
  },
  booksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  bookCard: {
    width: '48%',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#E9ECEF',
  },
  selectedBookCard: {
    borderColor: '#000000',
  },
  bookImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#000000',
    borderRadius: 12,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookInfo: {
    padding: 15,
  },
  bookTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 5,
    fontFamily: 'Poppins-SemiBold',
  },
  bookMeta: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'Poppins-Regular',
  },
  uploadSection: {
    marginBottom: 20,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#000000',
    borderStyle: 'dashed',
  },
  uploadText: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '500',
    marginLeft: 10,
    fontFamily: 'Poppins-Medium',
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
  finishButton: {
    backgroundColor: '#000000',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  finishText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Poppins-SemiBold',
  },
});