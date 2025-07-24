import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import SahayakLogo from '@/components/SahayakLogo';
import { FileText, BookOpen, Sparkles, Book, LogOut } from 'lucide-react-native';
import { auth } from '@/utils/firebase';
import { signOut } from 'firebase/auth';
import { StorageService } from '@/utils/storage';

export default function WelcomeScreen() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      await StorageService.clearAll();
      router.replace('/auth/login');
    } catch (e) {
      // Optionally show error
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <LogOut size={20} color="#000" />
      </TouchableOpacity>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <SahayakLogo size={100} showText={true} color="#000000" />
        </View>
        
        <View style={styles.featuresContainer}>
          <View style={styles.feature}>
            <FileText size={24} color="#000" style={styles.featureIcon} />
            <Text style={styles.featureText}>Generate custom worksheets and quizzes</Text>
          </View>
          <View style={styles.feature}>
            <BookOpen size={24} color="#000" style={styles.featureIcon} />
            <Text style={styles.featureText}>Create engaging lesson plans</Text>
          </View>
          <View style={styles.feature}>
            <Sparkles size={24} color="#000" style={styles.featureIcon} />
            <Text style={styles.featureText}>Auto-grade student submissions</Text>
          </View>
          <View style={styles.feature}>
            <Book size={24} color="#000" style={styles.featureIcon} />
            <Text style={styles.featureText}>Educational storytelling</Text>
          </View>
        </View>

        <Text style={styles.description}>
          Designed specifically for Indian school teachers to create amazing classroom resources with AI.
        </Text>

        <TouchableOpacity 
          style={styles.getStartedButton}
          onPress={() => router.push('/onboarding/class-selection')}
        >
          <Text style={styles.getStartedText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  logoutButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 10,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 8,
    elevation: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 60,
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 40,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  featureText: {
    fontSize: 16,
    color: '#000000',
    flex: 1,
    fontFamily: 'Poppins-Regular',
  },
  description: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 50,
    fontFamily: 'Poppins-Regular',
  },
  getStartedButton: {
    backgroundColor: '#000000',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 12,
  },
  getStartedText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Poppins-SemiBold',
  },
});