import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function TermsAndConditions() {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>Terms and Conditions</Text>
      <Text style={styles.text}>
        This is a dummy Terms and Conditions page. Please replace this text with your actual terms and conditions.
      </Text>
      <Text style={styles.text}>
        1. Use this app responsibly.
      </Text>
      <Text style={styles.text}>
        2. Do not misuse the features.
      </Text>
      <Text style={styles.text}>
        3. All data is handled as per our privacy policy.
      </Text>
      <Text style={styles.text}>
        4. For any questions, contact support.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    marginBottom: 20,
  },
  text: {
    fontSize: 16,
    color: '#000',
    marginBottom: 12,
  },
}); 