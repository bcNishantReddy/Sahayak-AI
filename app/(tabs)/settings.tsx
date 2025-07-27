import React, { useState } from 'react';
import TermsAndConditions from '@/components/TermsAndConditions';
import PrivacyPolicy from '@/components/PrivacyPolicy';
import LanguageSelector from '@/components/LanguageSelector';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Switch,
  Alert,
  Modal,
  TextInput,
  Pressable,
  useColorScheme,
} from 'react-native';
import { User, BookOpen, Download, Trash2, LogOut, ChevronRight, FileText } from 'lucide-react-native';
import { StorageService } from '@/utils/storage';
import { useRouter } from 'expo-router';
import SahayakLogo from '@/components/SahayakLogo';
import { NCERT_DATABASE } from '@/types';
import { auth, db } from '@/utils/firebase';
import { setDoc, doc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import FeatureTour, { FeatureTourStep } from '@/components/FeatureTour';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';

const CLASSES = [
  'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6',
  'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'
];
const LANGUAGES = ['English', 'Hindi', 'Bengali', 'Tamil', 'Telugu', 'Marathi', 'Gujarati', 'Kannada', 'Malayalam', 'Punjabi'];

export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profileModal, setProfileModal] = useState(false);
  const [classModal, setClassModal] = useState(false);
  const [textbookModal, setTextbookModal] = useState(false);
  const [languageModal, setLanguageModal] = useState(false);
  const [termsModal, setTermsModal] = useState(false);
  const [privacyModal, setPrivacyModal] = useState(false);
  const [editProfile, setEditProfile] = useState({ name: '', email: '', location: '' });
  const [editClasses, setEditClasses] = useState<string[]>([]);
  const [editLanguage, setEditLanguage] = useState('English');
  const [editSubjects, setEditSubjects] = useState<Record<string, string[]>>({});
  const [editTextbooks, setEditTextbooks] = useState<string[]>([]);
  const [showTour, setShowTour] = React.useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  React.useEffect(() => {
    loadUserData();
    (async () => {
      const step = await AsyncStorage.getItem('featureTourStep');
      if (step === '2') setShowTour(true);
    })();
  }, []);

  const loadUserData = async () => {
    const userData = await StorageService.getUser();
    setUser(userData);
    setEditProfile({
      name: userData?.name || '',
      email: userData?.email || '',
      location: userData?.location || '',
    });
    setEditClasses(userData?.selectedClasses || []);
    setEditLanguage(userData?.preferredLanguage || 'English');
    setEditSubjects(userData?.selectedSubjects || {});
    setEditTextbooks(userData?.selectedTextbooks?.books || []);
  };

  const handleProfileSave = async () => {
    const updated = { ...user, ...editProfile };
    await StorageService.saveUser(updated);
    await setDoc(doc(db, 'users', updated.id), updated, { merge: true });
    setProfileModal(false);
    loadUserData();
  };

  const handleClassSave = async () => {
    const updated = { ...user, selectedClasses: editClasses };
    await StorageService.saveUser(updated);
    await setDoc(doc(db, 'users', updated.id), updated, { merge: true });
    setClassModal(false);
    loadUserData();
  };

  const handleLanguageSave = async () => {
    const updated = { ...user, preferredLanguage: editLanguage };
    await StorageService.saveUser(updated);
    await setDoc(doc(db, 'users', updated.id), updated, { merge: true });
    setLanguageModal(false);
    loadUserData();
  };

  const handleClassSubjectSave = async () => {
    // Build textbooks from selected subjects
    let textbooks: string[] = [];
    Object.entries(editSubjects).forEach(([className, subjects]) => {
      const classData = NCERT_DATABASE[className as keyof typeof NCERT_DATABASE];
      if (classData) {
        subjects.forEach(subject => {
          const books = classData.subjects[subject as keyof typeof classData.subjects] || [];
          textbooks = textbooks.concat(books);
        });
      }
    });
    const updated = { ...user, selectedClasses: editClasses, selectedSubjects: editSubjects, selectedTextbooks: { books: textbooks } };
    await StorageService.saveUser(updated);
    await setDoc(doc(db, 'users', updated.id), updated, { merge: true });
    setClassModal(false);
    loadUserData();
  };
  const handleTextbookSave = async () => {
    const updated = { ...user, selectedTextbooks: { books: editTextbooks } };
    await StorageService.saveUser(updated);
    await setDoc(doc(db, 'users', updated.id), updated, { merge: true });
    setTextbookModal(false);
    loadUserData();
  };

  const handleLogout = async () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    try {
      await signOut(auth);
      await StorageService.clearAll();
      setShowLogoutModal(false);
      router.replace('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  const handleTourFinish = async () => {
    setShowTour(false);
    await AsyncStorage.setItem('featureTourStep', 'done');
  };

  const tourSteps: FeatureTourStep[] = [
    {
      title: 'Settings & Preferences',
      description: 'Update your profile, language, and teaching preferences anytime.',
      position: 'bottom',
      align: 'left',
    },
  ];

  const SettingItem = ({
    icon: Icon,
    title,
    subtitle,
    onPress,
    rightElement
  }: {
    icon: any;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
  }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.settingLeft}>
        <View style={styles.iconContainer}>
          <Icon size={20} color="#000" />
        </View>
        <View style={styles.settingContent}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {rightElement || <ChevronRight size={20} color="#999" />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, darkMode && { backgroundColor: '#111' }]}>
      <FeatureTour steps={tourSteps} visible={showTour} onFinish={handleTourFinish} />
      <View style={styles.header}>
        <Text style={[styles.headerTitle, darkMode && { color: '#fff' }]}>Settings</Text>
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileContainer}>
            <View style={styles.profileAvatar}>
              <User size={30} color="#fff" />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.name || 'Teacher'}</Text>
              <Text style={styles.profileEmail}>{user?.email || 'teacher@school.edu'}</Text>
              <Text style={styles.profileRole}>Mathematics Teacher</Text>
              {user?.location && (
                <Text style={styles.profileLocation}>📍 {user.location}</Text>
              )}
            </View>
            <TouchableOpacity style={styles.editButton} onPress={() => setProfileModal(true)}>
              <Text style={{ color: '#000', fontSize: 14 }}>Edit</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Teaching Profile */}
        <View style={styles.section}>
          <SettingItem
            icon={BookOpen}
            title="Classes & Subjects"
            subtitle={user?.selectedClasses?.length ? user.selectedClasses.join(', ') : 'No classes selected'}
            onPress={() => setClassModal(true)}
          />
        </View>

        {/* Textbooks */}
        <View style={styles.section}>
          <SettingItem
            icon={BookOpen}
            title="Uploaded Textbooks"
            subtitle={user?.selectedTextbooks ? Object.values(user.selectedTextbooks).flat().join(', ') : 'No textbooks selected'}
            onPress={() => setTextbookModal(true)}
          />
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={styles.iconContainer}>
                <FileText size={20} color={darkMode ? '#fff' : '#000'} />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, darkMode && { color: '#fff' }]}>Work Light/Dark Mode</Text>
                <Text style={[styles.settingSubtitle, darkMode && { color: '#bbb' }]}>Toggle between light and dark mode</Text>
              </View>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: '#F0F0F0', true: '#333' }}
              thumbColor={darkMode ? '#fff' : '#000'}
            />
          </View>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={styles.iconContainer}>
                <FileText size={20} color="#000" />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>{t('settings.language')}</Text>
                <Text style={styles.settingSubtitle}>{t('settings.selectLanguage')}</Text>
              </View>
            </View>
            <LanguageSelector />
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <SettingItem
            icon={FileText}
            title="Terms of Service"
            onPress={() => setTermsModal(true)}
          />
          <SettingItem
            icon={FileText}
            title="Privacy Policy"
            onPress={() => setPrivacyModal(true)}
          />
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={styles.iconContainer}>
                <FileText size={20} color="#000" />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Version</Text>
                <Text style={styles.settingSubtitle}>1.0.0</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Logout */}
        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={20} color="#000" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Brand */}
        <View style={styles.brandSection}>
          <SahayakLogo size={100} showText={true} color="#000" />
        </View>
      </ScrollView>

      {/* Profile Modal */}
      <Modal visible={profileModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TextInput
              style={styles.input}
              placeholder="Name"
              value={editProfile.name}
              onChangeText={t => setEditProfile({ ...editProfile, name: t })}
              placeholderTextColor="#999"
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={editProfile.email}
              onChangeText={t => setEditProfile({ ...editProfile, email: t })}
              placeholderTextColor="#999"
            />
            <TextInput
              style={styles.input}
              placeholder="Location"
              value={editProfile.location}
              onChangeText={t => setEditProfile({ ...editProfile, location: t })}
              placeholderTextColor="#999"
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.modalButton} onPress={() => setProfileModal(false)}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalButton} onPress={handleProfileSave}>
                <Text style={styles.modalButtonText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Classes & Subjects Modal */}
      <Modal visible={classModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Classes & Subjects</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {CLASSES.map(cls => (
                <View key={cls}>
                  <TouchableOpacity
                    style={[styles.classOption, editClasses.includes(cls) && styles.selectedClassOption]}
                    onPress={() => {
                      setEditClasses(prev => prev.includes(cls) ? prev.filter(c => c !== cls) : [...prev, cls]);
                      if (!editClasses.includes(cls)) setEditSubjects(s => ({ ...s, [cls]: [] }));
                      else setEditSubjects(s => { const copy = { ...s }; delete copy[cls]; return copy; });
                    }}
                  >
                    <Text style={[styles.classOptionText, editClasses.includes(cls) && styles.selectedClassOptionText]}>{cls}</Text>
                  </TouchableOpacity>
                  {editClasses.includes(cls) && (
                    <View style={{ marginLeft: 10 }}>
                      {(Object.keys(NCERT_DATABASE[cls as keyof typeof NCERT_DATABASE]?.subjects || {})).map(subject => (
                        <TouchableOpacity
                          key={subject}
                          style={[styles.classOption, editSubjects[cls]?.includes(subject) && styles.selectedClassOption]}
                          onPress={() => {
                            setEditSubjects(prev => {
                              const prevSubjects = prev[cls] || [];
                              return {
                                ...prev,
                                [cls]: prevSubjects.includes(subject)
                                  ? prevSubjects.filter(s => s !== subject)
                                  : [...prevSubjects, subject],
                              };
                            });
                          }}
                        >
                          <Text style={[styles.classOptionText, editSubjects[cls]?.includes(subject) && styles.selectedClassOptionText]}>{subject}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
            <View style={styles.modalActions}>
              <Pressable style={styles.modalButton} onPress={() => setClassModal(false)}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalButton} onPress={handleClassSubjectSave}>
                <Text style={styles.modalButtonText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>



      {/* Uploaded Textbooks Modal */}
      <Modal visible={textbookModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Uploaded Textbooks</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {editTextbooks.map(book => (
                <TouchableOpacity
                  key={book}
                  style={[styles.classOption, styles.selectedClassOption]}
                  onPress={() => setEditTextbooks(prev => prev.filter(b => b !== book))}
                >
                  <Text style={[styles.classOptionText, styles.selectedClassOptionText]}>{book} (Tap to remove)</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.modalActions}>
              <Pressable style={styles.modalButton} onPress={() => setTextbookModal(false)}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalButton} onPress={handleTextbookSave}>
                <Text style={styles.modalButtonText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Terms and Conditions Modal */}
      <Modal visible={termsModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, {height: 500}]}>
            <Text style={styles.modalTitle}>Terms and Conditions</Text>
            <TermsAndConditions />
            <View style={styles.modalActions}>
              <Pressable style={styles.modalButton} onPress={() => setTermsModal(false)}>
                <Text style={styles.modalButtonText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      {/* Privacy Policy Modal */}
      <Modal visible={privacyModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, {height: 500}]}>
            <Text style={styles.modalTitle}>Privacy Policy</Text>
            <PrivacyPolicy />
            <View style={styles.modalActions}>
              <Pressable style={styles.modalButton} onPress={() => setPrivacyModal(false)}>
                <Text style={styles.modalButtonText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </View>
              </Modal>

        {/* Logout Confirmation Modal */}
        <Modal visible={showLogoutModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Logout</Text>
              <Text style={{ color: '#666', marginBottom: 20 }}>
                Are you sure you want to logout?
              </Text>
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalButton} onPress={cancelLogout}>
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, { marginLeft: 10 }]} 
                  onPress={confirmLogout}
                >
                  <Text style={[styles.modalButtonText, { color: '#ff3b30' }]}>Logout</Text>
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
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  content: {
    flex: 1,
  },
  profileSection: {
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 15,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  profileEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  profileRole: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
    marginTop: 2,
  },
  profileLocation: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  editButton: {
    padding: 8,
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 20,
    borderRadius: 12,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: '#eee',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
    borderWidth: 1,
    borderColor: '#eee',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  logoutSection: {
    backgroundColor: '#fff',
    marginBottom: 20,
    borderRadius: 12,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: '#eee',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginLeft: 15,
  },
  brandSection: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: 320,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    color: '#000',
    backgroundColor: '#fff',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  modalButtonText: {
    color: '#000',
    fontWeight: '500',
    fontSize: 16,
  },
  classOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 6,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
  },
  selectedClassOption: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  classOptionText: {
    color: '#000',
    fontSize: 15,
  },
  selectedClassOptionText: {
    color: '#fff',
  },
});