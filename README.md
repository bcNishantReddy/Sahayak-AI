# Sahayak AI

A React Native/Expo application for educational AI assistance.

## Environment Setup

This project uses environment variables for sensitive configuration. Follow these steps to set up your environment:

### 1. Copy Environment Template

```bash
cp .env.example .env
```

### 2. Configure Environment Variables

Edit the `.env` file and replace the placeholder values with your actual configuration:

```env
# Firebase Configuration
FIREBASE_API_KEY=your_firebase_api_key_here
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
FIREBASE_APP_ID=your_app_id

# Google OAuth Client IDs
GOOGLE_EXPO_CLIENT_ID=your_expo_client_id_here
GOOGLE_IOS_CLIENT_ID=your_ios_client_id_here
GOOGLE_ANDROID_CLIENT_ID=your_android_client_id_here
GOOGLE_WEB_CLIENT_ID=your_web_client_id_here

# App Configuration
APP_NAME=Sahayak AI
APP_SLUG=sahayak-ai

# Bundle Identifiers
IOS_BUNDLE_IDENTIFIER=your_ios_bundle_identifier_here
ANDROID_PACKAGE_NAME=your_android_package_name_here

# EAS Configuration
EAS_PROJECT_ID=your_eas_project_id_here
```

### 3. Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password and Google Sign-in)
3. Create a Firestore database
4. Update Firestore security rules to allow authenticated users to read/write their own data
5. Copy the Firebase configuration values to your `.env` file

### 4. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Create OAuth 2.0 credentials for:
   - Web application (for Expo web)
   - iOS application (for iOS builds)
   - Android application (for Android builds)
5. Add the correct redirect URIs:
   - For Expo: `https://auth.expo.io/@your-expo-username/your-app-slug`
   - For development: `http://localhost:19006`
6. Copy the client IDs to your `.env` file

### 5. Install Dependencies

```bash
npm install
```

### 6. Start Development Server

```bash
npm run dev
```

## Security Notes

- Never commit the `.env` file to version control
- The `.env.example` file contains placeholder values and is safe to commit
- All sensitive configuration is now stored in environment variables
- The app uses Expo Constants to access environment variables securely

## Available Scripts

- `npm run dev` - Start development server
- `npm run build:web` - Build for web
- `npm run android` - Run on Android
- `npm run ios` - Run on iOS
- `npm run lint` - Run linting

## Project Structure

- `app/` - Expo Router pages and navigation
- `components/` - Reusable React components
- `utils/` - Utility functions and services
- `assets/` - Static assets (images, fonts)
- `types/` - TypeScript type definitions 