import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export interface FeatureTourStep {
  title: string;
  description: string;
  position?: 'center' | 'top' | 'bottom';
  align?: 'left' | 'right';
}

export default function FeatureTour({
  steps,
  visible,
  onFinish,
}: {
  steps: FeatureTourStep[];
  visible: boolean;
  onFinish: () => void;
}) {
  const [step, setStep] = useState(0);

  if (!visible) return null;

  const isLast = step === steps.length - 1;
  const position = steps[step].position || 'center';
  const align = steps[step].align || 'left';

  let popupPositionStyle = {};
  if (position === 'top') {
    popupPositionStyle = { justifyContent: 'flex-start', paddingTop: 80 };
  } else if (position === 'bottom') {
    popupPositionStyle = { justifyContent: 'flex-end', paddingBottom: 80 };
  } else {
    popupPositionStyle = { justifyContent: 'center' };
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={[styles.overlay, popupPositionStyle]} pointerEvents="box-none">
        <View style={[styles.bubbleRow, align === 'right' ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' }]}> 
          <View style={[styles.popup, align === 'right' ? styles.rightBubble : styles.leftBubble]} pointerEvents="auto">
            <TouchableOpacity
              style={styles.skipButton}
              onPress={() => {
                if (isLast) {
                  setStep(0);
                  onFinish();
                } else {
                  setStep(s => s + 1);
                }
              }}
            >
              <Text style={styles.skipButtonText}>Skip</Text>
            </TouchableOpacity>
            <Text style={styles.title}>{steps[step].title}</Text>
            <Text style={styles.description}>{steps[step].description}</Text>
            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                if (isLast) {
                  setStep(0);
                  onFinish();
                } else {
                  setStep(s => s + 1);
                }
              }}
            >
              <Text style={styles.buttonText}>{isLast ? 'Got it' : 'Next'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.38)',
    alignItems: 'center',
    // justifyContent set dynamically
  },
  bubbleRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 30,
  },
  popup: {
    maxWidth: width * 0.8,
    backgroundColor: '#F4F4F6',
    borderRadius: 18,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    position: 'relative',
  },
  leftBubble: {
    borderBottomLeftRadius: 8,
    borderTopLeftRadius: 8,
    marginLeft: 20,
  },
  rightBubble: {
    borderBottomRightRadius: 8,
    borderTopRightRadius: 8,
    marginRight: 20,
  },
  skipButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
    padding: 4,
  },
  skipButtonText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222',
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#444',
    marginBottom: 24,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#222',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 28,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 