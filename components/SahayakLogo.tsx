import React from 'react';
import { Image, View, Text, StyleSheet } from 'react-native';

interface SahayakLogoProps {
  size?: number;
  showText?: boolean;
  color?: string; // Ignored for PNG, kept for compatibility
}

export default function SahayakLogo({ size = 60, showText = true }: SahayakLogoProps) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Image
        source={require('@/assets/images/sahayak-logo.png')}
        style={{ width: size, height: size, resizeMode: 'contain' }}
      />
      {showText && (
        <>
          <Text style={styles.text}>Sahayak AI</Text>
          <Text style={styles.tagline}>Powered by ZANS</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 25,
    fontWeight: '700',
    color: '#000',
    marginTop: 8,
    fontFamily: 'Poppins-SemiBold',
  },
  tagline: {
    fontSize: 25,
    color: '#666',
    marginTop: 2,
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
  },
});