import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useLanguage } from '@/hooks/useLanguage';
import '../utils/i18n';

export default function RootLayout() {
  useFrameworkReady();
  const { isInitialized } = useLanguage();

  // No font loading needed, use system fonts in styles if required

  if (!isInitialized) {
    // You can show a loading screen here if needed
    return null;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
