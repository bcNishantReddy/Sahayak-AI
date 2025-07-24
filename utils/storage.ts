import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '@/types';

const STORAGE_KEYS = {
  USER: 'user_data',
  ONBOARDING: 'onboarding_completed',
  DOCUMENTS: 'user_documents',
};

export const StorageService = {
  async saveUser(user: User): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } catch (error) {
      console.error('Error saving user:', error);
    }
  },

  async getUser(): Promise<User | null> {
    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  },

  async setOnboardingCompleted(completed: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING, JSON.stringify(completed));
    } catch (error) {
      console.error('Error setting onboarding status:', error);
    }
  },

  async isOnboardingCompleted(): Promise<boolean> {
    try {
      const completed = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING);
      return completed ? JSON.parse(completed) : false;
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      return false;
    }
  },

  async saveDocuments(documents: any[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(documents));
    } catch (error) {
      console.error('Error saving documents:', error);
    }
  },

  async getDocuments(): Promise<any[]> {
    try {
      const documents = await AsyncStorage.getItem(STORAGE_KEYS.DOCUMENTS);
      return documents ? JSON.parse(documents) : [];
    } catch (error) {
      console.error('Error getting documents:', error);
      return [];
    }
  },

  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([STORAGE_KEYS.USER, STORAGE_KEYS.ONBOARDING, STORAGE_KEYS.DOCUMENTS]);
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  },
};