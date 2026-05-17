import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SplashScreen, Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createMMKV } from 'react-native-mmkv';

import { scheduleReturnReminder } from '@/lib/notification';

SplashScreen.preventAutoHideAsync();

// onboarding storage
const onboardingStorage = createMMKV({
  id: 'powercalc_gh.onboarding',
});

export const ONBOARDING_KEY = 'done';

export function markOnboardingDone() {
  onboardingStorage.set(ONBOARDING_KEY, true);
}

function isOnboardingDone() {
  return onboardingStorage.getBoolean(ONBOARDING_KEY) ?? false;
}

export default function RootLayout() {
  const segments = useSegments();

  const [onboardingDone, setOnboardingDone] =
    useState<boolean | null>(null);

  // Read onboarding state
  useEffect(() => {
    setOnboardingDone(isOnboardingDone());
  }, []);

  // Notifications
  useEffect(() => {
    scheduleReturnReminder();
  }, []);

  // Hide splash once onboarding state is known
  useEffect(() => {
    if (onboardingDone === null) return;

    SplashScreen.hideAsync();
  }, [onboardingDone]);

  // Routing
  useEffect(() => {
    if (onboardingDone === null) return;

    const inTabs = segments[0] === '(tabs)';

    if (onboardingDone && !inTabs) {
      router.replace('/(tabs)');
    }

    if (!onboardingDone && inTabs) {
      router.replace('/');
    }
  }, [segments, onboardingDone]);

  // Don't render until onboarding state is loaded
  if (onboardingDone === null) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />

        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
        </Stack>

      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}