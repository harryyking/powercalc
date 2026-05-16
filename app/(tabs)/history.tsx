/**
 * app/(tabs)/history.tsx — Credit History Screen
 */
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  StatusBar,
} from 'react-native';
import Text  from '@/components/Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  useHistory,
  markUnitsFinished,
  deleteHistoryEntry,
  getHistoryStats,
  clearHistory,
} from '../../lib/historyStore';
import { TARIFFS } from '../../constants/tariffs';
import { formatGhs, formatDuration } from '../../lib/useCalculator';
import type { CreditHistoryEntry } from '../../types';

// ─── Theme tokens ─────────────────────────────────────────────────────────────
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
  destructive:     '#541c15',
  destructiveLight:'#f87171',
  amber:           '#F59E0B',
  amberDim:        'rgba(245,158,11,0.12)',

  sm: 8, md: 14, lg: 20, xl: 28, pill: 999,
};

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function HistoryScreen() {
  const insets  = useSafeAreaInsets();
  const history = useHistory();
  const stats   = getHistoryStats();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function handleMarkFinished(entry: CreditHistoryEntry) {
    Alert.alert(
      'Units finished?',
      `Mark your ₵${entry.creditGhs} top-up from ${formatDate(entry.date)} as finished today?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Yes, finished', onPress: () => markUnitsFinished(entry.id) },
      ],
    );
  }

  function handleDelete(entry: CreditHistoryEntry) {
    Alert.alert(
      'Delete entry?',
      `Remove the ₵${entry.creditGhs} top-up from ${formatDate(entry.date)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteHistoryEntry(entry.id) },
      ],
    );
  }

  function handleClearAll() {
    Alert.alert(
      'Clear all history?',
      'This will permanently delete all your top-up records.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear all', style: 'destructive', onPress: clearHistory },
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
          {/* Decorative dot grid */}
          <View style={s.headerDots} pointerEvents="none">
            {Array.from({ length: 30 }).map((_, i) => (
              <View key={i} style={s.dot} />
            ))}
          </View>
          <View style={s.headerBadge}>
            <Ionicons name="time-outline" size={11} color={T.ring} />
            <Text style={s.headerBadgeText}>Log</Text>
          </View>
          <Text style={s.headerTitle}>Top-up History</Text>
          <Text style={s.headerSub}>Your prepaid credit records</Text>
        </View>

        {/* ── Stats strip ─────────────────────────────────────────── */}
        {history.length > 0 && (
          <View style={s.statsStrip}>
            <StatTile
              icon="wallet-outline"
              label="Total spent"
              value={formatGhs(stats.totalSpent)}
            />
            <View style={s.statDivider} />
            <StatTile
              icon="trending-up-outline"
              label="Daily avg"
              value={`${formatGhs(stats.averageDailySpend)}/day`}
            />
            <View style={s.statDivider} />
            <StatTile
              icon="calendar-outline"
              label="Avg duration"
              value={`${Math.round(stats.averageDaysPerTopUp)}d`}
            />
            {stats.accuracy !== null && (
              <>
                <View style={s.statDivider} />
                <StatTile
                  icon="checkmark-circle-outline"
                  label="Accuracy"
                  value={`${Math.round(stats.accuracy)}%`}
                  accent
                />
              </>
            )}
          </View>
        )}

        {/* ── History list ────────────────────────────────────────── */}
        <View style={s.section}>
          {history.length === 0 ? (
            <EmptyState />
          ) : (
            history.map((entry) => (
              <HistoryCard
                key={entry.id}
                entry={entry}
                expanded={expandedId === entry.id}
                onPress={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                onMarkFinished={() => handleMarkFinished(entry)}
                onDelete={() => handleDelete(entry)}
              />
            ))
          )}
        </View>

        {/* ── Clear all ───────────────────────────────────────────── */}
        {history.length > 0 && (
          <TouchableOpacity style={s.clearBtn} onPress={handleClearAll} activeOpacity={0.7}>
            <Ionicons name="trash-outline" size={14} color={T.destructiveLight} />
            <Text style={s.clearBtnText}>Clear all history</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </>
  );
}

// ─── HistoryCard ──────────────────────────────────────────────────────────────
interface HistoryCardProps {
  entry: CreditHistoryEntry;
  expanded: boolean;
  onPress: () => void;
  onMarkFinished: () => void;
  onDelete: () => void;
}

function HistoryCard({ entry, expanded, onPress, onMarkFinished, onDelete }: HistoryCardProps) {
  const hasActual = entry.actualDays !== undefined;
  const accuracy  = hasActual
    ? Math.max(
        0,
        Math.round(
          100 - (Math.abs(entry.actualDays! - entry.estimatedDays) / entry.estimatedDays) * 100,
        ),
      )
    : null;

  const tariffLabel = TARIFFS[entry.tariffType]?.label ?? entry.tariffType;
  const accuracyGood = accuracy !== null && accuracy >= 80;

  return (
    <TouchableOpacity
      style={[s.card, expanded && s.cardExpanded]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Left accent bar */}
      <View style={[s.cardAccent, expanded && s.cardAccentActive]} />

      {/* ── Card header ─────────────────────────────────────────── */}
      <View style={s.cardHeader}>
        <View style={s.cardLeft}>
          <Text style={s.cardCredit}>{formatGhs(entry.creditGhs)}</Text>
          <Text style={s.cardDate}>{formatDate(entry.date)}</Text>
        </View>

        <View style={s.cardRight}>
          <View style={s.daysRow}>
            <Ionicons name="flash-outline" size={12} color={T.primaryLight} />
            <Text style={s.cardDays}>{formatDuration(entry.estimatedDays, 0)} est.</Text>
          </View>
          {hasActual && (
            <View style={[s.accuracyBadge, accuracyGood ? s.accuracyGood : s.accuracyWarn]}>
              <Text style={[s.accuracyText, accuracyGood ? s.accuracyTextGood : s.accuracyTextWarn]}>
                {accuracy}% accurate
              </Text>
            </View>
          )}
        </View>

        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={T.mutedForeground}
          style={{ marginLeft: 8 }}
        />
      </View>

      {/* ── Expanded detail ─────────────────────────────────────── */}
      {expanded && (
        <View style={s.cardDetail}>
          <View style={s.detailGrid}>
            <DetailChip icon="flash-outline"    label="Tariff"       value={tariffLabel} />
            <DetailChip icon="cash-outline"     label="Daily spend"  value={`${formatGhs(entry.dailyCostGhs)}/day`} />
            {hasActual && (
              <DetailChip icon="calendar-outline" label="Actual" value={`${entry.actualDays} days`} />
            )}
          </View>

          {/* Appliance tags */}
          {entry.appliances.length > 0 && (
            <View style={s.applianceTags}>
              {entry.appliances.map((a) => (
                <View key={a.id} style={s.tag}>
                  <Text style={s.tagText}>{a.emoji} {a.name}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Action buttons */}
          <View style={s.cardActions}>
            {!hasActual && (
              <TouchableOpacity style={s.finishedBtn} onPress={onMarkFinished} activeOpacity={0.8}>
                <Ionicons name="checkmark-circle-outline" size={15} color={T.ring} />
                <Text style={s.finishedBtnText}>Units finished today</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={s.deleteBtn} onPress={onDelete} activeOpacity={0.8}>
              <Ionicons name="trash-outline" size={14} color={T.destructiveLight} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── StatTile ─────────────────────────────────────────────────────────────────
function StatTile({
  icon,
  label,
  value,
  accent = false,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <View style={s.statTile}>
      <Ionicons name={icon} size={13} color={accent ? T.ring : T.mutedForeground} style={{ marginBottom: 4 }} />
      <Text style={[s.statValue, accent && s.statValueAccent]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

// ─── DetailChip ───────────────────────────────────────────────────────────────
function DetailChip({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
}) {
  return (
    <View style={s.detailChip}>
      <View style={s.detailChipHeader}>
        <Ionicons name={icon} size={11} color={T.mutedForeground} />
        <Text style={s.detailLabel}>{label}</Text>
      </View>
      <Text style={s.detailValue}>{value}</Text>
    </View>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <View style={s.emptyState}>
      <View style={s.emptyIconWrap}>
        <Text style={s.emptyEmoji}>🧾</Text>
      </View>
      <Text style={s.emptyTitle}>No top-ups yet</Text>
      <Text style={s.emptySub}>
        After calculating, tap &quot;Save to history&quot; to track your credit here.
      </Text>
    </View>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GH', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
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
    position: 'absolute',
    top: 0, right: 0,
    width: 160, height: 120,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    opacity: 0.2,
    padding: 16,
  },
  dot: {
    width: 3, height: 3,
    borderRadius: 1.5,
    backgroundColor: T.primary,
  },
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
    borderRadius: T.pill,
    marginBottom: 12,
  },
  headerBadgeText: {
    fontSize: 10, fontWeight: '600',
    color: T.ring, letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: 26, fontWeight: '700',
    color: T.foreground, letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 13, color: T.mutedForeground, marginTop: 4,
  },

  // ── Stats strip
  statsStrip: {
    flexDirection: 'row',
    backgroundColor: T.surface,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  statDivider: {
    width: 1, height: 32, backgroundColor: T.border,
  },
  statTile: {
    flex: 1, alignItems: 'center', gap: 2,
  },
  statValue: {
    fontSize: 14, fontWeight: '700', color: T.foreground,
  },
  statValueAccent: { color: T.ring },
  statLabel: {
    fontSize: 10, color: T.mutedForeground,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },

  // ── Section / list
  section: {
    padding: 16, gap: 8,
  },

  // ── Card
  card: {
    backgroundColor: T.secondary,
    borderRadius: T.md,
    borderWidth: 1,
    borderColor: T.border,
    padding: 14,
    overflow: 'hidden',
  },
  cardExpanded: {
    borderColor: T.primary,
    backgroundColor: 'rgba(0,98,57,0.08)',
  },
  cardAccent: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0,
    width: 3,
    backgroundColor: T.border,
    borderTopLeftRadius: T.md,
    borderBottomLeftRadius: T.md,
  },
  cardAccentActive: {
    backgroundColor: T.primaryLight,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardLeft: { flex: 1, gap: 3 },
  cardCredit: {
    fontSize: 18, fontWeight: '700', color: T.foreground,
  },
  cardDate: {
    fontSize: 12, color: T.mutedForeground,
  },
  cardRight: {
    alignItems: 'flex-end', gap: 5,
  },
  daysRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  cardDays: {
    fontSize: 13, fontWeight: '600', color: T.primaryLight,
  },
  accuracyBadge: {
    borderRadius: T.pill,
    paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1,
  },
  accuracyGood: {
    backgroundColor: 'rgba(74,222,128,0.1)',
    borderColor: 'rgba(74,222,128,0.25)',
  },
  accuracyWarn: {
    backgroundColor: T.amberDim,
    borderColor: 'rgba(245,158,11,0.25)',
  },
  accuracyText:     { fontSize: 11, fontWeight: '600' },
  accuracyTextGood: { color: T.ring },
  accuracyTextWarn: { color: T.amber },

  // ── Expanded detail
  cardDetail: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: T.border,
    gap: 12,
  },
  detailGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  detailChip: {
    flex: 1,
    backgroundColor: T.card,
    borderRadius: T.sm,
    borderWidth: 1,
    borderColor: T.border,
    padding: 10,
    gap: 4,
  },
  detailChipHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  detailLabel: {
    fontSize: 10, color: T.mutedForeground,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 13, fontWeight: '600', color: T.foreground,
  },

  // Appliance tags
  applianceTags: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6,
  },
  tag: {
    backgroundColor: T.card,
    borderRadius: T.pill,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: T.border,
  },
  tagText: { fontSize: 12, color: T.mutedForeground },

  // Action buttons
  cardActions: {
    flexDirection: 'row', gap: 8, alignItems: 'center',
  },
  finishedBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: 'rgba(74,222,128,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.2)',
    borderRadius: T.md,
    paddingVertical: 11,
  },
  finishedBtnText: {
    color: T.ring, fontSize: 13, fontWeight: '600',
  },
  deleteBtn: {
    width: 40, height: 40,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(84,28,21,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.15)',
    borderRadius: T.md,
  },

  // Clear all
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginHorizontal: 16,
    marginTop: 4,
    paddingVertical: 14,
    borderRadius: T.md,
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.12)',
    backgroundColor: 'rgba(84,28,21,0.2)',
  },
  clearBtnText: {
    color: T.destructiveLight, fontSize: 13, fontWeight: '500',
  },

  // Empty state
  emptyState: {
    alignItems: 'center', paddingVertical: 56, gap: 12,
  },
  emptyIconWrap: {
    width: 72, height: 72,
    borderRadius: T.lg,
    backgroundColor: T.secondary,
    borderWidth: 1, borderColor: T.border,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  emptyEmoji: { fontSize: 34 },
  emptyTitle: {
    fontSize: 17, fontWeight: '600', color: T.foreground,
  },
  emptySub: {
    fontSize: 14, color: T.mutedForeground,
    textAlign: 'center', lineHeight: 21, maxWidth: 260,
  },
});