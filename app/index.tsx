import React from 'react';
import { useState, useEffect } from 'react';
import { Redirect } from 'expo-router';
import LoadingScreen from '@/components/LoadingScreen';
import { StorageService } from '@/utils/storage';

export default function IndexScreen() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const userData = await StorageService.getUser();
      const completed = await StorageService.isOnboardingCompleted();
      
      setUser(userData);
      setOnboardingCompleted(completed);
      
      // Simulate loading time for smooth animation
      setTimeout(() => {
        setLoading(false);
      }, 2000);
    } catch (error) {
      console.error('Error checking auth status:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Redirect href="/auth/login" />;
  }

  if (onboardingCompleted) {
    return <Redirect href="/(tabs)/chat" />;
  }

  return <Redirect href="/onboarding/welcome" />;
}