# Environment Variables Setup - Sahayak AI

## Overview

All sensitive configuration data has been moved to environment variables for security and maintainability. This document explains the setup and usage.

## Files Created/Modified

### 1. `.env` (Created)
Contains all sensitive configuration data:
- Firebase configuration
- Google OAuth client IDs
- App configuration
- Bundle identifiers
- EAS project ID

### 2. `.env.example` (Created)
Template file with placeholder values for new developers.

### 3. `app.config.js` (Created)
Expo configuration file that reads environment variables and makes them available to the app.

### 4. Updated Files
- `utils/firebase.ts` - Now uses environment variables for Firebase config
- `app/auth/login.tsx` - Now uses environment variables for Google OAuth
- `app/auth/signup.tsx` - Now uses environment variables for Google OAuth
- `README.md` - Updated with environment setup instructions

## Environment Variables

### Firebase Configuration
```env
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
FIREBASE_APP_ID=your_app_id
```

### Google OAuth Client IDs
```env
GOOGLE_EXPO_CLIENT_ID=your_expo_client_id
GOOGLE_IOS_CLIENT_ID=your_ios_client_id
GOOGLE_ANDROID_CLIENT_ID=your_android_client_id
GOOGLE_WEB_CLIENT_ID=your_web_client_id
```

### App Configuration
```env
APP_NAME=Sahayak AI
APP_SLUG=sahayak-ai
```

### Bundle Identifiers
```env
IOS_BUNDLE_IDENTIFIER=com.bcnishantreddy.sahayakai
ANDROID_PACKAGE_NAME=com.bcnishantreddy.sahayakai
```

### EAS Configuration
```env
EAS_PROJECT_ID=your_eas_project_id
```

## How It Works

1. **Environment Variables**: Stored in `.env` file (not committed to git)
2. **Expo Constants**: `app.config.js` reads `.env` and makes variables available via `Constants.expoConfig.extra`
3. **Fallback**: Code uses `Constants.expoConfig?.extra?.variableName || process.env.VARIABLE_NAME`
4. **Security**: `.env` is in `.gitignore`, only `.env.example` is committed

## Usage in Code

### Firebase Configuration
```typescript
import Constants from 'expo-constants';

const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.firebaseApiKey || process.env.FIREBASE_API_KEY,
  authDomain: Constants.expoConfig?.extra?.firebaseAuthDomain || process.env.FIREBASE_AUTH_DOMAIN,
  // ... other config
};
```

### Google OAuth
```typescript
const [request, response, promptAsync] = Google.useAuthRequest({
  clientId: Constants.expoConfig?.extra?.googleExpoClientId || process.env.GOOGLE_EXPO_CLIENT_ID,
  iosClientId: Constants.expoConfig?.extra?.googleIosClientId || process.env.GOOGLE_IOS_CLIENT_ID,
  // ... other client IDs
});
```

## Setup Instructions

### For New Developers
1. Clone the repository
2. Copy `.env.example` to `.env`
3. Fill in your actual values in `.env`
4. Run `npm install`
5. Start development: `npm run dev`

### For Production
1. Set environment variables in your deployment platform
2. Ensure all required variables are configured
3. Deploy using `expo build` or `eas build`

## Security Benefits

1. **No Hardcoded Secrets**: All sensitive data is externalized
2. **Environment-Specific**: Different values for dev/staging/production
3. **Version Control Safe**: `.env` is gitignored
4. **Team Collaboration**: `.env.example` provides template
5. **Easy Updates**: Change values without code changes

## Troubleshooting

### Common Issues
1. **"Cannot find name 'Constants'"**: Import `Constants from 'expo-constants'`
2. **Environment variables not loading**: Restart Expo dev server
3. **Build errors**: Ensure all required variables are set in production

### Verification
- Check that `.env` exists and has all required variables
- Verify `app.config.js` is properly configured
- Test that Firebase and Google OAuth work correctly

## Next Steps

1. **Complete Google OAuth Setup**: Add actual Expo and Android client IDs
2. **Production Environment**: Set up environment variables in deployment platform
3. **CI/CD Integration**: Configure environment variables in build pipeline
4. **Monitoring**: Add environment variable validation in app startup 