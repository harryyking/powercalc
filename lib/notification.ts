/**
 * lib/notifications.ts
 *
 * 3-day "come back and check your credit" reminder.
 * Strategy: Reset-on-open — cancel + reschedule every time the app
 * comes to the foreground so the clock only starts from the last visit.
 *
 * Aligned with expo-notifications ~0.55.x (Expo SDK 55).
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// ─── Constants ────────────────────────────────────────────────────────────────

const REMINDER_IDENTIFIER  = 'powercalc-return-reminder';
const THREE_DAYS_SECONDS   = 3 * 24 * 60 * 60;

const REMINDER_CONTENT: Notifications.NotificationContentInput = {
  title: "⚡ How's your ECG credit holding up?",
  body:  "It's been a few days — check how long your prepaid credit will last before it runs out.",
  sound: true,
  data:  { screen: '/(tabs)' },
};

// ─── Foreground display handler ───────────────────────────────────────────────
// Must be set at module load time (top level), before scheduleNotificationAsync.
// SDK 55 canonical keys: shouldShowBanner + shouldShowList.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList:   true,
    shouldPlaySound:  false,
    shouldSetBadge:   false,
  }),
});

// ─── Permission helper ────────────────────────────────────────────────────────

/**
 * Returns true if the app has permission to show notifications.
 *
 * iOS note from Expo docs: the root `status` field can be misleading on iOS
 * because iOS permissions are more granular (AUTHORIZED, PROVISIONAL, etc.).
 * The docs recommend reading `ios.status` and comparing against the
 * IosAuthorizationStatus enum for accuracy on iOS.
 *
 * On Android the root `granted` boolean is sufficient.
 */
function isPermissionGranted(
  result: Notifications.NotificationPermissionsStatus,
): boolean {
  if (Platform.OS === 'ios') {
    // IosAuthorizationStatus.AUTHORIZED = 3, PROVISIONAL = 4, EPHEMERAL = 5
    // All three mean notifications will be delivered — treat them as granted.
    const iosStatus = result.ios?.status;
    return (
      iosStatus === Notifications.IosAuthorizationStatus.AUTHORIZED   ||
      iosStatus === Notifications.IosAuthorizationStatus.PROVISIONAL  ||
      iosStatus === Notifications.IosAuthorizationStatus.EPHEMERAL
    );
  }
  // Android — root `granted` is accurate
  return result.ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  // Check existing permission first — avoids burning the one-time iOS prompt
  const existing = await Notifications.getPermissionsAsync();
  if (isPermissionGranted(existing)) return true;

  // iOS: if status is DENIED, the system won't show the prompt again.
  // canAskAgain covers this for both platforms.
  if (!existing.ios) return false;

  // Show the native permission dialog
  const asked = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowSound: true,
      allowBadge: false, // we don't use badges
    },
  });

  return isPermissionGranted(asked);
}

// ─── Schedule / reset ─────────────────────────────────────────────────────────

/**
 * Cancels any existing reminder and schedules a fresh one 3 days from now.
 * Call on every cold open AND every AppState 'active' event.
 */
export async function scheduleReturnReminder(): Promise<void> {
  if (Platform.OS === 'web') return;

  const granted = await requestNotificationPermission();
  if (!granted) return;

  await cancelReturnReminder();

  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_IDENTIFIER,
    content:    REMINDER_CONTENT,
    trigger: {
      type:    Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: THREE_DAYS_SECONDS,
      repeats: false,
    },
  });
}

// ─── Cancel ──────────────────────────────────────────────────────────────────

export async function cancelReturnReminder(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.cancelScheduledNotificationAsync(REMINDER_IDENTIFIER);
  } catch (_) {
    // Not found — safe to ignore
  }
}