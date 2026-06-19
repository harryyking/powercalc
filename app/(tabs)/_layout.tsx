/**
 * app/(tabs)/_layout.tsx — Tab Layout
 */
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Platform } from 'react-native';

// ─── Theme tokens (match index.tsx) ──────────────────────────────────────────
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

// ─── Tab icon ─────────────────────────────────────────────────────────────────
function TabIcon({
  emoji,
  label,
  focused,
}: {
  emoji: string;
  label: string;
  focused: boolean;
}) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      {focused && <View style={styles.iconGlow} />}
      <Text style={[styles.emoji, focused && styles.emojiActive]}>{emoji}</Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,       
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="⚡" label="Calculator" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🕐" label="History" focused={focused} />
          ),
        }}
      />
  
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="⚙️" label="Settings" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: T.card,
    borderTopWidth: 1,
    borderTopColor: T.border,
    height: Platform.OS === 'ios' ? 82 : 64,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingTop: 8,
    // Subtle top shadow/glow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 20,
  },

  iconWrap: {
    width: 48,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    position: 'relative',
    overflow: 'visible',
  },
  iconWrapActive: {
    backgroundColor: 'rgba(0, 98, 57, 0.18)',
  },
  iconGlow: {
    position: 'absolute',
    width: 28,
    height: 2,
    bottom: -2,
    borderRadius: 1,
    backgroundColor: T.ring,
    opacity: 0.7,
  },
  emoji: {
    fontSize: 20,
    opacity: 0.35,
  },
  emojiActive: {
    opacity: 1,
  },
});