import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function PrivacyPolicy() {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>Privacy Policy</Text>
      <Text style={styles.text}>
        This is a dummy Privacy Policy page. Please replace this text with your actual privacy policy.
      </Text>
      <Text style={styles.text}>
        1. We respect your privacy and protect your data.
      </Text>
      <Text style={styles.text}>
        2. No personal information is shared with third parties.
      </Text>
      <Text style={styles.text}>
        3. You can request data deletion at any time.
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