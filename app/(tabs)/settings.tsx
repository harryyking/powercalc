/**
 * app/(tabs)/settings.tsx — Settings Screen (Simplified)
 */
import React from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  StatusBar,
} from 'react-native';
import Text from '@/components/Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { clearHistory, getHistoryStats } from '../../lib/historyStore';
import { THEME } from '@/lib/theme';

const T = THEME.colors;
const S = THEME.radius
const APP_VERSION = '1.0.1';

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const stats = getHistoryStats();

  function handleClearHistory() {
    Alert.alert(
      'Clear history?',
      `This will permanently delete all ${stats.totalEntries} top-up records.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear all',
          style: 'destructive',
          onPress: () => {
            clearHistory();
            Alert.alert('Cleared', 'Your history has been deleted.');
          },
        },
      ]
    );
  }

  return (
    <View style={{flex: 1}}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ──────────────────────────────────────────────── */}
        <View style={[s.header, { paddingTop: insets.top + 20 }]}>
          <View style={s.headerDots} pointerEvents="none">
            {Array.from({ length: 30 }).map((_, i) => (
              <View key={i} style={s.dot} />
            ))}
          </View>
          <View style={s.headerBadge}>
            <Ionicons name="settings-outline" size={11} color={T.ring} />
            <Text style={s.headerBadgeText}>Settings</Text>
          </View>
          <Text style={s.headerTitle}>Preferences</Text>
          <Text style={s.headerSub}>Manage your data and resources</Text>
        </View>

        {/* ══════════════════════════════════════════════════════════
            SECTION: Your Data
        ══════════════════════════════════════════════════════════ */}
        <GroupLabel label="Your Data" />

        <View style={s.group}>
          <DataRow
            icon="bookmark-outline"
            label="Top-ups saved"
            value={String(stats.totalEntries)}
          />
          {stats.totalEntries > 0 && (
            <>
              <View style={s.separator} />
              <DataRow
                icon="cash-outline"
                label="Total spent (tracked)"
                value={`₵${stats.totalSpent.toFixed(2)}`}
                valueColor={T.primaryLight}
              />
            </>
          )}
          <View style={s.separator} />
          <TouchableOpacity
            style={[s.row, stats.totalEntries === 0 && s.rowDisabled]}
            onPress={handleClearHistory}
            disabled={stats.totalEntries === 0}
            activeOpacity={0.7}
          >
            <View
              style={[
                s.rowIcon,
                { backgroundColor: stats.totalEntries > 0 ? 'rgba(84,28,21,0.3)' : T.secondary },
              ]}
            >
              <Ionicons
                name="trash-outline"
                size={16}
                color={stats.totalEntries > 0 ? T.destructiveLight : T.mutedForeground}
              />
            </View>
            <Text
              style={[
                s.rowBody,
                s.rowTitle,
                { color: stats.totalEntries > 0 ? T.destructiveLight : T.mutedForeground },
              ]}
            >
              Clear all history
            </Text>
            {stats.totalEntries > 0 && (
              <Ionicons name="chevron-forward" size={16} color={T.destructiveLight} />
            )}
          </TouchableOpacity>
        </View>

        <View style={s.noteRow}>
          <Ionicons name="lock-closed-outline" size={12} color={T.mutedForeground} />
          <Text style={s.noteText}>All data is stored locally on your device.</Text>
        </View>

        {/* ══════════════════════════════════════════════════════════
            SECTION: Links & Resources (Replaces huge inline tables)
        ══════════════════════════════════════════════════════════ */}
        <GroupLabel label="Tariffs & Resources" />

        <View style={s.group}>
          <LinkRow
            icon="globe-outline"
            label="View Current PURC Rates"
            url="https://purc.com.gh"
          />
          <View style={s.separator} />
          <LinkRow
            icon="calculator-outline"
            label="PURC Web Estimator"
            url="https://purcghapp.com/tariffCalc.aspx"
          />
          <View style={s.separator} />
          <LinkRow
            icon="phone-portrait-outline"
            label="PURC Tariff Reckoner App"
            url="https://apps.apple.com/app/id6450124004"
          />
        </View>

        {/* ══════════════════════════════════════════════════════════
            SECTION: About
        ══════════════════════════════════════════════════════════ */}
        <GroupLabel label="About" />

        <View style={s.group}>
          <AboutRow icon="flash-outline" label="App" value="PowerCalc GH" />
          <View style={s.separator} />
          <AboutRow icon="code-slash-outline" label="Version" value={`v${APP_VERSION}`} />
        </View>

        {/* Disclaimer Footer */}
        <View style={s.footer}>
          <Text style={s.footerText}>
            ECG Calculator is an independent tool and is not affiliated with PURC or ECG.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function GroupLabel({ label }: { label: string }) {
  return (
    <View style={s.groupLabel}>
      <Text style={s.groupLabelText}>{label}</Text>
    </View>
  );
}

function DataRow({
  icon,
  label,
  value,
  valueColor,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={s.row}>
      <View style={[s.rowIcon, { backgroundColor: T.secondary }]}>
        <Ionicons name={icon} size={16} color={T.mutedForeground} />
      </View>
      <Text style={[s.rowBody, s.rowTitle]}>{label}</Text>
      <Text style={[s.rowValue, valueColor ? { color: valueColor } : {}]}>{value}</Text>
    </View>
  );
}

function AboutRow({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
}) {
  return (
    <View style={s.row}>
      <View style={[s.rowIcon, { backgroundColor: T.secondary }]}>
        <Ionicons name={icon} size={16} color={T.mutedForeground} />
      </View>
      <Text style={[s.rowBody, s.rowTitle]}>{label}</Text>
      <Text style={s.rowValue}>{value}</Text>
    </View>
  );
}

function LinkRow({
  icon,
  label,
  url,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  url: string;
}) {
  return (
    <TouchableOpacity style={s.row} onPress={() => Linking.openURL(url)} activeOpacity={0.7}>
      <View style={[s.rowIcon, { backgroundColor: 'rgba(0,98,57,0.12)' }]}>
        <Ionicons name={icon} size={16} color={T.primaryLight} />
      </View>
      <Text style={[s.rowBody, s.linkLabel]}>{label}</Text>
      <Ionicons name="open-outline" size={15} color={T.mutedForeground} />
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: T.background },
  content: { gap: 0 },

  // ── Header
  header: {
    backgroundColor: T.card,
    paddingHorizontal: 20,
    paddingBottom: 28,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    overflow: 'hidden',
  },
  headerDots: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 160,
    height: 120,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    opacity: 0.2,
    padding: 16,
  },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: T.primary },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(74,222,128,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: S.pill || 999,
    marginBottom: 12,
  },
  headerBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: T.ring,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: T.foreground,
    letterSpacing: -0.5,
  },
  headerSub: { fontSize: 13, color: T.mutedForeground, marginTop: 4 },

  // ── iOS-style group label
  groupLabel: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 8,
  },
  groupLabelText: {
    fontSize: 12,
    fontWeight: '600',
    color: T.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // ── Grouped card
  group: {
    marginHorizontal: 16,
    backgroundColor: T.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: T.border,
    overflow: 'hidden',
  },

  // ── Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  rowDisabled: { opacity: 0.45 },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowBody: { flex: 1 },
  rowTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: T.foreground,
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '500',
    color: T.mutedForeground,
  },
  linkLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: T.foreground,
  },
  separator: {
    height: 1,
    backgroundColor: T.border,
    marginLeft: 58, 
  },

  // ── Note
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  noteText: {
    fontSize: 12,
    color: T.mutedForeground,
  },

  // ── Footer Disclaimer
  footer: {
    marginTop: 32,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: T.mutedForeground,
    textAlign: 'center',
    lineHeight: 18,
  },
});