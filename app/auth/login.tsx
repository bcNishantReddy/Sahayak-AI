import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Eye, EyeOff } from 'lucide-react-native';
import SahayakLogo from '@/components/SahayakLogo'; // Your logo component
import { StorageService } from '@/utils/storage';
import { auth, db } from '@/utils/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc, getDoc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';

export default function LoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t('common.error'), t('auth.fillAllFields'));
      return;
    }
    setLoading(true);
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const user = userCred.user;
      // Always fetch user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      let userData;
      if (userDoc.exists()) {
        const data = userDoc.data();
        userData = {
          id: data.id || user.uid,
          email: typeof data.email === 'string' ? data.email : (user.email ?? ''),
          name: typeof data.name === 'string' ? data.name : (user.displayName || user.email?.split('@')[0] || ''),
          location: typeof data.location === 'string' ? data.location : '',
          preferredLanguage: typeof data.preferredLanguage === 'string' ? data.preferredLanguage : 'English',
          onboardingCompleted: !!data.onboardingCompleted,
          selectedClasses: Array.isArray(data.selectedClasses) ? data.selectedClasses : [],
          selectedSubjects: typeof data.selectedSubjects === 'object' && data.selectedSubjects !== null ? data.selectedSubjects : {},
          selectedTextbooks: typeof data.selectedTextbooks === 'object' && data.selectedTextbooks !== null ? data.selectedTextbooks : {},
        };
      } else {
        userData = {
          id: user.uid,
          email: user.email ?? '',
          name: user.displayName || user.email?.split('@')[0] || '',
          location: '',
          preferredLanguage: 'English',
          onboardingCompleted: false,
          selectedClasses: [],
          selectedSubjects: {},
          selectedTextbooks: {},
        };
        await setDoc(doc(db, 'users', user.uid), userData);
      }
      await StorageService.saveUser(userData);
      setLoading(false);
      // Always use Firestore value for onboardingCompleted
      if (userData.onboardingCompleted) {
        router.replace('/chat');
      } else {
        router.replace('/onboarding/welcome');
      }
    } catch (error: any) {
      setLoading(false);
              Alert.alert(t('common.error'), t('auth.loginError'));
    }
  };

  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: width > 600 ? width * 0.2 : 30,
            paddingVertical: 30,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoSection}>
            <SahayakLogo size={150} />
          </View>

          <View style={[styles.formSection, { width: '100%', maxWidth: 400 }]}>
                         <Text style={styles.title}>{t('auth.welcome')}</Text>
             <Text style={styles.subtitle}>{t('Join the revolution of education')}</Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                                 placeholder={t('auth.email')}
                placeholderTextColor="#999999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                onFocus={() => scrollRef.current?.scrollTo?.({ y: 0, animated: true })}
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                                 placeholder={t('auth.password')}
                placeholderTextColor="#999999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                onFocus={() => scrollRef.current?.scrollTo?.({ y: 0, animated: true })}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff size={20} color="#999999" />
                ) : (
                  <Eye size={20} color="#999999" />
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.disabledButton]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.loginButtonText}>
                                 {loading ? t('common.loading') : t('Sign In')}
              </Text>
            </TouchableOpacity>

            <View style={styles.signupSection}>
                             <Text style={styles.signupText}>{t('auth.dontHaveAccount')}</Text>
              <TouchableOpacity onPress={() => router.push('/auth/signup')}>
                                 <Text style={styles.signupLink}>{t(' Signup')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logoText: {
    marginTop: 8,
    fontSize: 18,
    color: '#000000',
    fontWeight: '600',
  },
  formSection: {
    width: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 40,
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#000000',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    padding: 4,
  },
  loginButton: {
    backgroundColor: '#000000',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  signupSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    fontSize: 14,
    color: '#666666',
  },
  signupLink: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '600',
  },
});
