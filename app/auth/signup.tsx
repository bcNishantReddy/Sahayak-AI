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
import { Eye, EyeOff, ChevronLeft, LogIn } from 'lucide-react-native';
import SahayakLogo from '@/components/SahayakLogo';
import { StorageService } from '@/utils/storage';
import { auth, googleProvider, db } from '@/utils/firebase';
import { createUserWithEmailAndPassword, signInWithCredential, GoogleAuthProvider } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

WebBrowser.maybeCompleteAuthSession();

export default function SignupScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

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
            email: user.email,
            name: user.displayName || user.email?.split('@')[0] || '',
            location: '',
            preferredLanguage: 'English',
            onboardingCompleted: false,
            selectedClasses: [],
            selectedSubjects: {},
            selectedTextbooks: {},
          };
          // Ensure email is a string, not null
          await StorageService.saveUser({ ...userData, email: user.email ?? '' });
          setLoading(false);
          router.replace('/onboarding/welcome');
        })
        .catch((error) => {
          setLoading(false);
          Alert.alert('Google Sign-Up Error', error.message);
        });
    }
  }, [response]);

  const handleSignup = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCred.user;
      const emailString = user.email ?? '';
      const userData = {
        id: user.uid,
        email: emailString,
        name: name || user.displayName || (emailString ? emailString.split('@')[0] : ''),
        location: '',
        preferredLanguage: 'English',
        onboardingCompleted: false,
        selectedClasses: [],
        selectedSubjects: {},
        selectedTextbooks: {},
      };
      await StorageService.saveUser({ ...userData, email: emailString });
      await setDoc(doc(db, 'users', user.uid), { ...userData, email: emailString });
      setLoading(false);
      router.replace('/onboarding/welcome');
    } catch (error: any) {
      setLoading(false);
      Alert.alert('Signup Error', error.message);
    }
  };

  const { width } = useWindowDimensions();

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
            <SahayakLogo size={100} showText={true} color="#000000" />
          </View>
          <View style={[styles.formSection, { width: '100%', maxWidth: 400 }]}> {/* Responsive maxWidth */}
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join thousands of teachers</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor="#999999"
                value={name}
                onChangeText={setName}
                onFocus={() => scrollRef.current?.scrollTo?.({ y: 0, animated: true })}
              />
            </View>
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
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Confirm Password"
                placeholderTextColor="#999999"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                onFocus={() => scrollRef.current?.scrollTo?.({ y: 0, animated: true })}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} color="#999999" />
                ) : (
                  <Eye size={20} color="#999999" />
                )}
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.signupButton, loading && styles.disabledButton]}
              onPress={handleSignup}
              disabled={loading}
            >
              <Text style={styles.signupButtonText}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.googleButton}
              onPress={() => promptAsync()}
              disabled={!request || loading}
            >
              <LogIn size={20} color="#000" style={{marginRight:8}} />
              <Text style={styles.googleButtonText}>Sign up with Google</Text>
            </TouchableOpacity>
            <View style={styles.loginSection}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/auth/login')}>
                <Text style={styles.loginLink}>Sign In</Text>
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
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 50,
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
    marginBottom: 16,
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
  signupButton: {
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
  signupButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  loginSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Poppins-Regular',
  },
  loginLink: {
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