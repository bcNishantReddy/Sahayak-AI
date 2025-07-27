# Internationalization (i18n) Implementation

## Overview

This app now supports multiple languages with real-time language switching. The internationalization system is built using `react-i18next` and provides a seamless experience for users to change languages on the fly.

## Features

- 🌍 **8 Supported Languages**: English, Hindi, Spanish, French, German, Chinese, Japanese, Arabic
- 🔄 **Real-time Language Switching**: Change language instantly without app restart
- 💾 **Language Persistence**: Selected language is saved and restored on app launch
- 📱 **Device Language Detection**: Automatically detects and uses device language if supported
- 🎨 **Beautiful Language Selector**: Modern UI with flags and native language names
- 📝 **Comprehensive Translations**: All app text is translated across all screens

## Supported Languages

| Language | Code | Native Name | Flag |
|----------|------|-------------|------|
| English | `en` | English | 🇺🇸 |
| Hindi | `hi` | हिन्दी | 🇮🇳 |
| Spanish | `es` | Español | 🇪🇸 |
| French | `fr` | Français | 🇫🇷 |
| German | `de` | Deutsch | 🇩🇪 |
| Chinese | `zh` | 中文 | 🇨🇳 |
| Japanese | `ja` | 日本語 | 🇯🇵 |
| Arabic | `ar` | العربية | 🇸🇦 |

## File Structure

```
├── utils/
│   └── i18n.ts                 # Main i18n configuration
├── hooks/
│   └── useLanguage.ts          # Language management hook
├── components/
│   └── LanguageSelector.tsx    # Language selection UI
├── locales/
│   ├── en.json                 # English translations
│   ├── hi.json                 # Hindi translations
│   ├── es.json                 # Spanish translations
│   ├── fr.json                 # French translations
│   ├── de.json                 # German translations
│   ├── zh.json                 # Chinese translations
│   ├── ja.json                 # Japanese translations
│   └── ar.json                 # Arabic translations
```

## Usage

### Basic Translation

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <Text>{t('common.loading')}</Text>
  );
}
```

### Language Switching

```tsx
import { setLanguage } from '@/utils/i18n';

// Change language
await setLanguage('hi'); // Switch to Hindi
```

### Language Selector Component

```tsx
import LanguageSelector from '@/components/LanguageSelector';

function SettingsScreen() {
  return (
    <View>
      <LanguageSelector />
    </View>
  );
}
```

### Language Hook

```tsx
import { useLanguage } from '@/hooks/useLanguage';

function MyComponent() {
  const { currentLanguage, isRTL, textDirection } = useLanguage();
  
  return (
    <View style={{ direction: textDirection }}>
      <Text>Current: {currentLanguage}</Text>
    </View>
  );
}
```

## Translation Keys Structure

The translation files are organized into logical sections:

### Common
- `common.loading` - Loading text
- `common.error` - Error messages
- `common.success` - Success messages
- `common.cancel` - Cancel button
- `common.save` - Save button

### Navigation
- `navigation.home` - Home tab
- `navigation.chat` - Chat tab
- `navigation.documents` - Documents tab
- `navigation.settings` - Settings tab

### Authentication
- `auth.welcome` - Welcome message
- `auth.loginTitle` - Login screen title
- `auth.email` - Email field
- `auth.password` - Password field
- `auth.loginError` - Login error message

### Chat
- `chat.title` - Chat screen title
- `chat.placeholder` - Message input placeholder
- `chat.typing` - AI typing indicator
- `chat.welcomeMessage` - Initial chat message

### Documents
- `documents.title` - Documents screen title
- `documents.noDocuments` - No documents message
- `documents.documentTypes.worksheet` - Worksheet type

### Settings
- `settings.title` - Settings screen title
- `settings.language` - Language setting
- `settings.selectLanguage` - Language selection

### Attendance
- `attendance.title` - Attendance screen title
- `attendance.classrooms` - Classrooms section
- `attendance.students` - Students section

## Adding New Languages

1. **Create Translation File**:
   ```bash
   cp locales/en.json locales/your-language-code.json
   ```

2. **Update i18n.ts**:
   ```tsx
   import yourLanguage from '../locales/your-language-code.json';
   
   export const languages = {
     // ... existing languages
     'your-language-code': { 
       name: 'Your Language', 
       nativeName: 'Your Native Name', 
       flag: '🏳️' 
     },
   };
   
   const resources = {
     // ... existing resources
     'your-language-code': { translation: yourLanguage },
   };
   ```

3. **Translate Content**: Update the JSON file with proper translations

## Adding New Translation Keys

1. **Add to English file** (`locales/en.json`):
   ```json
   {
     "newSection": {
       "newKey": "English text"
     }
   }
   ```

2. **Add to all other language files** with appropriate translations

3. **Use in components**:
   ```tsx
   const { t } = useTranslation();
   <Text>{t('newSection.newKey')}</Text>
   ```

## Best Practices

1. **Use Nested Keys**: Organize translations logically (e.g., `auth.loginTitle`)
2. **Keep Keys Descriptive**: Use clear, descriptive key names
3. **Avoid Hardcoded Text**: Always use translation keys instead of hardcoded strings
4. **Test All Languages**: Verify translations work correctly in all supported languages
5. **Consider RTL**: Arabic and other RTL languages need special consideration

## RTL Support

The system automatically detects RTL languages and provides:
- Text direction detection (`textDirection`)
- RTL language detection (`isRTL`)
- Proper layout handling

## Performance

- Translations are loaded once and cached
- Language switching is instant
- No performance impact on app startup
- Efficient memory usage

## Testing

Use the `LanguageTest` component to verify translations:

```tsx
import LanguageTest from '@/components/LanguageTest';

// Add to any screen for testing
<LanguageTest />
```

## Troubleshooting

### Common Issues

1. **Translation not found**: Check if the key exists in all language files
2. **Language not switching**: Verify the language code is correct
3. **RTL layout issues**: Check if the component handles RTL properly

### Debug Mode

Enable debug mode in development:
```tsx
// In utils/i18n.ts
debug: __DEV__, // Shows missing translations in console
```

## Future Enhancements

- [ ] Voice input in different languages
- [ ] Dynamic language loading
- [ ] Translation memory for better suggestions
- [ ] Community translation contributions
- [ ] Automatic translation quality checks 