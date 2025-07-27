import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '@/types';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/utils/firebase';

const STORAGE_KEYS = {
  USER: 'user_data',
  ONBOARDING: 'onboarding_completed',
  DOCUMENTS: 'user_documents',
};

export interface Document {
  id: string;
  title: string;
  type: 'worksheet' | 'quiz' | 'lesson-plan' | 'story' | 'document' | 'image' | 'video' | 'audio';
  class?: string;
  subject?: string;
  content?: string;
  url?: string;
  questions?: any[];
  createdAt: Date;
  fileType?: string;
  fileSize?: number;
}

export class StorageService {
  // Original methods for backward compatibility
  static async saveUser(user: User): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } catch (error) {
      console.error('Error saving user:', error);
    }
  }

  static async getUser(): Promise<User | null> {
    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  static async setOnboardingCompleted(completed: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING, JSON.stringify(completed));
    } catch (error) {
      console.error('Error setting onboarding status:', error);
    }
  }

  static async isOnboardingCompleted(): Promise<boolean> {
    try {
      const completed = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING);
      return completed ? JSON.parse(completed) : false;
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      return false;
    }
  }

  static async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([STORAGE_KEYS.USER, STORAGE_KEYS.ONBOARDING, STORAGE_KEYS.DOCUMENTS]);
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }

  // Document-related methods
  static async getDocuments(): Promise<Document[]> {
    try {
      const documentsJson = await AsyncStorage.getItem('documents');
      return documentsJson ? JSON.parse(documentsJson) : [];
    } catch (error) {
      console.error('Error loading documents:', error);
      return [];
    }
  }

  static async saveDocument(document: Document): Promise<void> {
    try {
      const documents = await this.getDocuments();
      documents.unshift(document);
      await AsyncStorage.setItem('documents', JSON.stringify(documents));
    } catch (error) {
      console.error('Error saving document:', error);
    }
  }

  static async deleteDocument(documentId: string): Promise<void> {
    try {
      const documents = await this.getDocuments();
      const filteredDocuments = documents.filter(doc => doc.id !== documentId);
      await AsyncStorage.setItem('documents', JSON.stringify(filteredDocuments));
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  }

  // Fetch documents from Google Cloud Storage
  static async fetchCloudDocuments(userId: string, documentType?: string): Promise<Document[]> {
    try {
      const baseUrl = 'https://storage.googleapis.com/storage/v1/b/sahayak-user-documents/o';
      
      if (documentType) {
        // Single API call for specific document type
        const prefix = `${documentType}/${userId}/`;
        const response = await fetch(`${baseUrl}?prefix=${encodeURIComponent(prefix)}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log(`📁 Fetching ${documentType} documents for user ${userId}:`, data);
        
        return this.parseStorageResponse(data, userId);
      } else {
        // Single API call to get all documents for user
        const prefix = `${userId}/`;
        const response = await fetch(`${baseUrl}?prefix=${encodeURIComponent(prefix)}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log(`📁 Fetching all documents for user ${userId}:`, data);
        
        return this.parseStorageResponse(data, userId);
      }
    } catch (error) {
      console.error('Error fetching cloud documents:', error);
      return [];
    }
  }

  // Parse Google Cloud Storage response
  private static parseStorageResponse(data: any, userId: string): Document[] {
    const documents: Document[] = [];

    // Handle empty response
    if (!data.items || data.items.length === 0) {
      console.log('📁 No documents found in storage');
      return documents;
    }

    console.log(`📁 Processing ${data.items.length} documents from storage`);

    for (const item of data.items) {
      // Check if this document belongs to the current user
      if (!item.name.includes(`/${userId}/`)) {
        console.log(`📁 Skipping document not belonging to user ${userId}: ${item.name}`);
        continue;
      }

      // Extract file name from the path
      const pathParts = item.name.split('/');
      const fileName = pathParts[pathParts.length - 1] || '';
      const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
      
      // Determine document type based on file extension
      let docType: Document['type'] = 'document';
      if (fileExtension === 'png' || fileExtension === 'jpg' || fileExtension === 'jpeg') {
        docType = 'image';
      } else if (fileExtension === 'mp4' || fileExtension === 'avi' || fileExtension === 'mov') {
        docType = 'video';
      } else if (fileExtension === 'mp3' || fileExtension === 'wav') {
        docType = 'audio';
      } else if (fileExtension === 'docx' || fileExtension === 'pdf') {
        docType = 'document';
      }

      // Determine category from path (first part of the path)
      let category = 'document';
      if (item.name.startsWith('images/')) category = 'image';
      else if (item.name.startsWith('lesson_plans/')) category = 'lesson-plan';
      else if (item.name.startsWith('quizzes/')) category = 'quiz';
      else if (item.name.startsWith('videos/')) category = 'video';
      else if (item.name.startsWith('worksheets/')) category = 'worksheet';

      // Clean up the file name (remove temp prefix and special characters)
      let cleanFileName = fileName;
      if (fileName.startsWith('temp\\')) {
        cleanFileName = fileName.replace('temp\\', '');
      }
      // Remove timestamp suffix if present
      cleanFileName = cleanFileName.replace(/_\d{8}_\d{6}\.[a-zA-Z]+$/, '');
      // Remove file extension for display
      cleanFileName = cleanFileName.replace(`.${fileExtension}`, '');

      // Convert GS:// URLs to HTTPS
      let downloadUrl = item.mediaLink;
      if (downloadUrl && downloadUrl.startsWith('gs://')) {
        downloadUrl = downloadUrl.replace('gs://', 'https://storage.googleapis.com/');
        console.log(`🔄 Converted GS URL to HTTPS: ${downloadUrl}`);
      }

      documents.push({
        id: item.id || fileName,
        title: cleanFileName || 'Untitled Document',
        type: category as Document['type'],
        url: downloadUrl, // Use converted URL
        createdAt: new Date(item.timeCreated),
        fileType: fileExtension,
        fileSize: parseInt(item.size) || 0,
      });

      console.log(`📄 Processed document: ${cleanFileName} (${category}) - ${downloadUrl}`);
    }

    return documents;
  }

  // Get documents by type - now uses single API call
  static async getDocumentsByType(userId: string, documentType: string): Promise<Document[]> {
    const documentTypes = ['images', 'lesson_plans', 'quizzes', 'videos', 'worksheets'];
    
    if (documentTypes.includes(documentType)) {
      return await this.fetchCloudDocuments(userId, documentType);
    } else {
      return await this.fetchCloudDocuments(userId);
    }
  }

  // Save document to Firestore
  static async saveDocumentToFirestore(document: Document, userId: string): Promise<void> {
    try {
      await addDoc(collection(db, 'documents'), {
        userId: userId,
        title: document.title,
        type: document.type,
        url: document.url,
        fileType: document.fileType,
        fileSize: document.fileSize,
        createdAt: new Date(),
        class: document.class,
        subject: document.subject,
        content: document.content,
        questions: document.questions
      });
      
      console.log('📄 Document saved to Firestore:', document.title);
    } catch (error) {
      console.error('❌ Error saving document to Firestore:', error);
    }
  }
}