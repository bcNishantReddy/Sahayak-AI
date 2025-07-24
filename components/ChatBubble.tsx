import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { User, Bot } from 'lucide-react-native';

interface ChatBubbleProps {
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function ChatBubble({ text, isUser, timestamp }: ChatBubbleProps) {
  return (
    <View
      style={[
        styles.messageContainer,
        isUser ? styles.userMessage : styles.aiMessage,
      ]}
    >
      <View style={styles.messageHeader}>
        {isUser ? (
          <User size={20} color="#424242" />
        ) : (
          <Bot size={20} color="#22A199" />
        )}
        <Text style={styles.messageTime}>
          {timestamp.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
      <Text style={[styles.messageText, isUser && styles.userMessageText]}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  messageContainer: {
    marginVertical: 5,
    maxWidth: '85%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#22A199',
    borderRadius: 20,
    borderBottomRightRadius: 5,
    padding: 15,
  },
  aiMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderBottomLeftRadius: 5,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  messageTime: {
    fontSize: 12,
    color: '#888',
    marginLeft: 5,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
    color: '#424242',
  },
  userMessageText: {
    color: '#FFFFFF',
  },
});