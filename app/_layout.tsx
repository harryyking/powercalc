import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SplashScreen, Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createMMKV } from 'react-native-mmkv';

import { scheduleReturnReminder } from '@/lib/notification';

SplashScreen.preventAutoHideAsync();

const onboarding_storage = createMMKV({ id: 'onboarding' });

const onboardingKey = 'completed';

export function setOnboardingCompleted() {
  onboarding_storage.set(onboardingKey, true);
}

export function isOnboardingCompleted() {
   return onboarding_storage.getBoolean(onboardingKey);
}


export default function RootLayout() {
  const segments = useSegments();
  const [isReady, setIsReady] = useState(false);


  useEffect(() => {
    const hasCompletedOnboarding = isOnboardingCompleted();
    const inOnboardingFlow = segments[0] === 'onboarding';

        if (!hasCompletedOnboarding && !inOnboardingFlow) {
      router.replace('/onboarding');
    } else if (hasCompletedOnboarding && inOnboardingFlow) {
      router.replace('/(tabs)');
    }

    setIsReady(true);
    SplashScreen.hideAsync();
  }, [segments]);
    

  // Notifications
  useEffect(() => {
    scheduleReturnReminder();
  }, []);


  if (!isReady) return null;


  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />

        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="onboarding" />
        </Stack>

      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}