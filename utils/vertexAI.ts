import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAuth } from 'firebase/auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

const functions = getFunctions();
const auth = getAuth();

// Initialize Firebase Functions
const interactWithAgent = httpsCallable(functions, 'interactWithAgent');

export interface ChatMessage {
  id: string;
  message: string;
  response: string;
  timestamp: Date;
  sessionId: string;
  userId: string;
}

export interface DocumentLink {
  id: string;
  title: string;
  url: string;
  type: 'document' | 'image' | 'video' | 'audio';
  timestamp: Date;
  userId: string;
}

/**
 * Send a message to Vertex AI Agent Engine
 */
export async function sendMessage(
  message: string,
  onChunk: (chunk: any) => void,
  onComplete: (fullResponse: string) => void,
  onError: (error: string) => void
): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    onError('User must be authenticated');
    return;
  }

  try {
    // Call the interactWithAgent function
    const result = await interactWithAgent({
      userId: user.uid,
      userQuery: message,
      userLocation: 'Unknown',
      userLanguage: 'en-US',
      startNewSession: false
    });
    
    const data = result.data as any;
    
    if (data.status === 'success' && data.response) {
      // Simulate streaming by sending the response in chunks
      const response = data.response;
      const words = response.split(' ');
      let currentChunk = '';
      
      for (const word of words) {
        currentChunk += word + ' ';
        if (currentChunk.length > 20) {
          onChunk({ text: currentChunk, full: { response: currentChunk } });
          currentChunk = '';
          // Small delay to simulate streaming
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
      
      // Send any remaining text
      if (currentChunk.trim()) {
        onChunk({ text: currentChunk, full: { response: currentChunk } });
      }
      
      // Save the chat message and complete
      await saveChatMessage(message, response, data.sessionId);
      onComplete(response);
    } else {
      onError('No response received from AI agent');
    }
  } catch (error) {
    console.error('Error getting response:', error);
    onError(error instanceof Error ? error.message : 'Unknown error');
  }
}

/**
 * Save chat message and extract documents
 */
async function saveChatMessage(message: string, response: string, sessionId: string): Promise<void> {
  try {
    const user = auth.currentUser;
    if (!user) return;

    // Save to Firestore directly
    const chatRef = await addDoc(collection(db, 'users', user.uid, 'chats'), {
      message,
      response,
      sessionId,
      timestamp: serverTimestamp(),
      userId: user.uid
    });

    // Extract and save document links
    const documentLinks = extractDocumentLinks(response);
    for (const link of documentLinks) {
      await addDoc(collection(db, 'users', user.uid, 'documents'), {
        title: link.title,
        url: link.url,
        type: link.type,
        timestamp: serverTimestamp(),
        userId: user.uid
      });
    }

    console.log('Chat message saved:', chatRef.id);
  } catch (error) {
    console.error('Error saving chat message:', error);
  }
}

/**
 * Extract document links from AI response
 */
function extractDocumentLinks(text: string): Array<{ title: string; url: string; type: string }> {
  const links: Array<{ title: string; url: string; type: string }> = [];
  
  // URL regex patterns for different file types
  const urlPatterns = [
    {
      pattern: /(https?:\/\/[^\s]+\.(pdf|doc|docx|txt|rtf))/gi,
      type: 'document'
    },
    {
      pattern: /(https?:\/\/[^\s]+\.(png|jpg|jpeg|gif|svg|webp))/gi,
      type: 'image'
    },
    {
      pattern: /(https?:\/\/[^\s]+\.(mp4|avi|mov|wmv|flv|webm))/gi,
      type: 'video'
    },
    {
      pattern: /(https?:\/\/[^\s]+\.(mp3|wav|flac|aac|ogg))/gi,
      type: 'audio'
    }
  ];

  urlPatterns.forEach(({ pattern, type }) => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(url => {
        try {
          // Extract title from URL or use filename
          const urlObj = new URL(url);
          const pathname = urlObj.pathname;
          const filename = pathname.split('/').pop() || 'Document';
          const title = filename.replace(/\.[^/.]+$/, ''); // Remove extension

          links.push({
            url,
            title: title.charAt(0).toUpperCase() + title.slice(1),
            type
          });
        } catch (e) {
          // Skip invalid URLs
        }
      });
    }
  });

  return links;
} 