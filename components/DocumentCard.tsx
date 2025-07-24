import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Calendar, BookOpen, HelpCircle, FileText as LucideFileText, Book } from 'lucide-react-native';

interface DocumentCardProps {
  title: string;
  type: 'worksheet' | 'quiz' | 'lesson-plan' | 'story';
  class: string;
  subject: string;
  createdAt: Date;
  questions?: number;
  onPress?: () => void;
}

export default function DocumentCard({
  title,
  type,
  class: className,
  subject,
  createdAt,
  questions,
  onPress,
}: DocumentCardProps) {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'worksheet': return '#22A199';
      case 'quiz': return '#FF9874';
      case 'lesson-plan': return '#48CFCB';
      case 'story': return '#FFD7C4';
      default: return '#424242';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'worksheet': return <BookOpen size={18} color="#000" style={{marginRight:4}} />;
      case 'quiz': return <HelpCircle size={18} color="#000" style={{marginRight:4}} />;
      case 'lesson-plan': return <BookOpen size={18} color="#000" style={{marginRight:4}} />;
      case 'story': return <Book size={18} color="#000" style={{marginRight:4}} />;
      default: return <LucideFileText size={18} color="#000" style={{marginRight:4}} />;
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleContainer}>
          {getTypeIcon(type)}
          <Text style={styles.cardTitle}>{title}</Text>
        </View>
        <View style={[styles.typeChip, { backgroundColor: getTypeColor(type) }]}>
          <Text style={styles.typeChipText}>{type.replace('-', ' ')}</Text>
        </View>
      </View>
      
      <View style={styles.cardContent}>
        <View style={styles.cardMeta}>
          <Text style={styles.cardMetaText}>
            <BookOpen size={14} color="#888" /> {className} <Text style={{fontSize:18, color:'#888', marginHorizontal:2}}>·</Text> {subject}
          </Text>
          <Text style={styles.cardMetaText}>
            <Calendar size={14} color="#888" /> {createdAt.toLocaleDateString()}
          </Text>
        </View>
        
        {questions && questions > 0 && (
          <Text style={styles.questionsText}>{questions} questions</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    color: '#424242',
    flex: 1,
  },
  typeChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeChipText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
    textTransform: 'capitalize',
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
    color: '#888',
    flexDirection: 'row',
    alignItems: 'center',
  },
  questionsText: {
    fontSize: 14,
    color: '#22A199',
    fontWeight: '500',
  },
});