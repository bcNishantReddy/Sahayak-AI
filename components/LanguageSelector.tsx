import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { languages, setLanguage } from '../utils/i18n';
import { ChevronDown, Globe, Check } from 'lucide-react-native';

interface LanguageSelectorProps {
  style?: any;
}

export default function LanguageSelector({ style }: LanguageSelectorProps) {
  const { t, i18n } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);

  const handleLanguageChange = async (languageCode: string) => {
    try {
      await setLanguage(languageCode);
      setSelectedLanguage(languageCode);
      setModalVisible(false);
    } catch (error) {
      Alert.alert(
        t('common.error'),
        'Failed to change language. Please try again.'
      );
    }
  };

  const currentLanguage = languages[selectedLanguage as keyof typeof languages];

  return (
    <>
      <TouchableOpacity
        style={[styles.container, style]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <View style={styles.languageInfo}>
          <Globe size={20} color="#666" />
          <Text style={styles.languageText}>
            {currentLanguage?.nativeName || currentLanguage?.name || 'English'}
          </Text>
          <Text style={styles.languageFlag}>{currentLanguage?.flag}</Text>
        </View>
        <ChevronDown size={16} color="#666" />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('settings.selectLanguage')}</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.languageList} showsVerticalScrollIndicator={false}>
              {Object.entries(languages).map(([code, language]) => (
                <TouchableOpacity
                  key={code}
                  style={[
                    styles.languageItem,
                    selectedLanguage === code && styles.selectedLanguageItem,
                  ]}
                  onPress={() => handleLanguageChange(code)}
                  activeOpacity={0.7}
                >
                  <View style={styles.languageItemContent}>
                    <Text style={styles.languageFlag}>{language.flag}</Text>
                    <View style={styles.languageDetails}>
                      <Text style={[
                        styles.languageName,
                        selectedLanguage === code && styles.selectedLanguageName,
                      ]}>
                        {language.nativeName}
                      </Text>
                      <Text style={styles.languageEnglishName}>
                        {language.name}
                      </Text>
                    </View>
                  </View>
                  {selectedLanguage === code && (
                    <Check size={20} color="#007AFF" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  languageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  languageText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  languageFlag: {
    fontSize: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  languageList: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  selectedLanguageItem: {
    backgroundColor: '#f0f8ff',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  languageItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  languageDetails: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  selectedLanguageName: {
    color: '#007AFF',
    fontWeight: '600',
  },
  languageEnglishName: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
}); 