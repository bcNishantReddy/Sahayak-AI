import 'dotenv/config';

export default {
  expo: {
    name: process.env.APP_NAME || "Sahayak AI",
    slug: process.env.APP_SLUG || "sahayak-ai",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    userInterfaceStyle: "light",

    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: process.env.IOS_BUNDLE_IDENTIFIER || "com.sahayak.ai"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: process.env.ANDROID_PACKAGE_NAME || "com.sahayak.ai"
    },
    web: {
      favicon: "./assets/images/favicon.png"
    },
    extra: {
      // Firebase Configuration
      firebaseApiKey: process.env.FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN,
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: process.env.FIREBASE_APP_ID,
      
      // Google OAuth Client IDs
      googleExpoClientId: process.env.GOOGLE_EXPO_CLIENT_ID,
      googleIosClientId: process.env.GOOGLE_IOS_CLIENT_ID,
      googleAndroidClientId: process.env.GOOGLE_ANDROID_CLIENT_ID,
      googleWebClientId: process.env.GOOGLE_WEB_CLIENT_ID,
      
      // EAS Configuration
      eas: {
        projectId: process.env.EAS_PROJECT_ID || "94546b38-4915-4ba6-9a4a-21bd6ac0ecd9"
      }
    },
    plugins: [
      "expo-router"
    ]
  }
}; 