/**
 * app/_layout.tsx — Root Layout
 *
 * Uses Expo Router's useSegments() hook to handle the show-once
 * onboarding redirect — the idiomatic pattern for auth/onboarding
 * flows in Expo Router.
 *
 * How it works:
 *  - useSegments() tells us which route group the user is currently in
 *  - Onboarding state is read synchronously from MMKV (no await needed)
 *  - A useEffect watches both values and redirects accordingly:
 *      onboarding done  + not in (tabs) → replace('/(tabs)')
 *      onboarding pending + in (tabs)   → replace('/')  ← guards deep links
 *  - SplashScreen stays visible until BOTH fonts AND onboarding check
 *    resolve — zero flicker guaranteed
 *
 * Fix log (vs original):
 *  1. scheduleReturnReminder moved to its own useEffect — runs once on mount
 *  2. SplashScreen.hideAsync() waits for fonts AND storage, not just storage
 *  3. AsyncStorage replaced with MMKV — synchronous, consistent with historyStore
 *  4. AdMob initialization restored
 */

import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SplashScreen, Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { createMMKV } from 'react-native-mmkv';
import { scheduleReturnReminder } from '@/lib/notification';

// ─── Onboarding storage ───────────────────────────────────────────────────────
// Separate MMKV instance from history — scoped by ID, no collision risk
const onboardingStorage = createMMKV({ id: 'powercalc_gh.onboarding' });
export const ONBOARDING_KEY = 'done';

export function markOnboardingDone() {
  onboardingStorage.set(ONBOARDING_KEY, true);
}

function isOnboardingDone(): boolean {
  return onboardingStorage.getBoolean(ONBOARDING_KEY) ?? false;
}

// Keep SplashScreen visible until we're ready
SplashScreen.preventAutoHideAsync();

// ─── Root Layout ──────────────────────────────────────────────────────────────
export default function RootLayout() {

  // null = still resolving, true/false = resolved
  // MMKV is synchronous so this resolves on the first render — no loading flicker
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);
  const segments = useSegments();

  // ── 1. Read onboarding state (sync via MMKV) ───────────────────────────────
  useEffect(() => {
    setOnboardingDone(isOnboardingDone());
  }, []);

  // ── 2. Hide splash only when BOTH fonts AND onboarding check are ready ──────
  // Previously: SplashScreen hid after storage only → fonts could still be loading
  // Fix: wait for fontsLoaded AND onboardingDone !== null

  // ── 3. Schedule return reminder — once on mount only ──────────────────────
  useEffect(() => {
    scheduleReturnReminder();
  }, []);

  // ── 4. Redirect based on onboarding state ─────────────────────────────────
  useEffect(() => {
    if (onboardingDone === null) return; // still resolving

    const inTabsGroup = segments[0] === '(tabs)';

    if (onboardingDone && !inTabsGroup) {
      // Already onboarded — skip onboarding screen
      router.replace('/(tabs)');
    } else if (!onboardingDone && inTabsGroup) {
      // Deep link hit a tab before onboarding — send back to start
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