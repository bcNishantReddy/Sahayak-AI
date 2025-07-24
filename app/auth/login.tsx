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
import { Eye, EyeOff, LogIn } from 'lucide-react-native';
import SahayakLogo from '@/components/SahayakLogo';
import { StorageService } from '@/utils/storage';
import { auth, googleProvider, db } from '@/utils/firebase';
import { signInWithEmailAndPassword, signInWithCredential, GoogleAuthProvider } from 'firebase/auth';
import { setDoc, doc, getDoc } from 'firebase/firestore';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Google Auth
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: '<YOUR_EXPO_CLIENT_ID>',
    iosClientId: '1081535716140-t4qfg8vqfrms05ovumurdmln2osrnsh2.apps.googleusercontent.com',
    androidClientId: '<YOUR_ANDROID_CLIENT_ID>',
    webClientId: '1081535716140-l0k2n832313gjjd4un97p4920oc39lo1.apps.googleusercontent.com',
  });

  React.useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      setLoading(true);
      signInWithCredential(auth, credential)
        .then(async (userCred) => {
          const user = userCred.user;
          const userData = {
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
          await StorageService.saveUser(userData);
          setLoading(false);
          router.replace('/onboarding/welcome');
        })
        .catch((error) => {
          setLoading(false);
          Alert.alert('Google Sign-In Error', error.message);
        });
    }
  }, [response]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const user = userCred.user;
      // Fetch user data from Firestore
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
        // Save to Firestore for first-time login
        await setDoc(doc(db, 'users', user.uid), userData);
      }
      await StorageService.saveUser(userData);
      setLoading(false);
      if (userData.onboardingCompleted) {
        router.replace('/');
      } else {
        router.replace('/onboarding/welcome');
      }
    } catch (error: any) {
      setLoading(false);
      Alert.alert('Login Error', error.message);
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
            <SahayakLogo size={150} showText={true} color="#000000" />
          </View>
          <View style={[styles.formSection, { width: '100%', maxWidth: 400 }]}> {/* Responsive maxWidth */}
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Email"
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
                placeholder="Password"
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
                {loading ? 'Signing In...' : 'Sign In'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.googleButton}
              onPress={() => promptAsync()}
              disabled={!request || loading}
            >
              <LogIn size={20} color="#000" style={{marginRight:8}} />
              <Text style={styles.googleButtonText}>Sign in with Google</Text>
            </TouchableOpacity>
            <View style={styles.signupSection}>
              <Text style={styles.signupText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/auth/signup')}>
                <Text style={styles.signupLink}>Sign Up</Text>
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
  content: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 60,
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
    fontFamily: 'Poppins-Bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 40,
    fontFamily: 'Poppins-Regular',
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
    fontFamily: 'Poppins-Regular',
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
    fontFamily: 'Poppins-SemiBold',
  },
  signupSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Poppins-Regular',
  },
  signupLink: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 12,
    paddingVertical: 12,
    justifyContent: 'center',
    marginBottom: 20,
  },
  googleButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
});