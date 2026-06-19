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
} from 'react-native';
import Text from '@/components/Text';
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
import { THEME } from '@/lib/theme';

const T = THEME.colors;
const S = THEME.radius;

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const history = useHistory();
  const stats = getHistoryStats();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function handleMarkFinished(entry: CreditHistoryEntry) {
    Alert.alert(
      'Units finished?',
      `Mark your ₵${entry.creditGhs} top-up from ${formatDate(entry.date)} as finished today?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Yes, finished', onPress: () => markUnitsFinished(entry.id) },
      ]
    );
  }

  function handleDelete(entry: CreditHistoryEntry) {
    Alert.alert(
      'Delete entry?',
      `Remove the ₵${entry.creditGhs} top-up from ${formatDate(entry.date)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteHistoryEntry(entry.id) },
      ]
    );
  }

  function handleClearAll() {
    Alert.alert(
      'Clear all history?',
      'This will permanently delete all your top-up records.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear all', style: 'destructive', onPress: clearHistory },
      ]
    );
  }

  return (
    <ScrollView
      style={s.scroll}
      contentContainerStyle={[s.content, {paddingBottom: insets.bottom + 32 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ──────────────────────────────────────────────── */}
               <View style={[s.header, { paddingTop: insets.top + 14 }]}>
                  <View style={s.headerDots} pointerEvents="none">
                    {Array.from({ length: 24 }).map((_, i) => <View key={i} style={s.dot} />)}
                  </View>
                  <View style={s.headerRow}>
                    <View>
                      <View style={s.ecgBadge}>
                        <Ionicons name="flash" size={9} color={T.ring} />
                        <Text style={s.ecgBadgeText}>Log</Text>
                      </View>
                      <Text style={s.appTitle}>History</Text>
                    </View>
                  </View>
                </View>


      <View style={{paddingHorizontal: 16, marginBottom: 8}}>

      {/* ── Hero Stats Card ─────────────────────────────────────── */}
      {history.length > 0 && (
        <View style={s.heroCard}>
          <View style={s.heroTop}>
            <Text style={s.heroLabel}>Total Spent</Text>
            <Text style={s.heroValue}>{formatGhs(stats.totalSpent)}</Text>
          </View>
          
          <View style={s.heroDivider} />
          
          <View style={s.heroBottom}>
            <MiniStat 
              icon="trending-up" 
              label="Daily Avg" 
              value={`${formatGhs(stats.averageDailySpend)}`} 
              />
            <MiniStat 
              icon="time" 
              label="Avg Duration" 
              value={`${Math.round(stats.averageDaysPerTopUp)}d`} 
              />
            {stats.accuracy !== null && (
              <MiniStat 
              icon="checkmark-circle" 
              label="Accuracy" 
              value={`${Math.round(stats.accuracy)}%`} 
              accent 
              />
            )}
          </View>
        </View>
      )}
      </View>

      {/* ── Vertical List ───────────────────────────────────────── */}
      <View style={{paddingHorizontal: 16}}>

      <View style={s.listContainer}>
        <Text style={s.sectionTitle}>Recent Top-ups</Text>
        
        {history.length === 0 ? (
          <EmptyState />
        ) : (
          <View style={s.cardStack}>
            {history.map((entry) => (
              <HistoryCard
              key={entry.id}
              entry={entry}
              expanded={expandedId === entry.id}
              onPress={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
              onMarkFinished={() => handleMarkFinished(entry)}
              onDelete={() => handleDelete(entry)}
              />
            ))}
          </View>
        )}
      </View>
        </View>

      {/* ── Clear all ───────────────────────────────────────────── */}
      <View style={{paddingHorizontal: 16}}>

      {history.length > 0 && (
        <TouchableOpacity style={s.clearBtn} onPress={handleClearAll} activeOpacity={0.7}>
          <Ionicons name="trash-outline" size={16} color={T.destructiveLight} />
          <Text style={s.clearBtnText}>Clear all history</Text>
        </TouchableOpacity>
      )}
      </View>
    </ScrollView>
  );
}

// ─── HistoryCard (Vertical Layout) ───────────────────────────────────────────
interface HistoryCardProps {
  entry: CreditHistoryEntry;
  expanded: boolean;
  onPress: () => void;
  onMarkFinished: () => void;
  onDelete: () => void;
}

function HistoryCard({ entry, expanded, onPress, onMarkFinished, onDelete }: HistoryCardProps) {
  const hasActual = entry.actualDays !== undefined;
  const accuracy = hasActual
    ? Math.max(
        0,
        Math.round(
          100 - (Math.abs(entry.actualDays! - entry.estimatedDays) / entry.estimatedDays) * 100
        )
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
      {/* ── Unexpanded Row View ───────────────────────────────── */}
      <View style={s.cardRow}>
        <View style={s.cardLeft}>
          <View style={[s.statusIndicator, hasActual ? s.statusFinished : s.statusActive]} />
          <View>
            <Text style={s.cardAmount}>{formatGhs(entry.creditGhs)}</Text>
            <Text style={s.cardDate}>{formatDate(entry.date)}</Text>
          </View>
        </View>

        <View style={s.cardRight}>
          <View style={s.estimateBadge}>
            <Ionicons name="flash" size={12} color={T.primaryLight} />
            <Text style={s.estimateText}>{formatDuration(entry.estimatedDays, 0)} est.</Text>
          </View>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={T.mutedForeground}
            style={s.chevron}
          />
        </View>
      </View>

      {/* ── Expanded detail accordion ─────────────────────────── */}
      {expanded && (
        <View style={s.cardDetail}>
          <View style={s.detailGrid}>
            <DetailRow icon="flash-outline" label="Tariff Type" value={tariffLabel} />
            <DetailRow icon="cash-outline" label="Burn Rate" value={`${formatGhs(entry.dailyCostGhs)} / day`} />
            {hasActual && (
              <DetailRow icon="calendar-outline" label="Actual Lasted" value={`${entry.actualDays} days`} />
            )}
            {hasActual && accuracy !== null && (
               <DetailRow 
                  icon={accuracyGood ? 'checkmark-circle' : 'warning'} 
                  label="Prediction Accuracy" 
                  value={`${accuracy}%`} 
                  accentColor={accuracyGood ? T.ring : T.amber} 
               />
            )}
          </View>

          {/* Appliance tags */}
          {entry.appliances.length > 0 && (
            <View style={s.applianceContainer}>
              <Text style={s.applianceTitle}>Tracked Appliances:</Text>
              <View style={s.applianceTags}>
                {entry.appliances.map((a) => (
                  <View key={a.id} style={s.tag}>
                    <Text style={s.tagText}>{a.emoji} {a.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Action buttons */}
          <View style={s.cardActions}>
            {!hasActual && (
              <TouchableOpacity style={s.finishedBtn} onPress={onMarkFinished} activeOpacity={0.8}>
                <Ionicons name="checkmark-circle" size={16} color={T.ring} />
                <Text style={s.finishedBtnText}>Mark as finished</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={s.deleteBtn} onPress={onDelete} activeOpacity={0.8}>
              <Ionicons name="trash" size={16} color={T.destructiveLight} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Sub-Components ──────────────────────────────────────────────────────────

function MiniStat({ icon, label, value, accent }: { icon: any, label: string, value: string, accent?: boolean }) {
  return (
    <View style={s.miniStat}>
      <View style={[s.miniStatIconWrap, accent && { backgroundColor: 'rgba(74,222,128,0.1)' }]}>
        <Ionicons name={icon} size={14} color={accent ? T.ring : T.primary} />
      </View>
      <View>
        <Text style={s.miniStatValue}>{value}</Text>
        <Text style={s.miniStatLabel}>{label}</Text>
      </View>
    </View>
  );
}

function DetailRow({ icon, label, value, accentColor }: { icon: any, label: string, value: string, accentColor?: string }) {
  return (
    <View style={s.detailRow}>
      <View style={s.detailRowLeft}>
        <Ionicons name={icon} size={14} color={T.mutedForeground} />
        <Text style={s.detailLabel}>{label}</Text>
      </View>
      <Text style={[s.detailValue, accentColor && { color: accentColor }]}>{value}</Text>
    </View>
  );
}

function EmptyState() {
  return (
    <View style={s.emptyState}>
      <View style={s.emptyIconWrap}>
        <Ionicons name="folder-open-outline" size={32} color={T.mutedForeground} />
      </View>
      <Text style={s.emptyTitle}>No history yet</Text>
      <Text style={s.emptySub}>
        When you calculate and save your top-ups, they will appear here as a ledger.
      </Text>
    </View>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: T.background },
  content: { gap: 12 },

  // ── Header
   header: {
    backgroundColor: T.card,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    overflow: 'hidden',
  },
  headerDots: {
    position: 'absolute', top: 0, right: 0,
    width: 130, height: 90,
    flexDirection: 'row', flexWrap: 'wrap',
    gap: 9, opacity: 0.2, padding: 12,
  },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: T.primaryLight },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ecgBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: T.ringDim,
    borderWidth: 1, borderColor: T.ringBorder,
    alignSelf: 'flex-start',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: S.pill, marginBottom: 6,
  },
  ecgBadgeText: { fontSize: 9, fontWeight: '700', color: T.ring, letterSpacing: 0.8, textTransform: 'uppercase' },
  appTitle: { fontSize: 30, fontWeight: '700', color: T.foreground, letterSpacing: -0.5 },
  tariffPill: {
    backgroundColor: T.secondary, borderWidth: 1, borderColor: T.border,
    borderRadius: S.pill, paddingHorizontal: 10, paddingVertical: 5,
  },
  tariffPillText: { fontSize: 11, fontWeight: '600', color: T.mutedForeground },

  headerTextWrap: { gap: 4 },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: T.foreground,
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 14,
    color: T.mutedForeground,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: T.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Hero Stats Card
  heroCard: {
    backgroundColor: T.card,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: T.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  heroTop: {
    alignItems: 'center',
    gap: 4,
    paddingBottom: 20,
  },
  heroLabel: {
    fontSize: 13,
    color: T.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '600',
  },
  heroValue: {
    fontSize: 40,
    fontWeight: '800',
    color: T.foreground,
    letterSpacing: -1.5,
  },
  heroDivider: {
    height: 1,
    backgroundColor: T.border,
    marginBottom: 20,
  },
  heroBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  miniStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniStatIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: T.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniStatValue: {
    fontSize: 14,
    fontWeight: '700',
    color: T.foreground,
  },
  miniStatLabel: {
    fontSize: 11,
    color: T.mutedForeground,
  },

  // ── List & Layout
  listContainer: { gap: 12 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: T.foreground,
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  cardStack: { gap: 12 },

  // ── History Card
  card: {
    backgroundColor: T.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: T.border,
    overflow: 'hidden',
  },
  cardExpanded: {
    borderColor: T.primary,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusIndicator: {
    width: 6,
    height: 36,
    borderRadius: 3,
  },
  statusActive: { backgroundColor: T.primaryLight },
  statusFinished: { backgroundColor: T.border },
  
  cardAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: T.foreground,
  },
  cardDate: {
    fontSize: 13,
    color: T.mutedForeground,
    marginTop: 2,
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  estimateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: T.secondary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: S.pill || 999,
  },
  estimateText: {
    fontSize: 12,
    fontWeight: '600',
    color: T.foreground,
  },
  chevron: { opacity: 0.5 },

  // ── Expanded Details
  cardDetail: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: T.border,
  },
  detailGrid: {
    gap: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 13,
    color: T.mutedForeground,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: T.foreground,
  },

  // Appliances
  applianceContainer: {
    backgroundColor: T.secondary,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  applianceTitle: {
    fontSize: 11,
    color: T.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  applianceTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: T.card,
    borderRadius: S.pill || 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: T.border,
  },
  tagText: { fontSize: 12, color: T.foreground },

  // Actions
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  finishedBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(74,222,128,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.2)',
    borderRadius: 12,
    paddingVertical: 12,
  },
  finishedBtnText: {
    color: T.ring,
    fontSize: 14,
    fontWeight: '600',
  },
  deleteBtn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(248,113,113,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.2)',
    borderRadius: 12,
  },

  // Clear all
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.2)',
    backgroundColor: 'rgba(248,113,113,0.05)',
  },
  clearBtnText: {
    color: T.destructiveLight,
    fontSize: 14,
    fontWeight: '600',
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: T.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: T.foreground,
  },
  emptySub: {
    fontSize: 14,
    color: T.mutedForeground,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 260,
  },
});