import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
  Linking,
  Pressable
} from 'react-native';
import { Send, Mic, User, FileText, BookOpen, HelpCircle, Book, Copy, Calendar, Video } from 'lucide-react-native';
import SahayakLogo from '@/components/SahayakLogo';
import { StorageService } from '@/utils/storage';
import FeatureTour, { FeatureTourStep } from '@/components/FeatureTour';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { auth } from '@/utils/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '@/utils/firebase';
import { useTranslation } from 'react-i18next';

type DocumentType = 'worksheet' | 'quiz' | 'lesson-plan' | 'story';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  documentGenerated?: {
    type: DocumentType;
    title: string;
    content: string;
    downloadUrl?: string;
  };
  isStreaming?: boolean;
}

export default function ChatScreen() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [isInFunctionOperation, setIsInFunctionOperation] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const router = useRouter();
  const [showTour, setShowTour] = React.useState(false);

  // Language and location for AI requests
  const [language, setLanguage] = useState('en'); // Default to English
  const [location, setLocation] = useState('India'); // Default location

  // Fetch language and location from Firebase database
  useEffect(() => {
    const fetchUserPreferences = async () => {
      try {
        // Get current user
        const user = auth.currentUser;
        if (!user) {
          console.log('👤 No authenticated user, using defaults');
          return;
        }

        // Fetch user data from Firebase database
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          // Get language from database
          if (userData.language) {
            setLanguage(userData.language);
            console.log('🌍 Language from database:', userData.language);
          } else {
            console.log('🌍 No language in database, using default: en');
          }
          
          // Get location from database
          if (userData.location) {
            setLocation(userData.location);
            console.log('📍 Location from database:', userData.location);
          } else {
            console.log('📍 No location in database, using default: India');
            setLocation('India');
          }
        } else {
          console.log('🌍 User document not found, using defaults');
        }
      } catch (error) {
        console.error('❌ Error fetching user preferences:', error);
        // Use defaults if there's an error
        setLanguage('en');
        setLocation('India');
      }
    };

    fetchUserPreferences();
  }, []);

  const API_BASE_URL = 'https://authenticated-agent-1081535716140.us-central1.run.app';
  const CREATE_SESSION_URL = `${API_BASE_URL}/create_session`;
  const STREAM_QUERY_URL = `${API_BASE_URL}/stream_query`;

  // Check authentication status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', user ? `User: ${user.uid}` : 'No user');
      setIsAuthenticated(!!user);
      if (!user) {
        setSessionId(null);
      }
    });
    return unsubscribe;
  }, []);

  // Create session when component mounts and user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const user = auth.currentUser;
      if (user) {
        console.log('🔄 Creating new session for chat tab visit...');
        createSession(user.uid);
      }
    }
  }, [isAuthenticated]);

  // Clean up abort controller on component unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  React.useEffect(() => {
    (async () => {
      const step = await AsyncStorage.getItem('featureTourStep');
      if (step === '0') setShowTour(true);
    })();
  }, []);

  const handleTourFinish = async () => {
    setShowTour(false);
    await AsyncStorage.setItem('featureTourStep', '1');
    router.replace('/documents');
  };

  const tourSteps: FeatureTourStep[] = [
    {
      title: t('chat.title'),
      description: t('chat.welcomeMessage'),
      position: 'top',
      align: 'left',
    },
  ];

  // Create session with the server
  const createSession = async (userId: string) => {
    try {
      setIsCreatingSession(true);
      console.log('🔄 Creating session for user:', userId);
      
      const response = await fetch(CREATE_SESSION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId
        }),
      });

      console.log('📊 Create session response status:', response.status);

      if (!response.ok) {
        throw new Error(`Failed to create session: ${response.status}`);
      }

      const data = await response.json();
      console.log('📨 Create session response:', data);

      if (data.session_id) {
        setSessionId(data.session_id);
        console.log('✅ Session created successfully:', data.session_id);
      } else {
        throw new Error('No session_id in response');
      }

    } catch (error: any) {
      console.error('❌ Error creating session:', error);
      Alert.alert('Session Error', 'Failed to create chat session. Please try again.');
    } finally {
      setIsCreatingSession(false);
    }
  };

  const startAgentStream = async (prompt: string) => {
    if (!prompt.trim() || isTyping) return;

    // Check if we have a session
    if (!sessionId) {
      console.error('❌ No session available');
      Alert.alert('Session Error', 'No active session. Please try again.');
      return;
    }

    setIsTyping(true);

    try {
      // Get current user ID
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No authenticated user');
      }

      console.log('🌐 Making stream query request...');
      console.log('📤 Request data:', {
        user_id: user.uid,
        session_id: sessionId,
        message: prompt,
        language: language,
        location: location
      });

      // Create AbortController for request cancellation
      abortControllerRef.current = new AbortController();

      // Make stream query request
      const response = await fetch(STREAM_QUERY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.uid,
          session_id: sessionId,
          message: prompt,
          language: language,
          location: location
        }),
        signal: abortControllerRef.current.signal,
      });

      console.log('✅ Stream query response received');
      console.log('📊 Response status:', response.status);
      console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Handle Server-Sent Events (SSE) streaming response
      const responseText = await response.text();
      console.log('📨 Full SSE response:', responseText);

      // Parse SSE data lines
      const lines = responseText.split('\n');
      let aiMessageId: string | null = null;
      let hasContent = false;
      
      for (const line of lines) {
        if (line.trim() && line.startsWith('data: ')) {
          const data = line.substring(6); // Remove 'data: ' prefix
          console.log('📨 Processing SSE line:', data);

          if (data.startsWith('[ERROR]')) {
            console.error('❌ Server error:', data);
            if (aiMessageId) {
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === aiMessageId
                    ? { ...msg, text: msg.text + `\nError: ${data}`, isStreaming: false }
                    : msg
                )
              );
            }
            return;
          }

          try {
            // Parse the JSON data from SSE
            const eventData = JSON.parse(data);
            console.log('📝 Parsed SSE event:', eventData);

            // Check if this is a function call or function response
            const parts = eventData?.content?.parts || [];
            let hasFunctionOperation = false;
            let textContent = '';

            for (const part of parts) {
              if (part.function_call || part.function_response) {
                hasFunctionOperation = true;
                console.log('🔧 Function operation detected:', part.function_call ? 'function_call' : 'function_response');
              } else if (part.text) {
                textContent += part.text;
              }
            }

            // Handle function operations with temporary animation
            if (hasFunctionOperation) {
              if (!isInFunctionOperation) {
                setIsInFunctionOperation(true);
                // Create a temporary message for function operation
                const tempMessageId = `temp_${Date.now()}`;
                const tempMessage: Message = {
                  id: tempMessageId,
                  text: '🤖 Working on your request...',
                  isUser: false,
                  timestamp: new Date(),
                  isStreaming: true,
                };
                setMessages(prev => [...prev, tempMessage]);
                
                // Remove the temporary message after 2 seconds
                setTimeout(() => {
                  setMessages(prev => prev.filter(msg => msg.id !== tempMessageId));
                  setIsInFunctionOperation(false);
                }, 2000);
              }
            }

            // Handle text content - create separate message for each text output
            if (textContent && textContent.trim()) {
              console.log('📄 Text content found:', textContent);
              setIsInFunctionOperation(false); // Reset function operation state
              
              // Extract download URL from the content
              const downloadUrl = extractDownloadUrl(textContent);
              console.log('🔗 Download URL extracted:', downloadUrl);
              
              // Create a new message for this text content
              const newMessageId = `text_${Date.now()}`;
              const newMessage: Message = {
                id: newMessageId,
                text: textContent,
                isUser: false,
                timestamp: new Date(),
                isStreaming: false,
                // Only add documentGenerated if there's a download URL
                ...(downloadUrl && {
                  documentGenerated: {
                    type: 'worksheet' as DocumentType,
                    title: 'Document Generated',
                    content: 'Your document has been created and is ready for download.',
                    downloadUrl: downloadUrl
                  }
                })
              };
              
              setMessages(prev => [...prev, newMessage]);
            }

          } catch (parseError) {
            console.log('📄 Raw SSE data (not JSON):', data);
            // Handle non-JSON SSE data
            if (data && !data.startsWith('[ERROR]') && aiMessageId) {
              hasContent = true;
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === aiMessageId
                    ? { ...msg, text: msg.text + data, isStreaming: true }
                    : msg
                )
              );
            }
          }
        }
      }

      // Mark streaming as complete
      if (aiMessageId) {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === aiMessageId 
              ? { ...msg, isStreaming: false }
              : msg
          )
        );
      }

    } catch (error: any) {
      console.error('❌ Error in agent stream:', error);
      
      if (error.name === 'AbortError') {
        console.log('🛑 Request was aborted');
        // Don't create error message if no AI message was created
      } else {
        Alert.alert('Error', 'Failed to connect to AI agent. Please try again.');
      }
    } finally {
      setIsTyping(false);
      abortControllerRef.current = null;
    }
  };

  const stopAgentStream = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsTyping(false);
  };

  const sendMessage = async () => {
    if (!isAuthenticated) {
      Alert.alert(
        t('auth.authenticationRequired'),
        t('auth.pleaseSignIn'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('auth.login'), onPress: () => router.push('/auth/login') }
        ]
      );
      return;
    }

    if (inputText.trim()) {
      const userMessage: Message = {
        id: Date.now().toString(),
        text: inputText,
        isUser: true,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, userMessage]);
      const currentPrompt = inputText;
      setInputText('');

      // Start the agent stream
      await startAgentStream(currentPrompt);
    } else if (!isAuthenticated) {
      Alert.alert('Authentication Required', 'Please sign in to use the chat feature.');
    }
  };

  // Quick action functions that populate input field
  const populateInputWithPrompt = (type: string) => {
    console.log('🎯 populateInputWithPrompt called with type:', type);
    let prompt = '';
    
    switch (type) {
      case 'worksheet':
        prompt = 'Generate a comprehensive worksheet for Grade [GRADE], Subject [SUBJECT], Chapter [CHAPTER]. Include 10-15 questions with clear instructions and answer key.';
        break;
      case 'quiz':
        prompt = 'Create an engaging quiz for Grade [GRADE], Subject [SUBJECT], Chapter [CHAPTER]. Include various question types like multiple choice, short answer, and problem-solving questions.';
        break;
      case 'lesson-plan':
        prompt = 'Design a detailed lesson plan for Grade [GRADE], Subject [SUBJECT], Chapter [CHAPTER]. Include learning objectives, activities, assessment methods, and time allocation.';
        break;
      case 'story':
        prompt = 'Write an educational story suitable for Grade [GRADE], Subject [SUBJECT], Chapter [CHAPTER]. Make it engaging and age-appropriate with clear learning outcomes.';
        break;
      case 'visual-aids':
        prompt = 'Create blackboard-ready visual aids for Grade [GRADE], Subject [SUBJECT], Chapter [CHAPTER]. Include diagrams, charts, and step-by-step illustrations.';
        break;
      case 'morning-assembly-planner':
        prompt = 'Generate a Morning Assembly Planner which provides thought of the day, positive news in the country and a word of the day.';
        break;
      case 'topic-video-explainer':
        prompt = 'Generate a video explainer for Grade [GRADE], Subject [SUBJECT], Concept [CONCEPT].';
        break;
      default:
        prompt = 'Generate educational content for Grade [GRADE], Subject [SUBJECT], Chapter [CHAPTER].';
    }
    
    console.log('🎯 Setting input text:', prompt);
    setInputText(prompt);
  };

  // Helper to copy text to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      // For React Native, we'll use Alert to show the copied text
      // In a real app, you'd use a clipboard library like @react-native-clipboard/clipboard
      Alert.alert(
        'Message Copied',
        'The message has been copied to your clipboard.',
        [
          { text: 'OK', style: 'default' },
          { 
            text: 'Show Copied Text', 
            onPress: () => {
              Alert.alert('Copied Text', text);
            }
          }
        ]
      );
      console.log('📋 Copied message to clipboard:', text);
    } catch (error) {
      console.error('❌ Error copying to clipboard:', error);
      Alert.alert('Error', 'Failed to copy message');
    }
  };

  // Helper to extract download URL from text content
  const extractDownloadUrl = (content: string) => {
    console.log('🔍 Extracting URL from content:', content);
    
    // Look for complete HTTPS URLs
    const urlMatch = content.match(/https:\/\/[^\s]+/);
    
    if (urlMatch) {
      let extractedUrl = urlMatch[0];
      console.log('✅ Raw extracted URL:', extractedUrl);
      
      // Clean up the URL to end with file extension
      // Remove query parameters and ensure it ends with file extension
      const urlParts = extractedUrl.split('?');
      const baseUrl = urlParts[0];
      
      // Check if the base URL ends with a file extension
      const fileExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.pdf', '.docx', '.doc', '.mp4', '.avi', '.mov', '.mp3', '.wav'];
      const hasFileExtension = fileExtensions.some(ext => baseUrl.toLowerCase().endsWith(ext));
      
      if (hasFileExtension) {
        // Use the base URL without query parameters
        extractedUrl = baseUrl;
        console.log('✅ Cleaned URL (ends with file extension):', extractedUrl);
      } else {
        // If no file extension found, try to extract from the path
        const pathParts = baseUrl.split('/');
        const lastPart = pathParts[pathParts.length - 1];
        const decodedLastPart = decodeURIComponent(lastPart);
        
        // Check if the decoded last part has a file extension
        const hasDecodedExtension = fileExtensions.some(ext => decodedLastPart.toLowerCase().endsWith(ext));
        
        if (hasDecodedExtension) {
          // Reconstruct URL with decoded filename
          const urlWithoutFilename = pathParts.slice(0, -1).join('/');
          extractedUrl = `${urlWithoutFilename}/${decodedLastPart}`;
          console.log('✅ Cleaned URL (decoded filename):', extractedUrl);
        } else {
          console.log('⚠️ No file extension found, using original URL');
        }
      }
      
      return extractedUrl;
    }
    
    // Look for GS:// URLs and convert them
    const gsMatch = content.match(/gs:\/\/[^\s]+/);
    if (gsMatch) {
      let extractedUrl = gsMatch[0];
      console.log('✅ Raw GS URL:', extractedUrl);
      
      // Convert GS:// to HTTPS
      extractedUrl = extractedUrl.replace('gs://', 'https://storage.googleapis.com/');
      console.log('🔄 Converted GS URL to HTTPS:', extractedUrl);
      
      return extractedUrl;
    }
    
    // Also check for HTTP URLs as fallback
    const httpMatch = content.match(/http:\/\/[^\s]+/);
    if (httpMatch) {
      let extractedUrl = httpMatch[0];
      console.log('✅ Extracted HTTP URL:', extractedUrl);
      
      // Apply same cleaning logic for HTTP URLs
      const urlParts = extractedUrl.split('?');
      const baseUrl = urlParts[0];
      const fileExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.pdf', '.docx', '.doc', '.mp4', '.avi', '.mov', '.mp3', '.wav'];
      const hasFileExtension = fileExtensions.some(ext => baseUrl.toLowerCase().endsWith(ext));
      
      if (hasFileExtension) {
        extractedUrl = baseUrl;
        console.log('✅ Cleaned HTTP URL:', extractedUrl);
      }
      
      return extractedUrl;
    }
    
    console.log('❌ No URL found in content');
    return undefined;
  };

  return (
    <SafeAreaView style={styles.container}>
      <FeatureTour steps={tourSteps} visible={showTour} onFinish={handleTourFinish} />
      
      {/* Background Icon */}
      <View style={styles.backgroundIconContainer}>
        <Image 
          source={require('@/assets/images/icon.png')} 
          style={styles.backgroundIcon}
          resizeMode="contain"
        />
      </View>
      
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <SahayakLogo size={32} showText={false} color="#000000" />
          <Text style={styles.headerTitle}>Ask Sahayak</Text>
          {isCreatingSession && (
            <View style={styles.sessionStatus}>
              <View style={[styles.connectionIndicator, styles.connecting]} />
              <Text style={styles.sessionStatusText}>Connecting...</Text>
            </View>
          )}
          {sessionId && !isCreatingSession && (
            <View style={styles.sessionStatus}>
              <View style={[styles.connectionIndicator, styles.connected]} />
              <Text style={styles.sessionStatusText}>Connected</Text>
            </View>
          )}
        </View>
      </View>

      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => {
            setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
          }}
        >
          {messages.map((message) => (
            <Pressable
              key={message.id}
              style={[
                styles.messageContainer,
                message.isUser ? styles.userMessage : styles.aiMessage,
              ]}
              onLongPress={() => {
                const messageText = message.text;
                copyToClipboard(messageText);
              }}
              android_ripple={{ color: 'rgba(0,0,0,0.1)', borderless: false }}
            >
              <View style={styles.messageHeader}>
                {message.isUser ? (
                  <User size={20} color="#000000" />
                ) : (
                  <View style={{ backgroundColor: '#fff', borderRadius: 10, padding: 2 }}>
                    <SahayakLogo size={20} showText={false} color="#000000" />
                  </View>
                )}
                <Text style={styles.messageTime}>
                  {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={() => copyToClipboard(message.text)}
                >
                  <Copy size={16} color={message.isUser ? "#666666" : "#ffffff"} />
                </TouchableOpacity>
              </View>
              <Text style={[styles.messageText, message.isUser ? {color: '#000'} : {color: '#fff'}]}>
                {message.text}
                {message.isStreaming && (
                  <Text style={styles.typingIndicator}>▋</Text>
                )}
              </Text>
              {message.documentGenerated && (
                <View style={styles.documentPreview}>
                  <View style={{flexDirection:'row',alignItems:'center'}}>
                    <FileText size={16} color="#000" style={{marginRight:6}} />
                    <Text style={styles.documentPreviewTitle}>{message.documentGenerated.title}</Text>
                  </View>
                  <Text style={styles.documentPreviewText}>{message.documentGenerated.content}</Text>
                  {message.documentGenerated.downloadUrl && (
                    <TouchableOpacity 
                      style={styles.viewDocumentButton}
                      onPress={async () => {
                        if (message.documentGenerated?.downloadUrl) {
                          const url = message.documentGenerated.downloadUrl;
                          console.log('🔗 Attempting to download from URL:', url);
                          
                          try {
                            // For Google Cloud Storage URLs, we need to handle them specially
                            if (url.includes('storage.googleapis.com')) {
                              console.log('📁 Google Cloud Storage URL detected');
                              
                              // Try to open the URL directly
                              const supported = await Linking.canOpenURL(url);
                              
                              if (supported) {
                                await Linking.openURL(url);
                                console.log('✅ Google Cloud Storage URL opened successfully');
                              } else {
                                // If direct opening fails, show options
                                Alert.alert(
                                  'Download Document',
                                  'Choose how to download your document:',
                                  [
                                    { text: 'Cancel', style: 'cancel' },
                                    { 
                                      text: 'Open in Browser', 
                                      onPress: async () => {
                                        try {
                                          await Linking.openURL(url);
                                        } catch (error) {
                                          Alert.alert('Error', 'Failed to open in browser');
                                        }
                                      }
                                    },
                                    { 
                                      text: 'Copy Download Link', 
                                      onPress: () => {
                                        Alert.alert('Link Copied', `Download link copied to clipboard:\n${url}`);
                                      }
                                    }
                                  ]
                                );
                              }
                            } else {
                              // For other URLs, try direct opening
                              const supported = await Linking.canOpenURL(url);
                              
                              if (supported) {
                                await Linking.openURL(url);
                                console.log('✅ URL opened successfully');
                              } else {
                                console.log('❌ URL not supported:', url);
                                Alert.alert(
                                  'Cannot Open Document',
                                  'This document type cannot be opened directly. Please download it first.',
                                  [
                                    { text: 'Cancel', style: 'cancel' },
                                    { text: 'Copy Link', onPress: () => {
                                      Alert.alert('Link Copied', `Download link: ${url}`);
                                    }}
                                  ]
                                );
                              }
                            }
                          } catch (error) {
                            console.error('❌ Error opening URL:', error);
                            Alert.alert(
                              'Download Error', 
                              'Failed to download document. Please try opening the link in your browser.',
                              [
                                { text: 'Cancel', style: 'cancel' },
                                { text: 'Copy Link', onPress: () => {
                                  Alert.alert('Link Copied', `Download link: ${url}`);
                                }}
                              ]
                            );
                          }
                        }
                      }}
                    >
                      <Text style={styles.viewDocumentButtonText}>Download Document</Text>
                    </TouchableOpacity>
                  )}
                  {!message.documentGenerated.downloadUrl && (
                    <TouchableOpacity 
                      style={[styles.viewDocumentButton, { backgroundColor: '#666666' }]}
                      onPress={() => router.push('/documents')}
                    >
                      <Text style={styles.viewDocumentButtonText}>View in Documents</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </Pressable>
          ))}

          {isTyping && (
            <View style={[styles.messageContainer, styles.aiMessage]}>
              <View style={styles.messageHeader}>
                <SahayakLogo size={20} showText={false} color="#000000" />
                <Text style={styles.messageTime}>typing...</Text>
              </View>
              <Text style={styles.typingText}>{t('chat.typing')}</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.quickActionsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => populateInputWithPrompt('worksheet')}
            >
              <View style={{flexDirection:'row',alignItems:'center'}}><BookOpen size={16} color="#000" style={{marginRight:6}} /><Text style={styles.quickActionText}>Generate Worksheet</Text></View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => populateInputWithPrompt('quiz')}
            >
              <View style={{flexDirection:'row',alignItems:'center'}}><HelpCircle size={16} color="#000" style={{marginRight:6}} /><Text style={styles.quickActionText}>Generate Quiz</Text></View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => populateInputWithPrompt('lesson-plan')}
            >
              <View style={{flexDirection:'row',alignItems:'center'}}><BookOpen size={16} color="#000" style={{marginRight:6}} /><Text style={styles.quickActionText}>Generate Lesson Plan</Text></View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => populateInputWithPrompt('story')}
            >
              <View style={{flexDirection:'row',alignItems:'center'}}><Book size={16} color="#000" style={{marginRight:6}} /><Text style={styles.quickActionText}>Generate Story</Text></View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => populateInputWithPrompt('visual-aids')}
            >
              <View style={{flexDirection:'row',alignItems:'center'}}><FileText size={16} color="#000" style={{marginRight:6}} /><Text style={styles.quickActionText}>Visual Aids</Text></View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => {
                console.log('🎯 Assembly Planner button pressed');
                populateInputWithPrompt('morning-assembly-planner');
              }}
            >
              <View style={{flexDirection:'row',alignItems:'center'}}><FileText size={16} color="#000" style={{marginRight:6}} /><Text style={styles.quickActionText}>Assembly Planner</Text></View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => {
                console.log('🎯 Video Explainer button pressed');
                populateInputWithPrompt('topic-video-explainer');
              }}
            >
              <View style={{flexDirection:'row',alignItems:'center'}}><FileText size={16} color="#000" style={{marginRight:6}} /><Text style={styles.quickActionText}>Video Explainer</Text></View>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {!isAuthenticated ? (
          <View style={styles.authPrompt}>
            <Text style={styles.authPromptText}>{t('auth.pleaseSignIn')}</Text>
            <TouchableOpacity
              style={styles.authButton}
              onPress={() => router.push('/auth/login')}
            >
              <Text style={styles.authButtonText}>{t('auth.login')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder={t('chat.placeholder')}
              placeholderTextColor="#999999"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity style={styles.micButton}>
              <Mic size={20} color="#000000" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
              <Send size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}
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
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginLeft: 10,
    fontFamily: 'Poppins-SemiBold',
  },
  content: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  messageContainer: {
    marginVertical: 5,
    maxWidth: '85%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderBottomRightRadius: 5,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  aiMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#000000',
    borderRadius: 12,
    borderBottomLeftRadius: 5,
    padding: 15,
    borderWidth: 0,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  messageTime: {
    fontSize: 12,
    color: '#999999',
    marginLeft: 5,
    fontFamily: 'Poppins-Regular',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
    color: '#000000', // default for user
    fontFamily: 'Poppins-Regular',
  },
  documentPreview: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
  },
  documentPreviewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'Poppins-SemiBold',
  },
  documentPreviewText: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
    fontFamily: 'Poppins-Regular',
  },
  viewDocumentButton: {
    marginTop: 10,
    backgroundColor: '#000000',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  viewDocumentButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Poppins-Medium',
  },
  typingText: {
    fontSize: 16,
    color: '#999999',
    fontStyle: 'italic',
    fontFamily: 'Poppins-Regular',
  },
  quickActionsContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  quickActionButton: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  quickActionText: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
    fontFamily: 'Poppins-Medium',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginRight: 10,
    maxHeight: 100,
    fontSize: 16,
    color: '#000000',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    fontFamily: 'Poppins-Regular',
  },
  micButton: {
    padding: 12,
    marginRight: 5,
  },
  sendButton: {
    backgroundColor: '#000000',
    borderRadius: 12,
    padding: 12,
  },
  typingIndicator: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
  },
  authPrompt: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  authPromptText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
    textAlign: 'center',
  },
  authButton: {
    backgroundColor: '#000',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  authButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sessionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0f7fa',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginLeft: 10,
  },
  sessionStatusText: {
    fontSize: 12,
    color: '#007bff',
    fontFamily: 'Poppins-Medium',
    marginLeft: 5,
  },
  backgroundIconContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: -1, // Ensure it's behind other content
  },
  backgroundIcon: {
    width: '80%',
    height: '80%',
    opacity: 0.05, // Very faded background
  },
  connectionIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 5,
  },
  connecting: {
    backgroundColor: '#ffc107', // Orange for connecting
  },
  connected: {
    backgroundColor: '#28a745', // Green for connected
  },
  copyButton: {
    padding: 5,
    marginLeft: 10,
  },
});