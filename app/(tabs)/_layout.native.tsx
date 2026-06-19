/**
 * app/(tabs)/_layout.native.tsx — Native Tab Layout (iOS & Android)
 *
 * Expo Router picks this file automatically on iOS and Android
 * (over _layout.tsx) because of the .native extension.
 *
 * NativeTabs renders:
 *  - iOS  → UITabBarController with SF Symbols icons
 *  - Android → Material Design bottom nav with Material Symbols
 *
 * Each <NativeTabs.Trigger name="..."> maps to a file in this directory:
 *   name="index"    → app/(tabs)/index.tsx    (Calculator)
 *   name="history"  → app/(tabs)/history.tsx
 *   name="tips"     → app/(tabs)/tips.tsx
 *   name="settings" → app/(tabs)/settings.tsx
 *
 * Requires SDK 55+. API is beta — import from 'expo-router/unstable-native-tabs'.
 * Docs: https://docs.expo.dev/router/advanced/native-tabs/
 */
import { NativeTabs } from 'expo-router/unstable-native-tabs';


const T = {
  background:   '#121212',
  card:         '#171717',
  border:       '#292929',
  primary:      '#006239',
  primaryLight: '#00a862',
  ring:         '#4ade80',
  foreground:   '#e2e8f0',
  muted:        '#1f1f1f',
  mutedFg:      '#5a5a5a',
};

export default function TabLayout() {
  return (
    <NativeTabs
      backgroundColor={T.card}
      tintColor={T.primaryLight}          // active icon/text
      labelStyle={{
        color: T.mutedFg,
      }}
    >
      {/* ⚡ Calculator */}
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Calculator</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf="square.grid.3x3.fill"   
          md="calculate"       
        />
      </NativeTabs.Trigger>

      {/* 🕐 History */}
      <NativeTabs.Trigger name="history">
        <NativeTabs.Trigger.Label>History</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf="clock.fill"
          md="history"
        />
      </NativeTabs.Trigger>

      {/* ⚙️ Settings */}
      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf="gearshape.fill"
          md="settings"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}