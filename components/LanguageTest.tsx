import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function LanguageTest() {
  const { t, i18n } = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Language Test</Text>
      <Text style={styles.currentLanguage}>
        Current Language: {i18n.language}
      </Text>
      <Text style={styles.testText}>
        Welcome: {t('auth.welcome')}
      </Text>
      <Text style={styles.testText}>
        Login: {t('auth.login')}
      </Text>
      <Text style={styles.testText}>
        Chat Title: {t('chat.title')}
      </Text>
      <Text style={styles.testText}>
        Settings: {t('settings.title')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f0f0f0',
    margin: 10,
    borderRadius: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  currentLanguage: {
    fontSize: 14,
    marginBottom: 10,
    color: '#666',
  },
  testText: {
    fontSize: 14,
    marginBottom: 5,
  },
}); 