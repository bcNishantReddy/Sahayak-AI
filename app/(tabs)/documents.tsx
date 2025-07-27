import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Modal,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Search, Filter, Calendar, BookOpen, X, Eye, HelpCircle, FileText as LucideFileText, Book, ExternalLink, Image, Video, Music, ChevronDown } from 'lucide-react-native';
import { StorageService, Document } from '@/utils/storage';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import FeatureTour, { FeatureTourStep } from '@/components/FeatureTour';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { auth } from '@/utils/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { db } from '@/utils/firebase';
import { useTranslation } from 'react-i18next';

export default function DocumentsScreen() {
  const { t } = useTranslation();
  
  const documentTypes = [
    { key: 'all', label: 'All Documents' },
    { key: 'worksheets', label: 'Worksheets' },
    { key: 'quizzes', label: 'Quizzes' },
    { key: 'lesson_plans', label: 'Lesson Plans' },
    { key: 'images', label: 'Images' },
    { key: 'videos', label: 'Videos' },
  ];
  
  const [searchText, setSearchText] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showTour, setShowTour] = React.useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Check authentication status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });
    return unsubscribe;
  }, []);

  React.useEffect(() => {
    (async () => {
      const step = await AsyncStorage.getItem('featureTourStep');
      if (step === '1') setShowTour(true);
    })();
  }, []);

  const handleTourFinish = async () => {
    setShowTour(false);
    await AsyncStorage.setItem('featureTourStep', '2');
    router.replace('/settings');
  };

  const tourSteps: FeatureTourStep[] = [
    {
      title: t('documents.title'),
      description: t('documents.recentDocuments'),
      position: 'center',
      align: 'right',
    },
  ];

  useFocusEffect(
    useCallback(() => {
      loadDocuments();
    }, [selectedType])
  );

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      if (isAuthenticated) {
        const user = auth.currentUser;
        if (user) {
          if (selectedType === 'all') {
            // Load all documents from Google Cloud Storage
            const cloudDocs = await StorageService.fetchCloudDocuments(user.uid);
            console.log(`📁 Loaded ${cloudDocs.length} documents for user ${user.uid}`);
            setDocuments(cloudDocs);
          } else {
            // Load specific document type
            const typeDocs = await StorageService.getDocumentsByType(user.uid, selectedType);
            console.log(`📁 Loaded ${typeDocs.length} ${selectedType} documents for user ${user.uid}`);
            setDocuments(typeDocs);
          }
        }
      } else {
        // Load documents from local storage
        const docs = await StorageService.getDocuments();
        setDocuments(docs);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
      Alert.alert('Error', 'Failed to load documents');
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const openDocument = async (document: Document) => {
    if (document.url) {
      try {
        console.log(`🔗 Opening document: ${document.title} - ${document.url}`);
        
        // Check if the URL can be opened
        const supported = await Linking.canOpenURL(document.url);
        
        if (supported) {
          await Linking.openURL(document.url);
        } else {
          Alert.alert(
            'Cannot Open Document',
            'This document type cannot be opened directly. Please download it first.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Copy Link', onPress: () => {
                // In a real app, you'd copy to clipboard
                Alert.alert('Link Copied', `Download link copied: ${document.url}`);
              }}
            ]
          );
        }
      } catch (error) {
        console.error('Error opening document:', error);
        Alert.alert('Error', 'Failed to open document. Please try again.');
      }
    } else {
      // For documents without URLs, show preview
      setSelectedDocument(document);
      setShowPreview(true);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'worksheet': return '#28a745';
      case 'quiz': return '#007bff';
      case 'lesson-plan': return '#ffc107';
      case 'image': return '#17a2b8';
      case 'video': return '#dc3545';
      case 'audio': return '#6f42c1';
      default: return '#6c757d';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'worksheet': return <BookOpen size={18} color="#000" style={{marginRight:4}} />;
      case 'quiz': return <HelpCircle size={18} color="#000" style={{marginRight:4}} />;
      case 'lesson-plan': return <BookOpen size={18} color="#000" style={{marginRight:4}} />;
      case 'image': return <Image size={18} color="#000" style={{marginRight:4}} />;
      case 'video': return <Video size={18} color="#000" style={{marginRight:4}} />;
      case 'audio': return <Music size={18} color="#000" style={{marginRight:4}} />;
      default: return <LucideFileText size={18} color="#000" style={{marginRight:4}} />;
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchText.toLowerCase()) ||
                         (doc.subject?.toLowerCase().includes(searchText.toLowerCase()) || false) ||
                         (doc.class?.toLowerCase().includes(searchText.toLowerCase()) || false);
    const matchesType = selectedType === 'all' || doc.type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <SafeAreaView style={styles.container}>
      <FeatureTour steps={tourSteps} visible={showTour} onFinish={handleTourFinish} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Documents</Text>
        <TouchableOpacity 
          style={styles.dropdownButton} 
          onPress={() => setShowDropdown(!showDropdown)}
        >
          <Text style={styles.dropdownButtonText}>
            {documentTypes.find(type => type.key === selectedType)?.label || 'All Documents'}
          </Text>
          <ChevronDown size={16} color="#000" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#999999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search documents..."
            placeholderTextColor="#999999"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
      </View>

      {/* Filter Modal */}
      <Modal visible={showDropdown} transparent animationType="fade">
        <View style={styles.filterModalOverlay}>
          <View style={styles.filterModalContent}>
            <Text style={styles.filterModalTitle}>Filter Documents</Text>
            {documentTypes.map((type) => (
              <TouchableOpacity
                key={type.key}
                style={[
                  styles.filterOption,
                  selectedType === type.key && styles.selectedFilterOption,
                ]}
                onPress={() => {
                  setSelectedType(type.key);
                  setShowDropdown(false);
                }}
              >
                <Text style={[
                  styles.filterOptionText,
                  selectedType === type.key && styles.selectedFilterOptionText,
                ]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.closeFilterButton} onPress={() => setShowDropdown(false)}>
              <Text style={styles.closeFilterButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView style={styles.documentsContainer} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0000ff" />
            <Text style={styles.loadingText}>Loading documents...</Text>
          </View>
        ) : filteredDocuments.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {selectedType === 'all' ? 'No documents found' : `No ${selectedType.replace('_', ' ')} found`}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {selectedType === 'all' 
                ? 'Start a chat to generate your first document' 
                : `No ${selectedType.replace('_', ' ')} have been generated yet. Try generating some in the chat!`
              }
            </Text>
          </View>
        ) : (
          filteredDocuments.map((doc) => (
            <TouchableOpacity 
              key={doc.id} 
              style={styles.documentCard}
              onPress={() => openDocument(doc)}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleContainer}>
                  {getTypeIcon(doc.type)}
                  <Text style={styles.cardTitle}>{doc.title}</Text>
                </View>
                <View style={[styles.typeChip, { backgroundColor: getTypeColor(doc.type) }]}>
                  <Text style={styles.typeChipText}>{doc.type.replace('-', ' ')}</Text>
                </View>
              </View>
              
              <View style={styles.cardContent}>
                <View style={styles.cardMeta}>
                  <Text style={styles.cardMetaText}>
                    {doc.class && <BookOpen size={14} color="#999999" />} {doc.class} {doc.subject && <Text style={{fontSize:18, color:'#999', marginHorizontal:2}}>·</Text>} {doc.subject}
                  </Text>
                  <Text style={styles.cardMetaText}>
                    <Calendar size={14} color="#999999" /> {(() => {
                      let dateObj = doc.createdAt;
                      if (!dateObj) return '-';
                      if (typeof dateObj === 'string' || typeof dateObj === 'number') {
                        dateObj = new Date(dateObj);
                      }
                      return dateObj && typeof dateObj.toLocaleDateString === 'function'
                        ? dateObj.toLocaleDateString()
                        : '-';
                    })()}
                  </Text>
                </View>
                
                {doc.questions && doc.questions.length > 0 && (
                  <Text style={styles.questionsText}>{doc.questions.length} questions</Text>
                )}
                
                <TouchableOpacity style={styles.previewButton} onPress={() => openDocument(doc)}>
                  {doc.url ? <ExternalLink size={16} color="#000000" /> : <Eye size={16} color="#000000" />}
                  <Text style={styles.previewButtonText}>{doc.url ? 'Open' : 'Preview'}</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Document Preview Modal */}
      <Modal
        visible={showPreview}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{selectedDocument?.title}</Text>
            <TouchableOpacity onPress={() => setShowPreview(false)}>
              <X size={24} color="#000000" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <Text style={styles.documentContent}>{selectedDocument?.content}</Text>
            
            {selectedDocument?.questions && selectedDocument.questions.length > 0 && (
              <View style={styles.questionsSection}>
                <Text style={styles.questionsSectionTitle}>Questions</Text>
                {selectedDocument.questions.map((question, index) => (
                  <View key={question.id} style={styles.questionCard}>
                    <Text style={styles.questionNumber}>Q{index + 1}.</Text>
                    <Text style={styles.questionText}>{question.question}</Text>
                    {question.options && (
                      <View style={styles.optionsContainer}>
                        {question.options.map((option: string, optIndex: number) => (
                          <Text key={optIndex} style={styles.optionText}>
                            {String.fromCharCode(65 + optIndex)}. {option}
                          </Text>
                        ))}
                      </View>
                    )}
                    <Text style={styles.answerText}>Answer: {question.answer}</Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'Poppins-SemiBold',
  },
  filterButton: {
    padding: 8,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#000000',
    fontFamily: 'Poppins-Regular',
  },
  typesContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  typeButton: {
    width: 90,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedTypeButton: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  unselectedTypeButton: {
    backgroundColor: '#fff',
    borderColor: '#000',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  selectedTypeButtonText: {
    color: '#fff',
  },
  unselectedTypeButtonText: {
    color: '#000',
  },
  documentsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  documentCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
    fontFamily: 'Poppins-SemiBold',
  },
  typeChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeChipText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
    textTransform: 'capitalize',
    fontFamily: 'Poppins-Medium',
  },
  cardContent: {
    gap: 8,
  },
  cardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardMetaText: {
    fontSize: 12,
    color: '#999999',
    flexDirection: 'row',
    alignItems: 'center',
    fontFamily: 'Poppins-Regular',
  },
  questionsText: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
    fontFamily: 'Poppins-Medium',
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  previewButtonText: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
    marginLeft: 5,
    fontFamily: 'Poppins-Medium',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
    fontFamily: 'Poppins-SemiBold',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
    fontFamily: 'Poppins-SemiBold',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  documentContent: {
    fontSize: 16,
    lineHeight: 24,
    color: '#000000',
    marginBottom: 20,
    fontFamily: 'Poppins-Regular',
  },
  questionsSection: {
    marginTop: 20,
  },
  questionsSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 15,
    fontFamily: 'Poppins-SemiBold',
  },
  questionCard: {
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  questionNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 5,
    fontFamily: 'Poppins-SemiBold',
  },
  questionText: {
    fontSize: 16,
    color: '#000000',
    marginBottom: 10,
    fontFamily: 'Poppins-Regular',
  },
  optionsContainer: {
    marginBottom: 10,
  },
  optionText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 5,
    fontFamily: 'Poppins-Regular',
  },
  answerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'Poppins-SemiBold',
  },
  filterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterModalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: 260,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    alignItems: 'stretch',
  },
  filterModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
    textAlign: 'center',
  },
  filterOption: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
    alignItems: 'center',
  },
  selectedFilterOption: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  filterOptionText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '500',
  },
  selectedFilterOptionText: {
    color: '#fff',
  },
  closeFilterButton: {
    marginTop: 10,
    alignItems: 'center',
    paddingVertical: 10,
  },
  closeFilterButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    fontFamily: 'Poppins-Regular',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '500',
    marginRight: 5,
    fontFamily: 'Poppins-Medium',
  },
});