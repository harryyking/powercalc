/**
 * app/_layout.tsx — Root Layout
 *
 * Uses Expo Router's useSegments() hook to handle the show-once
 * onboarding redirect — the idiomatic pattern for auth/onboarding
 * flows in Expo Router.
 *
 * How it works:
 *  - useSegments() tells us which route group the user is currently in
 *  - We read AsyncStorage once on mount
 *  - A useEffect watches both values and redirects accordingly:
 *      onboarding done  + not in (tabs) → replace('/(tabs)')
 *      onboarding pending + in (tabs)   → replace('/')   ← guards deep links
 *  - SplashScreen stays visible until the check resolves, so
 *    there's zero flicker — no blank View needed
 */

import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SplashScreen, Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { scheduleReturnReminder } from '@/lib/notification';

SplashScreen.preventAutoHideAsync();

export const ONBOARDING_KEY = '@powercalc_onboarding_done';

export default function RootLayout() {
  // null = still checking, true/false = resolved
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  // Which route group is currently active e.g. ['(tabs)'] or []
  const segments = useSegments();

  // ── 1. Read storage once on mount ────────────────────────────────────────
  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY)
      .then((val) => setOnboardingDone(val === 'true'))
      .catch(() => setOnboardingDone(false)) // treat errors as "not done"
      .finally(() => SplashScreen.hideAsync());
  }, []);

  // ── 2. React to state + segment changes ──────────────────────────────────
  useEffect(() => {
    scheduleReturnReminder();
    if (onboardingDone === null) return; // still loading, do nothing

    const inTabsGroup = segments[0] === '(tabs)';

    if (onboardingDone && !inTabsGroup) {
      // Already onboarded — skip past the onboarding screen
      router.replace('/(tabs)');
    } else if (!onboardingDone && inTabsGroup) {
      // Someone navigated directly to a tab without finishing onboarding
      // (e.g. a deep link) — send them back to onboarding first
      router.replace('/');
    }
  }, [onboardingDone, segments]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index"  options={{ animation: 'fade' }} />
          <Stack.Screen name="(tabs)" options={{ animation: 'slide_from_right' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}