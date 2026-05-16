/**
 * app/(tabs)/settings.tsx — Settings Screen
 */
import React, { useState } from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  StatusBar,
} from 'react-native';
import Text  from '@/components/Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { TARIFFS } from '../../constants/tariffs';
import { clearHistory, getHistoryStats } from '../../lib/historyStore';

// ─── Theme ────────────────────────────────────────────────────────────────────
const T = {
  background:      '#121212',
  surface:         '#1a1a1a',
  card:            '#171717',
  secondary:       '#242424',
  border:          '#292929',
  foreground:      '#e2e8f0',
  mutedForeground: '#a2a2a2',
  primary:         '#006239',
  primaryLight:    '#00a862',
  primaryForeground: '#dde8e3',
  ring:            '#4ade80',
  amber:           '#F59E0B',
  destructive:     '#541c15',
  destructiveLight:'#f87171',
  sm: 8, md: 14, lg: 20, xl: 28, pill: 999,
};

const APP_VERSION = '1.0.0';

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [expandedTariff, setExpandedTariff] = useState<string | null>('residential');
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
      ],
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={T.background} />
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
            <Text style={s.headerBadgeText}>v{APP_VERSION}</Text>
          </View>
          <Text style={s.headerTitle}>Settings</Text>
          <Text style={s.headerSub}>PowerCalc GH</Text>
        </View>

        {/* ══════════════════════════════════════════════════════════
            SECTION: PURC Tariffs
        ══════════════════════════════════════════════════════════ */}
        <GroupLabel label="Current PURC Tariffs" />

        <View style={s.group}>
          <View style={s.infoRow}>
            <Ionicons name="information-circle-outline" size={15} color={T.mutedForeground} />
            <Text style={s.infoText}>
              Rates effective April 1, 2026 · Q2 2026 AAF adjustment (−4.81%). PURC reviews quarterly.
            </Text>
          </View>

          {Object.values(TARIFFS).map((tariff, idx, arr) => {
            const expanded = expandedTariff === tariff.type;
            const isLast   = idx === arr.length - 1;
            return (
              <React.Fragment key={tariff.type}>
                <TouchableOpacity
                  style={[s.row, expanded && s.rowActive]}
                  onPress={() =>
                    setExpandedTariff(expanded ? null : tariff.type)
                  }
                  activeOpacity={0.7}
                >
                  {/* Icon */}
                  <View style={[s.rowIcon, { backgroundColor: expanded ? 'rgba(0,98,57,0.2)' : T.secondary }]}>
                    <Ionicons
                      name={
                        tariff.type === 'lifeline'    ? 'home-outline'     :
                        tariff.type === 'residential' ? 'business-outline' :
                        'briefcase-outline'
                      }
                      size={16}
                      color={expanded ? T.primaryLight : T.mutedForeground}
                    />
                  </View>

                  {/* Labels */}
                  <View style={s.rowBody}>
                    <Text style={[s.rowTitle, expanded && s.rowTitleActive]}>
                      {tariff.label}
                    </Text>
                    <Text style={s.rowSubtitle} numberOfLines={1}>
                      {tariff.description}
                    </Text>
                  </View>

                  <Ionicons
                    name={expanded ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={T.mutedForeground}
                  />
                </TouchableOpacity>

                {/* Expanded bands */}
                {expanded && (
                  <View style={s.bandsContainer}>
                    {tariff.bands.map((band, i) => (
                      <View key={i} style={[s.bandRow, i < tariff.bands.length - 1 && s.bandRowBorder]}>
                        <View style={s.bandLeft}>
                          <Text style={s.bandRange}>
                            {band.minKwh}–{band.maxKwh ?? '∞'} kWh
                          </Text>
                          {band.serviceChargePerMonth > 0 && (
                            <Text style={s.bandService}>
                              + ₵{band.serviceChargePerMonth.toFixed(2)} service/mo
                            </Text>
                          )}
                        </View>
                        <Text style={s.bandRate}>
                          ₵{band.ratePerKwh.toFixed(4)}
                          <Text style={s.bandRateSub}>/kWh</Text>
                        </Text>
                      </View>
                    ))}
                    <View style={s.bandFooter}>
                      <Ionicons name="time-outline" size={11} color={T.mutedForeground} />
                      <Text style={s.bandUpdated}>
                        Last updated: {tariff.lastUpdated}
                      </Text>
                    </View>
                  </View>
                )}

                {!isLast && !expanded && <View style={s.separator} />}
              </React.Fragment>
            );
          })}

          <View style={s.separator} />

          {/* PURC link */}
          <TouchableOpacity
            style={s.row}
            onPress={() => Linking.openURL('https://purc.com.gh')}
            activeOpacity={0.7}
          >
            <View style={[s.rowIcon, { backgroundColor: 'rgba(0,98,57,0.12)' }]}>
              <Ionicons name="globe-outline" size={16} color={T.primaryLight} />
            </View>
            <Text style={[s.rowBody, s.linkLabel]}>
              Check current rates on purc.com.gh
            </Text>
            <Ionicons name="open-outline" size={15} color={T.mutedForeground} />
          </TouchableOpacity>
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
            <View style={[
              s.rowIcon,
              { backgroundColor: stats.totalEntries > 0 ? 'rgba(84,28,21,0.3)' : T.secondary },
            ]}>
              <Ionicons
                name="trash-outline"
                size={16}
                color={stats.totalEntries > 0 ? T.destructiveLight : T.mutedForeground}
              />
            </View>
            <Text style={[
              s.rowBody,
              s.rowTitle,
              { color: stats.totalEntries > 0 ? T.destructiveLight : T.mutedForeground },
            ]}>
              Clear all history
            </Text>
            {stats.totalEntries > 0 && (
              <Ionicons name="chevron-forward" size={16} color={T.destructiveLight} />
            )}
          </TouchableOpacity>
        </View>

        <View style={s.noteRow}>
          <Ionicons name="lock-closed-outline" size={12} color={T.mutedForeground} />
          <Text style={s.noteText}>All data is stored only on your device. Nothing is uploaded.</Text>
        </View>

        {/* ══════════════════════════════════════════════════════════
            SECTION: About
        ══════════════════════════════════════════════════════════ */}
        <GroupLabel label="About" />

        <View style={s.group}>
          <AboutRow icon="flash-outline"       label="App"           value="PowerCalc GH"  />
          <View style={s.separator} />
          <AboutRow icon="code-slash-outline"  label="Version"       value={APP_VERSION}   />
          <View style={s.separator} />
          <AboutRow icon="document-text-outline" label="Tariff source" value="PURC Ghana"  />
          <View style={s.separator} />
          <AboutRow icon="business-outline"    label="ECG source"    value="ecg.com.gh"    />
          <View style={s.separator} />
          <AboutRow
            icon="checkmark-circle-outline"
            label="E-Levy"
            value="Abolished Apr 2025"
            valueColor={T.ring}
          />
        </View>

        {/* External links */}
        <GroupLabel label="Resources" />

        <View style={s.group}>
          <LinkRow
            icon="calculator-outline"
            label="PURC Electricity Estimator"
            url="https://purcghapp.com/tariffCalc.aspx"
          />
          <View style={s.separator} />
          <LinkRow
            icon="phone-portrait-outline"
            label="PURC Tariff Reckoner (official app)"
            url="https://apps.apple.com/app/id6450124004"
          />
        </View>

        {/* Disclaimer */}
        <View style={s.disclaimerCard}>
          <Ionicons name="information-circle-outline" size={14} color={T.mutedForeground} style={{ marginTop: 1 }} />
          <Text style={s.disclaimerText}>
            PowerCalc GH is an independent tool and is not affiliated with PURC or ECG.
            Tariff data is sourced from official PURC announcements and updated with each
            quarterly AAF review. Always verify critical figures at purc.com.gh.
          </Text>
        </View>
      </ScrollView>
    </>
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
    <TouchableOpacity
      style={s.row}
      onPress={() => Linking.openURL(url)}
      activeOpacity={0.7}
    >
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
  scroll:  { flex: 1, backgroundColor: T.background },
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
    position: 'absolute', top: 0, right: 0,
    width: 160, height: 120,
    flexDirection: 'row', flexWrap: 'wrap',
    gap: 10, opacity: 0.2, padding: 16,
  },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: T.primary },
  headerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(74,222,128,0.08)',
    borderWidth: 1, borderColor: 'rgba(74,222,128,0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 9, paddingVertical: 3,
    borderRadius: T.pill, marginBottom: 12,
  },
  headerBadgeText: {
    fontSize: 10, fontWeight: '600', color: T.ring,
    letterSpacing: 0.6, textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: 26, fontWeight: '700',
    color: T.foreground, letterSpacing: -0.5,
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
    borderRadius: T.lg,
    borderWidth: 1,
    borderColor: T.border,
    overflow: 'hidden',
  },

  // ── Row (iOS settings-style)
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 12,
  },
  rowActive: {
    backgroundColor: 'rgba(0,98,57,0.08)',
  },
  rowDisabled: { opacity: 0.45 },
  rowIcon: {
    width: 32, height: 32,
    borderRadius: T.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowBody: { flex: 1 },
  rowTitle: {
    fontSize: 15, fontWeight: '500', color: T.foreground,
  },
  rowTitleActive: { color: T.primaryForeground },
  rowSubtitle: {
    fontSize: 12, color: T.mutedForeground, marginTop: 1,
  },
  rowValue: {
    fontSize: 14, fontWeight: '500', color: T.mutedForeground,
  },
  linkLabel: {
    fontSize: 15, fontWeight: '500', color: T.primaryLight,
  },

  separator: {
    height: 1,
    backgroundColor: T.border,
    marginLeft: 58, // indent to align with text, past icon
  },

  // ── Info row
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  infoText: {
    flex: 1, fontSize: 12,
    color: T.mutedForeground, lineHeight: 18,
  },

  // ── Tariff bands
  bandsContainer: {
    backgroundColor: 'rgba(0,98,57,0.06)',
    marginHorizontal: 14,
    marginBottom: 12,
    borderRadius: T.md,
    borderWidth: 1,
    borderColor: 'rgba(0,168,98,0.15)',
    overflow: 'hidden',
  },
  bandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  bandRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  bandLeft: { gap: 2 },
  bandRange: {
    fontSize: 13, fontWeight: '500', color: T.foreground,
  },
  bandService: { fontSize: 11, color: T.mutedForeground },
  bandRate: {
    fontSize: 16, fontWeight: '700', color: T.primaryLight,
  },
  bandRateSub: {
    fontSize: 11, fontWeight: '400', color: T.mutedForeground,
  },
  bandFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: T.border,
  },
  bandUpdated: { fontSize: 11, color: T.mutedForeground },

  // ── Note
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginHorizontal: 20,
    marginTop: 10,
  },
  noteText: {
    flex: 1, fontSize: 12,
    color: T.mutedForeground, lineHeight: 17,
  },

  // ── Disclaimer
  disclaimerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 24,
    padding: 14,
    backgroundColor: T.surface,
    borderRadius: T.md,
    borderWidth: 1,
    borderColor: T.border,
  },
  disclaimerText: {
    flex: 1, fontSize: 12,
    color: T.mutedForeground, lineHeight: 18,
  },
});